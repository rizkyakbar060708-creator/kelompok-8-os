import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  LoaderCircle,
  Plus,
  XCircle,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import CategoryCard from "../../components/dashboard/CategoryCard"
import TrendLines from "../../components/charts/TrendLines"
import Card from "../../components/ui/Card"
import StatusBadge from "../../components/ui/StatusBadge"
import { getComplaints } from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import { CATEGORIES, CATEGORY_CONFIG } from "../../utils/categoryConfig"
import {
  buildCategoryStats,
  dailyTrend,
  formatDate,
  formatRate,
  joinFacilities,
  type ComplaintRow,
} from "../../utils/complaintStats"

const MAX_RECENT = 5
// Dashboard mahasiswa memakai rentang tetap 30 hari: tanpa tombol rentang,
// angkanya tetap segar tanpa menambah kontrol yang tidak dipakai sehari-hari.
const RANGE_DAYS = 30

function Dashboard() {
  const navigate = useNavigate()
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

        // Tidak ada filter client di sini. Endpoint /complaints/ sudah
        // menyaring di server: untuk role STUDENT, queryset-nya hanya berisi
        // pengaduan miliknya sendiri. Menyalin filter yang sama di browser
        // hanya memberi kesan palsu bahwa akses dibatasi di dua tempat.
        setRows(joinFacilities(complaints.items, facilities.items))
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
  }, [])

  const complaints = useMemo(() => rows ?? [], [rows])

  const windowRows = useMemo(() => {
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - (RANGE_DAYS - 1))

    return complaints.filter((row) => {
      const created = new Date(row.created_at)
      return created >= cutoff
    })
  }, [complaints])

  const countByStatus = (status: ComplaintRow["status"]) =>
    windowRows.filter((row) => row.status === status).length

  const pendingCount = countByStatus("PENDING")
  const inProgressCount = countByStatus("IN_PROGRESS")
  const resolvedCount = countByStatus("RESOLVED")
  const rejectedCount = countByStatus("REJECTED")

  const metrics = [
    {
      label: "Total pengaduan",
      value: windowRows.length,
      detail: `Dalam ${RANGE_DAYS} hari terakhir`,
      icon: FileText,
      orb: "bg-sky-400/25",
      tone: "border-sky-200 bg-sky-50/90 text-sky-700",
    },
    {
      label: "Menunggu",
      value: pendingCount,
      detail: "Belum ditindaklanjuti",
      icon: Clock3,
      orb: "bg-amber-300/25",
      tone: "border-amber-200 bg-amber-50/90 text-amber-700",
    },
    {
      label: "Diproses",
      value: inProgressCount,
      detail: "Sedang ditangani petugas",
      icon: LoaderCircle,
      orb: "bg-blue-400/25",
      tone: "border-blue-200 bg-blue-50/90 text-blue-700",
    },
    {
      label: "Selesai",
      value: resolvedCount,
      detail:
        windowRows.length === 0
          ? "Belum ada penyelesaian"
          : `${formatRate((resolvedCount / windowRows.length) * 100)} terselesaikan`,
      icon: CheckCircle2,
      orb: "bg-emerald-300/25",
      tone: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
    },
    {
      label: "Ditolak",
      value: rejectedCount,
      detail: "Perlu diperbaiki lalu kirim ulang",
      icon: XCircle,
      orb: "bg-rose-300/25",
      tone: "border-rose-200 bg-rose-50/90 text-rose-700",
    },
  ] as const

  const categoryStats = useMemo(
    () => buildCategoryStats(windowRows),
    [windowRows],
  )

  const trendData = useMemo(() => {
    const perCategory = CATEGORIES.map((category) =>
      dailyTrend(
        windowRows.filter((row) => row.category === category),
        14,
      ),
    )

    return perCategory[0].map((point, index) => ({
      date: point.date,
      label: point.label,
      KEAMANAN: perCategory[0][index].count,
      FASILITAS: perCategory[1][index].count,
      AKADEMIK: perCategory[2][index].count,
    }))
  }, [windowRows])

  const recent = [...complaints]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, MAX_RECENT)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Ringkasan aktivitas</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Pengaduanmu di kampus dalam {RANGE_DAYS} hari terakhir.
          </p>
        </div>

        <Link to="/complaints/create" className="btn-primary w-full sm:w-auto">
          <Plus size={18} />
          Buat Pengaduan
        </Link>
      </section>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      {/* Tiga kartu kategori memakai sparkline 7 hari dari buildCategoryStats. */}
      <section className="grid gap-4 md:grid-cols-3">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category}
            stat={categoryStats[category]}
            active={false}
            onSelect={() => {
              // Klik kartu kategori mahasiswa cukup membawa ke daftar
              // pengaduan miliknya; filter kategori lanjutan ada di sana.
              navigate("/complaints")
            }}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="relative overflow-hidden">
          <span className="orb -bottom-12 -left-10 h-32 w-32 bg-emerald-400/20" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Tren pengaduanmu
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  14 hari terakhir, per kategori.
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

            <div className="mt-5">
              <TrendLines
                data={trendData}
                height={220}
                emptyLabel="Belum ada pengaduan dua minggu terakhir."
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="relative flex items-center justify-between border-b border-slate-900/[0.08] px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold tracking-tight text-slate-900">
                Terbaru darimu
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Status laporan yang terakhir masuk.
              </p>
            </div>
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
                Belum ada pengaduan
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Laporan yang kamu kirim akan muncul di sini.
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
                  <span
                    className={`glass-chip h-10 w-10 shrink-0 ${
                      CATEGORY_CONFIG[complaint.category].chipClassName
                    }`}
                  >
                    <FileText size={18} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {complaint.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {formatDate(complaint.created_at)}
                    </span>
                  </span>

                  <StatusBadge status={complaint.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card className="relative overflow-hidden">
        <span className="orb -right-10 -top-10 h-36 w-36 bg-amber-300/25" />

        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="glass-chip h-11 w-11 shrink-0 border-amber-200 bg-amber-50/90 text-amber-700">
              <CircleAlert size={21} />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                Laporan tertangani cepat butuh detail lengkap
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Lengkapi lokasi kejadian dan foto agar laporanmu dapat
                ditindaklanjuti lebih cepat.
              </p>
            </div>
          </div>

          <Link to="/complaints/create" className="btn-secondary shrink-0">
            Buat laporan
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
