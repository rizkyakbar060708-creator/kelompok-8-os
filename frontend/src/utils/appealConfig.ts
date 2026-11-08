import type { AppealStatus } from "../services/appealService";

// Tipe kanonik diekspor ulang supaya komponen cukup mengimpor satu modul,
// mengikuti cara utils/statusConfig.ts menurunkan ComplaintStatus.
export type { AppealStatus };

// Tipe status sengaja diturunkan dari Appeal, bukan ditulis ulang, mengikuti
// pola ComplaintStatus di utils/statusConfig.ts.
//
// Catatan: map ini TIDAK punya fallback untuk status di luar tiga nilai.
// Serializer backend membatasi status lewat TextChoices Appeal.Status, jadi
// nilai lain berarti bug; lebih baik gagal keras daripada tampil salah
// diam-diam.
export const APPEAL_STATUSES: readonly AppealStatus[] = [
  "PENDING",
  "ACCEPTED",
  "DENIED",
];

interface AppealStatusConfig {
  label: string;
  // Kelas untuk badge. Latar opak dengan pola tiga-part yang sama seperti
  // STATUS_CONFIG: label Indonesia, bukan nilai enum mentah.
  badgeClassName: string;
}

export const APPEAL_STATUS_CONFIG: Record<AppealStatus, AppealStatusConfig> = {
  PENDING: {
    label: "Menunggu",
    badgeClassName: "bg-amber-100 text-amber-700",
  },
  ACCEPTED: {
    label: "Diterima",
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
  DENIED: {
    label: "Ditolak",
    badgeClassName: "bg-red-100 text-red-700",
  },
};

export const appealStatusLabel = (status: AppealStatus): string =>
  APPEAL_STATUS_CONFIG[status].label;
