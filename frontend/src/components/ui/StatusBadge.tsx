interface StatusBadgeProps {
  status: "submitted" | "verified" | "in_progress" | "resolved"
}

const statusConfig = {
  submitted: {
    label: "Diajukan",
    className: "bg-gray-100 text-gray-700",
  },
  verified: {
    label: "Diverifikasi",
    className: "bg-blue-100 text-blue-700",
  },
  in_progress: {
    label: "Diproses",
    className: "bg-yellow-100 text-yellow-700",
  },
  resolved: {
    label: "Selesai",
    className: "bg-green-100 text-green-700",
  },
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default StatusBadge