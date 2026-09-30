import { Plus, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

import ComplaintCard from "../../components/complaint/ComplaintCard"

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pengaduan
          </h1>

          <p className="mt-1 text-gray-500">
            Kelola dan pantau pengaduan fasilitas kamu.
          </p>
        </div>

        <Link
          to="/complaints/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={18} />
          Buat Pengaduan
        </Link>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Cari pengaduan..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400"
        >
          <option value="all">Semua Status</option>
          <option value="submitted">Diajukan</option>
          <option value="verified">Diverifikasi</option>
          <option value="in_progress">Diproses</option>
          <option value="resolved">Selesai</option>
        </select>
      </div>

      {/* Complaint list */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredComplaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            {...complaint}
          />
        ))}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="font-medium text-gray-700">
            Pengaduan tidak ditemukan
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Coba gunakan kata kunci atau filter yang berbeda.
          </p>
        </div>
      )}
    </div>
  )
}

export default Complaints 