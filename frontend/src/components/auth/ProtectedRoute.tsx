import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { ACCESS_TOKEN } from "../../constant";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isReady } = useAuth();

  // AuthProvider sudah memanggil /auth/me/ saat app mount, dan services/api.ts
  // menangani refresh token otomatis saat 401. Jadi guard tidak perlu fetch
  // sendiri: cukup tunggu isReady lalu nilai session yang sudah ada.
  if (!isReady) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />

        <p className="text-sm text-slate-600">Memuat halaman...</p>
      </div>
    );
  }

  if (!user || !localStorage.getItem(ACCESS_TOKEN)) {
    return <Navigate to="/login" replace />;
  }

  // Fallback-nya /forbidden, bukan ke halaman yang sedang dibuka. Kalau
  // diarahkan balik ke sini, guard akan dievaluasi ulang dengan hasil yang sama
  // dan menyebabkan infinite redirect loop.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

export default ProtectedRoute;