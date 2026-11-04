import type { LucideIcon } from "lucide-react";
import { Building2, GraduationCap, ShieldCheck } from "lucide-react";

import Sparkline from "../charts/Sparkline";
import Card from "../ui/Card";
import {
  CATEGORY_CONFIG,
  type ComplaintCategory,
} from "../../utils/categoryConfig";
import {
  formatResolutionHours,
  formatRate,
  type CategoryStats,
} from "../../utils/complaintStats";
import { STATUS_CONFIG } from "../../utils/statusConfig";

// Ikon per kategori disimpan di satu map agar kartu cukup menerima data
// CategoryStats tanpa props visual tambahan.
const CATEGORY_ICONS: Record<ComplaintCategory, LucideIcon> = {
  KEAMANAN: ShieldCheck,
  FASILITAS: Building2,
  AKADEMIK: GraduationCap,
};

interface CategoryCardProps {
  stat: CategoryStats;
  active: boolean;
  onSelect: () => void;
}

// Salah satu dari tiga kartu besar kategori. Klik kartu = pindah ke tab
// kategori itu, jadi elemennya button dan state aktif ditandai ring indigo.
function CategoryCard({ stat, active, onSelect }: CategoryCardProps) {
  const config = CATEGORY_CONFIG[stat.category];
  const Icon = CATEGORY_ICONS[stat.category];
  const activeRing = active
    ? "ring-2 ring-indigo-500/80 ring-offset-2 ring-offset-slate-100/60"
    : "focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100/60";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group h-full rounded-2xl text-left outline-none ${activeRing}`}
    >
      <Card className="glass-card-hover relative h-full overflow-hidden transition-shadow duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-600">
              {config.label}
            </p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
              {stat.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatRate(stat.resolutionRate)} terselesaikan ·{" "}
              {stat.avgResolution === null
                ? "belum ada yang selesai"
                : `rata-rata ${formatResolutionHours(stat.avgResolution)}`}
            </p>
          </div>

          <span
            className={`glass-chip h-10 w-10 shrink-0 ${config.chipClassName}`}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
        </div>

        {/* Mini bar status: segmen warna per status mengikuti STATUS_CONFIG. */}
        <div
          className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-900/[0.06]"
          role="img"
          aria-label={`Distribusi status ${config.label}: ${stat.slices
            .map(
              (slice) =>
                `${STATUS_CONFIG[slice.status].label} ${slice.count}`,
            )
            .join(", ")}`}
        >
          {stat.total > 0 &&
            stat.slices.map(
              (slice) =>
                slice.count > 0 && (
                  <span
                    key={slice.status}
                    style={{
                      width: `${(slice.count / stat.total) * 100}%`,
                      backgroundColor:
                        STATUS_CONFIG[slice.status].chartColor,
                    }}
                  />
                ),
            )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <span className="text-xs text-slate-500">
            {stat.total === 0
              ? "Belum ada pengaduan"
              : `${stat.highPriority} prioritas tinggi`}
          </span>
          <Sparkline
            points={stat.trend7}
            color={config.chartColor}
            height={26}
            summaryLabel={`Tren 7 hari terakhir kategori ${
              config.label
            }, total ${stat.trend7.reduce(
              (sum, point) => sum + point.count,
              0,
            )} pengaduan.`}
          />
        </div>
      </Card>
    </button>
  );
}

export default CategoryCard;
