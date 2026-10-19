import {
  Building2,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"

import Card from "../../components/ui/Card"
import EmptyState from "../../components/ui/EmptyState"
import { errorMessage } from "../../utils/errorMessage"
import {
  createFacility,
  getFacilities,
  updateFacility,
  type Facility,
  type FacilityStatus,
} from "../../services/facilityService"

type FacilityDraft = {
  name: string
  description: string
  location: string
  status: FacilityStatus
}

const EMPTY_DRAFT: FacilityDraft = {
  name: "",
  description: "",
  location: "",
  status: "ACTIVE",
}

const STATUS_OPTIONS: { value: FacilityStatus; label: string; hint: string }[] = [
  {
    value: "ACTIVE",
    label: "Aktif",
    hint: "Fasilitas bisa dipakai dan menerima pengaduan",
  },
  {
    value: "MAINTENANCE",
    label: "Perawatan",
    hint: "Sedang diperbaiki, pengaduan masih bisa dibuat",
  },
  {
    value: "INACTIVE",
    label: "Nonaktif",
    hint: "Tidak dipakai lagi",
  },
]

// Backend menyimpan Facility.status sebagai CharField tanpa choices, jadi nilai
// di luar tiga ini akan diterima apa adanya. Filter di sini tetap eksplisit
// supaya option yang tidak dikenal tidak tampil sebagai chip kosong.
const KNOWN_STATUSES: readonly FacilityStatus[] = [
  "ACTIVE",
  "MAINTENANCE",
  "INACTIVE",
]

const statusMeta: Record<FacilityStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Aktif", className: "bg-emerald-100 text-emerald-700" },
  MAINTENANCE: { label: "Perawatan", className: "bg-amber-100 text-amber-700" },
  INACTIVE: { label: "Nonaktif", className: "bg-slate-100 text-slate-600" },
}

function FacilitiesAdmin() {
  const [facilities, setFacilities] = useState<Facility[] | null>(null)
  const [error, setError] = useState("")
  const [isPaginated, setIsPaginated] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<FacilityDraft>(EMPTY_DRAFT)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const envelope = await getFacilities()

        if (!active) {
          return
        }

        setFacilities(envelope.items)
        setIsPaginated(envelope.isPaginated)
        setError("")
      } catch {
        if (!active) {
          return
        }

        setFacilities([])
        setError("Gagal memuat daftar fasilitas. Coba muat ulang halaman.")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [retryKey])

  const visibleFacilities = useMemo(() => {
    const list = facilities ?? []
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return list
    }

    return list.filter(
      (facility) =>
        facility.name.toLowerCase().includes(keyword) ||
        facility.location.toLowerCase().includes(keyword),
    )
  }, [facilities, search])

  const isLoading = facilities === null

  const openCreateForm = () => {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setActionError("")
    setNotice("")
    setIsFormOpen(true)
  }

  const openEditForm = (facility: Facility) => {
    setEditingId(facility.id)
    setDraft({
      name: facility.name,
      description: facility.description,
      location: facility.location,
      status: KNOWN_STATUSES.includes(facility.status)
        ? facility.status
        : "ACTIVE",
    })
    setActionError("")
    setNotice("")
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setActionError("")
    setNotice("")
    setIsSaving(true)

    try {
      if (editingId === null) {
        const created = await createFacility(draft)

        setFacilities((current) => [
          ...(current ?? []),
          created,
        ])
        setNotice(`Fasilitas "${created.name}" berhasil ditambahkan.`)
      } else {
        const updated = await updateFacility(editingId, draft)

        setFacilities((current) =>
          (current ?? []).map((facility) =>
            facility.id === updated.id ? updated : facility,
          ),
        )
        setNotice(`Perubahan pada "${updated.name}" tersimpan.`)
      }

      closeForm()
    } catch (requestError: unknown) {
      // Pesan error hanya dibaca dari respons API. Kalau request-nya ditolak, tidak
      // ada asumsi success yang ditampilkan di mana pun.
      setActionError(
        errorMessage(
          (requestError as { response?: { data?: unknown } })?.response?.data,
        ) ?? "Gagal menyimpan fasilitas. Coba lagi.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Data master</p>
          <h1 className="page-title">Kelola Fasilitas</h1>
          <p className="page-subtitle">
            Tambah dan perbarui fasilitas yang bisa dilaporkan mahasiswa.
          </p>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            onClick={openCreateForm}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={18} />
            Tambah Fasilitas
          </button>
        )}
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

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="alert-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <CircleCheck size={18} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {isFormOpen && (
        <Card className="relative overflow-hidden">
          <span className="orb -right-12 -top-14 h-40 w-40 bg-violet-400/22" />

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  {editingId === null ? "Fasilitas baru" : "Ubah fasilitas"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Nama dan lokasi wajib diisi. Deskripsi boleh dikosongkan.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="icon-button p-2"
                aria-label="Batal ubah fasilitas"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="facility-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Nama fasilitas
                </label>
                <input
                  id="facility-name"
                  type="text"
                  required
                  maxLength={150}
                  value={draft.name}
                  disabled={isSaving}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="input-base"
                />
              </div>

              <div>
                <label
                  htmlFor="facility-location"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Lokasi
                </label>
                <input
                  id="facility-location"
                  type="text"
                  required
                  maxLength={255}
                  value={draft.location}
                  disabled={isSaving}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  className="input-base"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="facility-description"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Deskripsi
                </label>
                <textarea
                  id="facility-description"
                  rows={3}
                  value={draft.description}
                  disabled={isSaving}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="input-base resize-y"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="facility-status"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Status
                </label>
                <select
                  id="facility-status"
                  value={draft.status}
                  disabled={isSaving}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as FacilityStatus,
                    }))
                  }
                  className="input-base cursor-pointer sm:max-w-xs"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {actionError && (
              <div
                role="alert"
                aria-live="polite"
                className="alert-error mt-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              >
                <CircleAlert size={17} className="mt-0.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="btn-secondary w-full sm:w-auto"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CircleCheck size={17} />
                    {editingId === null ? "Tambah Fasilitas" : "Simpan Perubahan"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Cari nama atau lokasi fasilitas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari fasilitas"
            className="input-base py-2.5 pl-10"
          />
        </div>

        <p className="px-1 text-xs font-medium tabular-nums text-slate-500 sm:w-40 sm:text-right">
          {isLoading
            ? "Memuat..."
            : `${visibleFacilities.length} dari ${facilities?.length ?? 0} fasilitas`}
        </p>
      </div>

      {isPaginated && (
        <p
          role="status"
          className="text-xs leading-5 text-amber-800"
        >
          Backend membalas daftar fasilitas dalam bentuk halaman, jadi tabel di
          bawah hanya menampilkan halaman pertama.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <LoaderCircle size={30} className="animate-spin" />
          <p>Memuat fasilitas...</p>
        </div>
      ) : visibleFacilities.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-slate-900/[0.07]">
            {visibleFacilities.map((facility) => {
              const meta = statusMeta[facility.status] ?? {
                label: facility.status,
                className: "bg-slate-100 text-slate-600",
              }

              return (
                <li
                  key={facility.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/70 sm:px-6"
                >
                  <span className="glass-chip h-11 w-11 shrink-0 border-white/70 bg-white/65 text-indigo-600">
                    <Building2 size={19} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {facility.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {facility.location}
                    </p>
                    {facility.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {facility.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
                  >
                    {meta.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => openEditForm(facility)}
                    className="btn-secondary shrink-0 py-2"
                  >
                    <Pencil size={15} />
                    Ubah
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState
          icon={Building2}
          title={
            (facilities?.length ?? 0) === 0
              ? "Belum ada fasilitas"
              : "Fasilitas tidak ditemukan"
          }
          description={
            (facilities?.length ?? 0) === 0
              ? "Tambahkan fasilitas pertama supaya mahasiswa bisa membuat pengaduan."
              : "Coba gunakan nama atau lokasi yang berbeda."
          }
          action={
            (facilities?.length ?? 0) === 0 ? (
              <button type="button" onClick={openCreateForm} className="btn-primary">
                <Plus size={17} />
                Tambah Fasilitas
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="btn-secondary"
              >
                Reset pencarian
              </button>
            )
          }
        />
      )}

      {/* Penghapusan sengaja tidak disediakan di fase ini. Field facility pada
          model Complaint memakai on_delete=CASCADE, jadi
          DELETE /api/facilities/{id}/ menghapus permanen seluruh pengaduan pada
          fasilitas itu, dan backend belum punya endpoint untuk menghitung
          dampaknya maupun menolak penghapusan bercabang. */}
      <Card className="relative overflow-hidden">
        <span className="orb -left-12 -bottom-14 h-32 w-32 bg-rose-400/16" />

        <div className="relative flex items-start gap-3">
          <span className="glass-chip h-11 w-11 shrink-0 border-rose-200 bg-rose-50/90 text-rose-700">
            <CircleAlert size={20} />
          </span>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Menghapus fasilitas belum tersedia
            </h2>

            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
              Penghapusan fasilitas akan ikut menghapus seluruh pengaduan yang
              terlampir padanya secara permanen, karena relasi pengaduan memakai
              penghapusan berantai. Backend belum memiliki endpoint untuk
              menghitung jumlah pengaduan terdampak atau menolak penghapusan
              bercabang, jadi sampai itu ada, paket ini hanya menyediakan tambah
              dan ubah.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Untuk sementara, nonaktifkan fasilitas lewat kolom Status bila
              sudah tidak dipakai.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FacilitiesAdmin