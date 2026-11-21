import json
import logging
import re
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone as dt_timezone

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

BMKG_ENDPOINT = "https://api.bmkg.go.id/publik/prakiraan-cuaca"

ATTRIBUTION = (
    "Data prakiraan cuaca bersumber dari BMKG "
    "(Badan Meteorologi, Klimatologi, dan Geofisika)."
)

# Prefix versi di key supaya perubahan bentuk snapshot tidak membaca cache lama
# dengan struktur yang berbeda setelah deploy.
CACHE_KEY = "weather:bmkg:v1:{adm4}"
STALE_KEY = "weather:bmkg:stale:v1:{adm4}"

# Slot BMKG selalu 3 jam, jadi satu hari penuh berisi 8 slot. Dipakai untuk
# menandai hari yang baru sebagian terisi (hari ini atau ujung horizon).
SLOTS_PER_DAY = 8

_OFFSET_PATTERN = re.compile(
    r"^(?P<sign>[+-])(?P<hours>\d{1,2}):?(?P<minutes>\d{2})$"
)

# Field yang boleh sampai ke frontend. `datetime_utc` sengaja tidak ikut:
# itu hanya dipakai untuk mengurutkan dan memilih slot, bukan untuk ditampilkan.
_PUBLIC_ENTRY_FIELDS = (
    "forecast_at",
    "date",
    "time",
    "temperature_c",
    "humidity_percent",
    "description",
    "description_en",
    "weather_code",
    "wind_speed_kmh",
    "wind_direction",
    "wind_direction_degrees",
    "wind_to",
    "precipitation_mm",
    "cloud_cover_percent",
    "visibility_text",
)


class WeatherError(Exception):
    """Kesalahan yang aman ditampilkan ke pengguna.

    `detail` hanya untuk log server; jangan pernah menaruhnya di respons.
    """

    def __init__(self, code, message, status_code, detail=""):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.detail = detail


def _now():
    # Dipisah supaya tes bisa menyuntikkan waktu tetap dan pemilihan slot
    # "current" tidak bergantung pada jam saat suite dijalankan.
    return timezone.now()


def _invalid_response(detail):
    return WeatherError(
        "invalid_response",
        "Respons prakiraan cuaca BMKG tidak dapat dibaca. Silakan coba lagi.",
        502,
        detail,
    )


def _as_utc_datetime(value):
    if not isinstance(value, str) or not value.strip():
        return None

    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt_timezone.utc)

    return parsed.astimezone(dt_timezone.utc)


def _as_local_datetime(value):
    if not isinstance(value, str) or not value.strip():
        return None

    try:
        parsed = datetime.fromisoformat(value.strip())
    except ValueError:
        return None

    # local_datetime BMKG tidak membawa offset; kalau suatu saat membawa,
    # wall time-nya tetap yang dipakai karena BMKG sudah mengonversinya.
    return parsed.replace(tzinfo=None)


def _number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return value


def _integer(value):
    number = _number(value)
    return int(number) if number is not None else None


def _text(value):
    if not isinstance(value, str):
        return None
    return value.strip() or None


def _offset_from_raw(value):
    if not isinstance(value, str):
        return None

    match = _OFFSET_PATTERN.match(value.strip())
    if match is None:
        return None

    sign = -1 if match.group("sign") == "-" else 1
    minutes = int(match.group("hours")) * 60 + int(match.group("minutes"))

    return dt_timezone(sign * timedelta(minutes=minutes))


def _timezone_label(tzinfo):
    offset = tzinfo.utcoffset(None)
    total_minutes = int(offset.total_seconds() // 60)
    labels = {420: "WIB", 480: "WITA", 540: "WIT"}

    if total_minutes in labels:
        return labels[total_minutes]

    sign = "+" if total_minutes >= 0 else "-"
    hours, minutes = divmod(abs(total_minutes), 60)

    return f"UTC{sign}{hours:02d}:{minutes:02d}"


def _resolve_timezone(local_meta, top_meta):
    # BMKG mengirim offset di dalam data[0].lokasi ("+0800") dan nama zona
    # di lokasi level atas ("Asia/Makassar"). Offset dipakai lebih dulu karena
    # itu yang benar-benar dipakai menyusun local_datetime tiap slot.
    raw_offset = local_meta.get("timezone")
    iana_name = top_meta.get("timezone")
    tzinfo = _offset_from_raw(raw_offset)

    if tzinfo is None and isinstance(iana_name, str) and iana_name:
        try:
            from zoneinfo import ZoneInfo

            zone = ZoneInfo(iana_name)
            tzinfo = dt_timezone(datetime.now(zone).utcoffset() or timedelta(0))
        except Exception:
            tzinfo = None

    if tzinfo is None:
        raise _invalid_response("BMKG payload has no usable timezone")

    return tzinfo, _timezone_label(tzinfo), iana_name or raw_offset


def _normalize_entry(item, tzinfo):
    if not isinstance(item, dict):
        return None

    utc_datetime = _as_utc_datetime(item.get("datetime"))
    if utc_datetime is None:
        return None

    local_datetime = _as_local_datetime(item.get("local_datetime"))
    if local_datetime is None:
        local_datetime = utc_datetime.astimezone(tzinfo).replace(tzinfo=None)

    temperature = _number(item.get("t"))
    weather_code = _integer(item.get("weather"))
    description = _text(item.get("weather_desc"))

    # Tanpa suhu, kode, atau deskripsi slot ini tidak bisa ditampilkan dengan
    # jujur, jadi dibuang alih-alih diisi nilai karangan.
    if temperature is None or weather_code is None or description is None:
        return None

    return {
        "datetime_utc": utc_datetime.isoformat(),
        "forecast_at": local_datetime.replace(tzinfo=tzinfo).isoformat(
            timespec="seconds"
        ),
        "date": local_datetime.date().isoformat(),
        "time": local_datetime.strftime("%H:%M"),
        "temperature_c": temperature,
        "humidity_percent": _number(item.get("hu")),
        "description": description,
        "description_en": _text(item.get("weather_desc_en")),
        "weather_code": weather_code,
        "wind_speed_kmh": _number(item.get("ws")),
        "wind_direction": _text(item.get("wd")),
        "wind_direction_degrees": _number(item.get("wd_deg")),
        "wind_to": _text(item.get("wd_to")),
        "precipitation_mm": _number(item.get("tp")),
        "cloud_cover_percent": _number(item.get("tcc")),
        "visibility_text": _text(item.get("vs_text")),
    }


def _analysis_time(groups, tzinfo):
    for group in groups:
        entries = group if isinstance(group, list) else [group]
        for entry in entries:
            if not isinstance(entry, dict):
                continue

            parsed = _as_local_datetime(entry.get("analysis_date"))
            if parsed is not None:
                return parsed.replace(tzinfo=tzinfo).isoformat(timespec="seconds")

    return None


def normalize_forecast(raw, adm4):
    """Ubah payload BMKG menjadi snapshot yang aman di-cache.

    Snapshot hanya berisi data mentah yang sudah dinormalisasi. Nilai yang
    bergantung pada waktu (current, hourly, daily) sengaja TIDAK disimpan,
    supaya cache yang masih hidup tidak menyajikan slot yang sudah lewat.
    """
    if not isinstance(raw, dict):
        raise _invalid_response("BMKG payload is not an object")

    records = raw.get("data")
    if not isinstance(records, list) or not records:
        raise _invalid_response("BMKG payload has no data records")

    record = records[0] if isinstance(records[0], dict) else {}
    top_meta = raw.get("lokasi") if isinstance(raw.get("lokasi"), dict) else {}
    local_meta = record.get("lokasi")
    if not isinstance(local_meta, dict):
        local_meta = top_meta

    cuaca = record.get("cuaca")
    groups = []
    if isinstance(cuaca, list):
        for group in cuaca:
            if isinstance(group, list):
                groups.extend(group)
            elif isinstance(group, dict):
                groups.append(group)
    elif isinstance(cuaca, dict):
        groups.append(cuaca)
    else:
        raise _invalid_response("BMKG payload has no cuaca groups")

    if not groups:
        raise _invalid_response("BMKG payload has an empty cuaca list")

    tzinfo, timezone_label, timezone_name = _resolve_timezone(local_meta, top_meta)

    entries = [
        entry
        for entry in (
            _normalize_entry(item, tzinfo) for item in groups
        )
        if entry is not None
    ]
    if not entries:
        raise _invalid_response("BMKG payload has no usable forecast slots")

    entries.sort(key=lambda entry: entry["datetime_utc"])

    offset_minutes = int(tzinfo.utcoffset(None).total_seconds() // 60)
    fetched_at = _now().astimezone(tzinfo).isoformat(timespec="seconds")

    return {
        "location": {
            "adm4": _text(local_meta.get("adm4")) or adm4,
            "village": _text(local_meta.get("desa")),
            "district": _text(local_meta.get("kecamatan")),
            "regency": _text(local_meta.get("kotkab")),
            "province": _text(local_meta.get("provinsi")),
            "latitude": _number(local_meta.get("lat")),
            "longitude": _number(local_meta.get("lon")),
            "timezone": timezone_name,
            "timezone_label": timezone_label,
            "utc_offset_minutes": offset_minutes,
        },
        "entries": entries,
        "source": {
            "provider": "BMKG",
            "attribution": ATTRIBUTION,
            "analysis_at": _analysis_time(groups, tzinfo),
            "fetched_at": fetched_at,
        },
    }


def _select_current(entries, now):
    for entry in entries:
        if _as_utc_datetime(entry["datetime_utc"]) >= now:
            return entry

    # Feed bisa saja seluruhnya sudah lewat (mis. BMKG terlambat memperbarui).
    # Slot terakhir tetap lebih berguna daripada halaman kosong, asalkan UI
    # menyebutnya sebagai prakiraan terakhir.
    return entries[-1] if entries else None


def _public_entry(entry):
    return {field: entry.get(field) for field in _PUBLIC_ENTRY_FIELDS}


def _hour_from_time(value):
    try:
        return int(str(value)[:2])
    except (TypeError, ValueError):
        return 12


def _build_daily(entries, now, location):
    if not entries:
        return []

    offset_minutes = location.get("utc_offset_minutes") or 0
    tzinfo = dt_timezone(timedelta(minutes=offset_minutes))
    today = now.astimezone(tzinfo).date().isoformat()

    grouped = {}
    for entry in entries:
        grouped.setdefault(entry["date"], []).append(entry)

    days = []
    for date in sorted(grouped):
        day = grouped[date]
        temperatures = [
            entry["temperature_c"]
            for entry in day
            if entry["temperature_c"] is not None
        ]
        if not temperatures:
            continue

        humidities = [
            entry["humidity_percent"]
            for entry in day
            if entry["humidity_percent"] is not None
        ]
        winds = [
            entry["wind_speed_kmh"]
            for entry in day
            if entry["wind_speed_kmh"] is not None
        ]
        rain = [
            entry["precipitation_mm"]
            for entry in day
            if entry["precipitation_mm"] is not None
        ]

        # Kondisi harian diwakili slot yang paling dekat dengan tengah hari.
        # Ini tetap nilai BMKG apa adanya, bukan rata-rata atau karangan.
        representative = min(
            day, key=lambda entry: abs(_hour_from_time(entry["time"]) - 12)
        )

        days.append(
            {
                "date": date,
                "is_today": date == today,
                "is_partial": len(day) < SLOTS_PER_DAY,
                "entry_count": len(day),
                "min_temperature_c": min(temperatures),
                "max_temperature_c": max(temperatures),
                "description": representative["description"],
                "weather_code": representative["weather_code"],
                "precipitation_mm": round(sum(rain), 1) if rain else None,
                "average_humidity_percent": (
                    round(sum(humidities) / len(humidities))
                    if humidities
                    else None
                ),
                "max_wind_speed_kmh": max(winds) if winds else None,
            }
        )

    return days


def build_weather_payload(snapshot, now=None, cached=False, stale=False):
    """Hitung current/hourly/daily dari snapshot cache pada waktu request."""
    now = now or _now()
    entries = snapshot.get("entries") or []
    if not entries:
        raise _invalid_response("Cached weather snapshot has no entries")

    future = [
        entry
        for entry in entries
        if _as_utc_datetime(entry["datetime_utc"]) >= now
    ]
    current = _select_current(entries, now)

    return {
        "location": dict(snapshot["location"]),
        "current": _public_entry(current) if current else None,
        # Hourly dan daily hanya berisi slot yang belum lewat. Slot yang sudah
        # lewat tidak boleh tampil sebagai prakiraan.
        "hourly": [_public_entry(entry) for entry in future],
        "daily": _build_daily(future, now, snapshot["location"]),
        "source": {
            **snapshot["source"],
            "cached": cached,
            "stale": stale,
        },
    }


def fetch_forecast_json(adm4):
    """Ambil payload mentah BMKG.

    Satu-satunya fungsi yang menyentuh jaringan; seluruh tes mem-patch fungsi
    ini supaya suite tidak bergantung pada layanan BMKG.
    """
    url = f"{BMKG_ENDPOINT}?adm4={adm4}"
    request = urllib.request.Request(
        url,
        headers={
            # BMKG membalas 403 untuk User-Agent bawaan urllib, jadi header ini
            # wajib. Nilai defaultnya bisa ditimpa lewat WEATHER_USER_AGENT.
            "User-Agent": settings.WEATHER_USER_AGENT,
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(
            request, timeout=settings.WEATHER_HTTP_TIMEOUT
        ) as response:
            raw_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise WeatherError(
                "location_not_found",
                "Prakiraan cuaca untuk lokasi ini tidak tersedia.",
                404,
                f"BMKG HTTP 404 for {url}",
            ) from exc

        raise WeatherError(
            "upstream_error",
            "Layanan prakiraan cuaca BMKG sedang tidak dapat diakses. "
            "Silakan coba lagi.",
            502,
            f"BMKG HTTP {exc.code} for {url}",
        ) from exc
    except TimeoutError as exc:
        raise WeatherError(
            "upstream_timeout",
            "Layanan prakiraan cuaca BMKG tidak merespons tepat waktu. "
            "Silakan coba lagi.",
            504,
            f"BMKG request timed out: {url}",
        ) from exc
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, TimeoutError):
            raise WeatherError(
                "upstream_timeout",
                "Layanan prakiraan cuaca BMKG tidak merespons tepat waktu. "
                "Silakan coba lagi.",
                504,
                f"BMKG request timed out: {url}",
            ) from exc

        raise WeatherError(
            "upstream_error",
            "Layanan prakiraan cuaca BMKG sedang tidak dapat diakses. "
            "Silakan coba lagi.",
            502,
            f"BMKG connection error: {exc.reason}",
        ) from exc
    except OSError as exc:
        raise WeatherError(
            "upstream_error",
            "Layanan prakiraan cuaca BMKG sedang tidak dapat diakses. "
            "Silakan coba lagi.",
            502,
            f"BMKG connection error: {exc}",
        ) from exc

    try:
        return json.loads(raw_body)
    except (TypeError, ValueError) as exc:
        raise _invalid_response("BMKG returned invalid JSON") from exc


def get_weather(now=None):
    """Snapshot cache + perhitungan waktu request.

    `now` bisa disuntikkan oleh tes supaya pemilihan slot deterministik.
    """
    adm4 = settings.WEATHER_DEFAULT_ADM4
    primary_key = CACHE_KEY.format(adm4=adm4)
    stale_key = STALE_KEY.format(adm4=adm4)

    snapshot = cache.get(primary_key)
    cached = snapshot is not None
    stale = False

    if snapshot is None:
        try:
            raw = fetch_forecast_json(adm4)
            snapshot = normalize_forecast(raw, adm4)
        except WeatherError as exc:
            # Lokasi yang salah adalah kesalahan konfigurasi, bukan gangguan
            # sementara; menyajikan data lama justru menyembunyikan masalah.
            if exc.code == "location_not_found":
                raise

            stale_snapshot = cache.get(stale_key)
            if stale_snapshot is None:
                logger.warning(
                    "BMKG unavailable for %s (%s); no stale copy available",
                    adm4,
                    exc.detail or exc.code,
                )
                raise

            logger.warning(
                "BMKG unavailable for %s (%s); serving stale snapshot",
                adm4,
                exc.detail or exc.code,
            )
            snapshot = stale_snapshot
            cached = True
            stale = True
        else:
            cache.set(primary_key, snapshot, settings.WEATHER_CACHE_TTL)
            cache.set(stale_key, snapshot, settings.WEATHER_STALE_TTL)

    return build_weather_payload(snapshot, now=now, cached=cached, stale=stale)
