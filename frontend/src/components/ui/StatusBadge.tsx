type Status =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"

interface StatusBadgeProps {
  status: Status
}

const statusConfig: Record<
  Status,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-700",
  },
  IN_PROGRESS: {
    label: "Diproses",
    className: "bg-blue-100 text-blue-700",
  },
  RESOLVED: {
    label: "Selesai",
    className: "bg-emerald-100 text-emerald-700",
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-100 text-red-700",
  },
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default StatusBadge
