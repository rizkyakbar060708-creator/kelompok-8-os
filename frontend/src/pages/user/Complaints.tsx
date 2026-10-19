import {
  AlertCircle,
  Clock3,
  LoaderCircle,
  Plus,
  Search,
  SearchX,
  TriangleAlert,
  X,
} from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"

import ComplaintCard from "../../components/complaint/ComplaintCard"
import EmptyState from "../../components/ui/EmptyState"
import { useAuth } from "../../contexts/AuthContext"
import {
  getComplaints,
  type Complaint,
} from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import { joinFacilities, type ComplaintRow } from "../../utils/complaintStats"
import { STAFF } from "../../utils/roles"

type Status = Complaint["status"] | "all"
type Priority = Complaint["priority"] | "all"

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "PENDING", label: "Menunggu" },
  { value: "IN_PROGRESS", label: "Diproses" },
  { value: "RESOLVED", label: "Selesai" },
  { value: "REJECTED", label: "Ditolak" },
]

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "all", label: "Semua Prioritas" },
  { value: "HIGH", label: "Tinggi" },
  { value: "MEDIUM", label: "Sedang" },
  { value: "LOW", label: "Rendah" },
]

const isStatus = (value: string | null): value is Status =>
  STATUS_OPTIONS.some((option) => option.value === value)

const isPriority = (value: string | null): value is Priority =>
  PRIORITY_OPTIONS.some((option) => option.value === value)

function Complaints() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  // Filter status dan prioritas datang dari query string supaya tautan pintasan
  // dari dashboard (mis. ?status=PENDING) langsung bekerja dan tombol "kembali"
  // browser mengembalikan keadaan filter yang sama. Nilai yang tidak dikenal
  // di URL diperlakukan sebagai "all" supaya parameter rusak tidak membuat
  // daftar kosong tanpa penjelasan.
  const statusParam = searchParams.get("status")
  const priorityParam = searchParams.get("priority")
  const statusFilter: Status = isStatus(statusParam) ? statusParam : "all"
  const priorityFilter: Priority = isPriority(priorityParam)
    ? priorityParam
    : "all"
  // Retry memakai state, bukan window.location.reload(), supaya state aplikasi
  // (filter pencarian, hasil scroll) tidak ikut hilang setiap kali user
  // menekan tombol muat ulang.
  const [retryKey, setRetryKey] = useState(0)

  // Staf memakai halaman ini untuk menindaklanjuti laporan orang lain, bukan
  // untuk melapor, jadi tombol buat pengaduan disembunyikan dari sana.
  // Perhatikan: ini hanya menghilangkan tombol. Backend sebenarnya tetap
  // mengizinkan role mana pun membuat pengaduan, jadi menyembunyikan tombol
  // bukan bukti soal hak akses.
  const canCreate = user?.role !== STAFF

  useEffect(() => {
    let active = true

    const fetchComplaints = async () => {
      try {
        // Serializer mengembalikan facility sebagai integer PK, jadi nama dan
        // lokasi diambil dari daftar fasilitas lalu di-join di client.
        const [complaints, facilities] = await Promise.all([
          getComplaints(),
          getFacilities(),
        ])

        if (!active) {
          return
        }

        setRows(joinFacilities(complaints.items, facilities.items))
        setError("")
      } catch {
        if (!active) {
          return
        }

        setRows([])
        setError("Gagal memuat pengaduan. Periksa koneksi ke server.")
      }
    }

    void fetchComplaints()

    return () => {
      active = false
    }
  }, [retryKey])

  const complaints = rows ?? []
  const isLoading = rows === null
  const hasActiveFilter = statusFilter !== "all" || priorityFilter !== "all"

  const setFilterParam = (key: "status" | "priority", value: string) => {
    const next = new URLSearchParams(searchParams)

    if (value === "all") {
      next.delete(key)
    } else {
      next.set(key, value)
    }

    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    setSearch("")
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.title
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || complaint.status === statusFilter

    const matchesPriority =
      priorityFilter === "all" || complaint.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const pendingCount = complaints.filter(
    (complaint) => complaint.status === "PENDING",
  ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Daftar laporan</p>
          <h1 className="page-title">Pengaduan</h1>
          <p className="page-subtitle">
            {canCreate
              ? "Kelola dan pantau pengaduan fasilitas kamu."
              : "Tinjau dan tindak lanjuti pengaduan yang masuk."}
          </p>
        </div>

        {canCreate && (
          <Link
            to="/complaints/create"
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={18} />
            Buat Pengaduan
          </Link>
        )}
      </div>

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Cari pengaduan..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari pengaduan"
            className="input-base py-2.5 pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setFilterParam("status", event.target.value)
          }
          aria-label="Filter status pengaduan"
          className="input-base cursor-pointer py-2.5 sm:w-48"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            setFilterParam("priority", event.target.value)
          }
          aria-label="Filter prioritas pengaduan"
          className="input-base cursor-pointer py-2.5 sm:w-48"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {!isLoading && !error && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterParam("status", "PENDING")}
            disabled={statusFilter === "PENDING"}
            className="glass-chip h-9 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-50/90 disabled:cursor-default disabled:border-amber-300 disabled:bg-amber-100/95"
          >
            <Clock3 size={14} />
            Menunggu tindak lanjut
            <span className="tabular-nums">{pendingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterParam("priority", "HIGH")}
            disabled={priorityFilter === "HIGH"}
            className="glass-chip h-9 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50/90 disabled:cursor-default disabled:border-indigo-300 disabled:bg-indigo-100/95"
          >
            <TriangleAlert size={14} />
            Prioritas tinggi
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="glass-chip h-9 px-3 text-xs font-semibold text-slate-600 transition hover:bg-white/85"
            >
              <X size={14} />
              Reset filter
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <LoaderCircle size={30} className="animate-spin" />
          <p>Memuat pengaduan...</p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
        >
          <AlertCircle size={30} className="text-red-500" />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="btn-secondary"
          >
            Coba lagi
          </button>
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              id={complaint.id}
              title={complaint.title}
              category={`Prioritas ${complaint.priority}`}
              location={`${complaint.facilityName} · ${complaint.location}`}
              date={new Date(complaint.created_at).toLocaleDateString(
                "id-ID",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
              status={complaint.status}
              reporter={complaint.reporter_username}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title={
            complaints.length === 0
              ? "Belum ada pengaduan"
              : "Pengaduan tidak ditemukan"
          }
          description={
            complaints.length === 0
              ? "Pengaduan yang kamu buat akan muncul di sini."
              : "Coba gunakan kata kunci atau filter yang berbeda."
          }
          action={
            hasActiveFilter || search ? (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary"
              >
                Reset filter
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}

export default Complaints
