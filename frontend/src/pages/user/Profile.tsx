import { CalendarClock, IdCard, LogOut, ShieldCheck, UserRound } from "lucide-react"
import { useNavigate } from "react-router-dom"

import Card from "../../components/ui/Card"
import { useAuth } from "../../contexts/AuthContext"

function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initial = user?.username?.slice(0, 1).toUpperCase() || "U"

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const details = [
    { label: "ID Pengguna", value: user?.id?.toString() || "-", icon: IdCard },
    { label: "Username", value: user?.username || "-", icon: UserRound },
    { label: "Peran", value: user?.role || "-", icon: ShieldCheck },
    { label: "Status Akun", value: "Aktif", icon: CalendarClock },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="eyebrow mb-2">Akun saya</p>

        <h1 className="page-title">Profil</h1>

        <p className="page-subtitle">Kelola informasi akun CampusCare kamu.</p>
      </div>

      <Card className="relative overflow-hidden">
        <span className="orb -right-12 -top-14 h-44 w-44 bg-violet-400/28" />
        <span className="orb -bottom-12 -left-10 h-36 w-36 bg-cyan-400/22" />

        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <span className="brand-mark h-20 w-20 shrink-0 rounded-3xl text-2xl font-bold">
            {initial}
          </span>

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">
              {user?.username || "Pengguna"}
            </h2>

            <p className="glass-pill mt-1 gap-1.5 border-sky-200 bg-sky-50/95 px-2.5 py-1 text-xs font-semibold capitalize text-sky-800">
              <ShieldCheck size={13} />
              {user?.role || "Mahasiswa"}
            </p>

            <p className="mt-3 text-sm text-slate-600">
              Gunakan informasi ini saat menghubungi pengelola fasilitas.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {details.map((detail) => {
          const Icon = detail.icon

          return (
            <Card key={detail.label}>
              <div className="flex items-center gap-4">
                <span className="glass-chip h-11 w-11 shrink-0 border-white/70 bg-white/65 text-indigo-600">
                  <Icon size={19} />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {detail.label}
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {detail.value}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          Keamanan akun
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          Keluar dari sesi ini pada perangkat yang sedang digunakan.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary mt-5 w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800 sm:w-auto"
        >
          <LogOut size={17} />
          Keluar dari akun
        </button>
      </Card>
    </div>
  )
}

export default Profile