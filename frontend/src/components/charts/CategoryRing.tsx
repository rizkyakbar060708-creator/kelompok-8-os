import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import {
  CATEGORY_CONFIG,
  type ComplaintCategory,
} from "../../utils/categoryConfig";
import { formatRate } from "../../utils/complaintStats";

interface CategoryRingProps {
  perCategory: Record<ComplaintCategory, number>;
  total: number;
  height?: number;
}

interface Slice {
  category: ComplaintCategory;
  label: string;
  count: number;
  color: string;
}

// Donut komposisi kategori. Ring tipis (stroke besar innerRadius) bukan sektor
// penuh, karena jumlah bagiannya hanya tiga dan tetap terbaca walaupun satu
// kategori mendominasi. Value 0 tidak di-render supaya labelnya tidak menipu.
function CategoryRing({ perCategory, total, height = 200 }: CategoryRingProps) {
  const categories: ComplaintCategory[] = [
    "FASILITAS",
    "AKADEMIK",
    "KEAMANAN",
  ];

  const data: Slice[] = categories
    .map((category) => ({
      category,
      label: CATEGORY_CONFIG[category].label,
      count: perCategory[category] ?? 0,
      color: CATEGORY_CONFIG[category].chartColor,
    }))
    .filter((slice) => slice.count > 0);

  // Sembunyikan slice bernilai nol, tapi tetap tulis angka 0 di legenda bila
  // kategori itu memang ada di data (impas dengan by_category backend).
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[210px] w-[210px] shrink-0">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Belum ada data komposisi.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={82}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {data.map((slice) => (
                    <Cell key={slice.category} fill={slice.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {total}
              </span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </>
        )}
      </div>

      <ul className="w-full space-y-2.5">
        {categories.map((category) => {
          const count = perCategory[category] ?? 0;
          const config = CATEGORY_CONFIG[category];

          return (
            <li key={category} className="flex items-center gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: config.chartColor }}
              />
              <span className="text-slate-600">{config.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-900">
                {count}
              </span>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-500">
                {total === 0 ? "0,0%" : formatRate((count / total) * 100)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CategoryRing;
