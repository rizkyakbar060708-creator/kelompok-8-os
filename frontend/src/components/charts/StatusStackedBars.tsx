import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COMPLAINT_STATUSES, STATUS_CONFIG } from "../../utils/statusConfig";
import { categoryLabel } from "../../utils/categoryConfig";
import type { Complaint } from "../../services/complaintService";

interface StatusStackedBarsProps {
  // Satu baris per kategori; jumlah tiap status boleh nol atau tidak dikirim.
  data: Array<
    { category: string } & Partial<
      Record<Complaint["status"], number | string>
    >
  >;
  height?: number;
}

// Stacked bar status × kategori. Segmen biru/emerald/amber/merah memakai
// warna STATUS_CONFIG supaya swatch legenda selalu sama dengan badge di
// halaman lain (aturan "warna status hanya untuk status").
function StatusStackedBars({ data, height = 240 }: StatusStackedBarsProps) {
  // Alias 3 huruf supaya label x tidak terpotong di lebar kolom kecil.
  const shortLabel: Record<string, string> = {
    Fasilitas: "FAS",
    Akademik: "AKA",
    Keamanan: "KAM",
  };

  const compact = data.map((row) => {
    const longLabel = categoryLabel(
      row.category as Parameters<typeof categoryLabel>[0],
    );

    return {
      label: shortLabel[longLabel] ?? longLabel,
      PENDING: Number(row.PENDING ?? 0),
      IN_PROGRESS: Number(row.IN_PROGRESS ?? 0),
      RESOLVED: Number(row.RESOLVED ?? 0),
      REJECTED: Number(row.REJECTED ?? 0),
    };
  });

  const total = compact.reduce(
    (acc, row) =>
      acc +
      COMPLAINT_STATUSES.reduce((sum, status) => sum + row[status], 0),
    0,
  );

  if (total === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-900/10 px-6 text-center text-sm text-slate-500" style={{ minHeight: 200 }}>
        Belum ada pengaduan untuk dibandingkan.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={compact}
          margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          barCategoryGap="28%"
        >
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
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={34}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.7)",
              fontSize: 12,
              boxShadow: "0 18px 36px -24px rgba(30,41,59,0.45)",
            }}
          />
          {COMPLAINT_STATUSES.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              name={STATUS_CONFIG[status].label}
              stackId="status"
              fill={STATUS_CONFIG[status].chartColor}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {COMPLAINT_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-2 text-xs text-slate-600">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_CONFIG[status].chartColor }}
            />
            {STATUS_CONFIG[status].label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StatusStackedBars;
