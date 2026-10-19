import {
  BarChart3,
  Building2,
  CircleAlert,
  ClipboardCheck,
  Info,
  Layers,
  TriangleAlert,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import Card from "../../components/ui/Card"
import StatusDonut from "../../components/charts/StatusDonut"
import TrendBars from "../../components/charts/TrendBars"
import { getComplaints } from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import {
  COMPLAINT_PRIORITIES,
  buildStats,
  dailyTrend,
  facilityLoad,
  formatRate,
  joinFacilities,
  oldestPendingAgeDays,
  priorityCounts,
  statusSlices,
  type ComplaintRow,
} from "../../utils/complaintStats"
import { STATUS_CONFIG } from "../../utils/statusConfig"

const TREND_DAYS = 14

const priorityLabels: Record<(typeof COMPLAINT_PRIORITIES)[number], string> = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
}

const priorityBarTones: Record<(typeof COMPLAINT_PRIORITIES)[number], string> = {
  HIGH: "bg-indigo-500/75",
  MEDIUM: "bg-amber-400/80",
  LOW: "bg-slate-300",
}

function Reports() {
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [error, setError] = useState("")
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
        setError("Gagal memuat data pengaduan. Coba muat ulang halaman.")
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
  const priorities = priorityCounts(complaints)
  const trend = dailyTrend(complaints, TREND_DAYS)
  const facilities = facilityLoad(complaints)
  const queueAge = oldestPendingAgeDays(complaints)
  const isLoading = rows === null

  const trendTotal = trend.reduce((sum, point) => sum + point.count, 0)
  const facilityPeak = facilities[0]?.total ?? 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Laporan administrator</p>
          <h1 className="page-title">Statistik &amp; Laporan</h1>
          <p className="page-subtitle">
            Ringkasan pengaduan fasilitas yang masuk ke sistem.
          </p>
        </div>

        <Link to="/admin" className="btn-secondary w-full sm:w-auto">
          <BarChart3 size={18} />
          Kembali ke Dashboard
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

      {/* Batas data dinyatakan terbuka, bukan disembunyikan. Tanpa ini angka di
          halaman ini bisa dibaca sebagai statistik resmi padahal backend tidak
          punya endpoint agregasi dan tidak punya paginasi. */}
      <div className="glass-panel flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm text-slate-700">
        <Info size={17} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            Cara angka di halaman ini dihitung
          </p>
          <p>
            Semua angka dihitung di browser dari respons{" "}
            <code className="rounded-md bg-white/70 px-1 py-0.5 text-xs">
              GET /api/complaints/
            </code>{" "}
            yang diterima admin. Backend belum punya endpoint agregasi
            statistik, dan endpoint daftar belum dikonfigurasi paginasi.
          </p>
          {isPaginated && (
            <p className="font-medium text-amber-800">
              Backend sekarang membalas dalam bentuk halaman, jadi semua angka
              di bawah hanya mencakup halaman pertama.
            </p>
          )}
          <p>
            Identitas pelapor tidak pernah ditampilkan di laporan ini, dan
            laporan ini tidak tersedia untuk role selain admin.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden">
          <span className="orb -right-9 -top-9 h-24 w-24 bg-sky-400/25" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-600">
              Total pengaduan
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? "—" : stats.total}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Seluruh pengaduan yang diterima
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -right-9 -top-9 h-24 w-24 bg-emerald-300/25" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-600">
              Tingkat penyelesaian
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? "—" : formatRate(stats.resolutionRate)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {stats.resolved} dari {stats.total} selesai
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -right-9 -top-9 h-24 w-24 bg-amber-300/25" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-600">
              Menunggu tindak lanjut
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? "—" : stats.pending}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {queueAge > 0
                ? `Terlama menunggu ${queueAge} hari`
                : "Tidak ada antrean terbuka"}
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -right-9 -top-9 h-24 w-24 bg-violet-400/22" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-600">
              Fasilitas tersibuk
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {isLoading ? "—" : (facilities[0]?.facilityName ?? "—")}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {facilities[0]
                ? `${facilities[0].total} pengaduan, ${facilities[0].unresolved} belum selesai`
                : "Belum ada data fasilitas"}
            </p>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="relative overflow-hidden">
          <span className="orb -right-10 -top-10 h-32 w-32 bg-violet-400/20" />

          <div className="relative">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
              <Layers size={17} className="text-slate-500" />
              Distribusi status
            </h2>

            {isLoading ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Memuat data...
              </div>
            ) : stats.total === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Belum ada pengaduan untuk dianalisis.
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                <StatusDonut slices={slices} total={stats.total} caption="Total" />

                <ul className="w-full space-y-2.5">
                  {slices.map((slice) => (
                    <li key={slice.status} className="flex items-center gap-2.5 text-sm">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: STATUS_CONFIG[slice.status].chartColor,
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
          <span className="orb -bottom-12 -right-10 h-32 w-32 bg-indigo-400/20" />

          <div className="relative">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
              <TriangleAlert size={17} className="text-slate-500" />
              Komposisi prioritas
            </h2>

            {isLoading ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Memuat data...
              </div>
            ) : stats.total === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Belum ada pengaduan untuk dianalisis.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {priorities.map((entry) => (
                  <div key={entry.priority}>
                    <div className="mb-1.5 flex items-baseline gap-2 text-sm">
                      <span className="font-medium text-slate-700">
                        {priorityLabels[entry.priority]}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {entry.count}
                      </span>
                      <span className="ml-auto text-xs tabular-nums text-slate-500">
                        {formatRate((entry.count / stats.total) * 100)}
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900/[0.07]">
                      <div
                        className={`h-full rounded-full ${priorityBarTones[entry.priority]}`}
                        style={{
                          width: `${Math.max(
                            (entry.count / stats.total) * 100,
                            entry.count > 0 ? 2 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <p className="pt-1 text-xs leading-5 text-slate-500">
                  Prioritas hanya bisa diubah pengelola; mahasiswa yang membuat
                  pengaduan tidak dapat menetapkannya sendiri.
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card className="relative overflow-hidden">
        <span className="orb -left-14 -top-14 h-36 w-36 bg-cyan-400/18" />

        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
                <BarChart3 size={17} className="text-slate-500" />
                Tren pengaduan {TREND_DAYS} hari terakhir
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Dihitung dari tanggal dibuat pengaduan (created_at).
              </p>
            </div>

            <p className="text-sm font-semibold tabular-nums text-slate-700">
              {isLoading ? "—" : `${trendTotal} pengaduan`}
            </p>
          </div>

          <div className="mt-6">
            <TrendBars points={trend} />
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden">
        <span className="orb -right-14 -bottom-16 h-36 w-36 bg-blue-400/18" />

        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
                <Building2 size={17} className="text-slate-500" />
                Beban pengaduan per fasilitas
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Lima fasilitas dengan pengaduan terbanyak dari data yang diterima.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Memuat data...
            </div>
          ) : facilities.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Belum ada pengaduan untuk dianalisis.
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {facilities.map((entry) => (
                <li key={entry.facilityId}>
                  <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                    <span className="font-semibold text-slate-800">
                      {entry.facilityName}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {entry.location}
                    </span>
                    <span className="ml-auto font-semibold tabular-nums text-slate-900">
                      {entry.total}
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      pengaduan
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900/[0.07]">
                    <div
                      className="h-full rounded-full bg-indigo-500/75"
                      style={{
                        width: `${Math.max(
                          (entry.total / facilityPeak) * 100,
                          2,
                        )}%`,
                      }}
                    />
                  </div>

                  {entry.unresolved > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.unresolved} belum selesai (Menunggu atau Diproses)
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="relative overflow-hidden">
        <span className="orb -left-12 -bottom-16 h-32 w-32 bg-amber-300/20" />

        <div className="relative flex items-start gap-3">
          <span className="glass-chip h-11 w-11 shrink-0 border-amber-200 bg-amber-50/90 text-amber-700">
            <ClipboardCheck size={20} />
          </span>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Yang belum tersedia di laporan ini
            </h2>

            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
              <li>
                Rekap per pengguna dan waktu penyelesaian aktual — backend belum
                menyimpan riwayat perubahan status.
              </li>
              <li>
                Ekspor CSV atau PDF — belum ada endpoint ekspor.
              </li>
              <li>
                Rekap kepatuhan SLA — tidak ada field tenggat waktu di model
                pengaduan.
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Reports