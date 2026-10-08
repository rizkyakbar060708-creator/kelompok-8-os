interface StatusBadgeProps {
  status: "submitted" | "verified" | "in_progress" | "resolved"
}

const statusConfig = {
  submitted: {
    label: "Diajukan",
    dotClassName: "bg-slate-500",
    pillClassName:
      "border-white/70 bg-slate-100/90 text-slate-700",
  },
  verified: {
    label: "Diverifikasi",
    dotClassName: "bg-sky-600",
    pillClassName:
      "border-sky-200 bg-sky-50/95 text-sky-800",
  },
  in_progress: {
    label: "Diproses",
    dotClassName: "bg-amber-600",
    pillClassName:
      "border-amber-200 bg-amber-50/95 text-amber-900",
  },
  resolved: {
    label: "Selesai",
    dotClassName: "bg-emerald-600",
    pillClassName:
      "border-emerald-200 bg-emerald-50/95 text-emerald-800",
  },
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`glass-pill shrink-0 gap-1.5 px-2.5 py-1 text-xs font-semibold ${config.pillClassName}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} />

      {config.label}
    </span>
  )
}

export default StatusBadge