import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  MapPin,
  Save,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import axios from "axios"

import StatusBadge from "../../components/ui/StatusBadge"
import Card from "../../components/ui/Card"
import { useAuth } from "../../contexts/AuthContext"
import {
  deleteComplaint,
  getComplaintDetail,
  updateComplaint,
  type Complaint,
} from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import { formatDate } from "../../utils/complaintStats"
import { resolveMediaUrl } from "../../utils/media"
import { isAdmin, isManager } from "../../utils/roles"
import { errorMessage } from "../../utils/errorMessage"
import {
  COMPLAINT_STATUSES,
  statusLabel,
} from "../../utils/statusConfig"

const priorityLabels: Record<Complaint["priority"], string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
}

// Prioritas dibaca sekilas, jadi tiap tingkat memakai warnanya sendiri. Nada
// indigo dipakai untuk "Tertinggi" supaya tidak bentrok dengan pil status di
// header yang juga memakai warna per nilainya.
const priorityTones: Record<Complaint["priority"], string> = {
  LOW: "border-slate-200 bg-white/70 text-slate-600",
  MEDIUM: "border-amber-200 bg-amber-50/90 text-amber-700",
  HIGH: "border-indigo-200 bg-indigo-50/90 text-indigo-700",
}

// Pesan error DRF dibaca lewat util yang sama dengan halaman lain supaya
// bentuk {"status": ["..."]}, {"detail": "..."}, dan daftar string ditangani
// satu kali saja.

function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Diturunkan saat render, bukan di effect: id yang bukan angka sudah pasti
  // tidak valid, jadi tidak perlu menunggu fetch selesai untuk mengetahuinya.
  // Number("") bernilai 0, jadi batas bawah 1 juga wajib dicek supaya id
  // kosong tidak berubah jadi request ke /complaints/0/.
  const complaintId = Number(id)
  const isInvalidId = !Number.isInteger(complaintId) || complaintId < 1

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [facilityName, setFacilityName] = useState("")
  const [location, setLocation] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  const [statusDraft, setStatusDraft] =
    useState<Complaint["status"]>("PENDING")
  const [priorityDraft, setPriorityDraft] =
    useState<Complaint["priority"]>("MEDIUM")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState("")
  // Pesan sukses hanya diisi setelah PATCH benar-benarDijawab 2xx oleh server
  // dan state lokal memang sudah mengikuti respons itu. Kalau request ditolak,
  // variabel ini dibiarkan kosong supaya tidak pernah menampilkan "berhasil"
  // untuk operasi yang gagal diam-diam.
  const [actionNotice, setActionNotice] = useState("")

  useEffect(() => {
    if (isInvalidId) {
      return
    }

    let active = true

    const load = async () => {
      let detail: Complaint | null = null

      try {
        detail = await getComplaintDetail(complaintId)

        if (!active) {
          return
        }

        setComplaint(detail)
        setStatusDraft(detail.status)
        setPriorityDraft(detail.priority)
        setActionError("")
        setActionNotice("")
        setNotFound(false)
        setError("")
      } catch (requestError: unknown) {
        if (!active) {
          return
        }

        const status = axios.isAxiosError(requestError)
          ? requestError.response?.status
          : undefined

        if (status === 404) {
          setNotFound(true)
        } else {
          setError("Gagal memuat pengaduan. Coba muat ulang halaman.")
        }

        return
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }

      // Nama fasilitas diambil setelah detail sukses, dan kegagalannya tidak
      // boleh menjatuhkan halaman. Dengan Promise.all, error dari /facilities/
      // ikut menggagalkan render padahal isi pengaduan sudah lengkap.
      try {
        const facilities = await getFacilities()

        if (!active) {
          return
        }

        const facility = facilities.items.find(
          (item) => item.id === detail.facility,
        )

        setFacilityName(facility?.name ?? "Fasilitas tidak dikenal")
        setLocation(facility?.location ?? "Lokasi tidak tersedia")
      } catch {
        if (active) {
          setFacilityName("Fasilitas tidak dikenal")
          setLocation("Lokasi tidak tersedia")
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [isInvalidId, complaintId, retryKey])

  // Kewenangan actions di frontend hanya untuk menyembunyikan tombol yang
  // memang tidak akan bisa dipakai; penolakan sesungguhnya tetap ditegakkan
  // backend, jadi ini bukan lapisan keamanan.
  //
  // canDelete sengaja tidak memakai isManager: CanDeleteComplaint di backend
  // menolak staf SELALU, hanya admin boleh menghapus, dan mahasiswa hanya
  // miliknya yang masih PENDING.
  const role = user?.role
  const ownerCanDelete =
    complaint !== null &&
    complaint.reporter === user?.id &&
    complaint.status === "PENDING"
  const canDelete = complaint !== null && (isAdmin(role) || ownerCanDelete)

  const handleSave = async () => {
    setActionError("")
    setActionNotice("")
    setIsSaving(true)

    try {
      const updated = await updateComplaint(complaintId, {
        status: statusDraft,
        priority: priorityDraft,
      })

      // Status di bawah hanya ditampilkan kalau baris ini sempat dieksekusi,
      // artinya server sudah mengembalikan objek hasil PATCH.
      setComplaint(updated)
      setStatusDraft(updated.status)
      setPriorityDraft(updated.priority)
      setActionNotice(
        `Tindak lanjut tersimpan. Status pengaduan kini ${statusLabel(updated.status).toLowerCase()}.`,
      )
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError)
        ? errorMessage(requestError.response?.data)
        : ""

      setActionError(message || "Gagal menyimpan perubahan. Coba lagi.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    // Konfirmasi native dipakai karena repo belum punya Modal (§7.2 design.md)
    // dan menambahkannya hanya untuk satu tombol terlalu besar risikonya.
    if (!window.confirm("Hapus pengaduan ini? Tindakan ini tidak bisa dibatalkan.")) {
      return
    }

    setActionError("")
    setActionNotice("")
    setIsDeleting(true)

    try {
      await deleteComplaint(complaintId)
      navigate("/complaints")
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError)
        ? errorMessage(requestError.response?.data)
        : ""

      setActionError(message || "Gagal menghapus pengaduan. Coba lagi.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/complaints"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Kembali ke Pengaduan
        </Link>

        <p className="eyebrow mb-2">Detail laporan</p>

        <h1 className="page-title">Detail Pengaduan</h1>
      </div>

      {isLoading && !isInvalidId ? (
        <div className="relative space-y-3">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-20 animate-pulse rounded-2xl bg-slate-900/[0.05]"
            />
          ))}

          <p className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle size={26} className="animate-spin text-slate-500" />
          </p>
        </div>
      ) : isInvalidId || notFound ? (
        <div
          role="alert"
          className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-10 text-center"
        >
          <AlertCircle size={30} className="text-red-500" />

          <p className="text-sm font-semibold text-slate-800">
            Pengaduan tidak ditemukan
          </p>

          <p className="max-w-sm text-sm leading-6 text-slate-600">
            Pengaduan yang kamu cari mungkin sudah dihapus atau tautannya
            tidak valid.
          </p>

          <Link to="/complaints" className="btn-secondary mt-2">
            Buka daftar pengaduan
          </Link>
        </div>
      ) : error || !complaint ? (
        <div
          role="alert"
          className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
        >
          <AlertCircle size={30} className="text-red-500" />
          <p>{error || "Gagal memuat pengaduan."}</p>

          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="btn-secondary"
          >
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <Card className="relative overflow-hidden">
            <span className="orb -right-12 -top-12 h-44 w-44 bg-indigo-400/25" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {complaint.title}
                </h2>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} className="text-slate-500" />
                    {facilityName} · {location}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    Dibuat {formatDate(complaint.created_at)}
                  </span>
                </div>
              </div>

              <StatusBadge status={complaint.status} />
            </div>
          </Card>

          {/* image bisa null (tidak diunggah) atau string kosong untuk pengaduan
              lama yang dibuat sebelum field ini ada, jadi dicek truthy.
              resolveMediaUrl mengubah "/media/..." menjadi URL absolut ke
              origin backend; tanpa itu browser akan mencarinya di origin
              frontend dan mendapat 404. */}
          {complaint.image && (
            <Card className="relative overflow-hidden">
              <img
                src={resolveMediaUrl(complaint.image) ?? ""}
                alt={`Foto pengaduan: ${complaint.title}`}
                className="relative w-full rounded-2xl object-cover"
              />
            </Card>
          )}

          <Card className="relative overflow-hidden">
            <span className="orb -bottom-12 -left-10 h-36 w-36 bg-blue-400/20" />

            <div className="relative space-y-5">
              {/* glass-pill, bukan glass-chip: chip itu resep untuk ikon tunggal
                  dalam kotak persegi (display:grid), sedangkan yang di sini baris
                  ikon + teks. */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`glass-pill gap-1.5 px-3 py-1.5 text-xs font-semibold ${priorityTones[complaint.priority]}`}
                >
                  <ClipboardList size={13} />
                  Prioritas {priorityLabels[complaint.priority]}
                </span>

                <span className="glass-pill gap-1.5 border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Diperbarui {formatDate(complaint.updated_at)}
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">
                  Deskripsi
                </h3>

                <p className="mt-2 text-sm leading-7 whitespace-pre-line text-slate-600">
                  {complaint.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Backend hanya mengisi reporter_username untuk role ADMIN, jadi kartu
              ini tidak pernah muncul untuk mahasiswa atau staf. */}
          {complaint.reporter_username && (
            <Card>
              <div className="flex items-center gap-4">
                <span className="glass-chip h-11 w-11 shrink-0 border-white/70 bg-white/65 text-indigo-600">
                  <User size={19} />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Pelapor
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {complaint.reporter_username}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {isManager(role) && (
            <Card className="relative overflow-hidden">
              <span className="orb -right-10 -bottom-16 h-40 w-40 bg-violet-400/20" />

              <div className="relative space-y-5">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-slate-900">
                    Tindak lanjut
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Ubah status dan prioritas pengaduan ini.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="complaint-status"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                    >
                      Status
                    </label>

                    <select
                      id="complaint-status"
                      value={statusDraft}
                      disabled={isSaving}
                      onChange={(event) =>
                        setStatusDraft(event.target.value as Complaint["status"])
                      }
                      className="input-base cursor-pointer"
                    >
                      {COMPLAINT_STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {statusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="complaint-priority"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                    >
                      Prioritas
                    </label>

                    <select
                      id="complaint-priority"
                      value={priorityDraft}
                      disabled={isSaving}
                      onChange={(event) =>
                        setPriorityDraft(
                          event.target.value as Complaint["priority"],
                        )
                      }
                      className="input-base cursor-pointer"
                    >
                      {(
                        Object.keys(priorityLabels) as Complaint["priority"][]
                      ).map((option) => (
                        <option key={option} value={option}>
                          {priorityLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-900/[0.08] pt-5">
                  <button
                    type="button"
                    onClick={handleSave}
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
                        <Save size={17} />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-secondary w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800 sm:mr-auto sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Hapus pengaduan
                  </>
                )}
              </button>
            )}

            <Link to="/complaints" className="btn-secondary w-full sm:w-auto">
              Kembali ke Daftar
            </Link>
          </div>

          {/* Satu panel error untuk kedua aksi (simpan dan hapus), jadi
              alasannya tidak pernah hilang saat panel tindak lanjut tidak ada. */}
          {actionError && (
            <div
              role="alert"
              aria-live="polite"
              className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            >
              <TriangleAlert size={17} className="mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Kebalikan dari actionError: hanya muncul setelah server mengonfirmasi
              PATCH dan state lokal sudah diperbarui dari respons itu. */}
          {actionNotice && (
            <div
              role="status"
              aria-live="polite"
              className="alert-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            >
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ComplaintDetail
