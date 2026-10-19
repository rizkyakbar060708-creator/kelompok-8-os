import {
  STATUS_CONFIG,
  type StatusSlice,
} from "../../utils/statusConfig";

interface StatusDonutProps {
  slices: StatusSlice[];
  total: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  caption?: string;
}

const RADIUS = 42;

// Lingkaran penuh dari circumference. Setiap segmen memakai stroke-dasharray
// dengan panjang proporsional terhadap total, lalu digeser dengan
// strokeDashoffset supaya mulai dari pukul 12 (svg diputar -90 derajat).
// SVG murni: tidak ada dependensi chart baru, dan warnanya diambil dari
// STATUS_CONFIG supaya sama persis dengan badge status.
function StatusDonut({
  slices,
  total,
  size = 180,
  thickness = 14,
  centerLabel,
  caption,
}: StatusDonutProps) {
  const circumference = 2 * Math.PI * RADIUS;
  const activeSlices = slices.filter((slice) => slice.count > 0);

  // Offset dihitung lewat reduce, bukan variabel yang diakumulasi di dalam
  // map, supaya tidak ada penulisan ulang state saat render.
  const segments = activeSlices.reduce<
    { status: (typeof activeSlices)[number]["status"]; length: number; dashOffset: number }[]
  >((accumulated, slice) => {
    const travelled = accumulated.reduce(
      (sum, segment) => sum + segment.length,
      0,
    );
    const length = total > 0 ? (slice.count / total) * circumference : 0;

    return [
      ...accumulated,
      { status: slice.status, length, dashOffset: -travelled },
    ];
  }, []);

  const summary = activeSlices
    .map((slice) => `${STATUS_CONFIG[slice.status].label} ${slice.count}`)
    .join(", ");

  return (
    <svg
      role="img"
      aria-label={
        total > 0
          ? `Distribusi status pengaduan: ${summary}`
          : "Belum ada pengaduan untuk digambar"
      }
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0"
    >
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        strokeWidth={thickness}
        className="stroke-slate-900/[0.07]"
      />

      {segments.map((segment) => (
        <circle
          key={segment.status}
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={STATUS_CONFIG[segment.status].chartColor}
          strokeWidth={thickness}
          strokeLinecap="butt"
          strokeDasharray={`${segment.length} ${circumference - segment.length}`}
          strokeDashoffset={segment.dashOffset}
          transform="rotate(-90 50 50)"
        />
      ))}

      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-900 text-[22px] font-bold"
      >
        {centerLabel ?? total}
      </text>

      {caption && (
        <text
          x="50"
          y="66"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-500 text-[8px] font-medium"
        >
          {caption}
        </text>
      )}
    </svg>
  );
}

export default StatusDonut;