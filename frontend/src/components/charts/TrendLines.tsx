import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CATEGORY_CONFIG,
  CATEGORIES,
} from "../../utils/categoryConfig";

interface TrendSeriesProps {
  // Satu baris per hari: { label: "4 Nov", FASILITAS: n, AKADEMIK: n, ... }
  data: Array<Record<string, number | string>>;
  height?: number;
  emptyLabel?: string;
}

function totalVotesInPoint(point: Record<string, number | string>): number {
  return CATEGORIES.reduce(
    (sum, category) => sum + ((point[category] as number) ?? 0),
    0,
  );
}

// Tren harian per kategori, tiga garis lurus satu palet kategori. Grid hanya
// horizontal (3–4 garis), tanpa sumbu Y terlihat, label x dipangkas interval —
// pola chart yang sama dengan studi terhadap dashboard nyata: garis kencang,
// chrome minim.
function TrendLines({
  data,
  height = 260,
  emptyLabel = "Belum ada pengaduan pada rentang ini.",
}: TrendSeriesProps) {
  const hasAnyVote = data.some((point) => totalVotesInPoint(point) > 0);

  if (!hasAnyVote) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-slate-900/10 px-6 text-center text-sm text-slate-500"
        style={{ minHeight: 200 }}
      >
        {emptyLabel}
      </div>
    );
  }

  const labelInterval = Math.max(
    1,
    Math.ceil(data.length / 6),
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid
            vertical={false}
            stroke="rgba(15, 23, 42, 0.08)"
            strokeDasharray="3 6"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(15, 23, 42, 0.12)" }}
            interval={labelInterval - 1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: "rgba(15, 23, 42, 0.2)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.7)",
              fontSize: 12,
              boxShadow: "0 18px 36px -24px rgba(30,41,59,0.45)",
            }}
          />
          {CATEGORIES.map((category) => (
            <Line
              key={category}
              type="linear"
              dataKey={category}
              name={CATEGORY_CONFIG[category].label}
              stroke={CATEGORY_CONFIG[category].chartColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legenda sebagai tabel nilai: dot, nama, total di periode terpilih. */}
      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {CATEGORIES.map((category) => {
          const config = CATEGORY_CONFIG[category];
          const total = data.reduce(
            (sum, point) => sum + ((point[category] as number) ?? 0),
            0,
          );

          return (
            <li key={category} className="flex items-center gap-2 text-xs text-slate-600">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: config.chartColor }}
              />
              {config.label}
              <span className="font-semibold tabular-nums text-slate-900">
                {total}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TrendLines;
