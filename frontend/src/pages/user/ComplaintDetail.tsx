import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ClipboardList,
  LoaderCircle,
  MapPin,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import axios from "axios"

import StatusBadge from "../../components/ui/StatusBadge"
import Card from "../../components/ui/Card"
import {
  getComplaintDetail,
  type Complaint,
} from "../../services/complaintService"
import { getFacilities } from "../../services/facilityService"
import { formatDate } from "../../utils/complaintStats"
import { resolveMediaUrl } from "../../utils/media"

const priorityLabels: Record<Complaint["priority"], string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
}

function ComplaintDetail() {
  const { id } = useParams()

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

        const facility = facilities.find(
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
              <div className="flex flex-wrap gap-3">
                <span className="glass-chip h-9 items-center gap-2 border-indigo-200 bg-indigo-50/90 px-3 text-xs font-semibold text-indigo-700">
                  <ClipboardList size={14} />
                  Prioritas {priorityLabels[complaint.priority]}
                </span>

                <span className="glass-chip h-9 items-center gap-2 border-slate-200 bg-white/70 px-3 text-xs font-semibold text-slate-600">
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link to="/complaints" className="btn-secondary w-full sm:w-auto">
              Kembali ke Daftar
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default ComplaintDetail
