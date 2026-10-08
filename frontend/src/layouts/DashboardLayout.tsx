import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  User,
  LogOut,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r bg-white p-4">
        <h1 className="mb-8 text-xl font-bold">
          Pengaduan Fasilitas
        </h1>

        <nav className="flex-1 space-y-2">
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
        </nav>

        <div className="border-t pt-4">
          {user && (
            <div className="mb-3 px-3">
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;