import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Inbox,
  LoaderCircle,
  PencilRuler,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Card from "../../components/ui/Card"
import StatusBadge from "../../components/ui/StatusBadge"
import StatusDonut from "../../components/charts/StatusDonut"
import { getComplaints } from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import {
  buildStats,
  formatDate,
  formatRate,
  joinFacilities,
  oldestPendingAgeDays,
  pendingQueue,
  statusSlices,
  type ComplaintRow,
} from "../../utils/complaintStats"
import { STATUS_CONFIG } from "../../utils/statusConfig"

const MAX_RECENT = 6
const MAX_QUEUE = 5

function AdminDashboard() {
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [error, setError] = useState("")
  // true kalau backend ternyata membalas amplop paginasi. Endpoint sekarang
  // tidak dikonfigurasi paginasi, tapi kalau berubah angka di bawah hanya
  // mewakili satu halaman dan label keterbatasan harus muncul.
  const [isPaginated, setIsPaginated] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

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

        setRows(joinFacilities(complaints.items, facilities.items))
        setIsPaginated(complaints.isPaginated)
        setError("")
      } catch {
        if (!active) {
          return
        }

        setRows([])
        setError("Gagal memuat pengaduan. Coba muat ulang halaman.")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [retryKey])

  const complaints = rows ?? []
  const stats = buildStats(complaints)
  const slices = statusSlices(complaints)
  const recent = complaints.slice(0, MAX_RECENT)
  const queue = pendingQueue(complaints).slice(0, MAX_QUEUE)
  const queueAge = oldestPendingAgeDays(complaints)
  const isLoading = rows === null

  // Kelima metrik dihitung dari respons API lewat buildStats, tidak ada angka
  // yang ditulis manual di file ini.
  const metrics = [
    {
      label: "Total pengaduan",
      value: stats.total,
      detail: "Seluruh pelapor",
      icon: FileText,
      orb: "bg-sky-400/25",
      tone: "border-sky-200 bg-sky-50/90 text-sky-700",
      href: "/complaints",
    },
    {
      label: "Menunggu",
      value: stats.pending,
      detail: "Belum ditindaklanjuti",
      icon: Clock3,
      orb: "bg-amber-300/25",
      tone: "border-amber-200 bg-amber-50/90 text-amber-700",
      href: "/complaints?status=PENDING",
    },
    {
      label: "Diproses",
      value: stats.inProgress,
      detail: "Sedang dikerjakan",
      icon: TrendingUp,
      orb: "bg-blue-400/25",
      tone: "border-blue-200 bg-blue-50/90 text-blue-700",
      href: "/complaints?status=IN_PROGRESS",
    },
    {
      label: "Selesai",
      value: stats.resolved,
      detail: `${formatRate(stats.resolutionRate)} terselesaikan`,
      icon: CheckCircle2,
      orb: "bg-emerald-300/25",
      tone: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
      href: "/complaints?status=RESOLVED",
    },
    {
      label: "Ditolak",
      value: stats.rejected,
      detail: "Perlu tinjauan ulang",
      icon: XCircle,
      orb: "bg-rose-300/25",
      tone: "border-rose-200 bg-rose-50/90 text-rose-700",
      href: "/complaints?status=REJECTED",
    },
  ]

  // Hanya pintasan yang benar-benar punya route dan endpoint pendukung. "Kelola
  // Pengguna" sengaja tidak ada: backend belum punya endpoint daftar maupun
  // ubah role, jadi tautan ke halaman yang tidak ada hanya jadi janji palsu.
  const shortcuts = [
    {
      label: "Semua Pengaduan",
      description: "Daftar lengkap dengan filter status dan prioritas",
      href: "/complaints",
      icon: FileText,
    },
    {
      label: "Kelola Fasilitas",
      description: "Tambah dan ubah data fasilitas",
      href: "/admin/facilities",
      icon: PencilRuler,
    },
    {
      label: "Statistik & Laporan",
      description: "Distribusi, antrean, dan beban per fasilitas",
      href: "/admin/reports",
      icon: BarChart3,
    },
    {
      label: "Kelola Pengguna",
      description: "Lihat semua pengguna, ubah peran, dan atur ulang password",
      href: "/admin/users",
      icon: Users,
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

      {error ? (
        <div
          role="alert"
          className="alert-error flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <CircleAlert size={18} className="shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="btn-secondary ml-auto"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {isPaginated && (
        <p
          role="status"
          className="glass-panel rounded-2xl px-4 py-3 text-xs leading-5 text-slate-600"
        >
          Backend kini membalas daftar dalam bentuk halaman. Angka di halaman ini
          hanya menghitung baris yang diterima pada halaman pertama.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Link
              key={metric.label}
              to={metric.href}
              className="focus-visible:outline-indigo-500"
            >
              <Card className="group relative h-full overflow-hidden">
                <span
                  className={`orb -right-9 -top-9 h-28 w-28 ${metric.orb} transition-transform duration-500 ease-out group-hover:scale-125`}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-600">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {isLoading ? "—" : metric.value}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {isLoading ? "Memuat..." : metric.detail}
                    </p>
                  </div>

                  <span className={`glass-chip h-11 w-11 shrink-0 ${metric.tone}`}>
                    <Icon size={20} />
                  </span>
                </div>
              </Card>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.55fr]">
        <Card className="relative overflow-hidden">
          <span className="orb -right-10 -top-10 h-36 w-36 bg-violet-400/20" />

          <div className="relative">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Distribusi status
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Porsi pengaduan menurut status saat ini.
            </p>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <LoaderCircle size={26} className="animate-spin" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : stats.total === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="glass-chip h-12 w-12 text-slate-500">
                  <BarChart3 size={20} />
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  Belum ada data untuk digambar
                </p>
                <p className="max-w-xs text-xs leading-5 text-slate-500">
                  Distribusi status muncul setelah ada pengaduan masuk.
                </p>
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                <StatusDonut
                  slices={slices}
                  total={stats.total}
                  caption="Total"
                />

                <ul className="w-full space-y-2.5">
                  {slices.map((slice) => (
                    <li
                      key={slice.status}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_CONFIG[slice.status].chartColor,
                        }}
                      />
                      <span className="text-slate-600">
                        {STATUS_CONFIG[slice.status].label}
                      </span>
                      <span className="ml-auto font-semibold tabular-nums text-slate-900">
                        {slice.count}
                      </span>
                      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-500">
                        {formatRate((slice.count / stats.total) * 100)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -bottom-14 -right-12 h-40 w-40 bg-amber-300/22" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Antrean menunggu tindak lanjut
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Status Menunggu, diurutkan dari yang paling lama.
                </p>
              </div>

              <Link
                to="/complaints?status=PENDING"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-violet-700"
              >
                Buka antrean
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-5 space-y-3">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="h-14 animate-pulse rounded-2xl bg-slate-900/[0.05]"
                  />
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="glass-chip h-12 w-12 text-emerald-600">
                  <CheckCircle2 size={20} />
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  Antrean kosong
                </p>
                <p className="max-w-xs text-xs leading-5 text-slate-500">
                  Tidak ada pengaduan berstatus Menunggu saat ini.
                </p>
              </div>
            ) : (
              <>
                {queueAge > 0 && (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-xs font-medium leading-5 text-amber-800">
                    Pengaduan tertua di antrean sudah menunggu {queueAge} hari.
                  </p>
                )}

                <div className="mt-4 divide-y divide-slate-900/[0.07]">
                  {queue.map((complaint) => (
                    <Link
                      key={complaint.id}
                      to={`/complaints/${complaint.id}`}
                      className="group flex items-center gap-3 py-3.5 transition hover:bg-white/70"
                    >
                      <span className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/65 text-slate-500 transition group-hover:border-white/85 group-hover:bg-white/85 group-hover:text-indigo-600">
                        <Inbox size={18} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {complaint.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {complaint.facilityName} ·{" "}
                          {formatDate(complaint.created_at)}
                        </span>
                      </span>

                      <StatusBadge status={complaint.status} />
                    </Link>
                  ))}
                </div>

                {stats.pending > MAX_QUEUE && (
                  <p className="mt-3 text-xs text-slate-500">
                    Menampilkan {MAX_QUEUE} dari {stats.pending} pengaduan
                    menunggu.
                  </p>
                )}
              </>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative flex items-center justify-between gap-4 border-b border-slate-900/[0.08] px-5 py-5 sm:px-6">
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
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-violet-700"
            >
              Lihat semua
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {isLoading ? (
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
                  to={`/complaints/${complaint.id}`}
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

            <div className="mt-5 grid gap-2">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon

                return (
                  <Link
                    key={shortcut.href}
                    to={shortcut.href}
                    className="group flex items-start gap-3 rounded-xl border border-white/70 bg-white/55 px-3.5 py-3 transition hover:border-white/90 hover:bg-white/80"
                  >
                    <span className="glass-chip h-9 w-9 shrink-0 text-indigo-600 transition group-hover:bg-white/85">
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">
                        {shortcut.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        {shortcut.description}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Users size={14} className="mt-0.5 shrink-0" />
              <span>
                Kelola pengguna tersedia lewat tautan di samping atau menu
                sidebar.
              </span>
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default AdminDashboard