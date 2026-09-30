import { NavLink, Outlet } from "react-router-dom"
import {
  Home,
  FileText,
  User,
  LogOut,
} from "lucide-react"

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-r bg-white p-4">
        <h1 className="mb-8 text-xl font-bold">
          Pengaduan Fasilitas
        </h1>

        <nav className="space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <Home size={20} />
            Dashboard
          </NavLink>

          <NavLink
            to="/complaints"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <FileText size={20} />
            Pengaduan
          </NavLink>

          <NavLink
            to="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <User size={20} />
            Profil
          </NavLink>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100">
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout