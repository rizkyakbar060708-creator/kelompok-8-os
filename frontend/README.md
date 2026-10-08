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

> **Catatan:** `jwt-decode` digunakan di `ProtectedRoute.tsx` tetapi **tidak terdaftar** di
> `package.json`. Lihat [§17](#17-known-issues).

---

## 3. Cara Install

Prasyarat: **Node.js 20+** dan **npm 10+**.

```bash
cd frontend
npm install
```

### Yang perlu diketahui

`npm install` saja **belum cukup** untuk build, karena `jwt-decode` tidak tercatat di
`package.json`. Penjelasannya ada di [§17](#17-known-issues).

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
> mengubah port Vite, atau seluruh request API akan diblokir.

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
    │   │   ├── Login.tsx     # POST /auth/login/
    │   │   └── Register.tsx  # POST /auth/register/
    │   └── user/
    │       ├── Dashboard.tsx       # Ringkasan (data hardcoded)
    │       ├── Complaints.tsx      # List pengaduan (data hardcoded)
    │       ├── CreateComplaint.tsx # Form pengaduan (belum submit ke API)
    │       └── Profile.tsx         # Profil user (lewat AuthContext)
    │
    ├── layouts/
    │   └── DashboardLayout.tsx     # Shell: sidebar + navbar + <Outlet/>
    │
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedRoute.tsx  # Penjaga route (belum dipakai, lihat §17)
    │   ├── complaint/
    │   │   └── ComplaintCard.tsx
    │   └── ui/
    │       ├── Card.tsx            # Glass card wrapper
    │       ├── StatusBadge.tsx     # Pill status pengaduan
    │       └── EmptyState.tsx      # Glass empty state
    │
    ├── contexts/
    │   └── AuthContext.tsx         # Provider user + login + logout
    │
    └── services/
        └── api.ts                  # Axios instance + request interceptor
```

---

## 7. Routing

Routing dikelola `react-router-dom` v7, dikonfigurasi penuh di
`src/routes/AppRoutes.tsx`.

### Struktur route

| Path | Komponen | Layout |
| --- | --- | --- |
| `/login` | `Login` | none |
| `/register` | `Register` | none |
| `/dashboard` | `Dashboard` | `DashboardLayout` |
| `/complaints` | `Complaints` | `DashboardLayout` |
| `/complaints/create` | `CreateComplaint` | `DashboardLayout` |
| `/profile` | `Profile` | `DashboardLayout` |

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/complaints" element={<Complaints />} />
    <Route path="/complaints/create" element={<CreateComplaint />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
```

`DashboardLayout` merender `<Outlet />`, sehingga seluruh route di dalamnya tampil di
dalam shell dashboard (sidebar + navbar).

Navigation dilakukan dengan `<NavLink>` di sidebar dan `<Link>` di halaman.

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
   → navigate("/dashboard")
```

> Perhatikan: `Login.tsx` memanggil `navigate("/dashboard")` secara langsung **tanpa**
> memeriksa `AuthContext.login()`. User di-refresh setelah login berarti `AuthContext`
> tetap_null sampai halaman dimuat ulang, sehingga `Profile` bisa menampilkan
> "Pengguna". Ini perilaku yang ada saat ini.

### Memuat sesi (saat aplikasi dibuka)

```
AuthProvider mount
   → cek localStorage["ACCESS"]
   → jika tidak ada: user = null (tetap logged out)
   → jika ada: api.get("/auth/me/") → setUser(response.data)
   → jika gagal: hapus ACCESS & REFRESH, user = null
```

### Logout

`AuthContext.logout()` menghapus `ACCESS` dan `REFRESH` dari `localStorage`, lalu
`navigate("/login")`.

> Backend **belum** punya endpoint logout, sehingga pencabutan token hanya di sisi client.

### Route guard

`ProtectedRoute` dirancang untuk Decode access token, dan jika kedaluwarsa memanggil
refresh. Namun komponen ini **belum dipasang** di `AppRoutes.tsx` — lihat
[§17](#17-known-issues).

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

`ProtectedRoute.tsx` melakukan decode access token untuk mengecek `exp`:

```ts
const decoded = jwtDecode(token);
const tokenExpiration = decoded.exp;

if (tokenExpiration < now) {
    await refreshToken();     // POST /api/auth/refresh/
} else {
    setIsAuthorized(true);
}
```

### Masa berlaku (dari backend)

| Token | Masa berlaku |
| --- | --- |
| Access | 30 menit |
| Refresh | 7 hari |

Karena access token hanya berlaku 30 menit, dan saat ini **tidak ada interceptor refresh
otomatis di `api.ts`**, sesi akan berakhir setelah 30 menit dan user harus login ulang.

---

## 10. Axios / API Service

Seluruh komunikasi HTTP terpusat di `src/services/api.ts`.

```ts
import axios from "axios";
import { ACCESS_TOKEN } from "../constant";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

### Yang sudah ada

- `baseURL` dari `import.meta.env.VITE_API_URL`.
- Request interceptor yang otomatis menyisipkan header
  `Authorization: Bearer <access token>` bila token tersedia.

### Yang belum ada

- **Response interceptor** — tidak ada penanganan otomatis untuk `401`.
- **Retry / refresh otomatis** — token yang kedaluwarsa tidak diperpanjang otomatis.
- **Normalisasi error** — setiap halaman harus membaca bentuk error axios secara manual.

### Pola pemakaian

```ts
import api from "../../services/api";

// Relative terhadap base URL
const response = await api.get("/auth/me/");
await api.post("/auth/login/", { username, password });
```

> **Jangan lupa** `baseURL` sudah berakhiran `/api`. Menulis `"/api/auth/me/"` akan
> menghasilkan URL ganda `.../api/api/auth/me/`.

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
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}
```

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

State di-`AuthContext` **read-only dari sisi komponen halaman** — komponen hanya
memakai `useAuth()`, tidak pernah memanggil `login()` maupun mengubah `user` secara
langsung (selain `Login.tsx` yang memang tidak memanggil `login()` sama sekali).

### Local state per halaman

| Komponen | State |
| --- | --- |
| `Login.tsx` | `username`, `password`, `showPassword`, `loading`, `error` |
| `Register.tsx` | `formData`, `showPassword`, `loading`, `error` |
| `Complaints.tsx` | `search`, `statusFilter` |
| `CreateComplaint.tsx` | `image` (`File \| null`) |
| `DashboardLayout.tsx` | `sidebarOpen` |
| `ProtectedRoute.tsx` | `isAuthorized` (`boolean \| null`) |

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

- Sidebar dengan `NavLink` ke Dashboard / Pengaduan / Profil.
- Navbar sticky dengan menu mobile, notifikasi, dan link ke profil.
- Panel user di footer sidebar dengan tombol keluar.
- Ornamen liquid glass.

### `pages/user/Dashboard.tsx`

Ringkasan: 3 kartu metrik, daftar pengaduan terbaru, dan call-to-action.

> **Data masih hardcoded** — array `metrics` dan `recentComplaints` di dalam file.

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

### Komponen reusable

| Komponen | Fungsi |
| --- | --- |
| `components/ui/Card.tsx` | Wrapper glass card |
| `components/ui/StatusBadge.tsx` | Pill status (`Diajukan`, `Diverifikasi`, `Diproses`, `Selesai`) |
| `components/ui/EmptyState.tsx` | Tampilan saat daftar kosong |
| `components/complaint/ComplaintCard.tsx` | Kartu pengaduan dengan lokasi, tanggal, dan status |
| `components/auth/ProtectedRoute.tsx` | Route guard (belum dipakai) |

---

## 13. Role-Based Access

**Belum ada role-based access control di frontend.**

Fakta yang perlu diketahui:

- `AuthContext` menyimpan `role` dari backend (`STUDENT` / `STAFF` / `ADMIN`).
- `DashboardLayout` membaca `user` untuk menampilkan nama dan role di sidebar, tetapi
  **tidak** melakukan redirect berdasarkan role.
- `ProtectedRoute` tidak memeriksa role sama sekali — hanya memeriksa keberadaan dan
  masa berlaku token.
- Tidak ada menu atau route yang disembunyikan berdasarkan role.

Dengan kata lain, seluruh user yang terautentikasi melihat menu dan halaman yang sama.
Pembatasan role di sisi backend juga belum ada — lihat
[`../backend/README.md`](../backend/README.md) §13 dan §14.

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
- **Build saat ini akan gagal** di lingkungan bersih karena `jwt-decode` tidak
  terdaftar di `package.json`. Lihat [§17](#17-known-issues).
- Menjalankan `npm run lint` menghasilkan 4 error yang sudah ada sebelumnya:
  2 `no-explicit-any` di `Login.tsx` dan `Register.tsx`, serta aturan
  `react-refresh` dan `react-hooks` di `AuthContext.tsx` dan `ProtectedRoute.tsx`.

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
| `pages/auth/Login.tsx` | `POST /auth/login/` |
| `contexts/AuthContext.tsx` | `GET /auth/me/` |
| `components/auth/ProtectedRoute.tsx` | `POST /api/auth/refresh/` ⚠️ URL tidak valid |

Endpoint yang **belum** dipakai, tetapi tersedia di backend dan siap diintegrasikan:

| Modul backend | Endpoint |
| --- | --- |
| Facilities | `GET`/`POST /api/facilities/`, `GET`/`PUT`/`PATCH`/`DELETE /api/facilities/{id}/` |
| Complaints | `GET`/`POST /api/complaints/`, `GET`/`PUT`/`PATCH`/`DELETE /api/complaints/{id}/` |

> Daftar endpoint lengkap, request body, dan response ada di
> [`../backend/README.md`](../backend/README.md). Dokumen itu adalah sumber kebenaran.

### Hal yang perlu diperhatikan saat integrasi

1. **`reporter` wajib diisi manual.** Backend tidak mengambil user dari token. Ambil
   `id` dari `GET /auth/me/`, lalu kirim sebagai `reporter` saat membuat pengaduan.

2. **Status tidak sama dengan frontend.**
   Backend: `PENDING` / `IN_PROGRESS` / `RESOLVED` / `REJECTED`.
   `StatusBadge.tsx` sekarang: `submitted` / `verified` / `in_progress` / `resolved`.
   Perlu pemetaan.

3. **`facility` juga berupa id.** Endpoint pengaduan mengembalikan
   `facility: <id>`, bukan objek. Tampilkan `name` dengan cara mengambil facility
   terpisah, atau map di sisi client.

4. **Upload foto belum didukung.** Field `image` ada di model backend tetapi tidak ada
   di serializer, sehingga `CreateComplaint.tsx` belum bisa mengirim file.

5. **Daftar pengaduan tidak terfilter per user.** `GET /api/complaints/` mengembalikan
   semua pengaduan, bukan milik user yang login saja.

6. **Gunakan `PATCH` untuk update sebagian field.** `PUT` mengggantikan seluruh
   resource dan akan error bila field wajib tidak dikirim.

7. **Semua URL wajib trailing slash.**

8. **Semua URL relatif terhadap `baseURL` yang sudah berisi `/api`.** Jangan menulis
   `/api/...` di path request.

9. **Trailing slash + relative path.** Contoh benar:

   ```ts
   api.get("/complaints/");   // → http://127.0.0.1:8000/api/complaints/
   ```

10. **Tangani `401` secara global.** Tambahkan response interceptor untuk
    memanggil `/auth/refresh/`, atau arahkan user ke login.

---

## 17. Known Issues

Semua temuan berikut sudah diverifikasi terhadap kode.

### 17.1 `jwt-decode` tidak ada di `package.json`

`components/auth/ProtectedRoute.tsx` meng-import `jwt-decode`, tetapi paket ini tidak
terdaftar di `package.json` **maupun** `package-lock.json`. Yang ada hanya di
`node_modules` lokal.

**Dampak:** `npm install` di komputer baru tidak akan memasang `jwt-decode`, sehingga
`npm run build` gagal dengan error modul tidak ditemukan.

**Perbaikan:**

```bash
npm install jwt-decode
```

### 17.2 `ProtectedRoute` belum dipakai

`ProtectedRoute` tidak di-import di `routes/AppRoutes.tsx`, dan `DashboardLayout`
tidak memeriksa `isAuthenticated`.

**Dampak:** membuka `/dashboard` tanpa token **tidak** mengarahkan ke halaman login.
Route dashboard benar-benar terbuka.

### 17.3 URL refresh token menggandakan `/api`

`ProtectedRoute.tsx:29`:

```ts
const res = await api.post("/api/auth/refresh/", { refresh: refreshToken });
```

Dikombinasikan dengan `baseURL` yang berakhiran `/api`, URL akhirnya:

```
http://127.0.0.1:8000/api/api/auth/refresh/   ← tidak valid
```

Seharusnya `api.post("/auth/refresh/", ...)`. Saat ini belum efek karena
`ProtectedRoute` belum dipakai.

### 17.4 `Login.tsx` tidak memanggil `AuthContext.login()`

Setelah login berhasil, `Login.tsx` hanya menyimpan token dan `navigate("/dashboard")`.
`user` pada `AuthContext` tetap `null` sampai halaman dimuat ulang, sehingga `Profile`
dan sidebar dapat menampilkan nama fallback "Pengguna".

### 17.5 Tidak ada refresh token otomatis

Access token berlaku 30 menit, dan `api.ts` tidak punya response interceptor. Setelah 30
menit semua request gagal `401` dan user harus login ulang.

### 17.6 Halaman masih memakai data contoh

`Dashboard.tsx`, `Complaints.tsx`, dan `CreateComplaint.tsx` belum memanggil API.
`Complaints.tsx` melakukan filter di atas array hardcoded.

### 17.7 Status pengaduan tidak sinkron dengan backend

`StatusBadge.tsx` memakai status `submitted` / `verified` / `in_progress` /
`resolved`, sedangkan backend memakai `PENDING` / `IN_PROGRESS` / `RESOLVED` /
`REJECTED`.

### 17.8 `index.html` masih memakai `<title>frontend</title>`

Title halaman masih default Vite, belum diubah menjadi nama aplikasi.

---

## Lihat Juga

| Dokumen | Isi |
| --- | --- |
| [`../README.md`](../README.md) | Dokumentasi utama project |
| [`../backend/README.md`](../backend/README.md) | Dokumentasi lengkap backend dan seluruh endpoint API |