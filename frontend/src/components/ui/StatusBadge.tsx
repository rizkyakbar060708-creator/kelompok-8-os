import {
  STATUS_CONFIG,
  type ComplaintStatus,
} from "../../utils/statusConfig";

interface StatusBadgeProps {
  status: ComplaintStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClassName}`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;