import { ArrowLeft, Upload, X } from "lucide-react"
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
      {/* Header */}
      <div>
        <Link
          to="/complaints"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Kembali ke Pengaduan
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">
          Buat Pengaduan
        </h1>

        <p className="mt-1 text-gray-500">
          Laporkan masalah fasilitas yang kamu temukan.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Judul Pengaduan
          </label>

          <input
            id="title"
            name="title"
            type="text"
            placeholder="Contoh: AC Ruang 301 Rusak"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Kategori
          </label>

          <select
            id="category"
            name="category"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Pilih kategori
            </option>

            <option value="electricity">
              Listrik
            </option>

            <option value="water">
              Air
            </option>

            <option value="ac">
              AC
            </option>

            <option value="facility">
              Fasilitas
            </option>

            <option value="internet">
              Internet
            </option>

            <option value="other">
              Lainnya
            </option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Lokasi
          </label>

          <input
            id="location"
            name="location"
            type="text"
            placeholder="Contoh: Gedung A, Ruang 301"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Deskripsi
          </label>

          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Jelaskan masalah fasilitas secara detail..."
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            required
          />
        </div>

        {/* Image */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Foto Fasilitas
          </label>

          {!image ? (
            <label
              htmlFor="image"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-gray-400 hover:bg-gray-50"
            >
              <Upload className="mb-3 h-8 w-8 text-gray-400" />

              <p className="text-sm font-medium text-gray-700">
                Upload foto
              </p>

              <p className="mt-1 text-xs text-gray-500">
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
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Upload size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {image.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {(image.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeImage}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            to="/complaints"
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Kirim Pengaduan
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateComplaint