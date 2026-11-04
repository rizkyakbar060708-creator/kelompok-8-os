import { AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

import type { Complaint } from "../../services/complaintService";
import {
  ageLabel,
  attentionReason,
  formatNumber,
  needsAttention,
} from "../../utils/complaintStats";
import { CATEGORY_CONFIG } from "../../utils/categoryConfig";

interface AttentionPanelProps {
  rows: Complaint[];
  maxItems?: number;
}

// Panel "Perlu perhatian": pengaduan HIGH atau yang sudah mengendap lebih dari
// 3 hari. Baris paling tua ditampilkan dulu supaya itu yang pertama ditangani.
function AttentionPanel({ rows, maxItems = 6 }: AttentionPanelProps) {
  const flagged = rows
    .filter((row) => needsAttention(row))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const visible = flagged.slice(0, maxItems);
  const remaining = flagged.length - visible.length;

  return (
    <section
      aria-labelledby="attention-panel-title"
      className="glass-card rounded-2xl border-rose-200/70 bg-rose-50/60 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="glass-chip h-9 w-9 shrink-0 bg-rose-100 text-rose-700">
          <AlertTriangle size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="attention-panel-title" className="text-sm font-semibold text-rose-900">
            Perlu perhatian
          </h2>
          <p className="text-xs text-rose-700/90">
            {visible.length === 0
              ? "Tidak ada pengaduan yang tertunda di kategori ini."
              : "Pengaduan HIGH atau belum ditangani lebih dari 3 hari"}
          </p>
        </div>
      </div>

      {visible.length > 0 && (
        <ul className="mt-4 space-y-2">
          {visible.map((row) => {
            const categoryLabelValue =
              CATEGORY_CONFIG[row.category]?.label ?? row.category;

            return (
              <li key={row.id}>
                <Link
                  to={`/complaints/${row.id}`}
                  className="group flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {row.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-rose-700">
                      <span>{categoryLabelValue}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" />
                        {ageLabel(row.created_at)}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                      {attentionReason(row)}
                    </p>
                  </div>

                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {remaining > 0 && (
        <p className="mt-3 text-xs font-medium text-rose-700">
          {formatNumber(remaining)} pengaduan lain juga perlu ditangani.
        </p>
      )}
    </section>
  );
}

export default AttentionPanel;
