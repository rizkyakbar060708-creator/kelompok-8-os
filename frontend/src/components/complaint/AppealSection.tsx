import {
  CheckCircle2,
  FileImage,
  Gavel,
  ImageUp,
  LoaderCircle,
  Send,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import axios from "axios"

import Modal from "../ui/Modal"
import Card from "../ui/Card"
import { useAuth } from "../../contexts/AuthContext"
import {
  createAppeal,
  getComplaintAppeals,
  type Appeal,
} from "../../services/appealService"
import {
  SENSITIVE_IMAGE_SUB_CATEGORIES,
  type Complaint,
} from "../../services/complaintService"
import { formatDate } from "../../utils/complaintStats"
import { errorMessage } from "../../utils/errorMessage"
import { resolveMediaUrl } from "../../utils/media"
import { APPEAL_STATUS_CONFIG, type AppealStatus } from "../../utils/appealConfig"

const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_EVIDENCE_SIZE_MB = MAX_EVIDENCE_SIZE_BYTES / (1024 * 1024)

// Badge gaya satu-satunya tetap mengikuti StatusBadge (design.md §7.4): latar
// opak, radius penuh, px-3 py-1, text-xs font-semibold. Tidak memakai komponen
// StatusBadge karena enum banding berbeda dari enum status pengaduan.
function AppealBadge({ status }: { status: AppealStatus }) {
  const config = APPEAL_STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClassName}`}
    >
      {config.label}
    </span>
  )
}

interface AppealSectionProps {
  complaint: Complaint
}

function AppealSection({ complaint }: AppealSectionProps) {
  const { user } = useAuth()

  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [appealsLoading, setAppealsLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [evidence, setEvidence] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  // Error di luar modal: gagal memuat riwayat banding. Error pengiriman dari
  // dalam modal masuk formError, mengikuti pola LostFound: error aksi modal
  // tampil di dalam modalnya masing-masing.
  const [actionError, setActionError] = useState("")
  // Notice sukses di isi hanya setelah server membalas 201 dan riwayat banding
  // sudah dimuat ulang, supaya "berhasil" tidak pernah tampil untuk pengiriman
  // yang gagal diam-diam.
  const [actionNotice, setActionNotice] = useState("")

  // Satu input file untuk seumur komponen (pola CreateComplaint): kalau input
  // ikut di dalam cabang render, begitu file dipilih picker tidak bisa dibuka
  // lagi tanpa menghapus file lama dulu.
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => fileInputRef.current?.click()

  // Owner dipakai di banyak kondisi: tombol banding, larangan foto
  // PENCURIAN/PELECEHAN_PERUNDUNGAN hanya berlaku bagi pelapor sensitifnya
  // sendiri, dan penolakan 403 dari backend.
  const isOwner = complaint.reporter === user?.id

  // Foto tidak dibolehkan untuk dua sub-kategori pengaduan sensitif; backend
  // menolak lampiran dengan validasi, jadi field-nya disembunyikan sejak awal.
  const evidenceHidden = SENSITIVE_IMAGE_SUB_CATEGORIES.includes(
    complaint.sub_category ?? "",
  )

  useEffect(() => {
    // Hanya pemilik laporan yang perlu riwayat banding; staff/admin yang
    // melihat detail mahasiswa tidak memicu request, dan panelnya sendiri
    // tidak dirender untuk mereka (return null sebelum markup).
    if (!isOwner) {
      return
    }

    let active = true

    const load = async () => {
      try {
        const data = await getComplaintAppeals(complaint.id)

        if (!active) {
          return
        }

        setAppeals(data.items)
        setActionError("")
      } catch {
        if (active) {
          setActionError("Gagal memuat riwayat banding. Coba lagi.")
        }
      } finally {
        if (active) {
          setAppealsLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [complaint.id, isOwner, retryKey])

  // Aturan tampilan tombol: pemilik laporan + status REJECTED + belum ada
  // banding PENDING. Riwayat harus sudah dimuat agar cek banding-PENDING itu
  // benar; tombol tidak dipercayakan pada data yang belum tuntas.
  const canAppeal =
    isOwner &&
    complaint.status === "REJECTED" &&
    !appealsLoading &&
    !appeals.some((appeal) => appeal.status === "PENDING")

  const resetForm = () => {
    setReason("")
    setEvidence(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openForm = () => {
    resetForm()
    setFormError("")
    setFormOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting) {
      return
    }

    setFormOpen(false)
    setFormError("")
  }

  const handleEvidenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // Validasi sisi klien menyamai batas backend (5 MB, PNG/JPEG) supaya file
    // yang pasti ditolak tidak sampai dikirim. Backend memvalidasi ulang.
    if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
      setFormError(
        `Ukuran bukti maksimal ${MAX_EVIDENCE_SIZE_MB} MB. File yang dipilih ` +
          `berukuran ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      )

      event.target.value = ""

      return
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setFormError("Format bukti harus PNG atau JPEG.")

      event.target.value = ""

      return
    }

    setFormError("")
    setEvidence(file)
  }

  const removeEvidence = () => {
    setEvidence(null)

    // Mengosongkan input supaya memilih file yang sama lagi tetap memicu
    // onChange, dan supaya file lama tidak ikut terkirim saat form di-submit.
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // required HTML melayani browser, tetapi trim dulu: isian berisi spasi
    // saja lolos validasi bawaan padahal tidak masuk akal sebagai alasan.
    if (!reason.trim()) {
      setFormError("Alasan banding wajib diisi.")
      return
    }

    setFormError("")
    setIsSubmitting(true)

    try {
      await createAppeal(complaint.id, {
        reason: reason.trim(),
        evidence,
      })

      // Rule alur: setelah aksi sukses muat ulang data banding. Muat ulang
      // lewat retryKey, satu pintu dengan muat awal.
      setRetryKey((key) => key + 1)
      setFormOpen(false)
      resetForm()
      setActionError("")
      setActionNotice("Banding berhasil dikirim. Menunggu pemeriksaan admin.")
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        const message =
          errorMessage(requestError.response?.data) ??
          "Gagal mengirim banding. Coba lagi."

        setFormError(message)
      } else {
        setFormError("Tidak dapat terhubung ke server.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOwner) {
    return null
  }

  return (
    <Card className="relative overflow-hidden">
      <span className="orb -right-12 -top-12 h-40 w-40 bg-amber-300/20" />

      <div className="relative space-y-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            Banding
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {complaint.status === "REJECTED"
              ? "Laporan ini ditolak. Jika kamu tidak setuju, ajukan banding agar admin memeriksa ulang."
              : "Riwayat banding yang pernah kamu ajukan untuk laporan ini."}
          </p>
        </div>

        {canAppeal && (
          <button
            type="button"
            onClick={openForm}
            className="btn-primary w-full sm:w-auto"
          >
            <Gavel size={17} />
            Ajukan Banding
          </button>
        )}

        {actionError && (
          <div
            role="alert"
            aria-live="polite"
            className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
            <span className="flex-1">{actionError}</span>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="shrink-0 self-center text-sm font-semibold text-indigo-600 underline-offset-2 hover:text-violet-700 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        )}

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

        {appealsLoading ? (
          <div className="flex items-center justify-center gap-3 py-6">
            <LoaderCircle size={20} className="animate-spin text-slate-500" />
            <p className="text-sm text-slate-600">Memuat riwayat banding...</p>
          </div>
        ) : !actionError ? (
          appeals.length === 0 ? (
            <p className="text-sm text-slate-500">
              Belum ada banding untuk laporan ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-900/[0.07]">
              {appeals.map((appeal) => {
                const evidenceUrl = resolveMediaUrl(appeal.evidence)

                return (
                  <li key={appeal.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 whitespace-pre-line text-slate-600">
                          {appeal.reason}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Diajukan {formatDate(appeal.created_at)}
                          {appeal.reviewed_at
                            ? ` · Diputuskan ${formatDate(appeal.reviewed_at)}`
                            : ""}
                          {appeal.reviewer_name
                            ? ` oleh ${appeal.reviewer_name}`
                            : ""}
                        </p>
                      </div>

                      <AppealBadge status={appeal.status} />
                    </div>

                    {/* evidence adalah path "/media/..." tanpa host; tanpa
                        resolveMediaUrl() browser mencarinya di origin frontend
                        dan mendapat 404 (pola foto pengaduan di atas). */}
                    {evidenceUrl && (
                      <img
                        src={evidenceUrl}
                        alt={`Bukti banding: ${appeal.complaint_title}`}
                        className="mt-3 block max-h-56 w-full rounded-xl object-cover sm:max-w-xs"
                      />
                    )}

                    {/* Catatan admin hanya muncul setelah banding diputuskan;
                        keputusan itu sendiri cukup dibaca dari badge status. */}
                    {appeal.response_note && (
                      <div className="mt-3 text-sm leading-6 text-slate-600">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Catatan admin
                        </span>
                        <span className="whitespace-pre-line">
                          {appeal.response_note}
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )
        ) : null}

        <Modal open={formOpen} onClose={closeForm} title="Ajukan Banding">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Jelaskan alasan keberatanmu atas keputusan penolakan ini. Banding
              akan diperiksa oleh administrator.
            </p>

            <div>
              <label
                htmlFor="appeal-reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Alasan Banding
              </label>

              <textarea
                id="appeal-reason"
                rows={4}
                className="input-base resize-none"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Jelaskan mengapa laporan ini seharusnya ditindaklanjuti..."
                required
                aria-invalid={Boolean(formError && !reason.trim())}
              />
            </div>

            {/* Input file ke luar cabang render supaya ref-nya tetap hidup
                saat upload disembunyikan (aturan yang sama dengan
                CreateComplaint). */}
            <input
              id="appeal-evidence"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleEvidenceChange}
              className="hidden"
            />

            {evidenceHidden ? (
              <p className="text-xs leading-6 text-slate-600">
                Laporan kategori ini tidak mengizinkan foto, jadi banding
                dikirim tanpa bukti gambar.
              </p>
            ) : !evidence ? (
              <button
                type="button"
                onClick={openPicker}
                className="glass-well flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl p-6 text-center"
              >
                <span className="glass-chip mb-3 h-11 w-11 border-white/70 bg-white/70 text-indigo-600">
                  <Upload size={19} />
                </span>

                <p className="text-sm font-semibold text-slate-800">
                  Upload bukti gambar
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PNG atau JPG, maksimal {MAX_EVIDENCE_SIZE_MB} MB. Opsional.
                </p>
              </button>
            ) : (
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/70 text-indigo-600">
                    <FileImage size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {evidence.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {(evidence.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openPicker}
                    className="btn-secondary shrink-0 gap-1.5 px-3 py-2 text-xs"
                  >
                    <ImageUp size={15} />
                    Ganti
                  </button>

                  <button
                    type="button"
                    onClick={removeEvidence}
                    aria-label="Hapus bukti gambar"
                    className="icon-button icon-button-danger shrink-0 p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                aria-live="polite"
                className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              >
                <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  // Batal memakai jalur sama dengan klik di luar dialog:
                  // pengiriman yang sedang berjalan tidak boleh dibatalkan.
                  if (!isSubmitting) {
                    setFormOpen(false)
                  }
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Kirim Banding
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Card>
  )
}

export default AppealSection
