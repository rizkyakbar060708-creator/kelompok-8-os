# CampusCare — Backend

REST API untuk aplikasi **CampusCare**, sistem pengaduan fasilitas kampus.

Backend menyediakan autentikasi berbasis JWT, data master fasilitas, dan data pengaduan
(complaint). Dibangun dengan **Django REST Framework** dan **SQLite**.

> **Status dokumentasi**
> Seluruh endpoint, request body, dan response dalam dokumen ini **sudah diverifikasi dengan
> menjalankan request sungguhan** terhadap kode di repository ini (Django 6.1.1, Python 3.13.7).
> Tidak ada endpoint atau fitur yang dicantumkan jika belum ada di kode.
> Fitur yang memang belum ada ditandai eksplisit pada
> [Endpoint yang Belum Tersedia](#13-endpoint-yang-belum-tersedia).

---

## Daftar Isi

1. [Deskripsi Project](#1-deskripsi-project)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Setup Environment](#4-setup-environment)
5. [Menjalankan Backend](#5-menjalankan-backend)
6. [Environment Variables](#6-environment-variables)
7. [Database](#7-database)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Ringkasan Endpoint](#9-ringkasan-endpoint)
10. [Dokumentasi Endpoint](#10-dokumentasi-endpoint)
11. [Contoh Penggunaan dengan cURL](#11-contoh-penggunaan-dengan-curl)
12. [Catatan Penting untuk Frontend Developer](#12-catatan-penting-untuk-frontend-developer)
13. [Endpoint yang Belum Tersedia](#13-endpoint-yang-belum-tersedia)
14. [Catatan Keamanan](#14-catatan-keamanan)

---

## 1. Deskripsi Project

CampusCare adalah aplikasi pengaduan fasilitas kampus.

Pengguna (**mahasiswa**) membuat pengaduan yang terhubung ke sebuah **fasilitas**.
Pengaduan memiliki status dan prioritas yang biasanya dikelola pengelola.

**Tiga domain data:**

| Domain | Model | Keterangan |
| --- | --- | --- |
| Akun | `accounts.User` | User kustom extends `AbstractUser`, punya field `role` |
| Fasilitas | `facilities.Facility` | Data master fasilitas (AC, lampu, keran, dsb.) |
| Pengaduan | `complaints.Complaint` | Laporan kerusakan yang merujuk `User` + `Facility` |

---

## 2. Tech Stack

| Layer | Teknologi | Versi |
| --- | --- | --- |
| Language | Python | 3.13.7 (terverifikasi) |
| Framework | Django | 6.1.1 |
| REST Framework | djangorestframework | 3.18.1 |
| Authentication | djangorestframework-simplejwt | 5.5.1 |
| JWT | PyJWT | 2.15.1 |
| CORS | django-cors-headers | 4.9.0 |
| Image handling | Pillow | 12.3.0 |
| Database | SQLite3 | bawaan Python |
| ASGI/WSGI | asgiref / Django | 6.1.1 |

Tidak ada dependency Node.js di backend. (`backend/package.json` ada tetapi isinya `{}`.)

---

## 3. Struktur Folder

```
backend/
├── manage.py                     # entry point Django
├── requirements.txt              # daftar dependency
├── db.sqlite3                    # database SQLite (sudah ada di repo)
├── config/
│   ├── settings.py               # konfigurasi utama
│   ├── urls.py                   # root URL + routing API
│   ├── asgi.py
│   └── wsgi.py
└── apps/
    ├── accounts/                 # user & autentikasi
    │   ├── models.py             # User (AbstractUser + role)
    │   ├── serializers.py        # RegisterSerializer, UserSerializer
    │   ├── views.py              # RegisterView, MeView
    │   ├── urls.py
    │   ├── admin.py
    │   └── migrations/0001_initial.py
    ├── facilities/               # data master fasilitas
    │   ├── models.py             # Facility
    │   ├── serializers.py        # FacilitySerializer
    │   ├── views.py              # ListCreate + RetrieveUpdateDestroy
    │   ├── urls.py
    │   ├── admin.py
    │   └── migrations/0001_initial.py
    └── complaints/               # pengaduan
        ├── models.py             # Complaint
        ├── serializers.py        # ComplaintSerializer
        ├── views.py              # ListCreate + RetrieveUpdateDestroy
        ├── urls.py
        ├── admin.py
        └── migrations/0001_initial.py
```

**Tidak ada `permissions.py`** di seluruh project. Otorisasi hanya memakai permission class
bawaan DRF (`AllowAny`, `IsAuthenticated`) — detail pada
[§8](#8-authentication--authorization).

---

## 4. Setup Environment

### Kebutuhan

- Python **3.13+** (terverifikasi memakai 3.13.7)
- Git

### Langkah

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Buat virtual environment
python -m venv .venv

# 3. Aktifkan virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# 4. Install dependency
pip install -r requirements.txt

# 5. Jalankan migrasi
python manage.py migrate

# 6. (Opsional) Buat admin untuk akses Django admin
python manage.py createsuperuser
```

> `db.sqlite3` sudah tersedia di repository, sehingga `migrate` pada langkah 5 umumnya
> tidak mengubah apa pun. Jalankan `python manage.py check` untuk memvalidasi konfigurasi.

---

## 5. Menjalankan Backend

```bash
cd backend
python manage.py runserver
```

Server berjalan di `http://127.0.0.1:8000` secara default.

Perintah lain yang tersedia:

```bash
python manage.py check            # validasi konfigurasi
python manage.py migrate           # terapkan migrasi database
python manage.py makemigrations    # buat migrasi baru setelah ubah model
python manage.py createsuperuser   # buat akun admin (Django admin)
python manage.py shell             # Django shell
python manage.py test              # jalankan test
```

### Cek cepat

```bash
curl http://127.0.0.1:8000/api/complaints/
# 401 — endpoint hidup dan mewajibkan autentikasi.
```

---

## 6. Environment Variables

**Saat ini backend tidak memakai environment variable sama sekali.**
Tidak ada file `.env`, dan tidak ada pemanggilan `os.environ.get(...)` untuk konfigurasi
aplikasi di luar `manage.py`.

Seluruh konfigurasi ditulis langsung di `config/settings.py`:

| Setting | Nilai saat ini | Lokasi |
| --- | --- | --- |
| `SECRET_KEY` | hardcoded (`django-insecure-...`) | `config/settings.py:24` |
| `DEBUG` | `True` | `config/settings.py:27` |
| `ALLOWED_HOSTS` | `[]` | `config/settings.py:29` |
| `CORS_ALLOWED_ORIGINS` | `["http://localhost:5173"]` | `config/settings.py:66` |

> **Penting untuk production:** `SECRET_KEY` yang di-hardcode juga dipakai untuk menandatangani
> token JWT. Mengganti `SECRET_KEY` akan **membatalkan seluruh token yang sedang berlaku** —
> semua pengguna harus login ulang. Dipindahkan ke environment variable sebelum dipublikasikan.

Satu-satunya environment variable yang dibaca adalah `DJANGO_SETTINGS_MODULE`, yang sudah
di-*default* oleh `manage.py` sehingga tidak perlu diset manual:

```
DJANGO_SETTINGS_MODULE=config.settings
```

---

## 7. Database

- **Engine:** `django.db.backends.sqlite3`
- **Nama file:** `backend/db.sqlite3`
- **Konfigurasi:** `config/settings.py:104`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Model

#### `accounts.User`

Custom user model (`AUTH_USER_MODEL = "accounts.User"`, `config/settings.py:130`),
extends `AbstractUser`.

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | int | primary key |
| `username` | varchar | unik, dari `AbstractUser` |
| `password` | varchar | ter-hash, dari `AbstractUser` |
| `email` | varchar | dari `AbstractUser` |
| `role` | varchar(20) | `STUDENT` \| `STAFF` \| `ADMIN`, default `STUDENT` |
| `is_staff` | bool | dari `AbstractUser` |
| `is_active` | bool | dari `AbstractUser` |

Field lain dari `AbstractUser` (`first_name`, `last_name`, `date_joined`, dll.) ada di
database, tetapi **tidak dikembalikan** oleh API.

Nilai `role` yang valid: `STUDENT`, `STAFF`, `ADMIN`.

#### `facilities.Facility`

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | int | primary key |
| `name` | varchar(150) | wajib |
| `description` | text | opsional, boleh kosong |
| `location` | varchar(255) | wajib |
| `status` | varchar(20) | `ACTIVE` \| `MAINTENANCE` \| `INACTIVE`, default `ACTIVE` |
| `created_at` | datetime | auto |
| `updated_at` | datetime | auto |

#### `complaints.Complaint`

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | int | primary key |
| `reporter` | FK → `accounts.User` | wajib diisi, `on_delete=CASCADE` |
| `facility` | FK → `facilities.Facility` | wajib diisi, `on_delete=CASCADE` |
| `title` | varchar(200) | wajib |
| `description` | text | wajib |
| `status` | varchar(20) | `PENDING` \| `IN_PROGRESS` \| `RESOLVED` \| `REJECTED`, default `PENDING` |
| `priority` | varchar(10) | `LOW` \| `MEDIUM` \| `HIGH`, default `MEDIUM` |
| `image` | ImageField | ada di model, **tidak dipakai API** (lihat §13) |
| `created_at` | datetime | auto |
| `updated_at` | datetime | auto |

> **Catatan:** field `image` ada di model, tetapi **tidak** terdaftar di
> `ComplaintSerializer.Meta.fields`, sehingga **tidak dapat dikirim maupun diterima melalui
> API**. Sudah diverifikasi: mengirim `image` tidak menghasilkan error, field tersebut
> diabaikan diam-diam.

---

## 8. Authentication & Authorization

### Mekanisme: JWT

Backend memakai **JWT** via `djangorestframework-simplejwt` (`config/settings.py:50`):

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}
```

Konsekuensi penting:

- **Default permission adalah `IsAuthenticated`** — semua endpoint mewajibkan token,
  kecuali yang eksplisit memakai `AllowAny` (hanya `/api/auth/register/`).
- Autentikasi dibaca dari header `Authorization: Bearer <access_token>`.

### Access token

| Aspek | Nilai |
| --- | --- |
| Masa berlaku | **30 menit** (`ACCESS_TOKEN_LIFETIME`) |
| Dipakai pada | header `Authorization: Bearer <token>` |
| Dipakai untuk | semua request kecuali register, login, dan refresh |

### Refresh token

| Aspek | Nilai |
| --- | --- |
| Masa berlaku | **7 hari** (`REFRESH_TOKEN_LIFETIME`) |
| Rotasi | **aktif** (`ROTATE_REFRESH_TOKENS = True`) |
| Blacklist | disetel `True`, **tidak berfungsi** (lihat catatan) |

Saat refresh dipanggil, server mengembalikan **access token baru sekaligus refresh token
baru**. Refresh token **lama masih bisa dipakai lagi** — karena app
`rest_framework_simplejwt.token_blacklist` **tidak terdaftar** di `INSTALLED_APPS`, sehingga
mekanisme blacklist dilewati. Sudah diverifikasi: memakai kembali refresh token lama tetap
menghasilkan `200`.

> Konsekuensi untuk client: logout harus menghapus token secara lokal, karena server belum
> bisa mencabut refresh token.

### Role dan permission

`accounts.User` punya field `role` dengan tiga nilai: `STUDENT`, `STAFF`, `ADMIN`.

Namun **belum ada permission berbasis role yang diimplementasikan**:

- Tidak ada `permissions.py` di project mana pun.
- Tidak ada view yang memakai permission seperti `IsAdminUser` atau custom permission.
- **Role tidak membatasi endpoint apa pun.** User dengan role `STUDENT` tetap bisa membuat
  dan menghapus facility maupun complaint. Sudah diverifikasi.
- Role **tidak bisa dipilih saat register** — `RegisterSerializer.create()` selalu memaksa
  `role=STUDENT`. Mengirim `role: "ADMIN"` di body register tetap menghasilkan user
  `STUDENT`.

Role saat ini berfungsi sebagai **label data**, bukan kontrol akses.

| Endpoint | Akses |
| --- | --- |
| `POST /api/auth/register/` | Public (`AllowAny`) |
| `POST /api/auth/login/` | Public |
| `POST /api/auth/refresh/` | Public |
| `GET /api/auth/me/` | Semua user terautentikasi |
| `/api/facilities/*` | Semua user terautentikasi (tanpa pembatasan role) |
| `/api/complaints/*` | Semua user terautentikasi (tanpa pembatasan role) |

Satu-satunya pembedaan hak akses yang benar-benar ada adalah flag `is_staff` /
`is_superuser` milik Django untuk dashboard `/admin/`. User yang daftar via
`/api/auth/register/` selalu dibuat dengan `is_staff=False` dan `is_superuser=False`,
sehingga tidak bisa masuk ke Django admin.

### 8.1 Frontend sudah role-gate, backend belum

Ada asimetri yang perlu diketahui: frontend **sudah** membedakan tampilan berdasarkan role
(route `/admin` hanya untuk `ADMIN`, menu disembunyikan untuk role lain), tetapi
pembatasan itu murni di sisi client dan dapat dilewati.

User `STUDENT` yang mengetahui URL `/api/complaints/` tetap bisa melihat, mengubah, dan
menghapus seluruh pengaduan. aggregating dashboard di frontend bukan kontrol akses.

Yang perlu ditambahkan di backend agar konsisten dengan frontend:

| Yang perlu dibuat | Lokasi |
| --- | --- |
| `IsAdminRole` permission class | `apps/accounts/permissions.py` (belum ada) |
| Scoping per user | `ComplaintListCreateView.get_queryset()` |
| Paksa `reporter` dari token | `ComplaintListCreateView.perform_create()` |
| Ownership check | `ComplaintDetailView.get_queryset()` |
| Endpoint statistik | `GET /api/complaints/stats/` dengan gate `IsAdminRole` |

Detail di [`../frontend/README.md` §13](../frontend/README.md).

---

## 9. Ringkasan Endpoint

Base URL saat development: `http://127.0.0.1:8000`

| # | Method | URL | Auth | Deskripsi |
| --- | --- | --- | --- | --- |
| 1 | POST | `/api/auth/register/` | Public | Daftar akun baru |
| 2 | POST | `/api/auth/login/` | Public | Login, dapatkan access + refresh token |
| 3 | POST | `/api/auth/refresh/` | Public | Perbarui access token (rotasi refresh) |
| 4 | GET | `/api/auth/me/` | Bearer | Data user yang sedang login |
| 5 | GET | `/api/facilities/` | Bearer | Daftar semua fasilitas |
| 6 | POST | `/api/facilities/` | Bearer | Buat fasilitas baru |
| 7 | GET | `/api/facilities/{id}/` | Bearer | Detail satu fasilitas |
| 8 | PUT | `/api/facilities/{id}/` | Bearer | Replace seluruh field fasilitas |
| 9 | PATCH | `/api/facilities/{id}/` | Bearer | Update sebagian field fasilitas |
| 10 | DELETE | `/api/facilities/{id}/` | Bearer | Hapus fasilitas |
| 11 | GET | `/api/complaints/` | Bearer | Daftar semua pengaduan |
| 12 | POST | `/api/complaints/` | Bearer | Buat pengaduan baru |
| 13 | GET | `/api/complaints/{id}/` | Bearer | Detail satu pengaduan |
| 14 | PUT | `/api/complaints/{id}/` | Bearer | Replace pengaduan |
| 15 | PATCH | `/api/complaints/{id}/` | Bearer | Update sebagian field pengaduan |
| 16 | DELETE | `/api/complaints/{id}/` | Bearer | Hapus pengaduan |

**Total: 8 path, 16 kombinasi method.** Ini daftar lengkap — diverifikasi dengan menelusuri
URL resolver Django. Tidak ada endpoint lain yang terdaftar.

Selain itu ada `GET /admin/` — dashboard bawaan Django (butuh staff/superuser).

> Seluruh URL memakai **trailing slash**. Request tanpa garis miring di akhir di-redirect 301
> oleh Django.

---

## 10. Dokumentasi Endpoint

### 10.1 `POST /api/auth/register/`

Mendaftarkan akun baru. Public.
**View:** `apps/accounts/views.py` → `RegisterView` (`generics.CreateAPIView`)

#### Request body

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `username` | string | Ya | Harus unik, tidak boleh kosong |
| `password` | string | Ya | Disimpan ter-hash, `write_only` (tidak dikembalikan) |

Field lain **diabaikan** — termasuk `role`, yang selalu dipaksa menjadi `STUDENT`.

#### Response `201 Created`

```json
{
  "username": "budi"
}
```

Hanya `username` yang dikembalikan. Field `id` dan `role` tidak ada di response.

#### Response `400 Bad Request`

Body error memakai objek dengan nama field sebagai key:

```json
{
  "username": ["A user with that username already exists."]
}
```

```json
{
  "password": ["This field is required."]
}
```

```json
{
  "username": ["This field may not be blank."]
}
```

---

### 10.2 `POST /api/auth/login/`

Login dan mendapatkan token. Public.
Menggunakan `TokenObtainPairView` dari simplejwt (di-wire langsung di `config/urls.py`).

#### Request body

```json
{
  "username": "budi",
  "password": "rahasia123"
}
```

#### Response `200 OK`

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> Perhatikan urutan key: server mengembalikan `refresh` lebih dulu, lalu `access`.

Isi payload `access` token (claims): `token_type`, `exp`, `iat`, `jti`, `user_id`.

#### Response `401 Unauthorized`

```json
{
  "detail": "No active account found with the given credentials"
}
```

Pesan yang sama dipakai untuk username tidak ada maupun password salah.

---

### 10.3 `POST /api/auth/refresh/`

Meminta access token baru. Public.
Menggunakan `TokenRefreshView` dari simplejwt.

#### Request body

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `refresh` | string | Ya | Refresh token sebelumnya |

#### Response `200 OK`

Karena `ROTATE_REFRESH_TOKENS = True`, **kedua** token dikembalikan:

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Client **wajib menyimpan ulang** `refresh` yang baru.

> Refresh token lama **tidak** dicabut dan masih bisa dipakai lagi, karena app
> `token_blacklist` tidak terpasang. Sudah diverifikasi.

#### Response `401 Unauthorized`

```json
{
  "detail": "Token is invalid or expired"
}
```

---

### 10.4 `GET /api/auth/me/`

Mengambil data user yang sedang login.
**View:** `apps/accounts/views.py` → `MeView` (`generics.RetrieveAPIView`)

`get_object()` di-override agar selalu mengembalikan `self.request.user`, sehingga user
**hanya bisa melihat dirinya sendiri**.

Tidak ada request body, tidak ada query parameter.

#### Response `200 OK`

```json
{
  "id": 1,
  "username": "budi",
  "role": "STUDENT"
}
```

#### Response `401 Unauthorized`

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 10.5 `GET /api/facilities/`

Mengambil daftar seluruh fasilitas.
**View:** `apps/facilities/views.py` → `FacilityListCreateView`

Tidak ada query parameter — **tidak ada filter, sorting, maupun paginasi**.

#### Response `200 OK`

```json
[
  {
    "id": 1,
    "name": "AC Ruang 301",
    "description": "Unit AC kelas",
    "location": "Gedung A",
    "status": "ACTIVE",
    "created_at": "2026-10-08T09:00:41.709459Z",
    "updated_at": "2026-10-08T09:00:41.709472Z"
  }
]
```

Selalu berupa array, termasuk ketika kosong (`[]`).

---

### 10.6 `POST /api/facilities/`

Membuat fasilitas baru.

#### Request body

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `name` | string | Ya | Maks 150 karakter |
| `location` | string | Ya | Maks 255 karakter |
| `description` | string | Tidak | Boleh string kosong |
| `status` | string | Tidak | `ACTIVE` \| `MAINTENANCE` \| `INACTIVE`, default `ACTIVE` |

#### Contoh request

```json
{
  "name": "AC Ruang 301",
  "description": "Unit AC kelas",
  "location": "Gedung A, Ruang 301",
  "status": "ACTIVE"
}
```

#### Response `201 Created`

```json
{
  "id": 1,
  "name": "AC Ruang 301",
  "description": "Unit AC kelas",
  "location": "Gedung A, Ruang 301",
  "status": "ACTIVE",
  "created_at": "2026-10-08T09:00:41.709459Z",
  "updated_at": "2026-10-08T09:00:41.709472Z"
}
```

#### Response `400 Bad Request`

```json
{
  "location": ["This field is required."]
}
```

---

### 10.7 `GET /api/facilities/{id}/`

Detail satu fasilitas.
**View:** `FacilityDetailView`

#### Path parameter

| Parameter | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | `Facility` primary key |

#### Response `200 OK`

```json
{
  "id": 1,
  "name": "AC Ruang 301",
  "description": "Unit AC kelas",
  "location": "Gedung A, Ruang 301",
  "status": "ACTIVE",
  "created_at": "2026-10-08T09:00:41.709459Z",
  "updated_at": "2026-10-08T09:00:41.709472Z"
}
```

#### Response `404 Not Found`

```json
{
  "detail": "No Facility matches the given query."
}
```

---

### 10.8 `PUT / PATCH /api/facilities/{id}/`

Mengubah data fasilitas. Perbedaannya:

| Method | Perilaku |
| --- | --- |
| `PATCH` | Hanya field yang dikirim yang berubah. Field tidak disebut tetap seperti semula. |
| `PUT` | Mengganti seluruh resource. Field wajib yang tidak dikirim akan menghasilkan `400`. |

**View:** `FacilityDetailView` (`generics.RetrieveUpdateDestroyAPIView`)

#### Contoh `PATCH` request

```json
{
  "status": "MAINTENANCE"
}
```

#### Response `200 OK`

```json
{
  "id": 1,
  "name": "AC Ruang 301",
  "description": "Unit AC kelas",
  "location": "Gedung A, Ruang 301",
  "status": "MAINTENANCE",
  "created_at": "2026-10-08T09:00:41.709459Z",
  "updated_at": "2026-10-08T09:01:12.482301Z"
}
```

`updated_at` otomatis berubah, `created_at` tetap.

#### Response `404 Not Found`

```json
{
  "detail": "No Facility matches the given query."
}
```

---

### 10.9 `DELETE /api/facilities/{id}/`

Menghapus fasilitas. Tidak ada body.

#### Response `204 No Content`

Body kosong.

> Menghapus facility akan ikut menghapus semua complaint yang merujuk facility tersebut
> (`on_delete=CASCADE`).

#### Response `404 Not Found`

```json
{
  "detail": "No Facility matches the given query."
}
```

---

### 10.10 `GET /api/complaints/`

Mengambil daftar seluruh pengaduan.
**View:** `apps/complaints/views.py` → `ComplaintListCreateView`

Tidak ada query parameter.

> **Penting:** endpoint ini **tidak memfilter berdasarkan `reporter`**. Setiap user
> terautentikasi melihat pengaduan milik semua user. Sudah diverifikasi.

#### Response `200 OK`

```json
[
  {
    "id": 1,
    "reporter": 1,
    "facility": 1,
    "title": "AC Ruang 301 Rusak",
    "description": "AC tidak berfungsi sejak kemarin.",
    "status": "PENDING",
    "priority": "MEDIUM",
    "created_at": "2026-10-08T09:00:41.718897Z",
    "updated_at": "2026-10-08T09:00:41.718912Z"
  }
]
```

Field `reporter` dan `facility` mengembalikan **id numerik**, bukan objek nested.

---

### 10.11 `POST /api/complaints/`

Membuat pengaduan baru.

#### Request body

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `reporter` | integer | **Ya** | Id user pelapor. **Wajib diisi manual oleh client.** |
| `facility` | integer | **Ya** | Id `Facility` yang bermasalah |
| `title` | string | Ya | Maks 200 karakter |
| `description` | string | Ya | Tidak boleh blank |
| `status` | string | Tidak | `PENDING` \| `IN_PROGRESS` \| `RESOLVED` \| `REJECTED`, default `PENDING` |
| `priority` | string | Tidak | `LOW` \| `MEDIUM` \| `HIGH`, default `MEDIUM` |

> **Penting:** `reporter` **tidak diambil otomatis** dari access token. View tidak
> meng-override `perform_create`, jadi client wajib mengirim `reporter` sendiri. Jika tidak
> dikirim, server membalas `400`.

> Field `image` **tidak bisa digunakan** meski ada di model — lihat
> [§13](#13-endpoint-yang-belum-tersedia).

#### Contoh request

```json
{
  "reporter": 1,
  "facility": 1,
  "title": "AC Ruang 301 Rusak",
  "description": "AC tidak berfungsi sejak kemarin dan sangat panas."
}
```

#### Response `201 Created`

```json
{
  "id": 1,
  "reporter": 1,
  "facility": 1,
  "title": "AC Ruang 301 Rusak",
  "description": "AC tidak berfungsi sejak kemarin dan sangat panas.",
  "status": "PENDING",
  "priority": "MEDIUM",
  "created_at": "2026-10-08T09:00:41.718897Z",
  "updated_at": "2026-10-08T09:00:41.718912Z"
}
```

#### Response `400 Bad Request`

```json
{
  "reporter": ["This field is required."]
}
```

---

### 10.12 `GET /api/complaints/{id}/`

Detail satu pengaduan.
**View:** `ComplaintDetailView`

#### Response `200 OK`

```json
{
  "id": 1,
  "reporter": 1,
  "facility": 1,
  "title": "AC Ruang 301 Rusak",
  "description": "AC tidak berfungsi sejak kemarin dan sangat panas.",
  "status": "PENDING",
  "priority": "MEDIUM",
  "created_at": "2026-10-08T09:00:41.718897Z",
  "updated_at": "2026-10-08T09:00:41.718912Z"
}
```

#### Response `404 Not Found`

```json
{
  "detail": "No Complaint matches the given query."
}
```

---

### 10.13 `PUT / PATCH /api/complaints/{id}/`

Mengubah data pengaduan. `PATCH` hanya mengubah field yang dikirim; `PUT` mengganti seluruh
resource dan field wajib yang tidak dikirim akan menghasilkan `400`.

#### Contoh `PATCH` request

```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

#### Response `200 OK`

```json
{
  "id": 1,
  "reporter": 1,
  "facility": 1,
  "title": "AC Ruang 301 Rusak",
  "description": "AC tidak berfungsi sejak kemarin dan sangat panas.",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "created_at": "2026-10-08T09:00:41.718897Z",
  "updated_at": "2026-10-08T09:01:12.482301Z"
}
```

> Siapa pun yang terautentikasi dapat mengubah `status` pengaduan siapa pun — termasuk ke
> `RESOLVED`. Belum ada pembatasan berdasarkan role maupun ownership.

---

### 10.14 `DELETE /api/complaints/{id}/`

Menghapus pengaduan. Tidak ada body.

#### Response `204 No Content`

Body kosong.

---

## 11. Contoh Penggunaan dengan cURL

Base URL `http://127.0.0.1:8000`.

### 11.1 Register

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"budi","password":"rahasia123"}'
```

```json
{ "username": "budi" }
```

### 11.2 Login dan simpan token

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"budi","password":"rahasia123"}'
```

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 11.3 Ambil profil sendiri

```bash
curl http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

```json
{ "id": 1, "username": "budi", "role": "STUDENT" }
```

### 11.4 Refresh token

```bash
curl -X POST http://127.0.0.1:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<REFRESH_TOKEN>"}'
```

Simpan ulang `access` **dan** `refresh` yang baru.

### 11.5 Buat fasilitas

```bash
curl -X POST http://127.0.0.1:8000/api/facilities/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "AC Ruang 301",
        "description": "Unit AC kelas",
        "location": "Gedung A, Ruang 301",
        "status": "ACTIVE"
      }'
```

### 11.6 Buat pengaduan

`reporter` diisi manual dengan id user dari `/api/auth/me/`.

```bash
curl -X POST http://127.0.0.1:8000/api/complaints/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "reporter": 1,
        "facility": 1,
        "title": "AC Ruang 301 Rusak",
        "description": "AC tidak berfungsi sejak kemarin."
      }'
```

### 11.7 Ubah status pengaduan

```bash
curl -X PATCH http://127.0.0.1:8000/api/complaints/1/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### 11.8 Daftar pengaduan

```bash
curl http://127.0.0.1:8000/api/complaints/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 11.9 Error tanpa token

```bash
curl -i http://127.0.0.1:8000/api/complaints/
# HTTP/1.1 401 Unauthorized
# {"detail":"Authentication credentials were not provided."}
```

---

## 12. Catatan Penting untuk Frontend Developer

### 1. Trailing slash wajib

Semua URL berakhir dengan `/`. Tanpa itu, Django membalas **301 redirect**.

### 2. Bentuk error register cocok dengan frontend saat ini

`Register.tsx` membaca `error.response.data.username[0]` lalu `data.password[0]`.
Format backend memang persis seperti itu:

```json
{ "username": ["A user with that username already exists."] }
{ "password": ["This field is required."] }
```

Penanganan error yang sudah ada di frontend **tidak perlu diubah**.

### 3. Response login memuat `refresh` sebelum `access`

Frontend wajib menyimpan keduanya. `Login.tsx` saat ini sudah melakukannya.

### 4. Access token hanya berlaku 30 menit

**Sudah ditangani di frontend.** `frontend/src/services/api.ts` memasang response
interceptor yang mencoba `POST /api/auth/refresh/` saat menerima 401, lalu mengulang
request aslinya. Bila refresh gagal, token dihapus dan user diarahkan ke `/login`.

### 5. Wajib simpan refresh token terbaru

Karena rotasi aktif, setiap pemanggilan `/api/auth/refresh/` menghasilkan refresh token
baru. Token lama masih berlaku, jadi tidak ada konflik, tetapi tetap simpan yang terbaru.

### 6. `reporter` harus dikirim manual saat membuat pengaduan

Backend **tidak** mengambil `reporter` dari token. Client wajib mengirim `reporter` dengan
id user. Ambil id ini dari `GET /api/auth/me/` (field `id`).

> **Perhatian:** frontend saat ini memfilter pengaduan berdasarkan
> `reporter === user.id` di browser, tapi karena backend mengembalikan seluruh pengaduan
> ke semua pengguna, filter itu bukan batas keamanan. Lihat
> [`../README.md` §13.2](../README.md).

### 7. Status Complaint

Backend memakai: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`.

**Frontend sekarang sudah cocok.** `StatusBadge.tsx` memakai empat nilai uppercase yang
sama, dan dashboard admin menghitung agregat langsung dari nilai tersebut.

### 8. Field `image` belum bisa dipakai

`CreateComplaint.tsx` punya UI upload foto, tetapi **backend belum menerima field
`image`** karena tidak terdaftar di serializer. Upload tidak akan tersimpan dan tidak akan
muncul di response.

### 9. Complaint tidak terfilter per user

`GET /api/complaints/` mengembalikan **semua** pengaduan, bukan hanya milik user yang login.
Karena itu, halaman daftar pengaduan di frontend tidak bisa mengandalkan endpoint ini untuk
menampilkan "pengaduan saya" tanpa filter tambahan di sisi client.

### 10. Tidak ada paginasi

Semua list endpoint mengembalikan seluruh data sekaligus. Untuk dataset besar, ini perlu
diperhatikan.

### 11. `401` berarti token hilang atau kedaluwarsa

- `{"detail":"Authentication credentials were not provided."}` → tidak mengirim header.
- `{"detail":"Token is invalid or expired."}` → token salah atau kedaluwarsa.

Keduanya perlu ditangani dengan mengarahkan user ke halaman login atau mencoba refresh.

### 12. Cors

Backend hanya mengizinkan origin `http://localhost:5173` (`config/settings.py:66`), yaitu
port default Vite. Jika frontend dijalankan di port lain, request akan diblokir CORS.

> **Gotcha:** `http://127.0.0.1:5173` **tidak** tercantum, padahal `frontend/.env`
> memakai `127.0.0.1` untuk `VITE_API_URL`. Itu tidak masalah — yang diperiksa browser
> adalah origin halaman frontend, bukan `VITE_API_URL`. Tapi buka frontend lewat
> `http://127.0.0.1:5173` akan gagal. Gunakan `http://localhost:5173`.

---

## 13. Endpoint yang Belum Tersedia

Bagian ini sengaja dicantumkan agar tidak disalahartikan sebagai endpoint yang ada.

### 13.1 Endpoint yang tidak ada

| Endpoint / Fitur | Status | Catatan |
| --- | --- | --- |
| Upload gambar pada complaint | **Belum tersedia** | Field `image` ada di model tapi tidak ada di serializer |
| `GET /api/auth/logout/` | **Belum tersedia** | Tidak ada view logout; token tidak bisa dicabut dari server |
| Blacklist / revoke token | **Belum tersedia** | App `token_blacklist` tidak terpasang |
| `GET /api/auth/users/` | **Belum tersedia** | Tidak ada endpoint untuk daftar user |
| Ganti password | **Belum tersedia** | Tidak ada view untuk mengubah password |
| Filter / search / sort pada list | **Belum tersedia** | Tidak ada query parameter di endpoint list |
| Paginasi | **Belum tersedia** | `ListCreateAPIView` tanpa pagination class |
| Endpoint khusus admin/staff | **Belum tersedia** | Tidak ada permission berbasis role; semua user akses sama |
| Dashboard / statistik | **Belum tersedia** | Tidak ada endpoint agregasi. Dashboard admin di frontend menghitung sendiri dari `GET /complaints/` |
| Verifikasi email / reset password | **Belum tersedia** | Tidak ada email verification |

### 13.2 Catatan tentang Django admin

`GET /admin/` tersedia dari Django, **bukan** endpoint API. Ini adalah dashboard berbasis
session Django, bukan JSON, dan hanya bisa diakses user dengan `is_staff=True` atau
`is_superuser=True`.

Akun admin dibuat lewat `python manage.py createsuperuser`, bukan lewat `/api/auth/register/`.
User yang daftar via API selalu `is_staff=False`, sehingga tidak bisa mengakses `/admin/`.

---

## 14. Catatan Keamanan

Hal-hal berikut terverifikasi dan perlu diketahui sebelum backend dipakai lebih luas:

1. **`SECRET_KEY` di-hardcode** di `config/settings.py:24`. Dipakai untuk menandatangani
   JWT. Jangan commit ke repository publik.

2. **`DEBUG = True`** di `config/settings.py:27`. Jangan aktifkan di production.

3. **`ALLOWED_HOSTS = []`** di `config/settings.py:29`. Saat `DEBUG=True`, Django hanya
   mengizinkan `localhost`, `127.0.0.1`, dan `[::1]`. Host lain akan ditolak dengan
   `DisallowedHost`.

4. **Tidak ada pembatasan role.** User `STUDENT` bisa membuat dan menghapus facility maupun
   complaint. Sudah diverifikasi.

5. **Tidak ada pembatasan ownership pada complaint.** User A bisa melihat, mengubah
   (`PATCH`/`PUT`), dan menghapus (`DELETE`) pengaduan milik user B. Sudah diverifikasi.

6. **Register tidak memvalidasi kekuatan password.** `AUTH_PASSWORD_VALIDATORS` ada di
   settings, tapi `RegisterSerializer` tidak memanggil `validate_password()`. Password
   `"123"` berhasil didaftarkan. Sudah diverifikasi.

7. **`reporter` diisi manual oleh client.** Client bisa mengatas-acak id user lain saat
   membuat pengaduan.

8. **Tidak ada rate limiting** pada endpoint login/register.

9. **`CORS_ALLOWED_ORIGINS` hanya untuk `http://localhost:5173`.** Tidak ada konfigurasi
   untuk environment lain.

---

## Lampiran: Ringkasan Verifikasi

Dokumen ini disusun dengan memeriksa kode secara langsung **dan** menjalankan request
sungguhan terhadap database in-memory (dev `db.sqlite3` tidak diubah). Hasil yang
dikonfirmasi:

| Aspek | Status |
| --- | --- |
| `manage.py check` | Lulus, 0 issues |
| Jumlah endpoint API | 8 path / 16 method (diverifikasi via URL resolver) |
| Response register | `201` dengan `{"username": "..."}` |
| Response login | `200` dengan `{refresh, access}` |
| Rotasi refresh token | Mengembalikan `access` + `refresh` baru |
| Reuse refresh token lama | Masih `200` (blacklist tidak aktif) |
| `GET /api/auth/me/` tanpa token | `401` |
| Complaint tanpa `reporter` | `400 {"reporter": [...]}` |
| Field `image` | Diabaikan (tidak ada di serializer) |
| Register dengan `role=ADMIN` | Tetap `STUDENT` |
| Password pendek `"123"` | Diterima (`201`) |
| `permissions.py` | Tidak ada di project |
| Environment variables | Tidak ada |
| `makemigrations --check` | `No changes detected` |

> Verifikasi di atas berlaku untuk kode backend, yang **tidak berubah** dalam
> pembaruan terakhir. Yang berubah adalah frontend — lihat
> [`../README.md` §15](../README.md) dan
> [`../frontend/README.md` §18](../frontend/README.md).