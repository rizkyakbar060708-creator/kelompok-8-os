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

---

## 1. Deskripsi

CampusCare adalah aplikasi pengaduan fasilitas kampus dengan dua actor utama:

- **Mahasiswa** — melihat fasilitas, mengirim pengaduan, memantau status pengaduannya.
- **Pengelola / Staff** — menangani pengaduan yang masuk dan memperbarui statusnya.

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
- Memberikan datafasilitas yang terstruktur sebagai dasar pengaduan.
- Menjaga pemisahan hak akses antara berbagai role pengguna.

> **Catatan:** pembatasan hak akses berbasis role masih berupa rancangan. Saat ini
> `role` disimpan sebagai data tetapi belum membatasi akses endpoint. Lihat
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
- Halaman **Dashboard** dengan kartu ringkasan dan daftar pengaduan terbaru.
- Halaman **Pengaduan** dengan pencarian dan filter status (berbasis data lokal).
- Halaman **Buat Pengaduan** dengan form dan area unggah foto.
- Halaman **Profil** yang menampilkan data user dari AuthContext.
- Design system liquid glass (`glass-panel`, `glass-card`, `glass-chip`, `brand-mark`).

> **Penting:** halaman Dashboard, Pengaduan, dan Buat Pengaduan saat ini masih
> menggunakan **data contoh (hardcoded)** — belum terhubung ke endpoint backend.
> Lihat [§11 Status Integrasi](#11-status-integrasi).

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
│       ├── pages/            # auth/ dan user/
│       ├── layouts/          # DashboardLayout
│       ├── components/       # auth/, complaint/, ui/
│       ├── contexts/         # AuthContext
│       ├── services/         # axios instance
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
└──────────────────────┘                          └──────────────────────┘
```

### Alur autentikasi

```
Register/Login  ──►  POST /api/auth/login/
                          │
                          ├──► access token  (umur 30 menit, disimpan di localStorage)
                          └──► refresh token (umur 7 hari,   disimpan di localStorage)

ProtectedRoute    ──►  decode access token (jwt-decode)
                          ├── masih valid  ──► izinkan akses
                          └── kedaluwarsa ──► POST /api/auth/refresh/ ──► token baru
```

Token disimpan di `localStorage` dengan key `ACCESS` dan `REFRESH`
(didefinisikan di `frontend/src/constant.ts`).

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

Integrasi frontend ↔ backend masih **berjalan bertahap**. Berikut kondisi nyata saat ini:

| Halaman / Modul | Terhubung ke API? | Sumber data saat ini |
| --- | --- | --- |
| Register | **Ya** | `POST /api/auth/register/` |
| Login | **Ya** | `POST /api/auth/login/` |
| AuthContext | **Ya** | `GET /api/auth/me/` |
| ProtectedRoute | Sebagian | `POST /api/auth/refresh/` *(URL bermasalah, lihat §13)* |
| Dashboard | Tidak | Data contoh hardcoded |
| Pengaduan (list) | Tidak | Data contoh hardcoded |
| Buat Pengaduan | Tidak | `console.log` pada submit |
| Profil | **Ya** | Lewat AuthContext |

Endpoint `facilities` dan `complaints` **sudah tersedia di backend**, tetapi belum
dipanggil dari frontend.

---

## 12. Dokumentasi Lainnya

| Dokumen | Isi |
| --- | --- |
| [`backend/README.md`](backend/README.md) | Dokumentasi lengkap backend: setup, environment, model, JWT, **seluruh endpoint**, contoh cURL, catatan keamanan |
| [`frontend/README.md`](frontend/README.md) | Dokumentasi lengkap frontend: struktur, routing, auth flow, axios service, design system, build production |

---

## 13. Known Issues

Temuan berikut berasal dari pemeriksaan kode dan **sudah terverifikasi**.

### 13.1 `ProtectedRoute` belum dipakai di routing

`ProtectedRoute` sudah tersedia di `frontend/src/components/auth/ProtectedRoute.tsx`,
tetapi **tidak di-import** di `AppRoutes.tsx`. Route dashboard, complaints, dan profile
dirender tanpa proteksi. `DashboardLayout` juga tidak memeriksa `isAuthenticated`.

Konsekuensi: membuka `/dashboard` tanpa token **tidak** mengarahkan user ke halaman login.

### 13.2 `jwt-decode` tidak terdaftar di `package.json`

`ProtectedRoute.tsx` meng-import `jwt-decode`, tetapi paket ini **tidak ada** di
`package.json` maupun `package-lock.json`. Paket tersebut hanya ada di `node_modules`
lokal, sehingga `npm install` di komputer baru **akan menyebabkan build gagal**.

Perbaikan: tambahkan `jwt-decode` ke `package.json`.

### 13.3 URL refresh token menggandakan `/api`

`ProtectedRoute.tsx` memanggil `api.post("/api/auth/refresh/")`, sedangkan `baseURL` sudah
berakhiran `/api`. URL akhirnya menjadi:

```
http://127.0.0.1:8000/api/api/auth/refresh/   ← tidak valid
```

Endpoint yang benar adalah `/auth/refresh/`. Request ini akan gagal jika route tersebut
saktif dipakai.

### 13.4 Status pengaduan berbeda antara backend dan frontend

| Backend | Frontend |
| --- | --- |
| `PENDING` | `submitted` |
| `IN_PROGRESS` | `in_progress` |
| `RESOLVED` | `resolved` |
| `REJECTED` | — |
| — | `verified` |

Perlu pemetaan saat integrasi.

### 13.5 Upload foto belum didukung backend

Field `image` ada di model `Complaint` tetapi **tidak** terdaftar di serializer, sehingga
tidak dapat dikirim melalui API. UI unggah foto di `CreateComplaint.tsx` belum
terhubung.

### 13.6 Belum ada pembatasan akses berbasis role

Seluruh endpoint (kecuali register/login/refresh) bisa diakses user terautentikasi apa pun.
User dengan role `STUDENT` dapat membuat dan menghapus facility maupun complaint.
Detail di [`backend/README.md` §14](backend/README.md).

### 13.7 Refresh token lama masih dapat dipakai

App `rest_framework_simplejwt.token_blacklist` tidak terpasang, sehingga
`BLACKLIST_AFTER_ROTATION` tidak berefek. Logout harus dilakukan sepenuhnya di sisi
frontend (hapus token dari `localStorage`).

### 13.8 Branch aktif adalah `main`

Repository saat ini berada di branch `main`, sedangkan sebagian besar pekerjaan UI
dilakukan di branch `ui`. Pastikan untuk checkout branch yang benar sebelum melakukan commit.

---

## 14. Contributor

| Nama | Kontribusi |
| --- | --- |
| **Rizky Akbar** | Seluruh commit pada repository ini (9 commit) |

Repository ini belum memiliki file `LICENSE`, sehingga status lisensinya belum ditentukan.