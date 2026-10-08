import { ArrowLeft, FileImage, Send, Upload, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

function CreateComplaint() {
  const [image, setImage] = useState<File | null>(null)

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (file) {
      setImage(file)
    }
  }

  const removeImage = () => {
    setImage(null)
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    console.log("Form submitted")
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
              placeholder="Contoh: AC Ruang 301 Rusak"
              className="input-base"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Kategori
            </label>

            <select
              id="category"
              name="category"
              className="input-base cursor-pointer"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Pilih kategori
              </option>

              <option value="electricity">Listrik</option>

              <option value="water">Air</option>

              <option value="ac">AC</option>

              <option value="facility">Fasilitas</option>

              <option value="internet">Internet</option>

              <option value="other">Lainnya</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Lokasi
            </label>

            <input
              id="location"
              name="location"
              type="text"
              placeholder="Contoh: Gedung A, Ruang 301"
              className="input-base"
              required
            />
          </div>
        </div>

        <div className="relative">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Deskripsi
          </label>

          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Jelaskan masalah fasilitas secara detail..."
            className="input-base resize-none"
            required
          />
        </div>

        <div className="relative">
          <label
            htmlFor="image"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Foto Fasilitas
          </label>

          {!image ? (
            <label
              htmlFor="image"
              className="glass-well flex cursor-pointer flex-col items-center justify-center rounded-2xl p-8 text-center"
            >
              <span className="glass-chip mb-3 h-11 w-11 border-white/70 bg-white/70 text-indigo-600">
                <Upload size={19} />
              </span>

              <p className="text-sm font-semibold text-slate-800">
                Upload foto
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG, atau JPEG
              </p>

              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="glass-pill flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/70 text-indigo-600">
                  <FileImage size={18} />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {image.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(image.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeImage}
                aria-label="Hapus foto"
                className="icon-button icon-button-danger shrink-0 p-2"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="relative flex flex-col-reverse gap-3 border-t border-slate-900/[0.08] pt-6 sm:flex-row sm:justify-end">
          <Link to="/complaints" className="btn-secondary w-full sm:w-auto">
            Batal
          </Link>

          <button type="submit" className="btn-primary w-full sm:w-auto">
            <Send size={17} />
            Kirim Pengaduan
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateComplaint