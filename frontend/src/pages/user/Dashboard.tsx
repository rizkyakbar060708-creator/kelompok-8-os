import { ArrowUpRight, CheckCircle2, CircleAlert, Clock3, FileText, Plus } from "lucide-react"
import { Link } from "react-router-dom"

import Card from "../../components/ui/Card"
import StatusBadge from "../../components/ui/StatusBadge"

const metrics = [
  { label: "Total pengaduan", value: "24", detail: "+4 bulan ini", icon: FileText, orb: "bg-sky-400/25", tone: "border-sky-200 bg-sky-50/90 text-sky-700" },
  { label: "Sedang diproses", value: "06", detail: "Butuh perhatian", icon: Clock3, orb: "bg-amber-300/25", tone: "border-amber-200 bg-amber-50/90 text-amber-700" },
  { label: "Telah selesai", value: "15", detail: "62,5% terselesaikan", icon: CheckCircle2, orb: "bg-emerald-300/25", tone: "border-emerald-200 bg-emerald-50/90 text-emerald-700" },
]

const recentComplaints = [
  { id: 1, title: "AC Ruang 301 Rusak", location: "Gedung A, Ruang 301", date: "Hari ini, 09.24", status: "in_progress" as const },
  { id: 2, title: "Lampu Koridor Mati", location: "Gedung B, Lantai 2", date: "Kemarin, 14.10", status: "resolved" as const },
  { id: 3, title: "Keran Air Rusak", location: "Gedung C, Toilet", date: "27 Sep, 08.42", status: "submitted" as const },
]

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Ringkasan aktivitas</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Tetap terhubung dengan kondisi fasilitas kampus.
          </p>
        </div>

        <Link to="/complaints/create" className="btn-primary w-full sm:w-auto">
          <Plus size={18} />
          Buat Pengaduan
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {metric.detail}
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
                Status laporan yang terakhir diperbarui.
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

          <div className="relative divide-y divide-slate-900/[0.07]">
            {recentComplaints.map((complaint) => (
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
                    {complaint.location} · {complaint.date}
                  </span>
                </span>

                <StatusBadge status={complaint.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -right-10 -top-10 h-36 w-36 bg-amber-300/25" />
          <span className="orb -bottom-12 -left-10 h-32 w-32 bg-blue-400/20" />

          <div className="relative">
            <span className="glass-chip h-11 w-11 border-amber-200 bg-amber-50/90 text-amber-700">
              <CircleAlert size={21} />
            </span>

            <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
              Butuh tindak lanjut?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Lengkapi detail lokasi dan foto agar laporan dapat ditangani
              lebih cepat.
            </p>

            <Link to="/complaints/create" className="btn-secondary mt-5">
              Buat laporan
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard
