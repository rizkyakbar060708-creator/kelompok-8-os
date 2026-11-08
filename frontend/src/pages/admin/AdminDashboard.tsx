import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Gavel,
  LoaderCircle,
  RefreshCw,
  Undo2,
  XCircle,
} from "lucide-react"
import Reveal from "../../components/ui/Reveal"
import RevealList, { RevealItem } from "../../components/ui/RevealList"
import Modal from "../../components/ui/Modal"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

import AttentionPanel from "../../components/dashboard/AttentionPanel"
import CategoryCard from "../../components/dashboard/CategoryCard"
import ComplaintTablePanel from "../../components/dashboard/ComplaintTablePanel"
import KpiCard from "../../components/dashboard/KpiCard"
import CategoryRing from "../../components/charts/CategoryRing"
import StatusStackedBars from "../../components/charts/StatusStackedBars"
import TopLocationBars from "../../components/charts/TopLocationBars"
import TrendLines from "../../components/charts/TrendLines"
import Card from "../../components/ui/Card"
import StatusBadge from "../../components/ui/StatusBadge"
import type { ComplaintCategoryName } from "../../services/complaintService"
import { getComplaints } from "../../services/complaintService"
import { getFacilities, type Facility } from "../../services/facilityService"
import {
  decideAppeal,
  getAppealQueue,
  type Appeal,
} from "../../services/appealService"
import { useAuth } from "../../contexts/AuthContext"
import { isAdmin } from "../../utils/roles"
import { errorMessage } from "../../utils/errorMessage"
import { resolveMediaUrl } from "../../utils/media"
import { useComplaintSummary } from "../../contexts/ComplaintSummaryContext"
import { CATEGORIES, CATEGORY_CONFIG } from "../../utils/categoryConfig"
import {
  ageLabel,
  avgResolutionHours,
  buildCategoryStats,
  dailyTrend,
  formatDate,
  formatDelta,
  formatNumber,
  formatResolutionHours,
  inWindow,
  joinFacilities,
  periodDelta,
  topSituations,
  type ComplaintRow,
  type PeriodDelta,
} from "../../utils/complaintStats"

import {
  COMPLAINT_STATUSES,
  STATUS_CONFIG,
} from "../../utils/statusConfig"

const MAX_RECENT = 6

type RangeDays = 7 | 30 | 90 | null

type TabName = "ALL" | ComplaintCategoryName

const RANGE_OPTIONS: Array<{ value: RangeDays; label: string }> = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
  { value: null, label: "Semua" },
]

const TABS: Array<{ value: TabName; label: string }> = [
  { value: "ALL", label: "Semua" },
  ...CATEGORIES.map((category) => ({
    value: category as TabName,
    label: CATEGORY_CONFIG[category].label,
  })),
]

function greeting(now: Date): string {
  const hour = now.getHours()

  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 19) return "Selamat sore"
  return "Selamat malam"
}

// Arah baik/buruk per metrik: delta yang naik tidak selalu kabar baik, jadi
// warna diputuskan di sini, bukan di komponen KpiCard.
type DeltaSentiment = "good" | "bad" | "neutral"

function AdminDashboard() {
  const { user } = useAuth()
  const { refresh: refreshSummary } = useComplaintSummary()
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [range, setRange] = useState<RangeDays>(30)
  const [activeTab, setActiveTab] = useState<TabName>("ALL")

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
        setFacilities(facilities.items)
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

  const isLoading = rows === null
  const complaints = useMemo(() => rows ?? [], [rows])

  // Baris dalam jendela waktu terpilih; seluruh kartu dan chart di bawah
  // membaca dari sini supaya angka antarpanel konsisten.
  const windowRows = useMemo(
    () => inWindow(complaints, range),
    [complaints, range],
  )

  // Delta = jendela ini vs jendela sepanjang sama sebelum itu, dihitung dari
  // SELURUH baris (bukan windowRows) supaya perbandingannya adil.
  const deltas = useMemo(() => {
    if (range === null) {
      return new Map<string, PeriodDelta>()
    }

    const countDelta = (predicate: (row: ComplaintRow) => boolean) =>
      periodDelta(complaints.filter(predicate), range)

    return new Map<string, PeriodDelta>([
      ["total", periodDelta(complaints, range)],
      ["pending", countDelta((row) => row.status === "PENDING")],
      ["inProgress", countDelta((row) => row.status === "IN_PROGRESS")],
      ["resolved", countDelta((row) => row.status === "RESOLVED")],
      ["rejected", countDelta((row) => row.status === "REJECTED")],
    ])
  }, [complaints, range])

  const countByStatus = (status: ComplaintRow["status"]) =>
    windowRows.filter((row) => row.status === status).length

  const pendingCount = countByStatus("PENDING")
  const inProgressCount = countByStatus("IN_PROGRESS")
  const resolvedCount = countByStatus("RESOLVED")
  const rejectedCount = countByStatus("REJECTED")

  const avgResolution = avgResolutionHours(windowRows)

  const metrics: Array<{
    key: string
    label: string
    value: string
    detail: string
    icon: typeof FileText
    orb: string
    tone: string
    href: string
    sentiment: DeltaSentiment
  }> = [
    {
      key: "total",
      label: "Total pengaduan",
      value: formatNumber(windowRows.length),
      detail: range === null ? "Tanpa batas waktu" : `Dalam ${range} hari terakhir`,
      icon: FileText,
      orb: "bg-sky-400/25",
      tone: "border-sky-200 bg-sky-50/90 text-sky-700",
      href: "/complaints",
      sentiment: "neutral",
    },
    {
      key: "pending",
      label: "Menunggu",
      value: formatNumber(pendingCount),
      detail: "Belum ditindaklanjuti",
      icon: Clock3,
      orb: "bg-amber-300/25",
      tone: "border-amber-200 bg-amber-50/90 text-amber-700",
      href: "/complaints?status=PENDING",
      sentiment: "bad",
    },
    {
      key: "inProgress",
      label: "Diproses",
      value: formatNumber(inProgressCount),
      detail: "Sedang dikerjakan",
      icon: LoaderCircle,
      orb: "bg-blue-400/25",
      tone: "border-blue-200 bg-blue-50/90 text-blue-700",
      href: "/complaints?status=IN_PROGRESS",
      sentiment: "neutral",
    },
    {
      key: "resolved",
      label: "Selesai",
      value: formatNumber(resolvedCount),
      detail:
        avgResolution === null
          ? "Belum ada penyelesaian"
          : `Rata-rata ${formatResolutionHours(avgResolution)}`,
      icon: CheckCircle2,
      orb: "bg-emerald-300/25",
      tone: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
      href: "/complaints?status=RESOLVED",
      sentiment: "good",
    },
    {
      key: "rejected",
      label: "Ditolak",
      value: formatNumber(rejectedCount),
      detail: "Perlu tinjauan ulang",
      icon: XCircle,
      orb: "bg-rose-300/25",
      tone: "border-rose-200 bg-rose-50/90 text-rose-700",
      href: "/complaints?status=REJECTED",
      sentiment: "neutral",
    },
  ]

  const categoryStats = useMemo(
    () => buildCategoryStats(windowRows),
    [windowRows],
  )

  // Tren harian tiga garis: satu bucket per hari di jendela terpilih.
  const trendData = useMemo(() => {
    const days = range ?? 30
    const perCategory = CATEGORIES.map((category) => {
      const points = dailyTrend(
        windowRows.filter((row) => row.category === category),
        days,
      )

      return { category, points }
    })

    return perCategory[0].points.map((point, index) => ({
      date: point.date,
      label: point.label,
      KEAMANAN: perCategory[0].points[index].count,
      FASILITAS: perCategory[1].points[index].count,
      AKADEMIK: perCategory[2].points[index].count,
    }))
  }, [windowRows, range])

  const stackedData = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const rows = windowRows.filter((row) => row.category === category)

        return {
          category,
          ...Object.fromEntries(
            COMPLAINT_STATUSES.map((status) => [
              status,
              rows.filter((row) => row.status === status).length,
            ]),
          ),
        }
      }),
    [windowRows],
  )

  const topLocations = useMemo(
    () => topSituations(windowRows, 5),
    [windowRows],
  )

  // Aktivitas terbaru; laporan anonim tetap tampil, hanya pelapornya yang
  // disembunyikan (aturan privasi endpoint list).
  const recent = useMemo(
    () =>
      [...windowRows]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, MAX_RECENT),
    [windowRows],
  )

  const tabCategory = activeTab === "ALL" ? null : activeTab
  const tabRows = useMemo(
    () =>
      windowRows.filter(
        (row) => tabCategory === null || row.category === tabCategory,
      ),
    [windowRows, tabCategory],
  )

  const isReporterVisible = isAdmin(user?.role)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* A. Header: sapaan, tanggal, filter rentang, refresh */}
      <Reveal as="section" className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end" delay={0}>
        <div>
          <p className="eyebrow mb-2">Panel administrator</p>
          <h1 className="page-title">
            {greeting(new Date())}
            {user?.username ? `, ${user.username}` : ""}!
          </h1>
          <p className="page-subtitle">
            Ringkasan pengaduan kampus,{" "}
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Rentang waktu"
          >
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setRange(option.value)}
                aria-pressed={range === option.value}
                className={`glass-pill border-white/70 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  range === option.value
                    ? "bg-indigo-500/90 text-white"
                    : "bg-white/70 text-slate-600 hover:bg-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            disabled={isLoading}
            className="btn-secondary"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : undefined}
              aria-hidden="true"
            />
            Muat ulang
          </button>
        </div>
      </Reveal>

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

      {/* Antrean banding: hanya ADMIN; endpoint queue membalas 403 untuk
          role lain, jadi panel ini tidak boleh dirender untuk staf. Setelah
          keputusan tersimpan, laporan dimuat ulang dari sumber yang sama. */}
      {isAdmin(user?.role) && (
        <AppealQueuePanel
          onDecided={() => {
            setRetryKey((key) => key + 1)
            refreshSummary()
          }}
        />
      )}

      {/* B. KPI global dengan delta vs periode sebelumnya */}
      <RevealList as="section" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const delta = deltas.get(metric.key)
          const text = delta ? formatDelta(delta) : null

          return (
            <RevealItem key={metric.key}>
              <KpiCard
                key={metric.key}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                icon={metric.icon}
                orb={metric.orb}
                chipTone={metric.tone}
                href={metric.href}
                loading={isLoading}
                delta={
                  range === null
                    ? null
                    : {
                      text,
                      tone: metric.sentiment,
                      windowLabel: delta && delta.previous > 0
                        ? `vs ${range} hari sebelumnya`
                        : runtimeDeltaLabel(delta, range),
                    }
                }
              />
            </RevealItem>
          )
        })}
      </RevealList>

      {/* C. Ringkasan per kategori (kartu + sparkline) */}
      <RevealList as="section" className="grid gap-4 md:grid-cols-3">
        {CATEGORIES.map((category) => (
          <RevealItem key={category}>
            <CategoryCard
              stat={categoryStats[category]}
              active={activeTab === category}
              onSelect={() => {
                setActiveTab(activeTab === category ? "ALL" : category)
              }}
            />
          </RevealItem>
        ))}
      </RevealList>

      {/* C2. Grafik utama: donut kategori, tren harian, stacked status, top-5 */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <Card className="relative overflow-hidden">
          <span className="orb -right-9 -top-9 h-32 w-32 bg-violet-400/20" />

          <div className="relative">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Komposisi kategori
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Proporsi pengaduan per kategori pada rentang ini.
            </p>

            <div className="mt-5">
              <CategoryRing
                perCategory={{
                  KEAMANAN: categoryStats.KEAMANAN.total,
                  FASILITAS: categoryStats.FASILITAS.total,
                  AKADEMIK: categoryStats.AKADEMIK.total,
                }}
                total={windowRows.length}
              />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -bottom-12 -left-10 h-32 w-32 bg-emerald-400/20" />

          <div className="relative">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Tren harian per kategori
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Jumlah pengaduan per hari, {range ?? "seluruh periode"}.
            </p>

            <div className="mt-5">
              <TrendLines data={trendData} />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="relative">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Status dalam tiap kategori
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Perbandingan status; cari kategori dengan backlog terbesar.
            </p>

            <div className="mt-5">
              <StatusStackedBars data={stackedData} />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="orb -right-10 -top-10 h-32 w-32 bg-amber-300/22" />

          <div className="relative">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Lima lokasi tersibuk
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Fasilitas atau lokasi kejadian dengan laporan terbanyak.
            </p>

            <div className="mt-5">
              <TopLocationBars
                items={topLocations}
                caption="Hitungan gabungan seluruh kategori pada rentang ini."
              />
            </div>
          </div>
        </Card>
      </section>

      {/* D+E. Tab per kategori: tabel, metrik status, perlu perhatian, aktivitas */}
      <section className="space-y-4">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Kategori pengaduan"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`glass-pill border-white/70 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.value
                  ? "bg-indigo-500/90 text-white"
                  : "bg-white/70 text-slate-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            {/* Metrik status kategori tab aktif */}
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <TabMetricCard
                label="Total"
                value={formatNumber(tabRows.length)}
                detail={
                  tabCategory === null
                    ? "Semua kategori"
                    : CATEGORY_CONFIG[tabCategory].label
                }
                chipTone="border-slate-200 bg-slate-50/90 text-slate-700"
              />
              {COMPLAINT_STATUSES.map((status) => (
                <TabMetricCard
                  key={status}
                  label={STATUS_CONFIG[status].label}
                  value={formatNumber(
                    tabRows.filter((row) => row.status === status).length,
                  )}
                  chipTone={STATUS_CONFIG[status].badgeClassName}
                />
              ))}
            </section>

            <ComplaintTablePanel
              category={tabCategory}
              facilities={facilities}
              showReporter={isReporterVisible}
            />
          </div>

          <div className="space-y-6">
            <AttentionPanel rows={tabRows} />

            <Card className="relative overflow-hidden">
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold tracking-tight text-slate-900">
                      Aktivitas terbaru
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {range === null
                        ? "Seluruh periode"
                        : `${range} hari terakhir`}
                    </p>
                  </div>

                  <Link
                    to="/complaints"
                    className="inline-flex shrink-0 items-center text-sm font-semibold text-indigo-600 transition hover:text-violet-700"
                  >
                    Lihat semua
                  </Link>
                </div>

                {(() => {
                  const visibleRecent = recent.filter(
                    (row) =>
                      tabCategory === null || row.category === tabCategory,
                  )

                  if (visibleRecent.length === 0) {
                    return (
                      <p className="py-8 text-center text-sm text-slate-500">
                        Belum ada aktivitas pada rentang ini.
                      </p>
                    )
                  }

                  return visibleRecent.map((row) => (
                    <Link
                      key={row.id}
                      to={`/complaints/${row.id}`}
                      className="group flex items-center gap-3 border-b border-slate-900/[0.06] py-3 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {row.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {row.is_anonymous
                            ? "Anonim"
                            : (row.reporter_username ?? "-")}{" "}
                          · {ageLabel(row.created_at)}
                        </span>
                      </span>

                      <StatusBadge status={row.status} />
                    </Link>
                  ))
                })()}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

// Panel antrean banding khusus ADMIN. Panel mem-fetch sendiri daftar banding
// PENDING lewat getAppealQueue(); daftar itu mengembalikan 403 untuk role
// lain, jadi komponen ini hanya dirender bila isAdmin() benar. Keputusan
// Terima/Tolak berjalan lewat modal agar catatan untuk pelapor ditulis di satu
// tempat, mengikuti pola modal konfirmasi di LostFound.
interface AppealQueuePanelProps {
  // Dipanggil setelah keputusan tersimpan: menghidupkan ulang muat pengaduan
  // (status laporan bisa berubah kembali PENDING) dan memuat ulang badge
  // sidebar lewat ComplaintSummaryProvider.
  onDecided: () => void
}

interface AppealDecision {
  status: "ACCEPTED" | "DENIED"
  label: string
  modalTitle: string
  description: string
  rowClass: string
  confirmClass: string
  icon: typeof Undo2
}

const APPEAL_DECISIONS: Record<
  "ACCEPTED" | "DENIED",
  AppealDecision
> = {
  ACCEPTED: {
    status: "ACCEPTED",
    label: "Terima",
    modalTitle: "Terima Banding",
    // Aturan alur (design.md): banding diterima mengembalikan laporan ke
    // PENDING di backend, jadi ada penjelasan eksplisit, bukan hanya warna.
    description:
      "Banding akan diterima dan status laporan kembali menjadi Menunggu untuk ditindaklanjuti pengelola.",
    rowClass:
      "btn-secondary px-3 py-2 text-xs border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800",
    confirmClass: "btn-primary w-full sm:w-auto",
    icon: Undo2,
  },
  DENIED: {
    status: "DENIED",
    label: "Tolak",
    modalTitle: "Tolak Banding",
    // Banding ditolak tidak mengubah status laporan; catatan menyertai
    // keputusan supaya pelapor tahu alasannya.
    description:
      "Banding akan ditolak dan status laporan tetap. Catatan ini akan ditampilkan kepada pelapor.",
    rowClass:
      "btn-secondary px-3 py-2 text-xs border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800",
    confirmClass:
      "btn-secondary w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800 sm:w-auto",
    icon: XCircle,
  },
}

function AppealQueuePanel({ onDecided }: AppealQueuePanelProps) {
  const [appeals, setAppeals] = useState<Appeal[] | null>(null)
  const [actionError, setActionError] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  const [target, setTarget] = useState<Appeal | null>(null)
  const [decision, setDecision] = useState<AppealDecision | null>(null)
  const [note, setNote] = useState("")
  const [isDeciding, setIsDeciding] = useState(false)
  const [decisionError, setDecisionError] = useState("")

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getAppealQueue()

        if (!active) {
          return
        }

        setAppeals(data.items)
        setActionError("")
      } catch {
        if (!active) {
          return
        }

        setAppeals([])
        setActionError("Gagal memuat antrean banding. Coba lagi.")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [retryKey])

  // `appeals` null berarti muat pertama; `queue` berisi baris terakhir yang
  // diketahui supaya pembaruan antrean tidak mengosongkan panel sekejap.
  const isLoading = appeals === null
  const queue = appeals ?? []

  const openDecision = (appeal: Appeal, next: AppealDecision) => {
    setTarget(appeal)
    setDecision(next)
    setNote("")
    setDecisionError("")
  }

  // Modal tidak boleh ditutup saat keputusan sedang berjalan, pola yang sama
  // dengan DeleteLostFoundModal.
  const closeModal = () => {
    if (!isDeciding) {
      setTarget(null)
      setDecision(null)
      setDecisionError("")
    }
  }

  const handleConfirm = async () => {
    if (!target || !decision) {
      return
    }

    setDecisionError("")
    setIsDeciding(true)

    try {
      await decideAppeal(target.id, {
        status: decision.status,
        // Catatan kosong tidak dikirim: field yang absen tidak menimpa kolom
        // response_note dengan string kosong.
        response_note: note.trim() || undefined,
      })

      // Aksi sukses: muat ulang daftar banding di sini dan data laporan lewat
      // onDecided; "berhasil" tampil hanya karena server sudah menjawab 2xx.
      setRetryKey((key) => key + 1)
      onDecided()

      setTarget(null)
      setDecision(null)
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 403) {
        setDecisionError("Kamu tidak memiliki izin memutus banding ini.")
      } else if (axios.isAxiosError(requestError)) {
        setDecisionError(
          errorMessage(requestError.response?.data) ??
            "Gagal memutus banding. Coba lagi.",
        )
      } else {
        setDecisionError("Tidak dapat terhubung ke server.")
      }
    } finally {
      setIsDeciding(false)
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <span className="orb -right-10 -top-10 h-32 w-32 bg-amber-300/22" />

      <div className="relative">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Antrean Banding
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Keberatan atas laporan yang ditolak, menunggu keputusanmu.
          </p>
        </div>

        {actionError ? (
          <div
            role="alert"
            aria-live="polite"
            className="alert-error mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <CircleAlert size={17} className="mt-0.5 shrink-0" />
            <span className="flex-1">{actionError}</span>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="shrink-0 self-center text-sm font-semibold text-indigo-600 underline-offset-2 hover:text-violet-700 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <LoaderCircle size={20} className="animate-spin text-slate-500" />
            <p className="text-sm text-slate-600">Memuat antrean banding...</p>
          </div>
        ) : queue.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Tidak ada banding yang menunggu diputuskan.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-900/[0.07]">
            {queue.map((appeal) => {
              const evidenceUrl = resolveMediaUrl(appeal.evidence)

              return (
                <li key={appeal.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/complaints/${appeal.complaint}`}
                        className="text-sm font-semibold text-slate-800 transition hover:text-indigo-600"
                      >
                        {appeal.complaint_title}
                      </Link>

                      <p className="mt-1 text-sm leading-6 whitespace-pre-line text-slate-600">
                        {appeal.reason}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Diajukan {formatDate(appeal.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {Object.values(APPEAL_DECISIONS).map((option) => (
                        <button
                          key={option.status}
                          type="button"
                          onClick={() => openDecision(appeal, option)}
                          className={option.rowClass}
                        >
                          <option.icon size={15} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* evidence adalah path "/media/..." tanpa host; wajib lewat
                      resolveMediaUrl() sebelum dipakai sebagai src (pola foto
                      pengaduan di ComplaintDetail). */}
                  {evidenceUrl && (
                    <img
                      src={evidenceUrl}
                      alt={`Bukti banding: ${appeal.complaint_title}`}
                      className="mt-3 block max-h-56 w-full rounded-xl object-cover sm:max-w-xs"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal
        open={target !== null && decision !== null}
        onClose={closeModal}
        title={decision === null ? "" : decision.modalTitle}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            {decision === null ? "" : decision.description} Keputusan akan
            diberlakukan pada banding laporan{" "}
            <span className="font-semibold text-slate-800">
              {target ? `"${target.complaint_title}"` : ""}
            </span>
            .
          </p>

          <div>
            <label
              htmlFor="appeal-response-note"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Catatan untuk pelapor{" "}
              <span className="text-slate-400">(opsional)</span>
            </label>

            <textarea
              id="appeal-response-note"
              rows={3}
              className="input-base resize-none"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                decision?.status === "ACCEPTED"
                  ? "Contoh: Banding diterima, laporan kembali diproses pengelola."
                  : "Contoh: Alasan banding tidak dapat diterima."
              }
            />
          </div>

          {decisionError && (
            <div
              role="alert"
              aria-live="polite"
              className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            >
              <CircleAlert size={17} className="mt-0.5 shrink-0" />
              <span>{decisionError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={isDeciding}
              className="btn-secondary w-full sm:w-auto"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeciding || !decision}
              className={decision === null ? "btn-primary w-full sm:w-auto" : decision.confirmClass}
            >
              {isDeciding ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  {decision === null ? (
                    <Gavel size={17} />
                  ) : (
                    <decision.icon size={17} />
                  )}
                  {decision === null ? "" : decision.label}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

// Label pembanding untuk kasus khusus "periode sebelumnya kosong": formatDelta
// sudah membuat "+n baru", jadi label ini hanya menjelaskan konteksnya.
function runtimeDeltaLabel(delta: PeriodDelta | undefined, range: number) {
  if (delta && delta.previous === 0 && delta.current > 0) {
    return `belum ada pada ${range} hari sebelumnya`
  }

  return `vs ${range} hari sebelumnya`
}

interface TabMetricCardProps {
  label: string
  value: string
  detail?: string
  // Kelas tint chip ikon mengikuti STATUS_CONFIG atau warna netral untuk Total.
  chipTone: string
}

function TabMetricCard({ label, value, detail, chipTone }: TabMetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <span className={`glass-chip h-9 w-9 shrink-0 ${chipTone}`}>
        <FileText size={17} />
      </span>

      <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </Card>
  )
}

export default AdminDashboard
