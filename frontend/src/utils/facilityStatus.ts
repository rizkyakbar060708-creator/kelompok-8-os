import type { FacilityStatus } from "../services/facilityService"

// Definisi konfigurasi status fasilitas kampus: Aktif, Perawatan, Nonaktif.
// Dipusatkan di sini agar FacilitiesAdmin dan modal Denah Gedung berbagi
// sumber kebenaran yang sama untuk label, badge, dan keterangan.

export interface FacilityStatusOption {
  value: FacilityStatus
  label: string
  hint: string
}

export const FACILITY_STATUS_OPTIONS: readonly FacilityStatusOption[] = [
  {
    value: "ACTIVE",
    label: "Aktif",
    hint: "Fasilitas bisa dipakai dan menerima pengaduan",
  },
  {
    value: "MAINTENANCE",
    label: "Perawatan",
    hint: "Sedang diperbaiki, pengaduan masih bisa dibuat",
  },
  {
    value: "INACTIVE",
    label: "Nonaktif",
    hint: "Tidak dipakai lagi",
  },
]

export const KNOWN_FACILITY_STATUSES: readonly FacilityStatus[] = [
  "ACTIVE",
  "MAINTENANCE",
  "INACTIVE",
]

export interface FacilityStatusMeta {
  label: string
  className: string
}

export const FACILITY_STATUS_META: Record<FacilityStatus, FacilityStatusMeta> = {
  ACTIVE: { label: "Aktif", className: "bg-emerald-100 text-emerald-700" },
  MAINTENANCE: { label: "Perawatan", className: "bg-amber-100 text-amber-700" },
  INACTIVE: { label: "Nonaktif", className: "bg-slate-100 text-slate-600" },
}

export function getFacilityStatusMeta(status: string): FacilityStatusMeta {
  if (status in FACILITY_STATUS_META) {
    return FACILITY_STATUS_META[status as FacilityStatus]
  }
  return { label: status, className: "bg-slate-100 text-slate-600" }
}
