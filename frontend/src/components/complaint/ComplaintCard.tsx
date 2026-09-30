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
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-gray-500">
            {category}
          </p>

          <h3 className="font-semibold text-gray-900">
            {title}
          </h3>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          {location}
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} />
          {date}
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <Link
          to={`/complaints/${id}`}
          className="flex items-center justify-end gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Lihat detail
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}

export default ComplaintCard