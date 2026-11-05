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
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"

import ComplaintCard from "../../components/complaint/ComplaintCard"
import EmptyState from "../../components/ui/EmptyState"
import { useAuth } from "../../contexts/AuthContext"
import {
  getComplaints,
  SUB_CATEGORY_LABELS,
  type Complaint,
  type ComplaintListParams,
} from "../../services/complaintService"
import {
  CATEGORY_CONFIG,
  categoryPath,
  isComplaintCategory,
} from "../../utils/categoryConfig"
import { getFacilities } from "../../services/facilityService"
import { joinFacilities, type ComplaintRow } from "../../utils/complaintStats"
import { STAFF } from "../../utils/roles"

type Status = Complaint["status"] | "all"
type Priority = Complaint["priority"] | "all"
type Category = Complaint["category"] | "all"
type SubCategory = string | "all"

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

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "all", label: "Semua Kategori" },
  { value: "FASILITAS", label: "Fasilitas" },
  { value: "AKADEMIK", label: "Akademik" },
  { value: "KEAMANAN", label: "Keamanan" },
]

const isStatus = (value: string | null): value is Status =>
  STATUS_OPTIONS.some((option) => option.value === value)

const isPriority = (value: string | null): value is Priority =>
  PRIORITY_OPTIONS.some((option) => option.value === value)

// Label sub-kategori memakai map yang sama dengan badge kartu supaya satu
// perubahan label tidak harus diulang di dua tempat.
const categorySubValues: Record<"AKADEMIK" | "KEAMANAN", string[]> = {
  AKADEMIK: [
    "JADWAL_KULIAH",
    "DOSEN_TIDAK_HADIR",
    "KESALAHAN_NILAI",
    "KENDALA_KRS",
    "PELAYANAN_AKADEMIK",
  ],
  KEAMANAN: [
    "KEHILANGAN_BARANG",
    "MASALAH_PARKIR",
    "PENCURIAN",
    "GANGGUAN_KEAMANAN",
    "PELECEHAN_PERUNDUNGAN",
  ],
}

const SUB_CATEGORY_OPTIONS: { value: SubCategory; label: string }[] = [
  { value: "all", label: "Semua Sub-Kategori" },
  ...Object.values(categorySubValues)
    .flat()
    .map((value) => ({ value: value as SubCategory, label: SUB_CATEGORY_LABELS[value] })),
]

const iSubCategory = (value: string | null): value is Exclude<SubCategory, "all"> =>
  Object.hasOwn(SUB_CATEGORY_LABELS, value ?? "")

function Complaints({ category }: { category?: Complaint["category"] }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rows, setRows] = useState<ComplaintRow[] | null>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  // Filter status, prioritas, dan sub-kategori datang dari query string
  // supaya tautan pintasan dari dashboard serta bar status sidebar
  // (mis. /complaints/keamanan?status=PENDING) langsung bekerja dan tombol
  // "kembali" browser mengembalikan keadaan filter yang sama. Kategori tidak
  // lagi lewat query — nilai itu terkunci di route statis (prop `category`).
  // Nilai yang tidak dikenal di URL diperlakukan sebagai "all" supaya
  // parameter rusak tidak membuat daftar kosong tanpa penjelasan.
  const statusParam = searchParams.get("status")
  const priorityParam = searchParams.get("priority")
  const categoryParam = searchParams.get("category")
  const subCategoryParam = searchParams.get("sub_category")
  const statusFilter: Status = isStatus(statusParam) ? statusParam : "all"
  const priorityFilter: Priority = isPriority(priorityParam)
    ? priorityParam
    : "all"
  const subCategoryFilter: SubCategory = iSubCategory(subCategoryParam)
    ? subCategoryParam
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

  // Tautan lama /complaints?category=X masih hidup: dialihkan ke route kategori
  // statis baru (tanpa param category, filter lain dibawa). Redirect pakai
  // replace supaya tombol "kembali" tidak jatuh ke URL dengan format lama.
  useEffect(() => {
    if (category || !isComplaintCategory(categoryParam)) {
      return
    }

    const next = new URLSearchParams(searchParams)
    next.delete("category")
    const query = next.toString()

    navigate(
      `${categoryPath(categoryParam)}${query ? `?${query}` : ""}`,
      { replace: true },
    )
  }, [category, categoryParam, navigate, searchParams])

  useEffect(() => {
    let active = true

    const fetchComplaints = async () => {
      try {
        // Kategori (dari route) dan status (dari query string, mis ?status=PENDING
        // dari sidebar) difilter di server supaya isi halaman selalu konsisten
        // dengan angka badge sidebar yang dibaca dari endpoint yang sama.
        // Serializer mengembalikan facility sebagai integer PK, jadi nama dan
        // lokasi diambil dari daftar fasilitas lalu di-join di client.
        const params: ComplaintListParams = {}
        if (category) {
          params.category = category
        }
        if (statusFilter !== "all") {
          params.status = statusFilter
        }

        const complaintsPromise =
          Object.keys(params).length > 0
            ? getComplaints(params)
            : getComplaints()

        const [complaints, facilities] = await Promise.all([
          complaintsPromise,
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

        // Refetch filter yang gagal tidak boleh menghapus daftar yang sudah
        // tampil; baris tetap ditampilkan dan pesan ulang muncul di atasnya.
        setError("Gagal memuat pengaduan. Periksa koneksi ke server.")
      }
    }

    void fetchComplaints()

    return () => {
      active = false
    }
  }, [retryKey, statusFilter, category])

  const complaints = rows ?? []
  const isLoading = rows === null
  const hasActiveFilter =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    subCategoryFilter !== "all"

  const setFilterParam = (
    key: "status" | "priority" | "sub_category",
    value: string,
  ) => {
    const next = new URLSearchParams(searchParams)

    if (value === "all") {
      next.delete(key)
    } else {
      next.set(key, value)
    }

    setSearchParams(next, { replace: true })
  }

  // Pilih kategori pada halaman "Semua" berarti pindah ke route kategorinya;
  // filter status yang sedang aktif dibawa supaya mutasi filter tetap satu
  // arah (category = route, sisanya = query string).
  const navigateToCategory = (value: string) => {
    if (!isComplaintCategory(value)) {
      return
    }

    const next = new URLSearchParams(searchParams)
    next.delete("category")
    const query = next.toString()

    navigate(`${categoryPath(value)}${query ? `?${query}` : ""}`)
  }

  const clearFilters = () => {
    setSearch("")
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  // Kategori dan status sudah difilter di server (lihat fetch di atas), jadi
  // sisa filter yang dikasih di client adalah pencarian, prioritas, dan
  // sub-kategori.
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.title
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesPriority =
      priorityFilter === "all" || complaint.priority === priorityFilter

    const matchesSubCategory =
      subCategoryFilter === "all" || complaint.sub_category === subCategoryFilter

    return (
      matchesSearch &&
      matchesPriority &&
      matchesSubCategory
    )
  })

  const pendingCount = complaints.filter(
    (complaint) => complaint.status === "PENDING",
  ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Daftar laporan</p>
          <h1 className="page-title">
            {category
              ? `Pengaduan ${CATEGORY_CONFIG[category].label}`
              : "Pengaduan"}
          </h1>
          <p className="page-subtitle">
            {canCreate
              ? "Kelola dan pantau pengaduan fasilitas kamu."
              : "Tinjau dan tindak lanjuti pengaduan yang masuk."}
          </p>
        </div>

        {canCreate && (
          <Link
            // Di route kategori, tombol utama ikut mengisi kategori supaya
            // alur "lihat laporan X, tambah laporan X" tidak bolak-balik meng-
            // ganti select kategori di form.
            to={
              category
                ? `/complaints/create?category=${category}`
                : "/complaints/create"
            }
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

        {/* Di route kategori, filter kategori sudah dibeli route-nya, jadi
            select ini hanya tampil di /complaints. Memilih opsi = pindah
            route kategori (bukan filter klien) supaya badge sidebar dan isi
            halaman selalu satu sumber. */}
        {!category && (
          <select
            value="all"
            onChange={(event) => navigateToCategory(event.target.value)}
            aria-label="Filter kategori pengaduan"
            className="input-base cursor-pointer py-2.5 sm:w-48"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={subCategoryFilter}
          onChange={(event) =>
            setFilterParam("sub_category", event.target.value)
          }
          aria-label="Filter sub-kategori pengaduan"
          className="input-base cursor-pointer py-2.5 sm:w-52"
        >
          {SUB_CATEGORY_OPTIONS.map((option) => (
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
        error ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
            <LoaderCircle size={30} className="animate-spin" />
            <p>Memuat pengaduan...</p>
          </div>
        )
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
            >
              <p className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={17} className="shrink-0" />
                Gagal memuat ulang. Daftar di bawah masih data sebelumnya.
              </p>
              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
                className="glass-chip h-9 px-3 text-xs font-semibold text-slate-600 transition hover:bg-white/85"
              >
                Muat ulang
              </button>
            </div>
          )}

          {!error && filteredComplaints.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredComplaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  id={complaint.id}
                  title={complaint.title}
                  category={complaint.category}
                  subCategory={complaint.sub_category}
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
                  isAnonymous={complaint.is_anonymous}
                />
              ))}
            </div>
          ) : !error ? (
            <EmptyState
              icon={SearchX}
              title={
                complaints.length === 0
                  ? category
                    ? "Belum ada pengaduan di kategori ini"
                    : "Belum ada pengaduan"
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
          ) : null}
        </>
      )}
    </div>
  )
}

export default Complaints