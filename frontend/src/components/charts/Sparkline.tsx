import type { TrendPoint } from "../../utils/complaintStats";

interface SparklineProps {
  points: TrendPoint[];
  color: string;
  height?: number;
  summaryLabel?: string;
}

// Grafik garis mini untuk kartu kategori. SVG murni tanpa library supaya
// 3 kartu kecil bisa dirender tanpa menyalakan bundel chart dua kali.
// Garis lurus (bukan kurva) mengikuti aturan design: kurva bisa mengarang
// nilai di antara dua total harian.
function Sparkline({ points, color, height = 32, summaryLabel }: SparklineProps) {
  const max = points.reduce((peak, point) => Math.max(peak, point.count), 0);

  const summary =
    summaryLabel ?? "Tren 7 hari terakhir tanpa pengaduan baru." ;

  // W: lebar viewBox 100 unit; titik pertama/terakhir ditarik ke dalam agar
  // garis tidak menabrak tepi.
  const innerWidth = points.length > 1 ? 96 : 0;
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const x = 2 + index * step;
    const y = max > 0 ? 28 - (point.count / max) * 26 : 28;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      role="img"
      aria-label={summary}
      width="100%"
      height={height}
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="shrink-0"
    >
      <polyline
        points={coordinates.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={max === 0 ? 0.35 : 0.9}
      />
    </svg>
  );
}

export default Sparkline;
