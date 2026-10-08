import { MapPin, Calendar, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import StatusBadge from "../ui/StatusBadge"

interface ComplaintCardProps {
  id: number
  title: string
  category: string
  location: string
  date: string
  status: "submitted" | "verified" | "in_progress" | "resolved"
}

function ComplaintCard({
  id,
  title,
  category,
  location,
  date,
  status,
}: ComplaintCardProps) {
  return (
    <article className="glass-card glass-card-hover group rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
            {category}
          </p>

          <h3 className="font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-500" />
          {location}
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          {date}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-900/[0.08] pt-4">
        <Link
          to={`/complaints/${id}`}
          className="flex items-center justify-end gap-1 rounded text-sm font-semibold text-indigo-600 transition group-hover:text-violet-700 hover:text-violet-700"
        >
          Lihat detail
          <ChevronRight
            size={16}
            className="transition group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  )
}

export default ComplaintCard