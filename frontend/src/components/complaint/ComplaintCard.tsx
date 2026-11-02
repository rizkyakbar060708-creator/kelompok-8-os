import { MapPin, Calendar, ChevronRight, User, Ghost, Building2, GraduationCap, Shield } from "lucide-react"
import { Link } from "react-router-dom"

import { subCategoryLabel } from "../../services/complaintService"
import StatusBadge from "../ui/StatusBadge"

type Status =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"

type Category = "FASILITAS" | "AKADEMIK" | "KEAMANAN"

interface ComplaintCardProps {
  id: number
  title: string
  category: Category
  // Nilai mentah (mis. "PENCURIAN"); label tampilan dihitung di sini.
  subCategory?: string | null
  location: string
  date: string
  status: Status
  // Hanya diisi untuk role ADMIN; backend mengirim null untuk role lain.
  reporter?: string | null
  // Tampil "Anonim" saat laporan anonim dan identitas memang tidak terkirim.
  isAnonymous?: boolean
}

function CategoryBadge({ category }: { category: Category }) {
  // Latar opak seperti StatusBadge (design.md §7.4), bukan permukaan kaca,
  // supaya badge tetap terbaca di atas glass-card.
  const config = {
    FASILITAS: {
      label: "Fasilitas",
      className: "bg-indigo-100 text-indigo-700",
      icon: Building2,
    },
    AKADEMIK: {
      label: "Akademik",
      className: "bg-emerald-100 text-emerald-700",
      icon: GraduationCap,
    },
    KEAMANAN: {
      label: "Keamanan",
      className: "bg-amber-100 text-amber-700",
      icon: Shield,
    },
  }[category]

  const Icon = config.icon

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      <Icon size={11} />
      {config.label}
    </span>
  )
}

function ComplaintCard({
  id,
  title,
  category,
  subCategory,
  location,
  date,
  status,
  reporter,
  isAnonymous = false,
}: ComplaintCardProps) {
  const subLabel = subCategoryLabel(subCategory ?? null)

  return (
    <article className="glass-card glass-card-hover group rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <CategoryBadge category={category} />

            {subLabel && (
              <span className="text-xs font-medium text-slate-500">
                {subLabel}
              </span>
            )}

            {isAnonymous && !reporter && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Ghost size={11} />
                Anonim
              </span>
            )}
          </div>

          <h3 className="mt-1.5 font-semibold tracking-tight text-slate-900">
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

        {reporter && (
          <div className="flex items-center gap-2">
            <User size={16} className="text-slate-500" />
            {reporter}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-900/8 pt-4">
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
