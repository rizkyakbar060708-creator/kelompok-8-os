import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Bell,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from "lucide-react"
import { useState } from "react"

import { useAuth } from "../contexts/AuthContext"

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home, adminOnly: false },
  { name: "Pengaduan", path: "/complaints", icon: FileText, adminOnly: false },
  { name: "Admin", path: "/admin", icon: ShieldCheck, adminOnly: true },
  { name: "Profil", path: "/profile", icon: User, adminOnly: false },
]

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initial = user?.username?.slice(0, 1).toUpperCase() || "U"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="app-shell relative overflow-x-hidden">
      <div className="orb fixed right-[-9rem] top-[-8rem] h-[28rem] w-[28rem] bg-blue-500/30" />
      <div className="orb fixed bottom-[-10rem] left-[-9rem] h-[26rem] w-[26rem] bg-violet-500/25" />
      <div className="orb fixed left-[42%] top-[22%] h-[22rem] w-[22rem] bg-pink-400/25" />
      <div className="orb fixed right-[18%] bottom-[6%] h-[20rem] w-[20rem] bg-amber-300/25" />
      <div className="orb fixed left-[12%] top-[58%] h-[18rem] w-[18rem] bg-cyan-400/20" />

      {sidebarOpen && (
        <button
          aria-label="Tutup menu navigasi"
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`glass-sidebar fixed inset-y-0 left-0 z-50 flex w-[17.5rem] transform flex-col text-slate-700 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/45 px-5">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="brand-mark h-10 w-10 rounded-xl">
              <ClipboardList size={20} />
            </span>

            <span>
              <span className="block text-[15px] font-bold tracking-tight text-slate-900">
                CampusCare
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Fasilitas Kampus
              </span>
            </span>
          </NavLink>

          <button
            onClick={() => setSidebarOpen(false)}
            className="icon-button p-2 lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>

          <div className="space-y-1.5">
            {navItems
              .filter((item) => !item.adminOnly || user?.role === "ADMIN")
              .map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl border py-3 pl-4 pr-3 text-sm font-medium ${
                        isActive ? "nav-link-active nav-link-accent" : "nav-link"
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.name}
                  </NavLink>
                )
              })}
          </div>
        </nav>

        <div className="glass-card glass-card-hover m-3 rounded-2xl p-3">
          <div className="flex items-center gap-3 px-1 py-1.5">
            <span className="brand-mark h-9 w-9 shrink-0 rounded-xl text-xs font-bold">
              {initial}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.username || "Pengguna"}
              </p>
              <p className="truncate text-xs capitalize text-slate-500">
                {user?.role || "Mahasiswa"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-900"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[17.5rem]">
        <header className="glass-nav sticky top-0 z-30">
          <div className="flex h-[4.5rem] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="icon-button p-2 lg:hidden"
                aria-label="Buka menu"
              >
                <Menu size={21} />
              </button>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Selamat datang, {user?.username || "Pengguna"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pantau fasilitas kampus dengan mudah.
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-900 sm:hidden">
                CampusCare
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="icon-button relative p-2.5" aria-label="Notifikasi">
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.65)]" />
              </button>

              <NavLink
                to="/profile"
                className="hidden items-center gap-2 rounded-xl border border-white/70 bg-white/55 p-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] transition hover:bg-white/80 sm:flex"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/70 bg-white/70 text-[10px] font-bold text-slate-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                  {initial}
                </span>
              </NavLink>
            </div>
          </div>
        </header>

        <main className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
