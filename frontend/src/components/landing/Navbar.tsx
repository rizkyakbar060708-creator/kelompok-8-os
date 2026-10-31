import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X, LockKeyhole } from "lucide-react"

interface NavLinkItem {
  href: string
  label: string
}

const PAGE_LINKS: readonly NavLinkItem[] = [
  { href: "#beranda", label: "Beranda" },
  { href: "#kategori", label: "Kategori" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#faq", label: "FAQ" },
]

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="glass-nav sticky top-0 z-30"
      aria-label="Navigasi utama"
    >
      <div className="flex h-[4.5rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="brand-mark h-8 w-8 rounded-xl">
            <LockKeyhole size={18} />
          </span>
          <span className="font-bold tracking-tight text-slate-900">
            CampusCare
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {PAGE_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link to="/login" className="btn-secondary text-sm px-4 py-2">
            Masuk
          </Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">
            Daftar
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="icon-button p-2"
            aria-label="Buka menu navigasi"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[17.5rem] glass-sidebar transform -translate-x-full transition-transform duration-300 lg:hidden">
            <div className="flex h-20 items-center justify-between border-b border-white/45 px-5">
              <span className="font-bold tracking-tight text-slate-900">
                CampusCare
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="icon-button p-2"
                aria-label="Tutup menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-7 space-y-1.5">
              {PAGE_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl border py-3 pl-4 pr-3 text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-indigo-600 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl border py-3 pl-4 pr-3 text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-indigo-600 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full text-sm py-2.5"
                >
                  Daftar
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </nav>
  )
}

export default Navbar
