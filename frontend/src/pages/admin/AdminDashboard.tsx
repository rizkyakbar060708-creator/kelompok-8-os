import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Card from "../../components/ui/Card"
import StatusBadge from "../../components/ui/StatusBadge"
import { getComplaints } from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import {
  buildStats,
  formatDate,
  formatRate,
  joinFacilities,
  type ComplaintRow,
} from "../../utils/complaintStats"

const MAX_RECENT = 6

function AdminDashboard() {
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [complaints, facilities] = await Promise.all([
          getComplaints(),
          getFacilities(),
        ])

        if (!active) {
          return
        }

        setRows(joinFacilities(complaints, facilities))
        setError("")
      } catch {
        if (!active) {
          return
        }

        setRows([])
        setError("Gagal memuat pengaduan. Coba muat ulang halaman.")
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const stats = buildStats(rows ?? [])
  const recent = (rows ?? []).slice(0, MAX_RECENT)

  // TODO(backend): agregasi ini dihitung di client dari list penuh karena
  // GET /api/complaints/stats/ belum ada. Begitu endpoint-nya tersedia,
  // ganti buildStats(rows) dengan response dari server.
  const metrics = [
    {
      label: "Total pengaduan",
      value: String(stats.total),
      detail: "Seluruh pelapor",
      icon: FileText,
      orb: "bg-sky-400/25",
      tone: "border-sky-200 bg-sky-50/90 text-sky-700",
    },
    {
      label: "Menunggu",
      value: String(stats.pending),
      detail: `${stats.inProgress} sedang diproses`,
      icon: Clock3,
      orb: "bg-amber-300/25",
      tone: "border-amber-200 bg-amber-50/90 text-amber-700",
    },
    {
      label: "Selesai",
      value: String(stats.resolved),
      detail: `${formatRate(stats.resolutionRate)} terselesaikan`,
      icon: CheckCircle2,
      orb: "bg-emerald-300/25",
      tone: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
    },
    {
      label: "Ditolak",
      value: String(stats.rejected),
      detail: "Perlu tinjauan ulang",
      icon: XCircle,
      orb: "bg-rose-300/25",
      tone: "border-rose-200 bg-rose-50/90 text-rose-700",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Panel administrator</p>
          <h1 className="page-title">Dashboard Admin</h1>
          <p className="page-subtitle">
            Pantau seluruh pengaduan fasilitas kampus.
          </p>
        </div>

        <Link to="/complaints" className="btn-primary w-full sm:w-auto">
          <ShieldCheck size={18} />
          Kelola Pengaduan
        </Link>
      </section>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className="group relative overflow-hidden">
              <span
                className={`orb -right-9 -top-9 h-28 w-28 ${metric.orb} transition-transform duration-500 ease-out group-hover:scale-125`}
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {rows === null ? "—" : metric.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {rows === null ? "Memuat..." : metric.detail}
                  </p>
                </div>

                <span className={`glass-chip h-11 w-11 shrink-0 ${metric.tone}`}>
                  <Icon size={20} />
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative flex items-center justify-between border-b border-slate-900/[0.08] px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold tracking-tight text-slate-900">
                Pengaduan terbaru
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Seluruh laporan dari semua pengguna.
              </p>
            </div>

            <Link
              to="/complaints"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-violet-700"
            >
              Lihat semua
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {rows === null ? (
            <div className="relative space-y-3 px-5 py-6 sm:px-6">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="h-14 animate-pulse rounded-2xl bg-slate-900/[0.05]"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="relative px-5 py-12 text-center sm:px-6">
              <span className="glass-chip mx-auto h-12 w-12 text-slate-500">
                <FileText size={20} />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-800">
                Belum ada pengaduan masuk
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Laporan dari pengguna akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="relative divide-y divide-slate-900/[0.07]">
              {recent.map((complaint) => (
                <Link
                  key={complaint.id}
                  to="/complaints"
                  className="group flex items-center gap-3 px-5 py-4 transition hover:bg-white/70 sm:px-6"
                >
                  <span className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/65 text-slate-500 transition group-hover:border-white/85 group-hover:bg-white/85 group-hover:text-indigo-600">
                    <FileText size={18} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {complaint.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {complaint.facilityName} · {complaint.location} ·{" "}
                      {formatDate(complaint.created_at)}
                    </span>
                  </span>

                  <StatusBadge status={complaint.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -right-10 -top-10 h-36 w-36 bg-amber-300/25" />
          <span className="orb -bottom-12 -left-10 h-32 w-32 bg-blue-400/20" />

          <div className="relative">
            <span className="glass-chip h-11 w-11 border-amber-200 bg-amber-50/90 text-amber-700">
              <CircleAlert size={21} />
            </span>

            <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
              Perlu ditinjau
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {stats.pending} pengaduan menunggu dan {stats.rejected} ditolak.
              Prioritaskan laporan dengan status tertunda.
            </p>

            <Link to="/complaints" className="btn-secondary mt-5">
              Buka daftar pengaduan
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default AdminDashboard