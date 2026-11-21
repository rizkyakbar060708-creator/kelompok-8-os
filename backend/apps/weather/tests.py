from datetime import datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.weather import services
from apps.weather.services import WeatherError, get_weather

User = get_user_model()

BASE_URL = "/api/weather/"
PRIMARY_KEY = services.CACHE_KEY.format(adm4="63.71.04.1005")
STALE_KEY = services.STALE_KEY.format(adm4="63.71.04.1005")

# 20 Nov 2026 13:44 UTC = 21:44 WITA. Slot pertama (22:00 WITA) masih di depan.
NOW = datetime(2026, 11, 20, 13, 44, tzinfo=dt_timezone.utc)


def _slot(local_datetime, temperature, humidity, rain, code, description, wind, cloud):
    local_dt = datetime.strptime(local_datetime, "%Y-%m-%d %H:%M:%S")
    utc_dt = local_dt - timedelta(hours=8)

    return {
        "datetime": utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "utc_datetime": utc_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "local_datetime": local_datetime,
        "t": temperature,
        "tcc": cloud,
        "tp": rain,
        "weather": code,
        "weather_desc": description,
        "weather_desc_en": "Test condition",
        "wd_deg": 352,
        "wd": "NW",
        "wd_to": "SE",
        "ws": wind,
        "hu": humidity,
        "vs": None,
        "vs_text": None,
        "time_index": "0-1",
        "analysis_date": "2026-11-20T12:00:00",
        "image": "https://example.invalid/icon.svg",
    }


# Bentuk asli respons BMKG: tiga grup hari dengan ukuran [1, 8, 8].
DAY_ONE = [
    _slot("2026-11-20 22:00:00", 26, 97, 0, 2, "Cerah Berawan", 7.2, 74),
]

DAY_TWO = [
    _slot("2026-11-21 01:00:00", 25, 98, 0, 2, "Cerah Berawan", 7.6, 81),
    _slot("2026-11-21 04:00:00", 24, 96, 0.3, 2, "Cerah Berawan", 9.6, 82),
    _slot("2026-11-21 07:00:00", 24, 96, 0, 1, "Cerah", 5.4, 44),
    _slot("2026-11-21 10:00:00", 28, 78, 0.1, 2, "Cerah Berawan", 1.6, 68),
    _slot("2026-11-21 13:00:00", 35, 48, 0.6, 1, "Cerah", 13.4, 51),
    _slot("2026-11-21 16:00:00", 30, 73, 0.9, 1, "Cerah", 10.3, 45),
    _slot("2026-11-21 19:00:00", 27, 90, 0, 2, "Cerah Berawan", 3.5, 75),
    _slot("2026-11-21 22:00:00", 26, 94, 0.1, 2, "Cerah Berawan", 1.4, 82),
]

DAY_THREE = [
    _slot("2026-11-22 01:00:00", 25, 99, 0, 2, "Cerah Berawan", 6.2, 80),
    _slot("2026-11-22 04:00:00", 24, 97, 0.1, 2, "Cerah Berawan", 5.9, 75),
    _slot("2026-11-22 07:00:00", 24, 94, 0, 2, "Cerah Berawan", 6.6, 69),
    _slot("2026-11-22 10:00:00", 28, 76, 0, 2, "Cerah Berawan", 6.4, 78),
    _slot("2026-11-22 13:00:00", 32, 64, 0.1, 1, "Cerah", 3.5, 15),
    _slot("2026-11-22 16:00:00", 29, 79, 0.3, 1, "Cerah", 10.1, 44),
    _slot("2026-11-22 19:00:00", 27, 92, 0.1, 0, "Cerah", 2.5, 10),
    _slot("2026-11-22 22:00:00", 27, 94, 0, 1, "Cerah", 1.4, 44),
]

LOCATION = {
    "adm1": "63",
    "adm2": "63.71",
    "adm3": "63.71.04",
    "adm4": "63.71.04.1005",
    "desa": "Sungai Miai",
    "kecamatan": "Banjarmasin Utara",
    "kotkab": "Kota Banjarmasin",
    "lat": -3.2935282158,
    "lon": 114.5943239309,
    "provinsi": "Kalimantan Selatan",
    "timezone": "+0800",
    "type": "adm4",
}

FIXTURE = {
    "data": [
        {
            "lokasi": LOCATION,
            "cuaca": [DAY_ONE, DAY_TWO, DAY_THREE],
        }
    ],
    "lokasi": {**LOCATION, "timezone": "Asia/Makassar"},
}


class WeatherAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="weather_user",
            password="Passw0rd!weather",
        )

    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Hanya jam yang dipatch; parsing dan cache tetap kode asli.
        now_patcher = patch("apps.weather.services._now", return_value=NOW)
        now_patcher.start()
        self.addCleanup(now_patcher.stop)

    def _authenticate(self):
        self.client.force_authenticate(user=self.user)

    def _get(self, path=""):
        return self.client.get(f"{BASE_URL}{path}")

    # --- Autentikasi ---

    def test_weather_endpoints_require_authentication(self):
        for path in ("", "current/", "forecast/"):
            self.assertEqual(self._get(path).status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Bentuk respons ---

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_combined_payload_contains_all_sections(self, fetch):
        self._authenticate()
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(
            set(data), {"location", "current", "hourly", "daily", "source"}
        )
        self.assertEqual(data["location"]["adm4"], "63.71.04.1005")
        self.assertEqual(data["location"]["village"], "Sungai Miai")
        self.assertEqual(data["location"]["timezone"], "Asia/Makassar")
        self.assertEqual(data["location"]["timezone_label"], "WITA")
        self.assertEqual(data["location"]["utc_offset_minutes"], 480)
        self.assertEqual(data["current"]["forecast_at"], "2026-11-20T22:00:00+08:00")
        self.assertEqual(data["current"]["temperature_c"], 26)
        self.assertEqual(len(data["hourly"]), 17)
        self.assertFalse(data["source"]["cached"])
        self.assertFalse(data["source"]["stale"])
        self.assertEqual(
            data["source"]["attribution"],
            "Data prakiraan cuaca bersumber dari BMKG "
            "(Badan Meteorologi, Klimatologi, dan Geofisika).",
        )
        self.assertEqual(fetch.call_count, 1)

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_current_uses_first_upcoming_slot(self, _fetch):
        data = get_weather(now=NOW)

        self.assertEqual(data["current"]["date"], "2026-11-20")
        self.assertEqual(data["current"]["time"], "22:00")
        self.assertEqual(data["current"]["description"], "Cerah Berawan")

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_current_falls_back_to_last_slot_when_all_are_past(self, _fetch):
        after_horizon = datetime(2026, 11, 23, 0, 0, tzinfo=dt_timezone.utc)
        data = get_weather(now=after_horizon)

        self.assertEqual(data["current"]["date"], "2026-11-22")
        self.assertEqual(data["current"]["time"], "22:00")
        self.assertEqual(data["hourly"], [])
        self.assertEqual(data["daily"], [])

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_hourly_contains_only_future_slots(self, _fetch):
        later = datetime(2026, 11, 20, 14, 30, tzinfo=dt_timezone.utc)
        data = get_weather(now=later)

        self.assertEqual(data["current"]["date"], "2026-11-21")
        self.assertEqual(data["current"]["time"], "01:00")
        self.assertEqual(len(data["hourly"]), 16)

        for entry in data["hourly"]:
            self.assertGreaterEqual(
                datetime.fromisoformat(entry["forecast_at"]), later
            )

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_daily_aggregates_real_values(self, _fetch):
        data = get_weather(now=NOW)
        day = next(day for day in data["daily"] if day["date"] == "2026-11-21")

        self.assertEqual(day["entry_count"], 8)
        self.assertFalse(day["is_today"])
        self.assertFalse(day["is_partial"])
        self.assertEqual(day["min_temperature_c"], 24)
        self.assertEqual(day["max_temperature_c"], 35)
        self.assertEqual(day["precipitation_mm"], 2.0)
        self.assertEqual(day["average_humidity_percent"], 84)
        self.assertEqual(day["max_wind_speed_kmh"], 13.4)
        self.assertEqual(day["description"], "Cerah")
        self.assertEqual(day["weather_code"], 1)

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_partial_first_day_uses_only_available_slots(self, _fetch):
        data = get_weather(now=NOW)

        self.assertEqual(len(data["daily"]), 3)
        today = data["daily"][0]

        self.assertEqual(today["date"], "2026-11-20")
        self.assertTrue(today["is_today"])
        self.assertTrue(today["is_partial"])
        self.assertEqual(today["entry_count"], 1)
        self.assertEqual(today["min_temperature_c"], 26)
        self.assertEqual(today["max_temperature_c"], 26)
        self.assertEqual(today["precipitation_mm"], 0.0)
        self.assertEqual(today["average_humidity_percent"], 97)
        self.assertEqual(today["max_wind_speed_kmh"], 7.2)

        # Hari tanpa slot tidak boleh muncul sebagai baris kosong.
        self.assertFalse([day for day in data["daily"] if day["entry_count"] == 0])

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_null_values_are_preserved_and_nothing_is_invented(self, _fetch):
        data = get_weather(now=NOW)
        current = data["current"]

        self.assertIsNone(current["visibility_text"])
        self.assertNotIn("feels_like", current)
        self.assertFalse(
            [key for key in current if "probability" in key.lower()]
        )

    # --- Kesalahan upstream ---

    @patch(
        "apps.weather.services.fetch_forecast_json",
        side_effect=WeatherError(
            "location_not_found",
            "Prakiraan cuaca untuk lokasi ini tidak tersedia.",
            404,
            "BMKG HTTP 404 for https://api.bmkg.go.id/publik/prakiraan-cuaca",
        ),
    )
    def test_upstream_404_returns_friendly_error(self, _fetch):
        self._authenticate()
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.json()["error"]["code"], "location_not_found")

    @patch(
        "apps.weather.services.fetch_forecast_json",
        side_effect=WeatherError(
            "upstream_timeout",
            "Layanan prakiraan cuaca BMKG tidak merespons tepat waktu. "
            "Silakan coba lagi.",
            504,
            "BMKG request timed out: https://api.bmkg.go.id/publik/prakiraan-cuaca",
        ),
    )
    def test_upstream_timeout_returns_504(self, _fetch):
        self._authenticate()
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_504_GATEWAY_TIMEOUT)
        self.assertEqual(response.json()["error"]["code"], "upstream_timeout")

    @patch(
        "apps.weather.services.fetch_forecast_json",
        return_value={"data": []},
    )
    def test_unexpected_payload_returns_invalid_response(self, _fetch):
        self._authenticate()
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.json()["error"]["code"], "invalid_response")

    @patch(
        "apps.weather.services.fetch_forecast_json",
        side_effect=WeatherError(
            "upstream_error",
            "Layanan prakiraan cuaca BMKG sedang tidak dapat diakses. "
            "Silakan coba lagi.",
            502,
            "BMKG HTTP 503 for https://api.bmkg.go.id/publik/prakiraan-cuaca",
        ),
    )
    def test_error_response_does_not_leak_internal_details(self, _fetch):
        self._authenticate()
        body = self._get().content.decode("utf-8")

        self.assertNotIn("api.bmkg.go.id", body)
        self.assertNotIn("Traceback", body)
        self.assertNotIn("HTTP 503", body)

    # --- Cache ---

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_cache_prevents_second_upstream_call(self, fetch):
        self._authenticate()
        first = self._get().json()
        second = self._get().json()

        self.assertEqual(fetch.call_count, 1)
        self.assertFalse(first["source"]["cached"])
        self.assertTrue(second["source"]["cached"])
        self.assertFalse(second["source"]["stale"])

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_cached_snapshot_recomputes_current_for_a_later_request(self, fetch):
        first = get_weather(now=NOW)
        later = datetime(2026, 11, 20, 14, 30, tzinfo=dt_timezone.utc)
        second = get_weather(now=later)

        self.assertEqual(fetch.call_count, 1)
        self.assertEqual(first["current"]["time"], "22:00")
        self.assertEqual(second["current"]["time"], "01:00")
        self.assertTrue(second["source"]["cached"])

    @override_settings(WEATHER_CACHE_TTL=0)
    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_cache_expiry_refetches(self, fetch):
        get_weather(now=NOW)
        get_weather(now=NOW)

        self.assertEqual(fetch.call_count, 2)

    # --- Stale-on-error ---

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_stale_snapshot_is_served_after_timeout(self, fetch):
        self._authenticate()
        first = self._get().json()
        cache.delete(PRIMARY_KEY)

        fetch.side_effect = WeatherError(
            "upstream_timeout",
            "Layanan prakiraan cuaca BMKG tidak merespons tepat waktu. "
            "Silakan coba lagi.",
            504,
            "BMKG request timed out",
        )
        second = self._get()

        self.assertEqual(second.status_code, status.HTTP_200_OK)
        body = second.json()
        self.assertTrue(body["source"]["stale"])
        self.assertTrue(body["source"]["cached"])
        self.assertEqual(body["source"]["fetched_at"], first["source"]["fetched_at"])
        self.assertEqual(fetch.call_count, 2)

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_stale_snapshot_is_served_after_invalid_payload(self, fetch):
        self._authenticate()
        self._get()
        cache.delete(PRIMARY_KEY)

        fetch.return_value = {"data": []}
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["source"]["stale"])

    @patch(
        "apps.weather.services.fetch_forecast_json",
        side_effect=WeatherError(
            "upstream_error",
            "Layanan prakiraan cuaca BMKG sedang tidak dapat diakses. "
            "Silakan coba lagi.",
            502,
            "BMKG HTTP 500",
        ),
    )
    def test_no_stale_copy_returns_the_original_error(self, _fetch):
        self._authenticate()
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.json()["error"]["code"], "upstream_error")

    # --- Endpoint parsial ---

    @patch("apps.weather.services.fetch_forecast_json", return_value=FIXTURE)
    def test_partial_endpoints_only_return_their_sections(self, fetch):
        self._authenticate()
        current = self._get("current/").json()
        forecast = self._get("forecast/").json()

        self.assertEqual(set(current), {"location", "current", "source"})
        self.assertEqual(set(forecast), {"location", "hourly", "daily", "source"})
        self.assertEqual(fetch.call_count, 1)
