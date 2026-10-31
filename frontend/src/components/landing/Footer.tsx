import { Link } from "react-router-dom"
import { LockKeyhole } from "lucide-react"

const FOOTER_LINKS: readonly { label: string; href: string }[] = [
  { label: "Beranda", href: "#beranda" },
  { label: "Kategori", href: "#kategori" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "FAQ", href: "#faq" },
]

function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 md:gap-14 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="brand-mark h-7 w-7 rounded-lg">
                <LockKeyhole size={16} />
              </span>
              <span className="font-bold tracking-tight text-slate-900">
                CampusCare
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-6 max-w-xs">
              Platform pengaduan fasilitas kampus yang memudahkan mahasiswa
              menyampaikan masalah dan memantau penanganannya.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-4">
              Navigasi
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-4">
              Akun
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/login"
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Masuk
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Daftar
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/40 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 CampusCare — Sistem Pengaduan Fasilitas Kampus
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
