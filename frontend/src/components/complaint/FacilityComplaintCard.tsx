import { Calendar, Check, ChevronRight, Cog, Ghost, MapPin, User, Wrench, X } from "lucide-react"
import type { CSSProperties } from "react"
import { Link } from "react-router-dom"

import { subCategoryLabel } from "../../services/complaintService"
import type { ComplaintStatus } from "../../utils/statusConfig"
import StatusBadge from "../ui/StatusBadge"
import type { ComplaintCardProps } from "./ComplaintCard"

type StepState = "done" | "active" | "todo" | "rejected"
type LineState = "fill" | "flow" | "todo" | "rejected"

interface Step {
  label: string
  state: StepState
  // Keadaan garis yang MENGARAH ke langkah ini (langkah pertama tidak punya)
  line?: LineState
}

// Jalur progres tiket. Hanya empat status backend yang dipetakan di sini;
// tidak ada fakta baru yang dikarang (mis. tanggal tiap tahap) karena API tidak
// mengirimnya. Ditolak berhenti di "Ditinjau": laporan memang sudah dilihat
// pengelola sebelum ditolak.
function getSteps(status: ComplaintStatus): Step[] {
  switch (status) {
    case "PENDING":
      return [
        { label: "Dikirim", state: "active" },
        { label: "Diproses", state: "todo", line: "todo" },
        { label: "Selesai", state: "todo", line: "todo" },
      ]
    case "IN_PROGRESS":
      return [
        { label: "Dikirim", state: "done" },
        { label: "Diproses", state: "active", line: "fill" },
        { label: "Selesai", state: "todo", line: "flow" },
      ]
    case "RESOLVED":
      return [
        { label: "Dikirim", state: "done" },
        { label: "Diproses", state: "done", line: "fill" },
        { label: "Selesai", state: "done", line: "fill" },
      ]
    case "REJECTED":
      return [
        { label: "Dikirim", state: "done" },
        { label: "Ditinjau", state: "done", line: "fill" },
        { label: "Ditolak", state: "rejected", line: "rejected" },
      ]
  }
}

function StepNode({ state, spinning }: { state: StepState; spinning: boolean }) {
  if (state === "done") return <Check size={12} strokeWidth={3} aria-hidden="true" />
  if (state === "rejected") return <X size={12} strokeWidth={3} aria-hidden="true" />
  if (state === "active" && spinning) {
    return <Cog size={13} className="tk-cog-spin" aria-hidden="true" />
  }
  return null
}

// Kartu pengaduan kategori Fasilitas: bentuk TIKET PERBAIKAN. Stub di kiri
// berisi nomor dan barcode, dipisah garis sobekan bertakik dari badan tiket.
// Di badan ada jalur progres tiga langkah yang terisi sesuai status.
// Bentuk (takik lewat mask), gerak (stub "disobek", barcode dipindai, gir
// berputar), dan jalur progres didefinisikan di blok ".tk-*" index.css.
// Pembungkus .tk-wrap menanggung bayangan dan angkatan hover karena mask pada
// kartu juga memotong bayangannya sendiri.
function FacilityComplaintCard({
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
  const steps = getSteps(status)
  const ticketNumber = `#${String(id).padStart(3, "0")}`

  return (
    <div className="tk-wrap" data-status={status}>
      <article
        className="cat-card cat-fasilitas glass-card tk-card"
        data-category={category}
      >
        {/* Gir besar sebagai hiasan latar; berputar terus saat Diproses */}
        <Cog className="tk-watermark" size={120} strokeWidth={1.25} aria-hidden="true" />

        <div className="tk-stub">
          <span className="cat-icon h-10 w-10 rounded-xl">
            <Wrench size={18} aria-hidden="true" />
          </span>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700/80">
              Tiket
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {ticketNumber}
            </p>
          </div>

          <span className="tk-barcode" aria-hidden="true" />
        </div>

        <div className="tk-body">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <Wrench size={11} aria-hidden="true" />
                  Fasilitas
                </span>

                {subLabel && (
                  <span className="text-xs font-medium text-slate-500">{subLabel}</span>
                )}

                {isAnonymous && !reporter && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    <Ghost size={11} aria-hidden="true" />
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

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
              {location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
              {date}
            </span>
            {reporter && (
              <span className="flex items-center gap-1.5">
                <User size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
                {reporter}
              </span>
            )}
          </div>

          <ol className="tk-track" aria-label="Progres pengaduan">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className="tk-step"
                data-state={step.state}
                aria-current={step.state === "active" ? "step" : undefined}
                style={{ "--tk-i": index } as CSSProperties}
              >
                {step.line && (
                  <span className="tk-line" data-state={step.line} aria-hidden="true" />
                )}
                <span className="tk-node">
                  <StepNode state={step.state} spinning={status === "IN_PROGRESS"} />
                </span>
                <span className="tk-label">{step.label}</span>
              </li>
            ))}
          </ol>

          <Link
            to={`/complaints/${id}`}
            className="cat-ink group/link mt-3 flex items-center justify-end gap-1 rounded text-sm font-semibold hover:underline"
          >
            Lihat detail
            <ChevronRight
              size={16}
              className="transition group-hover/link:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </article>
    </div>
  )
}

export default FacilityComplaintCard
