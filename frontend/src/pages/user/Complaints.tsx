import { Plus, Search, SearchX, LoaderCircle, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

import ComplaintCard from "../../components/complaint/ComplaintCard"
import EmptyState from "../../components/ui/EmptyState"
import {
  getComplaints,
  type Complaint,
} from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import { joinFacilities, type ComplaintRow } from "../../utils/complaintStats"

type Status = Complaint["status"] | "all"

function Complaints() {
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status>("all")
  const [error, setError] = useState("")
  // Retry memakai state, bukan window.location.reload(), supaya state aplikasi
  // (filter pencarian, hasil scroll) tidak ikut hilang setiap kali user
  // menekan tombol muat ulang.
  const [retryKey, setRetryKey] = useState(0)

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

        setRows(joinFacilities(complaints, facilities))
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

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.title
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || complaint.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Daftar laporan</p>
          <h1 className="page-title">Pengaduan</h1>
          <p className="page-subtitle">
            Kelola dan pantau pengaduan fasilitas kamu.
          </p>
        </div>

        <Link
          to="/complaints/create"
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={18} />
          Buat Pengaduan
        </Link>
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
            setStatusFilter(event.target.value as Status)
          }
          aria-label="Filter status pengaduan"
          className="input-base cursor-pointer py-2.5 sm:w-56"
        >
          <option value="all">Semua Status</option>
          <option value="PENDING">Menunggu</option>
          <option value="IN_PROGRESS">Diproses</option>
          <option value="RESOLVED">Selesai</option>
          <option value="REJECTED">Ditolak</option>
        </select>
      </div>

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
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
              }}
              className="btn-secondary"
            >
              Reset filter
            </button>
          }
        />
      )}
    </div>
  )
}

export default Complaints
