import api from "./api";

// Bentuk ini mengikuti payload GET /api/weather/ di backend
// (apps/weather/services.py). Nilai yang tidak tersedia dari BMKG tetap null:
// jangan diisi angka karangan di frontend.
export interface WeatherLocation {
  adm4: string;
  village: string | null;
  district: string | null;
  regency: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  // Label zona dari offset BMKG ("WITA"), bukan hardcode di frontend.
  timezone_label: string | null;
  utc_offset_minutes: number;
}

export interface WeatherEntry {
  forecast_at: string;
  date: string;
  time: string;
  temperature_c: number | null;
  humidity_percent: number | null;
  description: string | null;
  description_en: string | null;
  weather_code: number | null;
  wind_speed_kmh: number | null;
  wind_direction: string | null;
  wind_direction_degrees: number | null;
  wind_to: string | null;
  precipitation_mm: number | null;
  cloud_cover_percent: number | null;
  // BMKG saat ini mengirim null untuk hampir semua lokasi, jadi UI hanya
  // menampilkan baris ini kalau benar-benar berisi.
  visibility_text: string | null;
}

export interface WeatherDay {
  date: string;
  is_today: boolean;
  // true kalau BMKG belum menyediakan 8 slot penuh untuk hari tersebut.
  is_partial: boolean;
  entry_count: number;
  min_temperature_c: number | null;
  max_temperature_c: number | null;
  description: string | null;
  weather_code: number | null;
  precipitation_mm: number | null;
  average_humidity_percent: number | null;
  max_wind_speed_kmh: number | null;
}

export interface WeatherSource {
  provider: string;
  attribution: string;
  analysis_at: string | null;
  fetched_at: string;
  // true kalau request kali ini tidak memanggil BMKG karena cache masih hidup.
  cached: boolean;
  // true kalau BMKG gagal dan backend menyajikan salinan lama.
  stale: boolean;
}

export interface WeatherOverview {
  location: WeatherLocation;
  current: WeatherEntry | null;
  hourly: WeatherEntry[];
  daily: WeatherDay[];
  source: WeatherSource;
}

export const getWeather = async (): Promise<WeatherOverview> => {
  const response = await api.get<WeatherOverview>("/weather/");
  return response.data;
};

// Envelope error backend adalah {"error": {"code", "message"}}. Jangan memakai
// errorMessage() umum di sini: fungsi itu akan ikut menggabungkan `code`
// teknis ke kalimat yang dibaca pengguna.
export function weatherErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { error } = payload as { error?: unknown };

  if (!error || typeof error !== "object") {
    return null;
  }

  const message = (error as { message?: unknown }).message;

  return typeof message === "string" && message.trim() ? message : null;
}
