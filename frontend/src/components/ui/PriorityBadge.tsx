import { ClipboardList } from "lucide-react";

import { PRIORITY_CONFIG } from "../../utils/priorityConfig";

interface PriorityBadgeProps {
  priority: keyof typeof PRIORITY_CONFIG;
}

// Pil prioritas identik dengan spesifikasi design.md §9.2: glass-pill + ikon
// ClipboardList 13px + label Indonesia (Rendah/Sedang/Tinggi).
function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={`glass-pill gap-1.5 px-2.5 py-1 text-xs font-semibold ${config.pillClassName}`}
    >
      <ClipboardList size={13} className="shrink-0" />
      {config.label}
    </span>
  );
}

export default PriorityBadge;
