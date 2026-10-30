import type { Complaint } from "../services/complaintService";

// Tipe status sengaja diturunkan dari Complaint, bukan ditulis ulang. Sebelum
// ini `Status` dideklarasikan terpisah di StatusBadge, ComplaintCard, dan
// ComplaintDetail; menambah status baru di satu tempat tidak otomatis berlaku
// di yang lain. Memusatkannya di sini membuat badge, chart, dan label status
// ikut berubah begitu model menambah nilai baru.
//
// Catatan: map ini TIDAK punya fallback untuk status di luar empat nilai.
// Serializer backend membatasi status lewat TextChoices Complaint.Status, jadi
// nilai lain berarti bug; lebih baik gagal keras daripada tampil salah diam-diam.
export type ComplaintStatus = Complaint["status"];

export const COMPLAINT_STATUSES: readonly ComplaintStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

interface StatusConfig {
  label: string;
  // Kelas untuk StatusBadge. Latar opak, bukan kaca, mengikuti design.md §7.4.
  badgeClassName: string;
  // Warna segmen chart. Properti stroke/fill SVG tidak bisa memakai kelas
  // Tailwind, jadi hex ditulis eksplisit dan diselaraskan dengan tint badge.
  chartColor: string;
}

export const STATUS_CONFIG: Record<ComplaintStatus, StatusConfig> = {
  PENDING: {
    label: "Menunggu",
    badgeClassName: "bg-amber-100 text-amber-700",
    chartColor: "#f59e0b",
  },
  IN_PROGRESS: {
    label: "Diproses",
    badgeClassName: "bg-blue-100 text-blue-700",
    chartColor: "#3b82f6",
  },
  RESOLVED: {
    label: "Selesai",
    badgeClassName: "bg-emerald-100 text-emerald-700",
    chartColor: "#10b981",
  },
  REJECTED: {
    label: "Ditolak",
    badgeClassName: "bg-red-100 text-red-700",
    chartColor: "#ef4444",
  },
};

export const statusLabel = (status: ComplaintStatus): string =>
  STATUS_CONFIG[status].label;

// Bentuk data untuk donut chart dan legenda. Defined di sini, bukan di komponen
// chart, supaya agregasi di utils/complaintStats.ts tidak perlu mengimpor dari
// lapisan tampilan.
export interface StatusSlice {
  status: ComplaintStatus;
  count: number;
}