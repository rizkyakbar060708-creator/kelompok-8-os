import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import api from "../../services/api";
import axios from "axios";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register/", formData);

      navigate("/login");
    } catch (error: unknown) {
      const response = axios.isAxiosError(error) ? error.response : undefined;

      if (response?.data) {
        const data = response.data as Record<string, string[] | undefined>;

        if (data.username) {
          setError(data.username[0]);
        } else if (data.password) {
          setError(data.password[0]);
        } else {
          setError("Registrasi gagal.");
        }
      } else {
        setError("Tidak dapat terhubung ke server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="orb -right-24 top-10 h-88 w-88 bg-violet-500/32" />
      <div className="orb -left-28 bottom-0 h-88 w-88 bg-blue-500/32" />
      <div className="orb left-1/2 top-[-7rem] h-80 w-80 -translate-x-1/2 bg-pink-400/28" />
      <div className="orb bottom-[4%] left-[14%] h-72 w-72 bg-amber-300/25" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="brand-mark mx-auto mb-4 h-12 w-12 rounded-2xl">
            <LockKeyhole size={21} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            CampusCare
          </h1>

          <p className="mt-2 text-sm text-muted-ambient">
            Sistem Pengaduan Fasilitas Kampus
          </p>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <span className="orb -right-20 -top-20 h-56 w-56 bg-blue-400/25" />

          <div className="relative mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Buat Akun
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Daftar untuk menggunakan CampusCare
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="alert-error relative mb-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm">
              <TriangleAlert size={17} className="mt-0.5 shrink-0 text-red-300" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Username
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  required
                  aria-invalid={Boolean(error)}
                  className="input-base py-3 pl-10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  aria-invalid={Boolean(error)}
                  className="input-base py-3 pr-12"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Mendaftarkan...
                </>
              ) : (
                "Daftar"
              )}
            </button>
          </form>

          <p className="relative mt-6 text-center text-sm text-slate-600">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="link-accent"
            >
              Masuk sekarang
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-ambient">
          © 2026 CampusCare
        </p>
      </div>
    </div>
  );
}

export default Register;