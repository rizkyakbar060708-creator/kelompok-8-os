import type { TrendPoint } from "../../utils/complaintStats";

interface TrendBarsProps {
  points: TrendPoint[];
  height?: number;
  emptyLabel?: string;
}

// Grafik batang tren harian. Sengaja tanpa SVG dan tanpa library: satu seri
// batang sederhana cukup pakai flex + tinggi persen, dan dengan begitu tidak
// ada dependensi chart baru maupun kelas CSS baru di index.css.
function TrendBars({
  points,
  height = 160,
  emptyLabel = "Belum ada pengaduan pada rentang ini.",
}: TrendBarsProps) {
  const peak = points.reduce((max, point) => Math.max(max, point.count), 0);
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const summary = points
    .map((point) => `${point.label}: ${point.count}`)
    .join(", ");

  if (peak === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-slate-900/10 px-6 text-center text-sm text-slate-500"
        style={{ minHeight: height }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div>
      <div
        role="img"
        aria-label={`Jumlah pengaduan per hari, total ${total}. ${summary}`}
        className="flex items-end gap-1"
        style={{ height }}
      >
        {points.map((point) => (
          <div
            key={point.date}
            className="flex h-full flex-1 flex-col justify-end gap-1"
          >
            {point.count > 0 && (
              <span className="text-center text-[10px] font-semibold tabular-nums text-slate-600">
                {point.count}
              </span>
            )}

            <span
              className="w-full rounded-t-md bg-indigo-400/75 transition-colors hover:bg-indigo-500/85"
              style={{
                height: `${Math.max((point.count / peak) * 100, point.count > 0 ? 4 : 0)}%`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-1">
        {points.map((point, index) => (
          <span
            key={point.date}
            className="flex-1 truncate text-center text-[10px] text-slate-500"
          >
            {index % 2 === 0 ? point.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TrendBars;