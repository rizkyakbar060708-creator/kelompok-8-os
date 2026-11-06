import {
  AlertCircle,
  CalendarDays,
  CircleCheck,
  LoaderCircle,
  MapPin,
  PackageSearch,
  Phone,
  Plus,
  Search,
  SearchX,
  Trash2,
  TriangleAlert,
  User,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"

import EmptyState from "../../components/ui/EmptyState"
import Modal from "../../components/ui/Modal"
import {
  createLostFoundItem,
  deleteLostFoundItem,
  getLostFoundItems,
  LOST_FOUND_STATUS_LABELS,
  LOST_FOUND_TYPE_LABELS,
  updateLostFoundItem,
  type LostFoundItem,
  type LostFoundStatus,
  type LostFoundType,
} from "../../services/lostFoundService"
import { errorMessage } from "../../utils/errorMessage"

type TypeFilter = LostFoundType | "all"

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "LOST", label: "Kehilangan" },
  { value: "FOUND", label: "Penemuan" },
]

// Tone badge mengikuti pola chip design.md (border-*-200 bg-*-50/90 text-*-700).
// Kehilangan memakai rose dan penemuan sky — keduanya belum mewakili status
// pengaduan, jadi tidak ada benturan makna warna dengan Terbuka (amber) dan
// Selesai (emerald).
const TYPE_CHIP_CLASSES: Record<LostFoundType, string> = {
  LOST: "border-rose-200 bg-rose-50/90 text-rose-700",
  FOUND: "border-sky-200 bg-sky-50/90 text-sky-700",
}

// Tone status mengikuti §9.1: Terbuka berperilaku seperti "Menunggu" (amber),
// Selesai harus emerald agar konsisten di seluruh aplikasi.
const STATUS_PILL_CLASSES: Record<LostFoundStatus, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
}

// Batas sama dengan CharField di backend (models.py), supaya kesalahan panjang
// ketahuan sebelum request dikirim, bukan lewat respons 400.
const MAX_TITLE_LENGTH = 200
const MAX_LOCATION_LENGTH = 255
const MAX_CONTACT_LENGTH = 100

// DateField backend mengirim "YYYY-MM-DD" yang Date() baca sebagai tengah
// malam UTC; tanpa penanda waktu, zona +7 bisa menggeser tampilan harinya.
// Menambahkan "T00:00:00" memaksa parser membacanya sebagai waktu lokal.
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

function describeMutationError(
  requestError: unknown,
  action: "menandai selesai" | "menghapus",
): string {
  const response = axios.isAxiosError(requestError)
    ? requestError.response
    : undefined

  if (!response) {
    return "Tidak dapat terhubung ke server."
  }

  if (response.status === 401) {
    return "Sesi kamu habis. Silakan masuk kembali."
  }

  // can_edit yang hilang antara fetch dan klik, atau role berubah di sisi
  // server, mendarat di sini sebagai 403.
  if (response.status === 403) {
    return `Kamu tidak memiliki izin untuk ${action} laporan ini.`
  }

  if (response.status === 429) {
    return "Terlalu banyak permintaan. Coba lagi beberapa saat lagi."
  }

  return errorMessage(response.data) ?? "Terjadi kesalahan pada server."
}

function LostFound() {
  const [items, setItems] = useState<LostFoundItem[] | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  // Error aksi dari kartu (Tandai Selesai) tampil di halaman karena aksi ini
  // dijalankan langsung di kartu tanpa dialog; error aksi dari modal
  // (form dan hapus) tampil di dalam modalnya masing-masing.
  const [actionError, setActionError] = useState("")
  // null berarti tidak ada mutasi berjalan; selain itu berisi id item yang
  // sedang di-update supaya hanya kartu itu yang ter-disable, bukan seluruh
  // daftar.
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LostFoundItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [retryKey, setRetryKey] = useState(0)

  // Pemberitahuan sukses tidak punya penutup manual (repo belum punya toast);
  // hilang sendiri supaya tidak menumpuk di halaman.
  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => setNotice(""), 6000)

    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        // Seluruh baris di-fetch sekali; filter tipe dan pencarian dihitung di
        // client, sama seperti halaman Pengaduan. Param ?type/?search backend
        // sengaja tidak dipakai agar ganti filter tidak memicu request ulang.
        const data = await getLostFoundItems()

        if (!active) {
          return
        }

        setItems(data)
        setError("")
      } catch {
        if (!active) {
          return
        }

        setError("Gagal memuat laporan Lost & Found. Periksa koneksi ke server.")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [retryKey])

  const rows = items ?? []
  const isLoading = items === null
  const query = search.trim().toLowerCase()

  const visibleItems = rows.filter(
    (item) =>
      (typeFilter === "all" || item.type === typeFilter) &&
      (query === "" ||
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)),
  )

  const lostCount = rows.filter((row) => row.type === "LOST").length
  const foundCount = rows.filter((row) => row.type === "FOUND").length

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("all")
  }

  const handleFinish = async (item: LostFoundItem) => {
    setActionError("")
    setUpdatingId(item.id)

    try {
      const updated = await updateLostFoundItem(item.id, { status: "RESOLVED" })

      // Baris diperbarui dari respons PATCH, bukan diubah setengahnya di
      // client, supaya updated_at ikut segaris dengan backend.
      setItems(
        (current) =>
          current?.map((row) => (row.id === updated.id ? updated : row)) ??
          current,
      )
      setNotice(`Laporan "${updated.title}" ditandai selesai.`)
    } catch (requestError: unknown) {
      setActionError(describeMutationError(requestError, "menandai selesai"))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setDeleteError("")
    setIsDeleting(true)

    try {
      await deleteLostFoundItem(deleteTarget.id)

      const deletedTitle = deleteTarget.title

      // Refetch tidak dipanggil demi satu baris; cukup dibuang dari state.
      // Gagal di sini bukan masalah kebenaran data karena DELETE sudah 204.
      setItems((current) =>
        current
          ? current.filter((row) => row.id !== deleteTarget.id)
          : current,
      )
      setDeleteTarget(null)
      setNotice(`Laporan "${deletedTitle}" dihapus.`)
    } catch (requestError: unknown) {
      setDeleteError(describeMutationError(requestError, "menghapus"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Pencarian barang</p>
          <h1 className="page-title">Lost &amp; Found</h1>
          <p className="page-subtitle">
            Laporkan kehilangan atau penemuan barang di lingkungan kampus.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={18} />
          Lapor Barang
        </button>
      </div>

      {!isLoading && !error && notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700"
        >
          <CircleCheck size={17} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Cari judul atau lokasi barang..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari laporan barang"
            className="input-base py-2.5 pl-10"
          />
        </div>
      </div>

      {!isLoading && !error && (
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTypeFilter(option.value)}
              aria-pressed={typeFilter === option.value}
              // Pola chip filter yang sama dengan halaman Pengaduan: chip
              // aktif ditandai kombinasi disabled + tone warna, bukan varian
              // class baru.
              disabled={typeFilter === option.value}
              className="glass-chip h-9 px-3 text-xs font-semibold text-slate-600 transition hover:bg-white/85 disabled:cursor-default disabled:border-indigo-300 disabled:bg-indigo-100/95 disabled:text-indigo-700"
            >
              {option.label}
              {option.value === "LOST" && (
                <span className="tabular-nums">{lostCount}</span>
              )}
              {option.value === "FOUND" && (
                <span className="tabular-nums">{foundCount}</span>
              )}
            </button>
          ))}

          {(typeFilter !== "all" || query !== "") && (
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

      {!isLoading && !error && actionError && (
        <div
          role="alert"
          aria-live="polite"
          className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <TriangleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {isLoading ? (
        <div
          aria-busy="true"
          className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500"
        >
          <LoaderCircle size={30} className="animate-spin" />
          <p>Memuat laporan barang...</p>
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
      ) : visibleItems.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleItems.map((item) => (
            <LostFoundCard
              key={item.id}
              item={item}
              isUpdating={updatingId === item.id}
              onFinish={handleFinish}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={rows.length === 0 ? PackageSearch : SearchX}
          title={
            rows.length === 0 ? "Belum ada laporan barang" : "Laporan tidak ditemukan"
          }
          description={
            rows.length === 0
              ? "Laporan kehilangan atau penemuan barang yang dibuat akan muncul di sini."
              : "Coba gunakan kata kunci atau filter tipe yang berbeda."
          }
          action={
            rows.length === 0 ? (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="btn-primary"
              >
                <Plus size={17} />
                Lapor Barang
              </button>
            ) : (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary"
              >
                Reset filter
              </button>
            )
          }
        />
      )}

      <CreateLostFoundModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(title) => {
          setFormOpen(false)
          // Bump retryKey berarti refetch dari satu pintu; menggeser baris
          // manual di runtime juga bisa, tapi refetch membuat urutan "terbaru"
          // tetap ditentukan backend.
          setRetryKey((key) => key + 1)
          setNotice(`Laporan "${title}" terkirim.`)
        }}
      />

      <DeleteLostFoundModal
        target={deleteTarget}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

interface LostFoundCardProps {
  item: LostFoundItem
  isUpdating: boolean
  onFinish: (item: LostFoundItem) => void
  onDelete: (item: LostFoundItem) => void
}

function LostFoundCard({ item, isUpdating, onFinish, onDelete }: LostFoundCardProps) {
  return (
    <article className="glass-card glass-card-hover rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${TYPE_CHIP_CLASSES[item.type]}`}
        >
          {LOST_FOUND_TYPE_LABELS[item.type]}
        </span>

        <span
          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL_CLASSES[item.status]}`}
        >
          {LOST_FOUND_STATUS_LABELS[item.status]}
        </span>
      </div>

      <h3 className="mt-2.5 text-base font-semibold tracking-tight text-slate-900">
        {item.title}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
        {item.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <MapPin size={16} className="shrink-0 text-slate-500" />
          {item.location}
        </span>

        <span className="flex items-center gap-1.5">
          <CalendarDays size={16} className="shrink-0 text-slate-500" />
          {formatDate(item.date)}
        </span>

        {item.contact && (
          <span className="flex items-center gap-1.5">
            <Phone size={16} className="shrink-0 text-slate-500" />
            {item.contact}
          </span>
        )}

        {item.reporter_name && (
          <span className="flex items-center gap-1.5">
            <User size={16} className="shrink-0 text-slate-500" />
            {item.reporter_name}
          </span>
        )}
      </div>

      {item.can_edit && (
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-900/8 pt-4">
          {item.status === "OPEN" && (
            <button
              type="button"
              onClick={() => onFinish(item)}
              disabled={isUpdating}
              className="glass-chip h-9 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50/90 disabled:cursor-default disabled:opacity-60"
            >
              {isUpdating ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <CircleCheck size={14} />
              )}
              Tandai Selesai
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={isUpdating}
            aria-label={`Hapus laporan ${item.title}`}
            className="icon-button icon-button-danger p-2"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  )
}

// Modal form berdiri sebagai satu blok <form> di dalam children Modal supaya
// submit tetap bekerja dengan tombol Enter; prop footer Modal tidak dipakai
// karena tombolnya harus bertetangga dengan <form>.
interface CreateLostFoundModalProps {
  open: boolean
  onClose: () => void
  onCreated: (title: string) => void
}

function CreateLostFoundModal({
  open,
  onClose,
  onCreated,
}: CreateLostFoundModalProps) {
  const [type, setType] = useState<LostFoundType>("LOST")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [contact, setContact] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setType("LOST")
    setTitle("")
    setLocation("")
    setDate("")
    setContact("")
    setDescription("")
  }

  const close = () => {
    // Error lama tidak boleh ikut terbawa saat modal dipakai lagi.
    onClose()
    setError("")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // required HTML melayani browser, tetapi trim dulu: field berisi spasi
    // saja lolos validasi bawaan namun tidak masuk akal sebagai laporan.
    if (!title.trim() || !location.trim() || !description.trim() || !date) {
      setError("Judul, lokasi, tanggal, dan deskripsi wajib diisi.")
      return
    }

    setError("")
    setLoading(true)

    try {
      // reporter dan status sengaja tidak dikirim: backend mengisinya sendiri
      // dari sesi login dan memaksa OPEN saat pembuatan (perform_create).
      const created = await createLostFoundItem({
        type,
        title: title.trim(),
        location: location.trim(),
        date,
        // Kontak kosong dikirim sebagai string kosong, bukan dihilangkan,
        // karena field ini selalu ikut di serializer backend.
        contact: contact.trim(),
        description: description.trim(),
      })

      onCreated(created.title)
      // Nilai laporan yang sudah terkirim tidak boleh terisi lagi saat
      // "Lapor Barang" dibuka berikutnya.
      resetForm()
    } catch (requestError: unknown) {
      const response = axios.isAxiosError(requestError)
        ? requestError.response
        : undefined

      if (!response) {
        setError("Tidak dapat terhubung ke server.")
      } else if (response.status === 401) {
        setError("Sesi kamu habis. Silakan masuk kembali.")
      } else if (response.status === 429) {
        setError("Terlalu banyak permintaan. Coba lagi beberapa saat lagi.")
      } else {
        setError(errorMessage(response.data) ?? "Data tidak valid.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Lapor Barang">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="lost-found-type"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tipe Laporan
            </label>

            <select
              id="lost-found-type"
              className="input-base cursor-pointer"
              value={type}
              onChange={(event) =>
                setType(event.target.value as LostFoundType)
              }
            >
              <option value="LOST">Kehilangan</option>
              <option value="FOUND">Penemuan</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="lost-found-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tanggal Kejadian
            </label>

            <input
              id="lost-found-date"
              type="date"
              className="input-base"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="lost-found-title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Judul
          </label>

          <input
            id="lost-found-title"
            type="text"
            placeholder="Contoh: Tas ransel tertinggal di ruang 102"
            className="input-base"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            required
            aria-invalid={Boolean(error && !title.trim())}
          />
        </div>

        <div>
          <label
            htmlFor="lost-found-location"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Lokasi
          </label>

          <input
            id="lost-found-location"
            type="text"
            placeholder="Contoh: Perpustakaan, lantai 2"
            className="input-base"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={MAX_LOCATION_LENGTH}
            required
          />
        </div>

        <div>
          <label
            htmlFor="lost-found-contact"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Kontak <span className="text-slate-400">(opsional)</span>
          </label>

          <input
            id="lost-found-contact"
            type="text"
            placeholder="Nomor HP atau WhatsApp"
            className="input-base"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            maxLength={MAX_CONTACT_LENGTH}
          />
        </div>

        <div>
          <label
            htmlFor="lost-found-description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Deskripsi
          </label>

          <textarea
            id="lost-found-description"
            rows={4}
            placeholder="Jelaskan ciri barang dan detail kejadiannya..."
            className="input-base resize-none"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="btn-secondary w-full sm:w-auto"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Plus size={17} />
                Kirim Laporan
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface DeleteLostFoundModalProps {
  target: LostFoundItem | null
  isDeleting: boolean
  error: string
  onClose: () => void
  onConfirm: () => void
}

function DeleteLostFoundModal({
  target,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteLostFoundModalProps) {
  return (
    <Modal
      open={target !== null}
      onClose={() => {
        // Modal hoisted di halaman supaya state hapus cukup satu tempat;
        // target null artinya dialog tertutup.
        if (!isDeleting) {
          onClose()
        }
      }}
      title="Hapus Laporan"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          Laporan{" "}
          <span className="font-semibold text-slate-800">
            {target ? `"${target.title}"` : ""}
          </span>{" "}
          akan dihapus permanen dan tidak dapat dikembalikan.
        </p>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary w-full sm:w-auto"
          >
            Batal
          </button>

          {/* Override merah mengikuti pola "danger pada btn-secondary" yang
              sama dengan tombol keluar Profile (design.md §8.6). */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || !target}
            className="btn-secondary w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800 sm:w-auto"
          >
            {isDeleting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 size={17} />
                Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default LostFound
