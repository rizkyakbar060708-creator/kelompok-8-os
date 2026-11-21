import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSun,
  Cloudy,
  Sun,
  type LucideIcon,
} from "lucide-react"

// Kode cuaca BMKG. Kode yang tidak dikenal tetap ditampilkan dengan ikon awan
// netral; deskripsi asli dari BMKG yang menjadi sumber informasi utama, bukan
// ikon.
const WEATHER_ICONS: Record<number, LucideIcon> = {
  0: Sun,
  1: CloudSun,
  2: Cloud,
  3: Cloudy,
  4: CloudFog,
  5: CloudFog,
  10: CloudFog,
  45: CloudFog,
  60: CloudDrizzle,
  61: CloudRain,
  63: CloudRainWind,
  80: CloudRain,
  95: CloudLightning,
  97: CloudLightning,
}

export const weatherIconFor = (code: number | null | undefined): LucideIcon =>
  code === null || code === undefined ? Cloud : (WEATHER_ICONS[code] ?? Cloud)

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
})

const isNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value)

export const formatDecimal = (value: number | null | undefined): string =>
  isNumber(value) ? decimalFormatter.format(value) : "—"

export const formatInteger = (value: number | null | undefined): string =>
  isNumber(value) ? integerFormatter.format(value) : "—"

export const formatTemperature = (value: number | null | undefined): string =>
  isNumber(value) ? `${decimalFormatter.format(value)}°` : "—"

export const formatPercent = (value: number | null | undefined): string =>
  isNumber(value) ? `${integerFormatter.format(value)}%` : "—"

// Hari pertama yang baru terisi satu slot punya min = max. Menampilkan satu
// angka lebih jujur daripada rentang palsu "26° – 26°".
export function formatTemperatureRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (!isNumber(min) && !isNumber(max)) {
    return "—"
  }

  if (!isNumber(min)) {
    return formatTemperature(max)
  }

  if (!isNumber(max)) {
    return formatTemperature(min)
  }

  return min === max
    ? formatTemperature(min)
    : `${formatTemperature(min)} – ${formatTemperature(max)}`
}

export const formatRain = (value: number | null | undefined): string =>
  isNumber(value) ? `${decimalFormatter.format(value)} mm` : "—"

export const formatWind = (value: number | null | undefined): string =>
  isNumber(value) ? `${decimalFormatter.format(value)} km/jam` : "—"

// DateField/date BMKG adalah tanggal kalender lokal. "T00:00:00" mencegah
// parser membacanya sebagai tengah malam UTC yang bisa menggeser hari di
// browser dengan zona waktu lain.
const parseLocalDate = (value: string): Date | null => {
  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDayLabel(value: string, isToday: boolean): string {
  if (isToday) {
    return "Hari ini"
  }

  const date = parseLocalDate(value)

  if (!date) {
    return value
  }

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

export function formatShortDate(value: string): string {
  const date = parseLocalDate(value)

  if (!date) {
    return value
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })
}

// analysis_at dan fetched_at dibuat backend dalam waktu lokal lokasi, jadi
// jam dindingnya dibaca langsung dari string. Ini menghindari konversi ulang
// yang bisa bergeser kalau browser pengguna berada di zona lain.
export function formatAnalysisTime(
  value: string | null,
  timezoneLabel: string | null,
): string | null {
  if (!value) {
    return null
  }

  const [datePart, timePart] = value.split("T")

  if (!datePart) {
    return null
  }

  const date = parseLocalDate(datePart)
  const formattedDate = date
    ? date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : datePart
  const clock = timePart?.slice(0, 5)
  const zone = timezoneLabel ? ` ${timezoneLabel}` : ""

  return clock ? `${formattedDate}, ${clock}${zone}` : formattedDate
}

export function formatFetchedClock(
  value: string,
  timezoneLabel: string | null,
): string | null {
  const match = /T(\d{2}:\d{2})/.exec(value)

  if (!match) {
    return null
  }

  return timezoneLabel ? `${match[1]} ${timezoneLabel}` : match[1]
}
