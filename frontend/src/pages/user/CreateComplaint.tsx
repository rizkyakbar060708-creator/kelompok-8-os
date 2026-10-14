import {
  ArrowLeft,
  FileImage,
  ImageUp,
  LoaderCircle,
  Send,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

import { createComplaint } from "../../services/complaintService"
import { getFacilities, type Facility } from "../../services/facilityService"

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)

// location tersimpan sebagai "Gedung A - Lantai 3". Dipisah supaya daftar
// bisa dikelompokkan per gedung lewat optgroup, dan opsi di dalam grup tidak
// perlu mengulang nama gedungnya.
function splitLocation(location: string) {
  const [building, ...rest] = location.split(" - ")

  return {
    building: building.trim() || location,
    floor: rest.join(" - ").trim(),
  }
}

function groupByBuilding(facilities: Facility[]) {
  const groups = new Map<string, Facility[]>()

  for (const facility of facilities) {
    const { building } = splitLocation(facility.location)

    const current = groups.get(building)

    if (current) {
      current.push(facility)
    } else {
      groups.set(building, [facility])
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "id"))
    .map(([building, items]) => [
      building,
      [...items].sort((a, b) => a.name.localeCompare(b.name, "id")),
    ]) as [string, Facility[]][]
}

function CreateComplaint() {
  const navigate = useNavigate()

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityId, setFacilityId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Satu input file untuk seumur component, tidak dimount ulang tiap kali
  // cabang tampilan foto berubah. Kalau input ikut di dalam cabang !image,
  // begitu foto dipilih tidak ada yang bisa memicu picker lagi, jadi mengganti
  // foto berarti harus hapus dulu.
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => fileInputRef.current?.click()

  const facilityGroups = useMemo(
    () => groupByBuilding(facilities),
    [facilities],
  )

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getFacilities()

        if (active) {
          setFacilities(data)
        }
      } catch {
        if (active) {
          setError("Gagal memuat daftar fasilitas.")
        }
      } finally {
        if (active) {
          setIsLoadingFacilities(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  // Disimpan di ref, bukan state, supaya revoke saat unmount membaca nilai
  // terbaru. Effect ini hanya berdeps kosong, jadi saat StrictMode memanggil
  // cleanup lalu setup ulang di mount awal, ref masih kosong dan tidak ada
  // blob yang ikut ter-revoke. Foto dipilih setelah mount selesai.
  const previewRef = useRef("")

  const releasePreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = ""
      setPreview("")
    }
  }

  // createObjectURL mengembalikan blob URL yang harus di-revoke. Kalau tidak,
  // tiap penggantian foto menambah blob yang menggantung sampai tab ditutup.
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = ""
      }
    }
  }, [])

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // Dicek di frontend supaya tidak perlu mengunggah file yang pasti ditolak.
    // Backend tetap memvalidasi ulang karena batas di sini bisa dilewati.
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(
        `Ukuran foto maksimal ${MAX_IMAGE_SIZE_MB} MB. File yang dipilih ` +
          `berukuran ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      )

      event.target.value = ""

      return
    }

    if (
      file.type !== "image/png" &&
      file.type !== "image/jpeg"
    ) {
      setError("Format foto harus PNG atau JPEG.")

      event.target.value = ""

      return
    }

    setError("")
    releasePreview()

    const url = URL.createObjectURL(file)

    previewRef.current = url
    setPreview(url)
    setImage(file)
  }

  const removeImage = () => {
    releasePreview()
    setImage(null)

    // Mengosongkan input supaya memilih file yang sama lagi tetap memicu
    // onChange, dan supaya file lama tidak ikut terkirim kalau form di-submit.
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError("")
    setLoading(true)

    try {
      await createComplaint({
        facility: Number(facilityId),
        title: title.trim(),
        description: description.trim(),
        image,
      })

      navigate("/complaints")
    } catch (requestError: unknown) {
      const response = axios.isAxiosError(requestError)
        ? requestError.response
        : undefined

      if (!response) {
        setError("Tidak dapat terhubung ke server.")
      } else if (response.status === 401) {
        setError("Sesi kamu habis. Silakan masuk kembali.")
      } else if (response.status === 400) {
        const data = response.data as Record<string, string[] | undefined>

        setError(data.image?.[0] ?? data.facility?.[0] ?? "Data tidak valid.")
      } else {
        setError("Terjadi kesalahan pada server.")
      }
    } finally {
      setLoading(false)
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

        <p className="eyebrow mb-2">Laporan baru</p>

        <h1 className="page-title">Buat Pengaduan</h1>

        <p className="page-subtitle">
          Laporkan masalah fasilitas yang kamu temukan.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="glass-panel relative overflow-hidden space-y-6 rounded-3xl p-6 sm:p-8"
      >
        <span className="orb -right-20 -top-20 h-56 w-56 bg-indigo-400/25" />

        <div className="relative grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Judul Pengaduan
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: AC Ruang 301 Rusak"
              className="input-base"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="facility"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Fasilitas Bermasalah
            </label>

            <select
              id="facility"
              name="facility"
              className="input-base cursor-pointer"
              required
              value={facilityId}
              onChange={(event) => setFacilityId(event.target.value)}
              disabled={isLoadingFacilities || facilityGroups.length === 0}
            >
              <option value="" disabled>
                {isLoadingFacilities
                  ? "Memuat fasilitas..."
                  : "Pilih fasilitas"}
              </option>

              {facilityGroups.map(([building, items]) => (
                <optgroup key={building} label={building}>
                  {items.map((facility) => {
                    const { floor } = splitLocation(facility.location)

                    return (
                      <option key={facility.id} value={facility.id}>
                        {floor ? `${facility.name} - ${floor}` : facility.name}
                      </option>
                    )
                  })}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Deskripsi
          </label>

          <textarea
            id="description"
            name="description"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Jelaskan masalah fasilitas secara detail..."
            className="input-base resize-none"
            required
          />
        </div>

        <div className="relative">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Foto Fasilitas
          </span>

          {/* Satu input untuk seumur component, dipicu lewat openPicker(). */}
          <input
            id="image"
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleImageChange}
            className="hidden"
          />

          {!image ? (
            <button
              type="button"
              onClick={openPicker}
              className="glass-well flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl p-8 text-center"
            >
              <span className="glass-chip mb-3 h-11 w-11 border-white/70 bg-white/70 text-indigo-600">
                <Upload size={19} />
              </span>

              <p className="text-sm font-semibold text-slate-800">
                Upload foto
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PNG atau JPG, maksimal {MAX_IMAGE_SIZE_MB} MB. Opsional.
              </p>
            </button>
          ) : (
            <div className="glass-card overflow-hidden rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/70 text-indigo-600">
                  <FileImage size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {image.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(image.size / 1024).toFixed(1)} KB
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
                  onClick={removeImage}
                  aria-label="Hapus foto"
                  className="icon-button icon-button-danger shrink-0 p-2"
                >
                  <X size={18} />
                </button>
              </div>

              {/* aspect-video menahan tinggi frame apa pun orientasi fotonya,
                  jadi form tidak melompat saat gambar berganti. */}
              {preview && (
                <img
                  src={preview}
                  alt="Pratinjau foto fasilitas"
                  className="mt-4 aspect-video w-full rounded-xl border border-white/60 object-cover shadow-inner"
                />
              )}
            </div>
          )}
        </div>

        <div className="relative flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-6 sm:flex-row sm:justify-end">
          <Link to="/complaints" className="btn-secondary w-full sm:w-auto">
            Batal
          </Link>

          <button
            type="submit"
            disabled={loading || isLoadingFacilities}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send size={17} />
                Kirim Pengaduan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateComplaint
