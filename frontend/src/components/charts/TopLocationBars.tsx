import { formatNumber } from "../../utils/complaintStats";

interface TopLocationBarsProps {
  items: Array<{ label: string; count: number }>;
  emptyLabel?: string;
  caption?: string;
}

// Daftar bar horizontal: satu baris label + bar isian + angka rata kanan.
// Tanpa recharts supaya terbaca di lebar sempit maupun roti tipis, dan tetap
// satu palet (indigo = brand) seperti aturan "warna di data".
function TopLocationBars({
  items,
  emptyLabel = "Belum ada lokasi yang terpakai pada rentang ini.",
  caption,
}: TopLocationBarsProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-900/10 px-6 py-10 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  const peak = items.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label} className="group">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-slate-700" title={item.label}>
                {item.label}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                {formatNumber(item.count)}
              </span>
            </div>

            <div
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-900/[0.06]"
              role="img"
              aria-label={`${item.label}: ${item.count} pengaduan`}
            >
              <div
                className="h-full rounded-full bg-indigo-500/85 transition-all duration-300 group-hover:bg-indigo-500"
                style={{ width: `${Math.max((item.count / peak) * 100, 4)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {caption && (
        <p className="mt-4 text-xs text-slate-500">{caption}</p>
      )}
    </div>
  );
}

export default TopLocationBars;
