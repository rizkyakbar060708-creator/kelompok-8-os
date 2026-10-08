import { Plus, Search, SearchX } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

import ComplaintCard from "../../components/complaint/ComplaintCard"
import EmptyState from "../../components/ui/EmptyState"

type Status =
  | "submitted"
  | "verified"
  | "in_progress"
  | "resolved"

interface Complaint {
  id: number
  title: string
  category: string
  location: string
  date: string
  status: Status
}

const complaints: Complaint[] = [
  {
    id: 1,
    title: "AC Ruang 301 Rusak",
    category: "AC",
    location: "Gedung A, Ruang 301",
    date: "29 September 2026",
    status: "in_progress",
  },
  {
    id: 2,
    title: "Lampu Koridor Mati",
    category: "Listrik",
    location: "Gedung B, Lantai 2",
    date: "28 September 2026",
    status: "resolved",
  },
  {
    id: 3,
    title: "Keran Air Rusak",
    category: "Air",
    location: "Gedung C, Toilet",
    date: "27 September 2026",
    status: "submitted",
  },
  {
    id: 4,
    title: "Kursi Ruang Kelas Rusak",
    category: "Fasilitas",
    location: "Gedung A, Ruang 205",
    date: "26 September 2026",
    status: "verified",
  },
]

function Complaints() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.title
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      complaint.status === statusFilter

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

        <Link to="/complaints/create" className="btn-primary w-full sm:w-auto">
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
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter status pengaduan"
          className="input-base cursor-pointer py-2.5 sm:w-56"
        >
          <option value="all">Semua Status</option>
          <option value="submitted">Diajukan</option>
          <option value="verified">Diverifikasi</option>
          <option value="in_progress">Diproses</option>
          <option value="resolved">Selesai</option>
        </select>
      </div>

      {filteredComplaints.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard key={complaint.id} {...complaint} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="Pengaduan tidak ditemukan"
          description="Coba gunakan kata kunci atau filter yang berbeda."
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