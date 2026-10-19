import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../../pages/user/Dashboard";
import { ADMIN, STAFF } from "../../utils/roles";

function DashboardRedirector() {
  const { user } = useAuth();

  // Admin bekerja dari dashboard admin, staf bekerja dari daftar pengaduan
  // karena tugasnya menindaklanjuti laporan orang lain, dan mahasiswa tetap di
  // dashboard biasa. Tanpa pengalihan untuk staf, /dashboard menampilkan metrik
  // pengaduan sendiri yang selalu kosong karena ScopedComplaintMixin menyaring
  // queryset untuk role non-pengelola.
  //
  // Item "Dashboard" di sidebar sengaja hanya untuk STUDENT supaya tautannya
  // tidak berbalik ke daftar pengaduan begitu diklik.
  if (user?.role === ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === STAFF) {
    return <Navigate to="/complaints" replace />;
  }

  return <Dashboard />;
}

export default DashboardRedirector;