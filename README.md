# CampusCare

**Sistem Pengaduan Fasilitas Kampus**

Aplikasi web untuk menerima, memantau, dan mengelola laporan kerusakan fasilitas
kampus. Mahasiswa mengirim pengaduan, pengelola fasilitas menindaklanjuti, dan status
per laporan dapat dilacak.

Project ini terdiri dari dua bagian yang berjalan terpisah:

| Bagian | Technology | Lokasi |
| --- | --- | --- |
| Backend API | Django REST Framework + JWT | [`backend/`](backend/) |
| Frontend | React + TypeScript + Vite | [`frontend/`](frontend/) |

---

## Daftar Isi

1. [Deskripsi](#1-deskripsi)
2. [Tujuan Project](#2-tujuan-project)
3. [Fitur Utama](#3-fitur-utama)
4. [Tech Stack](#4-tech-stack)
5. [Struktur Project](#5-struktur-project)
6. [Arsitektur](#6-arsitektur)
7. [Prasyarat](#7-prasyarat)
8. [Menjalankan Project](#8-menjalankan-project)
9. [Environment Variables](#9-environment-variables)
10. [Authentication](#10-authentication)
11. [Status Integrasi](#11-status-integrasi)
12. [Dokumentasi Lainnya](#12-dokumentasi-lainnya)
13. [Known Issues](#13-known-issues)
14. [Contributor](#14-contributor)
15. [Yang Sudah Diperbaiki](#15-yang-sudah-diperbaiki)

---

## 1. Deskripsi

CampusCare adalah aplikasi pengaduan fasilitas kampus dengan dua actor utama:

- **Mahasiswa** — melihat fasilitas, mengirim pengaduan, memantau status pengaduannya.
- **Pengelola / Staff** — menangani pengaduan yang masuk dan memperbarui statusnya.
- **Administrator** — memantau seluruh pengaduan dari semua pengguna lewat dashboard khusus.

Data inti yang dimodelkan:

- **Fasilitas** — data master fasilitas yang dapat dilaporkan (AC, lampu, keran air, dsb.).
- **Pengaduan** — laporan kerusakan yang merujuk ke satu fasilitas dan satu pelapor.
- **Akun** — user dengan atribut `role` (`STUDENT`, `STAFF`, `ADMIN`).

Frontend menggunakan desain **liquid glass** (glassmorphism dengan transparansi,
refleksi, dan efek refractif) di atas latar navy gelap.

---

## 2. Tujuan Project

- Menyediakan satu tempat terpusat untuk melaporkan kerusakan fasilitas kampus.
- Memudahkan pelacakan status pengaduan dari dilaporkan hingga selesai.
- Memberikan data fasilitas yang terstruktur sebagai dasar pengaduan.
- Menjaga pemisahan hak akses antara berbagai role pengguna.

> **Catatan:** pembatasan hak akses berbasis role **baru ada di sisi frontend** (route
> `/admin` dan disembunyikan di navigasi). Di sisi backend, `role` masih disimpan sebagai
> data dan **belum membatasi akses endpoint** mana pun — filter "pengaduan saya" di
> dashboard user dijalankan di browser, bukan di server. Lihat
> [§13](#13-known-issues).

---

## 3. Fitur Utama

### Yang sudah tersedia di backend

- Registrasi akun baru (role dipaksa `STUDENT`).
- Login menggunakan JWT, menghasilkan **access token** dan **refresh token**.
- Refresh access token dengan rotasi refresh token.
- Mengambil data user yang sedang login (`/api/auth/me/`).
- CRUD lengkap untuk **fasilitas**: list, create, retrieve, update, delete.
- CRUD lengkap untuk **pengaduan**: list, create, retrieve, update, delete.
- Django admin (`/admin/`) untuk mengelola data secara manual.

### Yang sudah tersedia di frontend

- Halaman **Login** dan **Register** yang terhubung langsung ke backend API.
- Layout dashboard dengan sidebar dan navbar responsif.
- Halaman **Dashboard** dengan kartu ringkasan dan daftar pengaduan terbaru, **terhubung
  ke API** dan dihitung dari data nyata.
- Halaman **Dashboard Admin** khusus role `ADMIN` dengan agregat seluruh pengaduan.
- Routing berbasis role: halaman dan menu `/admin` hanya untuk `ADMIN`, sedangkan role
  lainnya menerima halaman **403 Forbidden**.
- **Auto-refresh token** di axios interceptor — sesi tidak lagi terputus setelah 30 menit.
- Halaman **Pengaduan** dengan pencarian dan filter status (berbasis data lokal).
- Halaman **Buat Pengaduan** dengan form dan area unggah foto.
- Halaman **Profil** yang menampilkan data user dari AuthContext.
- Halaman **403 Forbidden** dan **404 Not Found**.
- Design system liquid glass (`glass-panel`, `glass-card`, `glass-chip`, `brand-mark`).

> **Penting:** halaman **Pengaduan** dan **Buat Pengaduan** masih memakai data lokal
> dan belum mengirim ke backend. Yang sudah terhubung ke API: autentikasi, Dashboard
> user, dan Dashboard admin. Lihat [§11 Status Integrasi](#11-status-integrasi).

---

## 4. Tech Stack

### Backend

| Technology | Versi |
| --- | --- |
| Python | 3.13+ |
| Django | 6.1.1 |
| djangorestframework | 3.18.1 |
| djangorestframework-simplejwt | 5.5.1 |
| django-cors-headers | 4.9.0 |
| Pillow | 12.3.0 |
| SQLite3 | bawaan Python |

### Frontend

| Technology | Versi |
| --- | --- |
| React | 19.2 |
| React DOM | 19.2 |
| React Router DOM | 7.18 |
| TypeScript | ~6.0 |
| Vite | 8.3 |
| Tailwind CSS | 4.3 |
| Axios | 1.20 |
| lucide-react | 1.48 |
| jwt-decode | 4.0 |

---

## 5. Struktur Project

```
.
├── backend/                  # Django REST Framework API
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3
│   ├── config/               # settings, urls, asgi, wsgi
│   └── apps/
│       ├── accounts/         # User + autentikasi
│       ├── facilities/       # Facility (data master)
│       └── complaints/       # Complaint (pengaduan)
│
├── frontend/                 # React SPA (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env                  # VITE_API_URL (tidak di-commit)
│   └── src/
│       ├── main.tsx          # Entry point React
│       ├── App.tsx
│       ├── index.css         # Design system liquid glass
│       ├── routes/           # AppRoutes
│       ├── pages/            # auth/, user/, admin/, Forbidden, NotFound
│       ├── layouts/          # DashboardLayout
│       ├── components/       # auth/, complaint/, ui/
│       ├── contexts/         # AuthContext
│       ├── services/         # axios instance + complaint/facility service
│       ├── utils/            # complaintStats (agregasi & format)
│       └── constant.ts
│
├── README.md                 # Anda sedang membaca
└── .gitignore
```

---

## 6. Arsitektur

Arsitektur **monorepo sederhana** dengan dua aplikasi terpisah yang tidak berbagi kode
(backend Python, frontend TypeScript). Keduanya berkomunikasi murni lewat HTTP/JSON.

```
┌──────────────────────┐        HTTP/JSON         ┌──────────────────────┐
│      Frontend        │  ──────────────────────► │       Backend        │
│   React SPA (5173)   │   Authorization: Bearer  │   Django API (8000)  │
│                      │ ◄────────────────────── │                      │
│  - AuthContext       │      { access, refresh } │  - JWT (simplejwt)   │
│  - axios (api.ts)    │                          │  - DRF ViewSet/GenAPI│
│  - React Router      │                          │  - SQLite            │
│  - ProtectedRoute    │                          │                      │
└──────────────────────┘                          └──────────────────────┘
```

### Alur autentikasi

```
Register/Login  ──►  POST /api/auth/login/
                          │
                          ├──► access token  (umur 30 menit, disimpan di localStorage)
                          └──► refresh token (umur 7 hari,   disimpan di localStorage)

AuthProvider mount ──►  cek ACCESS di localStorage
                          ├── tidak ada  ──► isReady = true, user = null
                          └── ada       ──► GET /auth/me/ ──► setUser()

Login sukses      ──►  refreshUser()  ──►  navigate sesuai role
                                               ├── ADMIN  ──► /admin
                                               └── lainnya ──► /dashboard

Request 401       ──►  axios response interceptor
                          ├── coba POST /auth/refresh/ sekali
                          │     ├── berhasil ──► ulangi request asli
                          │     └── gagal     ──► hapus token, ke /login
```

Refresh token **dipicu oleh response interceptor**, bukan oleh decoding `exp` di route
guard. Ada flag `_retried` pada config request supaya 401 yang beruntun tidak
menyebabkan refresh berulang.

Token disimpan di `localStorage` dengan key `ACCESS` dan `REFRESH`
(didefinisikan di `frontend/src/constant.ts`).

### Routing berbasis role

| Role | `/dashboard` | `/admin` |
| --- | --- | --- |
| `STUDENT` | Dashboard user | 403 Forbidden |
| `STAFF` | Dashboard user | 403 Forbidden |
| `ADMIN` | redirect → `/admin` | Dashboard admin |

Fallback saat role tidak cocok diarahkan ke `/forbidden`, **bukan** ke halaman yang
sedang dibuka. Kalau fallback diarahkan balik ke route yang sama, guard akan
dievaluasi ulang dengan hasil identik dan terjadi infinite redirect loop.

### Base URL

Axios instance memakai `VITE_API_URL` sebagai `baseURL`. Request ditulis relatif terhadap
base tersebut, contoh `api.get("/auth/me/")` →
`http://127.0.0.1:8000/api/auth/me/`.

Karena itu base URL harus berakhiran `/api`.

---

## 7. Prasyarat

| Kebutuhan | Versi | Keterangan |
| --- | --- | --- |
| Python | 3.13+ | Untuk backend |
| pip | — | Dependency Python |
| Node.js | 20+ | Untuk frontend (dibutuhkan oleh Vite 8) |
| npm | 10+ | Sudah ikut dengan Node.js |

---

## 8. Menjalankan Project

### 8.1 Backend

```bash
cd backend

# Virtual environment
python -m venv .venv

# Aktifkan
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependency
pip install -r requirements.txt

# Migrasi database
python manage.py migrate

# Jalankan server
python manage.py runserver
```

Backend berjalan di `http://127.0.0.1:8000`.

> `db.sqlite3` sudah disertakan, jadi `migrate` umumnya tidak mengubah apa pun.

### 8.2 Frontend

```bash
cd frontend

# Install dependency
npm install

# Jalankan development server
npm run dev
```

Frontend berjalan di `http://localhost:5173` (port default Vite).

> Port `5173` **harus** dipakai tanpa diubah, karena backend hanya mengizinkan CORS
> dari `http://localhost:5173`. Port lain akan menyebabkan request diblokir.

### 8.3 Perintah frontend lain

```bash
npm run build     # Type-check + build production ke dist/
npm run preview   # Pratinjau hasil build
npm run lint      # ESLint
```

### 8.4 Membuat akun admin Django

```bash
cd backend
python manage.py createsuperuser
```

Diperlukan untuk mengakses dashboard admin di `http://127.0.0.1:8000/admin/`.

---

## 9. Environment Variables

### Frontend — wajib

Frontend membaca **satu** environment variable:

| Nama | Wajib | Contoh | Keterangan |
| --- | --- | --- | --- |
| `VITE_API_URL` | Ya | `http://127.0.0.1:8000/api` | Base URL API, **harus berakhiran `/api`** |

File `.env` **tidak** di-commit ke repository (sudah masuk `.gitignore`). Buat manual
di `frontend/.env`:

```env
VITE_API_URL="http://127.0.0.1:8000/api"
```

> Semua variabel berawalan `VITE_` akan ikut ter-expose ke bundle browser. Jangan menaruh
> secret di sini.

### Backend — belum ada

Backend **belum menggunakan environment variable**. `SECRET_KEY`, `DEBUG`, dan
`ALLOWED_HOSTS` masih ditulis langsung di `backend/config/settings.py`.

Satu-satunya variabel yang dibaca adalah `DJANGO_SETTINGS_MODULE`, yang sudah di-*default*
oleh `manage.py`.

> Disarankan memindahkan konfigurasi tersebut ke environment variable sebelum
> dipublikasikan. Detail di [`backend/README.md`](backend/README.md).

---

## 10. Authentication

Menggunakan **JWT** (`djangorestframework-simplejwt`) di backend.

| Aspek | Nilai |
| --- | --- |
| Access token | 30 menit |
| Refresh token | 7 hari |
| Rotasi refresh token | Aktif |
| Header | `Authorization: Bearer <access_token>` |
| Penyimpanan di frontend | `localStorage`, key `ACCESS` dan `REFRESH` |

Endpoint terkait:

| Method | URL | Akses |
| --- | --- | --- |
| POST | `/api/auth/register/` | Public |
| POST | `/api/auth/login/` | Public |
| POST | `/api/auth/refresh/` | Public |
| GET | `/api/auth/me/` | Butuh token |

Role yang tersedia pada model user: `STUDENT`, `STAFF`, `ADMIN`.

Detail lengkap: [`backend/README.md` §8](backend/README.md).

---

## 11. Status Integrasi

Integrasi frontend ↔ backend berjalan **bertahap**. Berikut kondisi nyata saat ini:

| Halaman / Modul | Terhubung ke API? | Sumber data saat ini |
| --- | --- | --- |
| Register | **Ya** | `POST /api/auth/register/` |
| Login | **Ya** | `POST /api/auth/login/` + `GET /api/auth/me/` |
| AuthContext | **Ya** | `GET /api/auth/me/` |
| ProtectedRoute | **Ya** | Membaca context, tidak fetch sendiri |
| Axios interceptor | **Ya** | `POST /api/auth/refresh/` saat 401 |
| Dashboard (user) | **Ya** | `GET /api/complaints/` + `GET /api/facilities/` |
| Dashboard Admin | **Ya** | `GET /api/complaints/` + `GET /api/facilities/` |
| Pengaduan (list) | Tidak | Data contoh hardcoded |
| Buat Pengaduan | Tidak | `console.log` pada submit |
| Profil | **Ya** | Lewat AuthContext |

### Catatan tentang data dashboard

Kedua dashboard mengambil data dari endpoint yang sama dan berbeda hanya pada filter:

| Dashboard | Filter | Perbedaan |
| --- | --- | --- |
| Dashboard user | `reporter === user.id` | Hanya pengaduan sendiri, 3 kartu metrik |
| Dashboard Admin | tanpa filter | Seluruh pengaduan, 4 kartu metrik (tambah "Ditolak") |

> **Penting:** filter `reporter === user.id` dijalankan di **browser**, bukan di server.
> `GET /api/complaints/` masih mengembalikan seluruh pengaduan ke setiap pengguna yang
> terautentikasi, jadi ini **bukan batas keamanan** — data pengaduan orang lain tetap
> terlihat di DevTools. Lihat [§13.2](#132-filter-pengaduan-hanya-di-client).

Endpoint `facilities` dan `complaints` sudah dipakai oleh kedua dashboard. Yang masih
**belum** dipakai: endpoint create/update/delete pengaduan.

---

## 12. Dokumentasi Lainnya

| Dokumen | Isi |
| --- | --- |
| [`backend/README.md`](backend/README.md) | Dokumentasi lengkap backend: setup, environment, model, JWT, **seluruh endpoint**, contoh cURL, catatan keamanan |
| [`frontend/README.md`](frontend/README.md) | Dokumentasi lengkap frontend: struktur, routing, auth flow, axios service, design system, build production |

---

## 13. Known Issues

Temuan berikut berasal dari pemeriksaan kode dan **sudah terverifikasi**. Item yang
sudah diselesaikan dicatat di [§15](#15-yang-sudah-diperbaiki).

### 13.1 Inline redirect loop pada route guard

**Sudah diperbaiki.** `ProtectedRoute` mengarahkan user yang role-nya tidak cocok ke
`/dashboard`, padahal `/dashboard` adalah halaman yang sedang dibuka sekaligus halaman
yang memakai gate tersebut. Guard dievaluasi ulang, gagal lagi, dan mengulang — hasilnya
halaman putih.

Sekarang fallback mengarah ke `/forbidden`, dan `AppRoutes.tsx` memisahkan
`/dashboard` (user) dari `/admin` (admin) lewat `DashboardRedirector`.

### 13.2 Filter pengaduan hanya di client

`GET /api/complaints/` mengembalikan **seluruh** pengaduan ke setiap pengguna yang
terautentikasi. Dashboard user memfilter `reporter === user.id` di browser.

**Dampak:** pengaduan milik orang lain tetap dikirim ke browser dan terlihat di
DevTools. Filter ini hanya mengatur **tampilan**, bukan akses. Should backend
memperbaiki, `get_queryset()` di `apps/complaints/views.py` perlu memfilter
`reporter=request.user`.

### 13.3 Ownership pengaduan tidak dijaga backend

`ComplaintDetailView` memakai `Complaint.objects.all()` tanpa pengecekan kepemilikan,
sehingga user A dapat melihat, mengubah (`PATCH`/`PUT`), dan menghapus (`DELETE`)
pengaduan milik user B. Field `reporter` juga bisa diisi client, jadi pengaduan bisa
dibuat atas nama user lain.

Detail: [`backend/README.md` §14](backend/README.md).

### 13.4 Belum ada pembatasan akses berbasis role di backend

Seluruh endpoint (kecuali register/login/refresh) bisa diakses user terautentikasi apa
pun. User dengan role `STUDENT` dapat membuat dan menghapus facility maupun complaint.
Role hanya membatasi **tampilan** di frontend.

Detail: [`backend/README.md` §8](backend/README.md).

### 13.5 Upload foto belum didukung backend

Field `image` ada di model `Complaint` tetapi **tidak** terdaftar di serializer,
sehingga tidak dapat dikirim melalui API. UI unggah foto di `CreateComplaint.tsx`
belum terhubung.

### 13.6 Refresh token lama masih dapat dipakai

App `rest_framework_simplejwt.token_blacklist` tidak terpasang, sehingga
`BLACKLIST_AFTER_ROTATION` tidak berefek. Logout harus dilakukan sepenuhnya di sisi
frontend (hapus token dari `localStorage`).

### 13.7 Route `/complaints/:id` belum terdaftar

`ComplaintCard.tsx` menautkan ke `/complaints/{id}`, tetapi route tersebut belum
didefinisikan di `AppRoutes.tsx`, sehingga membuka tautan itu berakhir di halaman 404.
Saat ini halaman Dashboard dan Pengaduan masih menautkan ke `/complaints` agar tidak
memicu ini.

### 13.8 CORS hanya mengizinkan `localhost:5173`

`CORS_ALLOWED_ORIGINS` di `backend/config/settings.py` hanya berisi
`http://localhost:5173`, sedangkan `frontend/.env` memakai `127.0.0.1`. Jika Vite
dibuka lewat `http://127.0.0.1:5173`, seluruh request API akan diblokir CORS.
Gunakan `http://localhost:5173`, atau tambahkan origin-nya ke backend.

---

## 14. Contributor

| Nama | Kontribusi |
| --- | --- |
| **Rizky Akbar** | Seluruh commit pada repository ini |

Repository ini belum memiliki file `LICENSE`, sehingga status lisensinya belum ditentukan.

---

## 15. Yang Sudah Diperbaiki

Catatan perubahan agar tidak ada duplikasi dengan [§13](#13-known-issues).

| # | Masalah | Perbaikan |
| --- | --- | --- |
| 1 | `ProtectedRoute` tidak dipakai di routing — dashboard terbuka tanpa token | Dipasang di `AppRoutes.tsx` untuk seluruh route area dashboard |
| 2 | `jwt-decode` tidak ada di `package.json` — build gagal di mesin baru | Ditambahkan ke `package.json` **dan** `package-lock.json` |
| 3 | URL refresh token menggandakan `/api` → `/api/api/auth/refresh/` | Dipindah ke axios interceptor dengan path `/auth/refresh/` |
| 4 | Infinite redirect loop karena fallback guard menuju route yang sama | Fallback diubah ke `/forbidden`, route `/admin` dipisah |
| 5 | `Login.tsx` tidak mengisi `AuthContext` sehingga nama tampil "Pengguna" | `Login.tsx` memanggil `refreshUser()` sebelum `navigate()` |
| 6 | Tidak ada refresh token otomatis — sesi putus setelah 30 menit | Response interceptor di `services/api.ts` |
| 7 | Dashboard masih memakai data hardcoded (24 / 06 / 15) | Diambil dari `GET /api/complaints/`, agregat dihitung nyata |
| 8 | Status frontend (`submitted`, `verified`) tidak cocok backend | `StatusBadge` sekarang memakai `PENDING` / `IN_PROGRESS` / `RESOLVED` / `REJECTED` |
| 9 | `npm run lint` menghasilkan 4 error | Sekarang **0 error** (`any` diganti `unknown` + `axios.isAxiosError`) |

### Perubahan route

| Route | Sebelum | Sesudah |
| --- | --- | --- |
| `/dashboard` | `ProtectedRoute allowedRoles={["ADMIN"]}` | `DashboardRedirector` → dashboard user, atau redirect `/admin` bila ADMIN |
| `/admin` | — | `ProtectedRoute allowedRoles={["ADMIN"]}` |
| `/forbidden` | — | Halaman 403 |