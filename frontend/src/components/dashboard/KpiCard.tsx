import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import Card from "../ui/Card";

export type DeltaTone = "good" | "bad" | "neutral";

export interface Delta {
  // "+3" / "-2" / "+4 baru"; null berarti tidak ada pembanding yang sehat
  // (rentang "semua", atau dua periode sama-sama kosong).
  text: string | null;
  tone: DeltaTone;
  // Jendela pembanding: "vs 6 hari sebelumnya".
  windowLabel?: string;
}

interface KpiCardProps {
  label: string;
  // Angka siap tampil ("27", "68,4%"); pemformatan satuan di pemanggil.
  value: string;
  detail?: string;
  icon: LucideIcon;
  orb: string;
  chipTone: string;
  href?: string;
  delta?: Delta | null;
  loading?: boolean;
}

// Nada warna delta: hijau = arah baik metrik, merah = arah buruk, abu = netral
// atau data yang belum bisa dibandingkan. Arah baik/buruk ditentukan pemanggil
// (menunggu naik itu buruk, selesai naik itu baik) — komponen ini hanya render.
const DELTA_TONE: Record<DeltaTone, string> = {
  good: "text-emerald-600",
  bad: "text-rose-600",
  neutral: "text-slate-500",
};

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  orb,
  chipTone,
  href,
  delta = null,
  loading = false,
}: KpiCardProps) {
  const body = (
    <Card className="group relative h-full overflow-hidden">
      <span
        className={`orb -right-9 -top-9 h-28 w-28 ${orb} transition-transform duration-500 ease-out group-hover:scale-125`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{label}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : value}
          </p>

          <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2">
            {delta?.text && (
              <span
                className={`text-xs font-semibold tabular-nums ${DELTA_TONE[delta.tone]}`}
              >
                {delta.text}
              </span>
            )}

            <span className="text-xs font-medium text-slate-500">
              {loading
                ? "Memuat..."
                : (delta?.text && delta.windowLabel) || detail}
            </span>
          </div>
        </div>

        <span className={`glass-chip h-11 w-11 shrink-0 ${chipTone}`}>
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="focus-visible:outline-indigo-500">
        {body}
      </Link>
    );
  }

  return body;
}

export default KpiCard;
