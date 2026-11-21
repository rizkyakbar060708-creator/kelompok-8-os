import {
  AlertCircle,
  Cloud,
  CloudOff,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  Wind,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState, createElement } from "react"
import axios from "axios"

import EmptyState from "../../components/ui/EmptyState"
import {
  getWeather,
  weatherErrorMessage,
  type WeatherDay,
  type WeatherEntry,
  type WeatherLocation,
  type WeatherOverview,
} from "../../services/weatherService"
import {
  formatAnalysisTime,
  formatDayLabel,
  formatDecimal,
  formatFetchedClock,
  formatPercent,
  formatRain,
  formatShortDate,
  formatTemperature,
  formatTemperatureRange,
  formatWind,
  weatherIconFor,
} from "../../utils/weather"

// weatherIconFor mengembalikan komponen stabil dari modul lucide, tetapi React
// Compiler tidak bisa membuktikannya saat komponen ditulis sebagai variabel
// JSX. createElement menjaga komponen tetap stabil tanpa membuat komponen baru
// di dalam render (react-hooks/static-components).
function WeatherGlyph({
  code,
  size,
  className,
}: {
  code: number | null | undefined
  size: number
  className?: string
}) {
  return createElement(weatherIconFor(code), {
    size,
    className,
    "aria-hidden": true,
  })
}

function describeWeatherError(requestError: unknown): string {
  if (!axios.isAxiosError(requestError) || !requestError.response) {
    return "Tidak dapat terhubung ke server."
  }

  const { status, data } = requestError.response

  if (status === 401) {
    return "Sesi kamu habis. Silakan masuk kembali."
  }

  if (status === 429) {
    return "Terlalu banyak permintaan. Coba lagi beberapa saat lagi."
  }

  return weatherErrorMessage(data) ?? "Prakiraan cuaca sedang tidak dapat dimuat."
}

function Weather() {
  const [weather, setWeather] = useState<WeatherOverview | null>(null)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getWeather()

        if (!active) {
          return
        }

        setWeather(data)
        setError("")
      } catch (requestError: unknown) {
        if (!active) {
          return
        }

        setError(describeWeatherError(requestError))
      } finally {
        if (active) {
          setIsRefreshing(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [retryKey])

  const refresh = () => {
    setIsRefreshing(true)
    setError("")
    setRetryKey((key) => key + 1)
  }

  const isLoading = weather === null && !error

  const locationLine = weather
    ? [
        weather.location.village,
        weather.location.district,
        weather.location.regency,
      ]
        .filter((part): part is string => Boolean(part))
        .join(", ")
    : ""

  const timezoneLabel = weather?.location.timezone_label ?? null
  const fetchedClock = weather
    ? formatFetchedClock(weather.source.fetched_at, timezoneLabel)
    : null
  const analysisTime = weather
    ? formatAnalysisTime(weather.source.analysis_at, timezoneLabel)
    : null
  const todayDate =
    weather?.daily.find((day) => day.is_today)?.date ?? null

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Prakiraan BMKG</p>
          <h1 className="page-title">Cuaca Kampus</h1>
          <p className="page-subtitle">
            {locationLine
              ? `Prakiraan untuk ${locationLine}.`
              : "Prakiraan cuaca terbaru dari BMKG."}
          </p>
        </div>

        {weather && (
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {fetchedClock && (
              <div className="text-right">
                <p className="text-[11px] font-medium text-slate-500">
                  Diperbarui
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-800">
                  {fetchedClock}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="btn-secondary shrink-0"
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={isRefreshing ? "animate-spin" : undefined}
              />
              {isRefreshing ? "Memuat..." : "Perbarui"}
            </button>
          </div>
        )}
      </header>

      {weather?.source.stale && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800"
        >
          <TriangleAlert
            size={17}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <p>
            Data mungkin tidak terbaru. BMKG belum dapat dihubungi, jadi
            prakiraan terakhir yang tersimpan tetap ditampilkan
            {fetchedClock ? ` (diperbarui ${fetchedClock})` : ""}.
          </p>
        </div>
      )}

      {error && weather && (
        <div
          role="alert"
          className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <TriangleAlert
            size={17}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <p>
            {error} Data terakhir yang berhasil dimuat tetap ditampilkan.
          </p>
        </div>
      )}

      {isLoading ? (
        <div
          aria-busy="true"
          className="glass-panel flex flex-col items-center justify-center gap-3 rounded-3xl py-20 text-slate-500"
        >
          <LoaderCircle
            size={30}
            aria-hidden="true"
            className="animate-spin"
          />
          <p className="text-sm">Memuat prakiraan cuaca BMKG...</p>
        </div>
      ) : !weather ? (
        <div
          role="alert"
          className="glass-panel flex flex-col items-center gap-3 rounded-3xl p-8 text-center"
        >
          <AlertCircle size={30} aria-hidden="true" className="text-red-500" />
          <p className="text-sm font-semibold text-slate-900">
            Prakiraan cuaca tidak dapat dimuat
          </p>
          <p className="max-w-md text-sm leading-6 text-slate-600">{error}</p>
          <button type="button" onClick={refresh} className="btn-secondary">
            <RefreshCw size={16} aria-hidden="true" />
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          {weather.current ? (
            <CurrentPanel
              current={weather.current}
              location={weather.location}
              todayDate={todayDate}
            />
          ) : (
            <EmptyState
              icon={CloudOff}
              title="Prakiraan saat ini tidak tersedia"
              description="BMKG belum mengirim slot prakiraan yang bisa ditampilkan. Coba perbarui beberapa saat lagi."
              action={
                <button
                  type="button"
                  onClick={refresh}
                  className="btn-secondary"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Perbarui
                </button>
              }
            />
          )}

          <HourlyPanel
            entries={weather.hourly}
            todayDate={todayDate}
            timezoneLabel={timezoneLabel}
          />

          <DailyPanel days={weather.daily} timezoneLabel={timezoneLabel} />

          <footer className="glass-panel flex flex-col gap-2 rounded-2xl px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 leading-5">
              <CloudSun
                size={15}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-500"
              />
              <span>{weather.source.attribution}</span>
            </p>

            <p className="shrink-0 tabular-nums text-slate-500">
              {analysisTime && `Analisis ${analysisTime}`}
              {analysisTime && fetchedClock ? " · " : ""}
              {fetchedClock && `Diperbarui ${fetchedClock}`}
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

interface CurrentPanelProps {
  current: WeatherEntry
  location: WeatherLocation
  todayDate: string | null
}

function CurrentPanel({ current, location, todayDate }: CurrentPanelProps) {
  const dayLabel = formatDayLabel(current.date, current.date === todayDate)
  const zone = location.timezone_label ? ` ${location.timezone_label}` : ""

  const metrics: {
    label: string
    value: string
    icon: LucideIcon
  }[] = [
    {
      label: "Kelembapan",
      value: formatPercent(current.humidity_percent),
      icon: Droplets,
    },
    {
      label: current.wind_direction
        ? `Angin dari ${current.wind_direction}`
        : "Angin",
      value: formatWind(current.wind_speed_kmh),
      icon: Wind,
    },
    {
      label: "Curah hujan",
      value: formatRain(current.precipitation_mm),
      icon: CloudRain,
    },
    {
      label: "Tutupan awan",
      value: formatPercent(current.cloud_cover_percent),
      icon: Cloud,
    },
  ]

  // vs/vs_text BMKG hampir selalu null. Baris jarak pandang hanya muncul
  // kalau BMKG benar-benar mengirim nilai, bukan diisi "Tidak tersedia".
  if (current.visibility_text) {
    metrics.push({
      label: "Jarak pandang",
      value: current.visibility_text,
      icon: Eye,
    })
  }

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <span
        aria-hidden="true"
        className="orb -bottom-24 -right-16 h-64 w-64 bg-sky-400/20"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="glass-chip h-14 w-14 shrink-0 text-sky-600">
              <WeatherGlyph code={current.weather_code} size={28} />
            </span>

            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">
                Prakiraan terdekat
              </p>
              <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">
                {current.description ?? "Kondisi tidak tersedia"}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                {dayLabel} · {current.time}
                {zone}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <p className="text-6xl font-bold leading-none tracking-tight tabular-nums text-slate-900 sm:text-7xl">
              {formatTemperature(current.temperature_c)}
            </p>
            <p className="pb-1 text-sm font-medium text-slate-500">
              suhu udara
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Prakiraan BMKG untuk {location.village ?? "lokasi kampus"}, bukan
            pengukuran langsung.
          </p>
        </div>

        <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-900/[0.08] pt-5 sm:grid-cols-3 lg:w-auto lg:min-w-[26rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {metrics.map((metric) => (
            <Metric
              key={metric.label}
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </dl>
      </div>
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        size={16}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-slate-500"
      />

      <div className="min-w-0">
        <dt className="text-[11px] font-medium leading-4 text-slate-500">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-semibold leading-5 tabular-nums text-slate-900">
          {value}
        </dd>
      </div>
    </div>
  )
}

interface HourlyPanelProps {
  entries: WeatherEntry[]
  todayDate: string | null
  timezoneLabel: string | null
}

function HourlyPanel({ entries, todayDate, timezoneLabel }: HourlyPanelProps) {
  return (
    <section className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Prakiraan per 3 jam
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {timezoneLabel
              ? `Waktu setempat (${timezoneLabel}).`
              : "Waktu setempat."}
          </p>
        </div>

        <span className="text-xs font-medium tabular-nums text-slate-500">
          {entries.length} slot
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Tidak ada prakiraan 3 jam berikutnya dari BMKG.
        </p>
      ) : (
        <ul
          aria-label="Prakiraan cuaca per 3 jam"
          className="mt-4 flex gap-3 overflow-x-auto pb-1"
        >
          {entries.map((entry, index) => {
            const startsNewDay =
              index === 0 || entry.date !== entries[index - 1].date
            const showDate = startsNewDay && entry.date !== todayDate

            return (
              <li
                key={entry.forecast_at}
                className="glass-card w-[7.25rem] shrink-0 rounded-2xl px-3 py-3 text-center"
              >
                <p className="text-xs font-medium tabular-nums text-slate-500">
                  {entry.time}
                </p>

                <WeatherGlyph
                  code={entry.weather_code}
                  size={22}
                  className="mx-auto mt-2 text-sky-600"
                />

                <p className="mt-2 text-lg font-semibold tabular-nums text-slate-900">
                  {formatTemperature(entry.temperature_c)}
                </p>

                <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-600">
                  {entry.description ?? "—"}
                </p>

                {entry.precipitation_mm !== null &&
                  entry.precipitation_mm > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-sky-700">
                      <Droplets size={11} aria-hidden="true" />
                      {formatDecimal(entry.precipitation_mm)} mm
                    </p>
                  )}

                {showDate && (
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    {formatShortDate(entry.date)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

interface DailyPanelProps {
  days: WeatherDay[]
  timezoneLabel: string | null
}

function DailyPanel({ days, timezoneLabel }: DailyPanelProps) {
  return (
    <section className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Prakiraan harian
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Ringkasan dari slot yang masih tersedia
            {timezoneLabel ? ` (${timezoneLabel}).` : "."}
          </p>
        </div>

        <span className="text-xs font-medium tabular-nums text-slate-500">
          {days.length} hari
        </span>
      </div>

      {days.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Belum ada prakiraan harian berikutnya dari BMKG.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
          {days.map((day) => (
            <li key={day.date} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDayLabel(day.date, day.is_today)}
                  </p>
                  {day.is_today && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatShortDate(day.date)}
                    </p>
                  )}
                </div>

                {day.is_partial && (
                  <span
                    title={`Baru ${day.entry_count} dari 8 slot tersedia`}
                    className="rounded-full bg-slate-900/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    Sebagian
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <WeatherGlyph
                  code={day.weather_code}
                  size={20}
                  className="shrink-0 text-sky-600"
                />
                <p className="line-clamp-1 text-sm font-medium text-slate-800">
                  {day.description ?? "—"}
                </p>
              </div>

              <dl className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <dt className="text-[11px] text-slate-500">Suhu</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                    {formatTemperatureRange(
                      day.min_temperature_c,
                      day.max_temperature_c,
                    )}
                  </dd>
                </div>

                <div className="text-right">
                  <dt className="text-[11px] text-slate-500">Hujan</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                    {formatRain(day.precipitation_mm)}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-900/[0.08] pt-2 text-[11px] tabular-nums text-slate-500">
                <span>
                  Kelembapan {formatPercent(day.average_humidity_percent)}
                </span>
                <span>Angin {formatWind(day.max_wind_speed_kmh)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Weather
