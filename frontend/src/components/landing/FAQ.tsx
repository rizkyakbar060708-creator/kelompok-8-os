import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"

interface FAQItem {
  q: string
  a: string
}

const FAQS: readonly FAQItem[] = [
  {
    q: "Bagaimana cara membuat pengaduan?",
    a:
      "Daftar atau masuk ke akun Anda, lalu buka halaman \"Buat Pengaduan\". Isi judul, pilih kategori, tulis deskripsi, dan unggah foto bukti jika diperlukan. Setelah dikirim, pengaduan akan muncul di daftar Anda dengan status Menunggu.",
  },
  {
    q: "Apakah saya bisa memantau status pengaduan?",
    a:
      "Ya. Setiap pengaduan memiliki status — Menunggu, Diproses, Selesai, atau Ditolak — yang dapat Anda pantau kapan saja di halaman daftar dan detail pengaduan Anda.",
  },
  {
    q: "Siapa yang dapat melihat laporan saya?",
    a:
      "Laporan Anda dilihat oleh tim pengelola kampus (administrator dan petugas). Setiap role hanya mengakses data sesuai kewenangannya di backend, sehingga mahasiswa lain tidak dapat melihat pengaduan Anda.",
  },
  {
    q: "Bagaimana jika pengaduan saya ditolak?",
    a:
      "Jika pengaduan ditolak, statusnya berubah menjadi Ditolak dengan catatan dari tim pengelola. Anda dapat membuat pengaduan baru bila perlu menyampaikan informasi tambahan.",
  },
  {
    q: "Apakah laporan keamanan bersifat rahasia?",
    a:
      "Laporan ditangani oleh pihak berwenang kampus, tetapi kami tidak menjamin anonimitas penuh. Identitas pelapor dicatat dalam sistem dan hanya terlihat untuk role Administrator sesuai kebijakan backend.",
  },
]

function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="eyebrow inline-flex items-center justify-center gap-2 sm:justify-center">
            <HelpCircle size={16} className="shrink-0" />
            Pertanyaan umum
          </span>
          <h2 className="page-title mt-2 mb-4">FAQ</h2>
          <p className="page-subtitle">
            Semua jawaban berikut mengacu pada kemampuan sebenarnya di
            CampusCare.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {FAQS.map((item, index) => {
            const isOpen = openId === index
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`

            return (
              <div
                key={item.q}
                className="glass-card overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-white/60 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                  onClick={() =>
                    setOpenId(isOpen ? null : index)
                  }
                >
                  {item.q}
                  {isOpen ? (
                    <ChevronUp size={16} className="shrink-0 text-indigo-600 transition-transform" />
                  ) : (
                    <ChevronDown size={16} className="shrink-0 text-slate-400 transition-transform" />
                  )}
                </button>
                <div
                  id={panelId}
                  hidden={!isOpen}
                  className="px-5 pb-4 text-sm text-slate-600 leading-6"
                >
                  {item.a}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQ
