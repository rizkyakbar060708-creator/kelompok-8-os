import type { Complaint } from "../services/complaintService";

// Sumber kebenaran warna dan label prioritas. Gaya pil mengikuti design.md
// §9.2 (LOW slate, MEDIUM amber, HIGH indigo), tempatkan di satu file agar
// badge di tabel, kartu, dan detail tidak saling berbeda seperti yang pernah
// terjadi dengan label "Prioritas HIGH".
export type ComplaintPriority = Complaint["priority"];

export const PRIORITY_CONFIG: Record<
  ComplaintPriority,
  { label: string; pillClassName: string }
> = {
  LOW: {
    label: "Rendah",
    pillClassName: "border-slate-200 bg-white/70 text-slate-600",
  },
  MEDIUM: {
    label: "Sedang",
    pillClassName: "border-amber-200 bg-amber-50/90 text-amber-700",
  },
  HIGH: {
    label: "Tinggi",
    pillClassName: "border-indigo-200 bg-indigo-50/90 text-indigo-700",
  },
};
