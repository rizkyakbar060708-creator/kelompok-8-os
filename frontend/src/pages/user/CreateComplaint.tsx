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
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"

import { useComplaintSummary } from "../../contexts/ComplaintSummaryContext"
import { createComplaint, getComplaintCategories, SENSITIVE_IMAGE_SUB_CATEGORIES, type ComplaintCategory } from "../../services/complaintService"
import { isComplaintCategory } from "../../utils/categoryConfig"
import { getFacilities, type Facility } from "../../services/facilityService"

// Backend menyimpan title di CharField(max_length=200). Batas yang sama
// dipasang di input supaya kesalahan ketahuan sebelum request dikirim, bukan
// sesudahnya dalam bentuk respons 400.
const MAX_TITLE_LENGTH = 200

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)

// Error 400 dari DRF berbentuk { field: [pesan, ...] }. Kalau hanya field image
// dan facility yang dibaca, pesan untuk title, description, atau
// non_field_errors ikut hilang dan user hanya melihat teks umum padahal
// kesalahan-nya spesifik.
function firstErrorMessage(
  data: Record<string, unknown>,
  fields: string[],
): string | null {
  for (const field of fields) {
    const value = data[field]

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0]
    }

    if (typeof value === "string") {
      return value
    }
  }

  return null
}

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
  const { refresh: refreshSummary } = useComplaintSummary()
  const [searchParams] = useSearchParams()

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [categories, setCategories] = useState<ComplaintCategory[]>([])
  const [facilityId, setFacilityId] = useState("")
  // ?category= dari sidebar "Buat Laporan <kategori>" mengisi nilai awal
  // sekali di initializer (bukan effect supaya tidak menimpa pilihan ulang
  // user). Nilai tidak dikenal di query dulu di-guard isComplaintCategory;
  // kalau absah, kategori dipakai apa adanya.
  const [category, setCategory] = useState<"FASILITAS" | "AKADEMIK" | "KEAMANAN">(() => {
    const queryCategory = searchParams.get("category")
    return isComplaintCategory(queryCategory) ? queryCategory : "FASILITAS"
  })
  const [subCategoryId, setSubCategoryId] = useState("")
  const [incidentLocation, setIncidentLocation] = useState("")
  const [incidentDate, setIncidentDate] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
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

  // Sub-kategori selalu mengikuti kategori aktif; FASILITAS tidak punya.
  const subOptions =
    categories.find((cat) => cat.value === category)?.sub_categories ?? []

  // Upload foto disembunyikan untuk sub-kategori sensitif; media dilayani
  // publik di /media/ tanpa pemeriksaan permission, jadi backend menolaknya.
  const imageHidden = SENSITIVE_IMAGE_SUB_CATEGORIES.includes(subCategoryId)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getFacilities()

        if (active) {
          setFacilities(data.items)
          const targetFacilityId = searchParams.get("facility")
          // Prefill dilakukan hanya setelah fasilitas selesai dimuat di callback async ini,
          // divalidasi ketersediaan id-nya, dan tidak menimpa pilihan user sesudahnya.
          if (targetFacilityId) {
            setFacilityId((prev) => {
              if (!prev && data.items.some((f) => String(f.id) === targetFacilityId)) {
                setCategory("FASILITAS")
                return targetFacilityId
              }
              return prev
            })
          }
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
  }, [searchParams])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await getComplaintCategories()

        if (active) {
          setCategories(data)
        }
      } catch {
        if (active) {
          setError("Gagal memuat kategori pengaduan.")
        }
      } finally {
        if (active) {
          setIsLoadingCategories(false)
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
        // Hanya kategori FASILITAS yang boleh membawa fasilitas.
        facility: category === "FASILITAS" && facilityId ? Number(facilityId) : null,
        category,
        sub_category: subCategoryId || null,
        incident_location: incidentLocation.trim() || null,
        incident_date: incidentDate || null,
        is_anonymous: isAnonymous,
        title: title.trim(),
        description: description.trim(),
        image,
      })

      // Badge sidebar harus ikut naik tanpa reload; refresh dipanggil sebelum
      // navigate supaya sidebar sudah menyegarkan data saat halaman baru
      // terlihat.
      refreshSummary()
      navigate("/complaints")
    } catch (requestError: unknown) {
      const response = axios.isAxiosError(requestError)
        ? requestError.response
        : undefined

      if (!response) {
        setError("Tidak dapat terhubung ke server.")
        return
      }

      if (response.status === 401) {
        setError("Sesi kamu habis. Silakan masuk kembali.")
        return
      }

      if (response.status === 429) {
        setError("Terlalu banyak permintaan. Coba lagi beberapa saat lagi.")
        return
      }

      if (response.status === 400) {
        const data = (response.data ?? {}) as Record<string, unknown>

        setError(
          firstErrorMessage(data, [
            "title",
            "description",
            "category",
            "sub_category",
            "facility",
            "incident_location",
            "incident_date",
            "is_anonymous",
            "image",
            "status",
            "priority",
            "non_field_errors",
            "detail",
          ]) ?? "Data tidak valid.",
        )

        return
      }

      setError("Terjadi kesalahan pada server.")
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
              maxLength={MAX_TITLE_LENGTH}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Kategori Pengaduan
            </label>

            <select
              id="category"
              name="category"
              className="input-base cursor-pointer"
              required
              value={category}
              onChange={(event) => {
                setCategory(
                  event.target.value as "FASILITAS" | "AKADEMIK" | "KEAMANAN"
                )

                // Fasilitas lama tidak boleh terkirim bersama kategori lain;
                // backend menolaknya dengan 400 padahal field fasilitas sudah
                // tidak tampil di layar.
                setFacilityId("")

                // Pilihan sub-kategori milik kategori lama ikut dibuang;
                // pasangan kategori/sub yang salah juga ditolak backend.
                setSubCategoryId("")
              }}
              disabled={isLoadingCategories}
            >
              <option value="" disabled>
                {isLoadingCategories
                  ? "Memuat kategori..."
                  : "Pilih kategori"}
              </option>

              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {category !== "FASILITAS" && (
            <div className="sm:col-span-2">
              <label
                htmlFor="sub-category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sub-Kategori
              </label>

              <select
                id="sub-category"
                name="sub-category"
                className="input-base cursor-pointer"
                required
                value={subCategoryId}
                onChange={(event) => {
                  setSubCategoryId(event.target.value)

                  // Foto yang sudah dipilih juga dibuang: backend menolak
                  // laporan sensitif dengan lampiran.
                  if (SENSITIVE_IMAGE_SUB_CATEGORIES.includes(event.target.value)) {
                    removeImage()
                  }
                }}
                disabled={isLoadingCategories || subOptions.length === 0}
              >
                <option value="" disabled>
                  {isLoadingCategories
                    ? "Memuat sub-kategori..."
                    : "Pilih sub-kategori"}
                </option>

                {subOptions.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>

              {subCategoryId === "PELECEHAN_PERUNDUNGAN" && (
                <p className="mt-2 text-xs text-slate-600">
                  Laporan ini hanya dapat dilihat oleh kamu dan admin. Tidak
                  dapat dilampiri foto.
                </p>
              )}
            </div>
          )}

          {category === "FASILITAS" && (
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
                          {floor
                            ? `${facility.name} - ${floor}`
                            : facility.name}
                        </option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
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
            placeholder={category === "FASILITAS" ? "Jelaskan masalah fasilitas secara detail..." : "Jelaskan masalah secara detail..."}
            className="input-base resize-none"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <label
              htmlFor="incident-location"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Lokasi Kejadian <span className="text-slate-400">(opsional)</span>
            </label>

            <input
              id="incident-location"
              name="incident-location"
              type="text"
              value={incidentLocation}
              onChange={(event) => setIncidentLocation(event.target.value)}
              placeholder="Contoh: Laboratorium Komputer, Gedung C"
              className="input-base"
              maxLength={255}
            />
          </div>

          <div className="relative">
            <label
              htmlFor="incident-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Waktu Kejadian <span className="text-slate-400">(opsional)</span>
            </label>

            {/* Nilai datetime-local sudah berformat ISO 8601 sans detik,
                yang tetap diterima parser DateTimeField backend. */}
            <input
              id="incident-date"
              name="incident-date"
              type="datetime-local"
              value={incidentDate}
              onChange={(event) => setIncidentDate(event.target.value)}
              className="input-base"
            />

            <p className="mt-2 text-xs text-slate-500">
              Waktu kejadian tidak boleh di masa depan.
            </p>
          </div>
        </div>

        <div className="relative">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id="is-anonymous"
              name="is-anonymous"
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />

            <span className="text-sm text-slate-800">
              <span className="font-medium">Kirim sebagai anonim</span>
              <span className="mt-1 block text-xs text-slate-500">
                Identitasmu disembunyikan dari petugas, tetapi tetap tercatat
                dan dapat dilihat oleh admin serta dirimu sendiri.
              </span>
            </span>
          </label>
        </div>

        {/* Input tetap termount meski upload disembunyikan; openPicker()
            dan removeImage() bergantung pada ref ini. */}
        <input
          id="image"
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleImageChange}
          className="hidden"
        />

        {!imageHidden && (
          <div className="relative">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Foto Fasilitas
          </span>

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
        )}

        <div className="relative flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-6 sm:flex-row sm:justify-end">
          <Link to="/complaints" className="btn-secondary w-full sm:w-auto">
            Batal
          </Link>

          <button
            type="submit"
            disabled={loading || isLoadingFacilities || isLoadingCategories}
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