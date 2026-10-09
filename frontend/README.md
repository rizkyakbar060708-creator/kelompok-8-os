# CampusCare — Frontend

Frontend aplikasi **CampusCare (Sistem Pengaduan Fasilitas Kampus)**.

Dibangun dengan **React 19 + TypeScript + Vite**, menggunakan **Tailwind CSS v4** untuk
styling dengan tema *liquid glass*.

> Dokumentasi lengkap API backend ada di
> [`../backend/README.md`](../backend/README.md). Dokumen ini sengaja **tidak** menyalin
> daftar endpoint — cukup menjelaskan cara frontend berkomunikasi dengan backend.

---

## Daftar Isi

1. [Deskripsi](#1-deskripsi)
2. [Tech Stack](#2-tech-stack)
3. [Cara Install](#3-cara-install)
4. [Menjalankan Development Server](#4-menjalankan-development-server)
5. [Environment Variables](#5-environment-variables)
6. [Struktur Folder](#6-struktur-folder)
7. [Routing](#7-routing)
8. [Authentication Flow](#8-authentication-flow)
9. [JWT](#9-jwt)
10. [Axios / API Service](#10-axios--api-service)
11. [State Management](#11-state-management)
12. [Halaman yang Tersedia](#12-halaman-yang-tersedia)
13. [Role-Based Access](#13-role-based-access)
14. [Design System Liquid Glass](#14-design-system-liquid-glass)
15. [Build Production](#15-build-production)
16. [Integrasi dengan Backend](#16-integrasi-dengan-backend)
17. [Known Issues](#17-known-issues)
18. [Yang Sudah Diperbaiki](#18-yang-sudah-diperbaiki)

---

## 1. Deskripsi

Single-page application (SPA) untuk CampusCare. Bertanggung jawab atas:

- Menampilkan halaman login, register, dan area dashboard.
- Menyimpan dan mengirim token JWT ke backend.
- Menyediakan komponen UI reusable.
- Menyediakan design system liquid glass.

Frontend **tidak memiliki backend sendiri** — seluruh data diambil dari Django REST API
melalui HTTP.

---

## 2. Tech Stack

### Runtime & build

| Technology | Versi | Peran |
| --- | --- | --- |
| React | 19.2 | UI library |
| React DOM | 19.2 | Renderer |
| React Router DOM | 7.18 | Routing |
| TypeScript | ~6.0 | Type safety |
| Vite | 8.3 | Dev server & bundler |

### Styling & ikon

| Technology | Versi | Peran |
| --- | --- | --- |
| Tailwind CSS | 4.3 | Utility-first CSS |
| @tailwindcss/vite | 4.3 | Plugin Tailwind untuk Vite |
| lucide-react | 1.48 | Library ikon SVG |

### Jaringan

| Technology | Versi | Peran |
| --- | --- | --- |
| Axios | 1.20 | HTTP client ke backend |

### Tooling

| Technology | Peran |
| --- | --- |
| ESLint 10 | Linting (`eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) |
| Babel + `@rolldown/plugin-babel` | React Compiler preset |
| TypeScript project references | `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json` |

`jwt-decode` kini **sudah terdaftar** di `package.json` dan `package-lock.json`, jadi
`npm install` di komputer baru cukup untuk menjalankan build.

---

## 3. Cara Install

Prasyarat: **Node.js 20+** dan **npm 10+**.

```bash
cd frontend
npm install
```

Semua dependency tercatat di `package.json`, sehingga `npm install` sudah cukup untuk
build tanpa langkah tambahan.

---

## 4. Menjalankan Development Server

```bash
npm run dev
```

Frontend berjalan di `http://localhost:5173` (port default Vite).

### Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Development server dengan HMR |
| `npm run build` | Type-check (`tsc -b`) lalu build production ke `dist/` |
| `npm run preview` | Menjalankan hasil build secara lokal |
| `npm run lint` | Menjalankan ESLint |

> **Penting:** backend hanya mengizinkan CORS dari `http://localhost:5173`. Jangan
> mengubah port Vite, atau seluruh request API akan diblokir. Catatan: backend
> **tidak** mengizinkan `http://127.0.0.1:5173`, jadi buka frontend lewat
> `localhost`, bukan alamat IP — lihat [§17.6](#176-cors-hanya-mengizinkan-localhost5173).

---

## 5. Environment Variables

Frontend membaca **satu** environment variable:

| Nama | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `VITE_API_URL` | **Ya** | `http://127.0.0.1:8000/api` | Base URL API |

### Cara membuat

Buat file `frontend/.env`:

```env
VITE_API_URL="http://127.0.0.1:8000/api"
```

Atau untuk OS Linux/macOS, `frontend/.env.local`:

```env
VITE_API_URL="http://127.0.0.1:8000/api"
```

### Aturan penting

1. **Harus berakhiran `/api`** — karena endpoint dipanggil relatif terhadap base URL
   (contoh `api.get("/auth/me/")` → `http://127.0.0.1:8000/api/auth/me/`).
2. Wajib berawalan `VITE_`, jika tidak Vite tidak membacanya.
3. File `.env` **tidak di-commit** (sudah masuk `.gitignore`) — setiap developer harus
   membuatnya sendiri.
4. Nilai `VITE_*` akan tertanam di bundle browser. **Jangan menaruh secret di sini.**

Tanpa `VITE_API_URL`, `baseURL` bernilai `undefined` dan seluruh request API akan gagal.

---

## 6. Struktur Folder

```
frontend/
├── index.html                # Entry HTML + definisi SVG filter liquid glass
├── package.json
├── vite.config.ts            # Plugin: react, babel (react compiler), tailwindcss
├── tsconfig.json             # Project references
├── tsconfig.app.json         # Config untuk src/
├── tsconfig.node.json        # Config untuk tooling
├── eslint.config.js
├── .env                      # VITE_API_URL (gitignored)
├── public/                   # Aset statis (favicon.svg)
└── src/
    ├── main.tsx              # Root render: StrictMode > BrowserRouter > AuthProvider > AppRoutes
    ├── App.tsx               # Wrapper tipis yang me-render AppRoutes
    ├── index.css             # Design system liquid glass
    ├── constant.ts           # Key localStorage: ACCESS, REFRESH
    │
    ├── routes/
    │   └── AppRoutes.tsx     # Seluruh definisi route
    │
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.tsx     # POST /auth/login/ + GET /auth/me/
    │   │   └── Register.tsx  # POST /auth/register/
    │   ├── user/
    │   │   ├── Dashboard.tsx       # Ringkasan dari API (filter milik sendiri)
    │   │   ├── Complaints.tsx      # List pengaduan (data hardcoded)
    │   │   ├── CreateComplaint.tsx # Form pengaduan (belum submit ke API)
    │   │   └── Profile.tsx         # Profil user (lewat AuthContext)
    │   ├── admin/
    │   │   └── AdminDashboard.tsx  # Agregat seluruh pengaduan (role ADMIN)
    │   ├── Forbidden.tsx    # 403 — role tidak punya akses
    │   └── NotFound.tsx     # 404
    │
    ├── layouts/
    │   └── DashboardLayout.tsx     # Shell: sidebar + navbar + <Outlet/>
    │
    ├── components/
    │   ├── auth/
    │   │   ├── ProtectedRoute.tsx      # Route guard: sesi + cek role
    │   │   └── DashboardRedirector.tsx # ADMIN → /admin, lainnya dashboard user
    │   ├── complaint/
    │   │   └── ComplaintCard.tsx
    │   └── ui/
    │       ├── Card.tsx            # Glass card wrapper
    │       ├── StatusBadge.tsx     # Pill status pengaduan
    │       └── EmptyState.tsx      # Glass empty state
    │
    ├── contexts/
    │   └── AuthContext.tsx         # Provider user + isReady + refreshUser
    │
    ├── utils/
    │   └── complaintStats.ts       # Agregasi, join facility, format tanggal
    │
    └── services/
        ├── api.ts                  # Axios instance + interceptor request & response
        ├── complaintService.ts     # GET /complaints/
        └── facilityService.ts      # GET /facilities/
```

---

## 7. Routing

Routing dikelola `react-router-dom` v7, dikonfigurasi penuh di
`src/routes/AppRoutes.tsx`.

### Struktur route

| Path | Komponen | Guard | Layout |
| --- | --- | --- | --- |
| `/login` | `Login` | none | none |
| `/register` | `Register` | none | none |
| `/` | redirect → `/dashboard` | sesi | `DashboardLayout` |
| `/dashboard` | `DashboardRedirector` | sesi | `DashboardLayout` |
| `/admin` | `AdminDashboard` | sesi + `ADMIN` | `DashboardLayout` |
| `/complaints` | `Complaints` | sesi | `DashboardLayout` |
| `/complaints/create` | `CreateComplaint` | sesi | `DashboardLayout` |
| `/profile` | `Profile` | sesi | `DashboardLayout` |
| `/forbidden` | `Forbidden` | none | none |
| `*` | `NotFound` | none | none |

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<DashboardRedirector />} />
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminDashboard />
      </ProtectedRoute>
    } />
    <Route path="/complaints" element={<Complaints />} />
    <Route path="/complaints/create" element={<CreateComplaint />} />
    <Route path="/profile" element={<Profile />} />
  </Route>

  <Route path="/forbidden" element={<Forbidden />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

`DashboardLayout` merender `<Outlet />`, sehingga seluruh route di dalamnya tampil di
dalam shell dashboard (sidebar + navbar).

Navigation dilakukan dengan `<NavLink>` di sidebar dan `<Link>` di halaman.

### Kenapa perlu `DashboardRedirector`?

`/dashboard` tidak memakai gate role. Komponen inilah yang memeriksa `user.role`:

```tsx
function DashboardRedirector() {
  const { user } = useAuth();

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
}
```

Dengan begitu `Login.tsx` tetap cukup `navigate("/dashboard")` dan setiap role mendarat
di halaman yang benar.

> **Penting:** fallback `ProtectedRoute` saat role tidak cocok diarahkan ke `/forbidden`,
> **bukan** ke route yang sedang dibuka. Kalau fallback diarahkan balik ke route yang
> sama, guard akan dievaluasi ulang dengan hasil identik dan terjadi infinite redirect
> loop — inilah bug yang membuat dashboard tidak muncul setelah login.

---

## 8. Authentication Flow

### Register

```
User mengisi form
   → Register.tsx: api.post("/auth/register/", { username, password })
   → sukses: navigate("/login")
   → gagal 401/400: tampilkan pesan dari error.response.data
```

Error yang ditangani sudah sesuai dengan format backend
(`data.username[0]` lalu `data.password[0]`).

### Login

```
User mengisi form
   → Login.tsx: api.post("/auth/login/", { username, password })
   → response.data = { access, refresh }
   → localStorage.setItem("ACCESS", access)
   → localStorage.setItem("REFRESH", refresh)
   → await refreshUser()        // GET /auth/me/ → isi AuthContext
   → navigate(user.role === "ADMIN" ? "/admin" : "/dashboard")
```

`refreshUser()` wajib dipanggil sebelum `navigate()` karena `ProtectedRoute` membaca
`user` dari context. Tanpa itu, guard dievaluasi saat `user` masih `null` dan sidebar
menampilkan nama fallback "Pengguna".

### Memuat sesi (saat aplikasi dibuka)

```
AuthProvider mount
   → cek localStorage["ACCESS"]
   → jika tidak ada: isReady = true, user = null (tetap logged out)
   → jika ada: api.get("/auth/me/") → setUser(response.data)
   → jika gagal: hapus ACCESS & REFRESH, user = null
   → selalu: isReady = true
```

Flag `isReady` memungkinkan `ProtectedRoute` membedakan "sedang memuat" dari "tidak
login" — tanpa itu guard akan menampilkan spinner tanpa henti.

### Logout

`AuthContext.logout()` menghapus `ACCESS` dan `REFRESH` dari `localStorage`, lalu
`navigate("/login")`.

> Backend **belum** punya endpoint logout, sehingga pencabutan token hanya di sisi client.

### Route guard

`ProtectedRoute` membaca state dari `AuthContext` dan tidak melakukan request sendiri:

```tsx
if (!isReady) return <Spinner />;

if (!user || !localStorage.getItem(ACCESS_TOKEN)) {
  return <Navigate to="/login" replace />;
}

if (allowedRoles && !allowedRoles.includes(user.role)) {
  return <Navigate to="/forbidden" replace />;
}

return children;
```

Logika decode token dan refresh dipindah ke axios interceptor — lihat
[§10](#10-axios--api-service).

---

## 9. JWT

JWT digunakan di dua tempat:

### Penyimpanan

Key didefinisikan di `src/constant.ts`:

```ts
export const ACCESS_TOKEN = "ACCESS"
export const REFRESH_TOKEN = "REFRESH"
```

Disimpan di `localStorage`.

### Pembacaan token

Dulu `ProtectedRoute` melakukan decode access token untuk mengecek `exp` memakai
`jwt-decode`. **Logika itu sudah dihapus** dan diganti response interceptor axios, karena
pendekatan decode-%40exp selalu satu langkah di belakang — request yang terlanjur terkirim
tetap akan mendapat 401.

### Masa berlaku (dari backend)

| Token | Masa berlaku |
| --- | --- |
| Access | 30 menit |
| Refresh | 7 hari |

Karena access token hanya berlaku 30 menit, `api.ts` memasang response interceptor yang
otomatis mencoba refresh — lihat [§10](#10-axios--api-service). Sesi tidak lagi terputus
setelah 30 menit.

---

## 10. Axios / API Service

Seluruh komunikasi HTTP terpusat di `src/services/api.ts`.

### Request interceptor

```ts
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response interceptor (auto-refresh)

```ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;

      const access = await refreshAccessToken();

      if (access) {
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);   // ulangi request asli
      }

      clearSession();
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);
```

Dua lapis perlindungan mencegah refresh berulang:

| Mekanisme | Fungsi |
| --- | --- |
| Flag `_retried` pada config request | Menandai request yang sudah dicoba refresh, supaya 401 berikutnya tidak memicu percobaan lagi |
| Promise `refreshPromise` bersama | Beberapa request yang gagal bersamaan menunggu **satu** panggilan refresh, bukan*N* panggilan sekaligus |

Request ke `/auth/login/` dan `/auth/refresh/` dikecualikan agar endpoint auth tidak
memicu refresh.

### Service terpisah

| File | Fungsi |
| --- | --- |
| `services/api.ts` | Axios instance + kedua interceptor |
| `services/complaintService.ts` | `getComplaints()` → `GET /complaints/` |
| `services/facilityService.ts` | `getFacilities()` → `GET /facilities/` |

### Pola pemakaian

```ts
import api from "../../services/api";
import { getComplaints } from "../../services/complaintService";

// Relatif terhadap baseURL (sudah berakhiran /api)
const response = await api.get("/auth/me/");
const complaints = await getComplaints();
```

> **Jangan lupa** `baseURL` sudah berakhiran `/api`. Menulis `"/api/complaints/"` akan
> menghasilkan URL ganda `.../api/api/complaints/`.

### Yang masih belum ada

- **Normalisasi error** — setiap halaman membaca bentuk error axios secara manual.

---

## 11. State Management

Tidak memakai Redux, Zustand, atau library state management lain.

State dikelola dengan:

| Jenis | Mekanisme |
| --- | --- |
| State global | `AuthContext` (`src/contexts/AuthContext.tsx`) |
| State server | `useEffect` + Axios |
| State lokal | `useState` di komponen |

### AuthContext

```ts
interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isReady: boolean;
  refreshUser: () => Promise<User | null>;
  login: (user: User) => void;
  logout: () => void;
}
```

| Nilai | Arti |
| --- | --- |
| `user === null, isReady === false` | Sesi masih dicek |
| `user === null, isReady === true` | Tidak login |
| `user !== null` | Sudah login |

`AuthProvider` membungkus seluruh aplikasi di `main.tsx`:

```tsx
<StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
</StrictMode>
```

State di-`AuthContext` **read-only dari sisi komponen halaman** — komponen memakai
`useAuth()` untuk membaca, dan hanya `Login.tsx` yang memanggil `refreshUser()`.

### Local state per halaman

| Komponen | State |
| --- | --- |
| `Login.tsx` | `username`, `password`, `showPassword`, `loading`, `error` |
| `Register.tsx` | `formData`, `showPassword`, `loading`, `error` |
| `Dashboard.tsx` | `rows` (`ComplaintRow[] \| null`), `error` |
| `AdminDashboard.tsx` | `rows` (`ComplaintRow[] \| null`), `error` |
| `Complaints.tsx` | `search`, `statusFilter` |
| `CreateComplaint.tsx` | `image` (`File \| null`) |
| `DashboardLayout.tsx` | `sidebarOpen` |
| `AuthContext.tsx` | `user`, `isReady` |

Pola pada kedua dashboard: `rows === null` berarti **sedang memuat** (tampilkan skeleton),
`rows === []` berarti **memuat selesai tapi kosong** (tampilkan empty state). Keduanya perlu
dibedakan agar tidak menampilkan "belum ada data" saat request masih berjalan.

---

## 12. Halaman yang Tersedia

### `pages/auth/Login.tsx`

Login ke backend. Glass panel dengan input berikon, toggle lihat password, checkbox
"Ingat saya", error state, dan spinner saat submit.

### `pages/auth/Register.tsx`

Registrasi akun baru. Glass panel dengan input berikon, toggle lihat password, error
state, dan spinner saat submit.

### `layouts/DashboardLayout.tsx`

Shell untuk seluruh halaman dashboard. Berisi:

- Sidebar dengan `NavLink` ke Dashboard / Pengaduan / **Admin** / Profil. Item "Admin"
  hanya ditampilkan bila `user.role === "ADMIN"`.
- Navbar sticky dengan menu mobile, notifikasi, dan link ke profil.
- Panel user di footer sidebar dengan tombol keluar.
- Ornamen liquid glass.

### `pages/user/Dashboard.tsx`

Ringkasan pengaduan **milik user yang login**: 3 kartu metrik (total, sedang diproses,
selesai + persentase), daftar pengaduan terbaru, dan call-to-action.

Data diambil dari `GET /complaints/` + `GET /facilities/`, lalu difilter
`reporter === user.id` sebelum dihitung.

> **Filter ini hanya di client.** Backend mengembalikan seluruh pengaduan ke setiap
> pengguna, jadi ini bukan batas keamanan. Lihat [§17.1](#171-filter-pengaduan-hanya-di-client).

### `pages/admin/AdminDashboard.tsx`

Ringkasan **seluruh** pengaduan dari semua pengguna: 4 kartu metrik (total, menunggu,
selesai, ditolak) + daftar terbaru. Hanya dapat diakses role `ADMIN`.

Agregasi dihitung di client dari list penuh karena `GET /api/complaints/stats/` belum
tersedia di backend.

### `pages/user/Complaints.tsx`

Daftar pengaduan dengan pencarian (filter judul) dan filter status, ditambah empty
state.

> **Data masih hardcoded** — array `complaints` di dalam file. Belum memanggil API.

### `pages/user/CreateComplaint.tsx`

Form pembuatan pengaduan: judul, kategori, lokasi, deskripsi, dan unggah foto. Saat ini
`handleSubmit` hanya menjalankan `console.log("Form submitted")` — **belum mengirim ke
backend**.

### `pages/user/Profile.tsx`

Menampilkan data user dari `AuthContext`, kartu informasi (id, username, peran, status),
dan tombol keluar.

### `pages/Forbidden.tsx` dan `pages/NotFound.tsx`

Halaman 403 (role tidak punya akses) dan 404 (route tidak ada). Keduanya mengikuti
pola visual yang sama: `app-shell` + `orb` + `glass-panel` + `eyebrow`.

### Komponen reusable

| Komponen | Fungsi |
| --- | --- |
| `components/ui/Card.tsx` | Wrapper glass card |
| `components/ui/StatusBadge.tsx` | Pill status (`PENDING` / `IN_PROGRESS` / `RESOLVED` / `REJECTED`) |
| `components/ui/EmptyState.tsx` | Tampilan saat daftar kosong |
| `components/complaint/ComplaintCard.tsx` | Kartu pengaduan dengan lokasi, tanggal, dan status |
| `components/auth/ProtectedRoute.tsx` | Route guard sesi + cek role |
| `components/auth/DashboardRedirector.tsx` | Memilih dashboard sesuai role |
| `utils/complaintStats.ts` | Agregasi, join facility, format tanggal & persentase |

---

## 13. Role-Based Access

Frontend **sudah** membedakan tampilan berdasarkan role:

| Role | `/dashboard` | `/admin` | Menu "Admin" |
| --- | --- | --- | --- |
| `STUDENT` | Dashboard user | 403 Forbidden | disembunyikan |
| `STAFF` | Dashboard user | 403 Forbidden | disembunyikan |
| `ADMIN` | redirect → `/admin` | Dashboard admin | tampil |

Cara kerjanya:

1. `ProtectedRoute` menerima prop `allowedRoles` dan membandingkannya dengan `user.role`.
2. Menu sidebar difilter di `DashboardLayout` berdasarkan `adminOnly`.
3. `DashboardRedirector` mengarahkan ADMIN ke `/admin` saat membuka `/dashboard`.

> **Batasnya:** ini hanya pembatasan di sisi client. Backend **belum** punya permission
> berbasis role, sehingga user `STUDENT` tetap bisa memanggil `/api/complaints/{id}/`
> secara langsung dan mengedit pengaduan orang lain. Lihat
> [`../backend/README.md` §8](../backend/README.md) dan
> [`../backend/README.md` §14](../backend/README.md).

---

## 14. Design System Liquid Glass

Tema visual frontend adalah *liquid glass*: permukaan transparan dengan blur, rim
highlight, dan efek refractif di atas latar navy gelap.

### Defined di `src/index.css`

| Class | Peran |
| --- | --- |
| `.app-shell` | Latar aplikasi + gradient radial + grain |
| `.orb` | Cahaya ambient membulat dengan `blur(80px)` |
| `.glass-panel` | Glass container besar (form, panel auth) |
| `.glass-card` | Kartu konten dengan hover lift |
| `.glass-panel-dark` | Glass untuk sidebar |
| `.glass-nav` | Glass untuk navbar |
| `.glass-pill` | Pill transparan (badge, chip) |
| `.glass-chip` | Chip persegi untuk ikon |
| `.glass-well` | Area well untuk dropzone |
| `.brand-mark` | Blok gradien dengan specular cap |
| `.alert-error` | Alert error kontras tinggi |
| `.input-base` | Input glass |
| `.btn-primary` | Tombol utama gradien |
| `.btn-secondary` | Tombol sekunder glass |
| `.icon-button` | Tombol ikon |
| `.link-accent` | Tautan aksen |
| `.eyebrow` | Label kecil di atas judul |
| `.page-title` / `.page-subtitle` | Tipografi halaman |
| `.text-ambient` / `.text-muted-ambient` | Teks di atas latar ambient |

### Refraksi

`index.html` mendefinisikan tiga SVG filter (`liquid-refract`, `liquid-refract-deep`,
`liquid-refract-soft`) yang dipakai lewat
`backdrop-filter: url(#liquid-refract)`. Filter ini membungkus distorsi HALF yang
disembunyikan di balik `@supports` di `index.css` agar browser yang tidak mendukung
tetap mendapat `blur()` biasa.

### Tema

Didefinisikan pada blok `@theme` di `src/index.css`:

| Token | Nilai |
| --- | --- |
| `--color-ink-950` | `#050b16` |
| `--color-ink-900` | `#091324` |
| `--color-ink-800` | `#12233d` |
| `--color-brand-300` | `#a6c0ff` |
| `--color-brand-400` | `#7da7ff` |
| `--color-brand-500` | `#5b7cff` |
| `--color-brand-600` | `#4666e8` |
| `--ease-liquid` | `cubic-bezier(0.22, 1, 0.36, 1)` |

Animasi dikurangi otomatis bila pengguna mengaktifkan `prefers-reduced-motion`.

> Untuk mengatur tampilan, **gunakan class Tailwind yang sudah ada**. Jangan menambahkan
> styling framework baru atau CSS inline per komponen.

---

## 15. Build Production

```bash
npm run build
```

Perintah ini menjalankan dua tahap:

1. `tsc -b` — type-check seluruh project.
2. `vite build` — bundle produksi ke folder `dist/`.

Output:

```
dist/index.html
dist/assets/index-*.js
dist/assets/index-*.css
```

### Pratinjau hasil build

```bash
npm run preview
```

### Catatan

- Folder `dist` sudah masuk `.gitignore`.
- Build berjalan bersih: `npm run build` dan `npm run lint` **tidak menghasilkan error**.

---

## 16. Integrasi dengan Backend

### Ringkasan

Frontend dan backend berjalan sebagai dua proses terpisah, berkomunikasi via HTTP/JSON.

```
Frontend (5173)  ──►  Backend (8000)
     baseURL = http://127.0.0.1:8000/api
```

Endpoint yang **sudah** dipakai frontend:

| Lokasi | Request |
| --- | --- |
| `pages/auth/Register.tsx` | `POST /auth/register/` |
| `pages/auth/Login.tsx` | `POST /auth/login/`, `GET /auth/me/` |
| `contexts/AuthContext.tsx` | `GET /auth/me/` |
| `services/api.ts` | `POST /auth/refresh/` (dijalankan otomatis saat 401) |
| `services/complaintService.ts` | `GET /complaints/` |
| `services/facilityService.ts` | `GET /facilities/` |

Endpoint yang **belum** dipakai, tetapi tersedia di backend dan siap diintegrasikan:

| Modul backend | Endpoint |
| --- | --- |
| Complaints | `POST /api/complaints/`, `GET`/`PUT`/`PATCH`/`DELETE /api/complaints/{id}/` |
| Facilities | `POST /api/facilities/`, `GET`/`PUT`/`PATCH`/`DELETE /api/facilities/{id}/` |

> Daftar endpoint lengkap, request body, dan response ada di
> [`../backend/README.md`](../backend/README.md). Dokumen itu adalah sumber kebenaran.

### Hal yang perlu diperhatikan saat integrasi

1. **`reporter` wajib diisi manual.** Backend tidak mengambil user dari token. Ambil
   `id` dari `GET /auth/me/`, lalu kirim sebagai `reporter` saat membuat pengaduan.

2. **Status sudah cocok dengan backend.**
   Backend dan `StatusBadge` sama-sama memakai `PENDING` / `IN_PROGRESS` / `RESOLVED`
   / `REJECTED`. Tidak perlu pemetaan.

3. **`facility` juga berupa id.** Endpoint pengaduan mengembalikan
   `facility: <id>`, bukan objek. `utils/complaintStats.ts` sudah menangani ini lewat
   `joinFacilities()` yang mencocokkan id dengan `GET /facilities/`.

4. **Upload foto belum didukung.** Field `image` ada di model backend tetapi tidak ada
   di serializer, sehingga `CreateComplaint.tsx` belum bisa mengirim file.

5. **Daftar pengaduan tidak terfilter per user.** `GET /api/complaints/` mengembalikan
   semua pengaduan. Filter di dashboard hanya bersifat tampilan — bukan keamanan.

6. **Gunakan `PATCH` untuk update sebagian field.** `PUT` menggantikan seluruh
   resource dan akan error bila field wajib tidak dikirim.

7. **Semua URL wajib trailing slash.**

8. **Semua URL relatif terhadap `baseURL` yang sudah berisi `/api`.** Jangan menulis
   `/api/...` di path request. Contoh benar:

   ```ts
   api.get("/complaints/");   // → http://127.0.0.1:8000/api/complaints/
   ```

9. **`401` sudah ditangani global** oleh response interceptor di `services/api.ts`.

10. **Route `/complaints/:id` belum terdaftar.** `ComplaintCard.tsx` menautkan ke sana,
    tetapi route belum ada di `AppRoutes.tsx`.

---

## 17. Known Issues

Semua temuan berikut sudah diverifikasi terhadap kode.

### 17.1 Filter pengaduan hanya di client

`GET /api/complaints/` mengembalikan seluruh pengaduan ke setiap pengguna yang
terautentikasi. `Dashboard.tsx` memfilter `reporter === user.id` di browser.

**Dampak:** pengaduan milik orang lain tetap masuk ke browser dan terlihat di
DevTools. Ini bukan access control.

**Perbaikan (backend):** tambahkan scoping di `ComplaintListCreateView.get_queryset()`.

### 17.2 Route `/complaints/:id` belum terdaftar

`ComplaintCard.tsx` menautkan ke `/complaints/{id}`, tetapi route tersebut belum
didefinisikan, sehingga tautan itu berakhir di 404.

**Perbaikan:** daftarkan route-nya di `AppRoutes.tsx` atau ubah tautan.

### 17.3 Upload foto belum terhubung

Field `image` ada di model backend tetapi tidak ada di serializer. UI unggah di
`CreateComplaint.tsx` hanya menyimpan `File` di state lokal, dan `handleSubmit` baru
menjalankan `console.log`.

### 17.4 Halaman Pengaduan dan Buat Pengaduan belum integrasi

`Complaints.tsx` masih memfilter array hardcoded, dan `CreateComplaint.tsx` belum
mengirim ke `POST /api/complaints/`.

### 17.5 `/login` dan `/register` tidak dilindungi

Belum ada `PublicOnlyRoute`, sehingga user yang sudah login tetap bisa membuka kedua
halaman tersebut.

### 17.6 CORS hanya mengizinkan `localhost:5173`

`frontend/.env` memakai `127.0.0.1`, sedangkan backend hanya mengizinkan
`http://localhost:5173`. Buka frontend lewat `http://localhost:5173`, atau tambahkan
origin-nya ke `CORS_ALLOWED_ORIGINS`.

---

## 18. Yang Sudah Diperbaiki

| # | Masalah | Perbaikan |
| --- | --- | --- |
| 1 | `ProtectedRoute` tidak dipakai — dashboard terbuka tanpa token | Dipasang untuk seluruh route area dashboard |
| 2 | `jwt-decode` tidak ada di `package.json` | Ditambahkan ke `package.json` + `package-lock.json` |
| 3 | URL refresh menggandakan `/api` | Dipindah ke interceptor, path `/auth/refresh/` |
| 4 | Infinite redirect loop saat login | Fallback guard → `/forbidden`; `/admin` dipisah dari `/dashboard` |
| 5 | `Login.tsx` tidak mengisi context | Memanggil `refreshUser()` sebelum `navigate()` |
| 6 | Tidak ada refresh otomatis (sesi putus 30 menit) | Response interceptor dengan `_retried` + `refreshPromise` |
| 7 | Dashboard memakai data hardcoded | `GET /complaints/` + `GET /facilities/` |
| 8 | `StatusBadge` tidak cocok dengan backend | Sekarang uppercase, sama dengan backend |
| 9 | `npm run lint` 4 error | Sekarang **0 error** |
| 10 | `index.html` title masih default Vite | Sudah `CampusCare — Sistem Pengaduan Fasilitas Kampus` |

---

## Lihat Juga

| Dokumen | Isi |
| --- | --- |
| [`../README.md`](../README.md) | Dokumentasi utama project |
| [`../backend/README.md`](../backend/README.md) | Dokumentasi lengkap backend dan seluruh endpoint API |