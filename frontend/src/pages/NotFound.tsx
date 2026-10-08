import { ArrowLeft, Compass, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="orb -left-24 top-10 h-88 w-88 bg-blue-500/35" />
      <div className="orb -right-28 bottom-0 h-88 w-88 bg-violet-500/30" />
      <div className="orb left-1/2 top-[-7rem] h-80 w-80 -translate-x-1/2 bg-pink-400/28" />
      <div className="orb bottom-[8%] left-[16%] h-72 w-72 bg-amber-300/25" />

      <div className="relative w-full max-w-lg">
        <div className="glass-panel relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-10">
          <span className="orb -right-16 -top-20 h-56 w-56 bg-indigo-400/25" />
          <span className="orb -bottom-20 -left-16 h-56 w-56 bg-cyan-400/20" />

          <div className="relative">
            <span className="glass-chip mx-auto h-16 w-16 rounded-2xl border-white/70 bg-white/65 text-indigo-600">
              <Compass size={26} />
            </span>

            <p className="eyebrow mt-6">Error 404</p>

            <p className="mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
              404
            </p>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Halaman tidak ditemukan
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
              Periksa kembali tautan atau kembali ke dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/dashboard" className="btn-primary w-full sm:w-auto">
                <LayoutDashboard size={17} />
                Kembali ke Dashboard
              </Link>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary w-full sm:w-auto"
              >
                <ArrowLeft size={17} />
                Halaman sebelumnya
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-ambient">
          © 2026 CampusCare
        </p>
      </div>
    </div>
  );
}

export default NotFound;
