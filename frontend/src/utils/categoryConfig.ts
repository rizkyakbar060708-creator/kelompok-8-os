import type { ComplaintCategoryName } from "../services/complaintService";

// Tipe kategori sengaja diturunkan dari Complaint, sama seperti pola
// statusConfig.ts. Menambah kategori berarti menambah nilai enum backend dan
// keduanya di-sinkron lewat satu union ini.
export type ComplaintCategory = ComplaintCategoryName;

export interface CategoryConfig {
  label: string;
  // Chip tint di kartu kategori. Latar opak mengikuti pola CategoryBadge di
  // ComplaintCard (design.md §7.4): badge jangan memakai permukaan kaca.
  chipClassName: string;
  // Warna segmen chart. Properti SVG tidak bisa memakai kelas Tailwind, jadi
  // hex ditulis eksplisit dan diselaraskan dengan tint badge.
  chartColor: string;
}

export const CATEGORY_CONFIG: Record<ComplaintCategory, CategoryConfig> = {
  FASILITAS: {
    label: "Fasilitas",
    chipClassName: "bg-indigo-100 text-indigo-700",
    // Indigo dipilih juga karena sama dengan warna brand (btn-primary), jadi
    // kategori utama aplikasi mewakili identitas visualnya.
    chartColor: "#4f46e5",
  },
  AKADEMIK: {
    label: "Akademik",
    chipClassName: "bg-emerald-100 text-emerald-700",
    chartColor: "#059669",
  },
  KEAMANAN: {
    label: "Keamanan",
    chipClassName: "bg-amber-100 text-amber-700",
    chartColor: "#d97706",
  },
};

export const CATEGORIES: readonly ComplaintCategory[] = [
  "KEAMANAN",
  "FASILITAS",
  "AKADEMIK",
];

export const categoryLabel = (category: ComplaintCategory): string =>
  CATEGORY_CONFIG[category].label;
