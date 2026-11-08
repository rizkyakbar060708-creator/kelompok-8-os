# CampusCare — Backend

REST API CampusCare dibangun dengan Django REST Framework, SQLite, dan JWT. Base URL
development adalah `http://127.0.0.1:8000/api`.

## Menjalankan

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver
```

Backend tidak memakai `.env`; konfigurasi ada di `config/settings.py`.

## Struktur dan otorisasi

- `apps/accounts/permissions.py` berisi pengecekan role API.
- `apps/complaints/permissions.py` berisi aturan penghapusan pengaduan.
- `apps/complaints/migrations/0002_complaint_category_and_incident_fields.py`
  menambahkan kategori, informasi kejadian, dan anonimitas.
- `apps/complaints/migrations/0004_appeal.py` menambahkan model `Appeal` beserta
  constraint satu banding `PENDING` per laporan.

Role aplikasi adalah `STUDENT`, `STAFF`, dan `ADMIN`. Field `role` merupakan satu-satunya
sumber kebenaran API; `is_staff` dan `is_superuser` hanya mengatur dashboard Django
`/admin/`.

| Aksi | STUDENT | STAFF | ADMIN |
| --- | --- | --- | --- |
| Lihat laporan biasa | Miliknya | Semua | Semua |
| Lihat `PELECEHAN_PERUNDUNGAN` | Miliknya | Tidak | Semua |
| Ubah status/prioritas | Tidak | Ya | Ya |
| Hapus laporan | Miliknya saat `PENDING` | Tidak | Semua |
| Ajukan banding pada laporan `REJECTED` | Miliknya | Tidak | Tidak |
| Putuskan banding | Tidak | Tidak | Ya |
| Menulis fasilitas | Tidak | Tidak | Ya |

Register selalu membuat akun `STUDENT`. Access token berlaku 30 menit dan refresh token
7 hari. Refresh token dirotasi serta token sebelumnya masuk blacklist, sehingga client
wajib menyimpan refresh token baru.

## Endpoint

Semua URL wajib memakai trailing slash.

| Method | URL | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/auth/register/` | Public | Daftar akun STUDENT |
| POST | `/api/auth/login/` | Public | Mengambil access dan refresh token |
| POST | `/api/auth/refresh/` | Public | Merotasi refresh token |
| POST | `/api/auth/blacklist/` | Bearer | Mencabut refresh token |
| GET | `/api/auth/me/` | Bearer | Profil user sendiri |
| GET, POST | `/api/facilities/` | Bearer; POST ADMIN | Daftar atau buat fasilitas |
| GET, PUT, PATCH, DELETE | `/api/facilities/{id}/` | Bearer; tulis ADMIN | Kelola fasilitas |
| GET, POST | `/api/complaints/` | Bearer | Daftar terotorisasi atau buat laporan |
| GET, PUT, PATCH, DELETE | `/api/complaints/{id}/` | Bearer | Kelola laporan terotorisasi |
| GET | `/api/users/` | ADMIN | Daftar pengguna dan jumlah laporan |
| PATCH | `/api/users/{id}/` | ADMIN | Mengubah role pengguna lain |
| POST | `/api/users/{id}/password/` | ADMIN | Reset password pengguna lain; `204` |

| GET | `/api/complaints/{id}/appeals/` | Bearer | Riwayat banding laporan itu (urut terbaru) |
| POST | `/api/complaints/{id}/appeals/` | Bearer, pemilik laporan | Ajukan banding; `multipart` (`reason`, `evidence` opsional); `201` |
| GET | `/api/appeals/` | ADMIN | Antrean semua banding; filter `?status=PENDING` |
| PATCH | `/api/appeals/{id}/` | ADMIN | Putuskan banding; `JSON {status, response_note}` |

Respons `/api/users/` tidak pernah memuat password atau hash. ADMIN tidak dapat mengubah
role maupun mereset password akunnya sendiri.

## Pengaduan

Pelapor diambil dari access token ketika `POST /api/complaints/`; frontend tidak boleh
mengirim `reporter`. Respons memuat `facility`, `category`, `sub_category`, `title`,
`description`, `status`, `priority`, `image`, `incident_location`, `incident_date`,
`is_anonymous`, timestamp, serta `reporter` dan `reporter_username` sesuai hak akses.

| Category | Facility | Sub-kategori yang diizinkan |
| --- | --- | --- |
| `FASILITAS` | Wajib | Harus kosong |
| `AKADEMIK` | Harus kosong | `JADWAL_KULIAH`, `DOSEN_TIDAK_HADIR`, `KESALAHAN_NILAI`, `KENDALA_KRS`, `PELAYANAN_AKADEMIK` |
| `KEAMANAN` | Harus kosong | `KEHILANGAN_BARANG`, `MASALAH_PARKIR`, `PENCURIAN`, `GANGGUAN_KEAMANAN`, `PELECEHAN_PERUNDUNGAN` |

Sub-kategori wajib diisi saat membuat laporan `AKADEMIK`/`KEAMANAN`. Laporan lama yang
belum memiliki sub-kategori tetap valid saat di-update selama field itu tidak dikirim ulang.

`incident_date` opsional, tetapi tidak boleh di masa depan. `incident_location` opsional.
`PENCURIAN` dan `PELECEHAN_PERUNDUNGAN` otomatis menjadi prioritas `HIGH` saat dibuat.

`category`, `sub_category`, dan `is_anonymous` hanya dapat diisi saat create. Ketiganya
ditolak pada PUT maupun PATCH untuk semua role agar aturan akses dan lampiran tidak dapat
dilewati.

### Laporan sensitif dan anonim

Hanya `PELECEHAN_PERUNDUNGAN` yang sensitif. Laporan ini hanya tersedia bagi pelapor dan
ADMIN—termasuk pada list, detail, dan filter. STAFF tetap dapat melihat `PENCURIAN`.

`is_anonymous: true` menyembunyikan `reporter` dan `reporter_username` dari STAFF. ADMIN
tetap melihat identitas tersebut dan pelapor tetap melihat identitasnya sendiri. Frontend
harus menjelaskan bahwa anonimitas membatasi visibilitas dari STAFF, bukan dari ADMIN atau
dari pelapor sendiri.

Foto PNG/JPEG maksimal 5 MB dapat dikirim dengan `multipart/form-data`; jangan set header
`Content-Type` manual saat memakai `FormData`. Gambar dilarang untuk `PENCURIAN` dan
`PELECEHAN_PERUNDUNGAN` pada create, PUT, dan PATCH. Path `image` bersifat relatif
(`/media/...`) dan harus diubah menjadi URL backend, misalnya dengan `resolveMediaUrl()`.

### Filter dan pembaruan

`GET /api/complaints/` mendukung filter exact:

```text
?category=KEAMANAN
?sub_category=PENCURIAN
?status=PENDING
?priority=HIGH
```

`GET /api/complaints/categories/` mengembalikan kategori beserta sub-kategorinya untuk
dropdown dan filter:

```json
[{"value": "FASILITAS", "label": "Fasilitas", "sub_categories": []},
 {"value": "AKADEMIK", "label": "Akademik", "sub_categories": [{"value": "JADWAL_KULIAH", "label": "Jadwal kuliah"}, {"value": "...", "label": "..."}]}]
```

Path ini didaftarkan sebelum `<int:pk>/` agar tidak dianggap sebagai id pengaduan.

Backend melakukan scoping role/ownership sebelum query parameter. Filter tidak dapat
membuka laporan orang lain untuk STUDENT atau laporan sensitif untuk STAFF. Belum ada
pagination, search, atau sorting.

STUDENT dapat mengubah isi laporan miliknya, tetapi tidak dapat mengubah `status` atau
`priority`. STAFF dan ADMIN dapat mengubah keduanya. Laporan orang lain yang tidak
diizinkan selalu memberi `404`, bukan `403`.

## Banding (Appeal)

Mahasiswa dapat mengajukan keberatan atas laporan yang ditolak. Model `Appeal` terhubung
ke `Complaint` dan hanya boleh dibuat dari endpoint nested berikut:

```text
POST /api/complaints/{id}/appeals/   # multipart: reason, evidence (opsional)
GET  /api/complaints/{id}/appeals/   # riwayat banding laporan, urut terbaru
GET  /api/appeals/?status=PENDING    # antrean banding, khusus ADMIN
PATCH /api/appeals/{id}/             # keputusan: {status: ACCEPTED|DENIED, response_note}
```

JSON banding: `id`, `complaint`, `complaint_title`, `status`, `reason`, `evidence`,
`response_note`, `reviewer_name`, `reviewed_at`, `created_at`. Tidak ada field pelapor,
jadi identitas pengadu hanya diketahui lewat `reporter_username` pada laporannya sendiri.

Aturan banding, ditegakkan di `AppealCreateSerializer` dan `AppealDecisionSerializer`:

| Aturan | Perlakuan |
| --- | --- |
| Hanya laporan `REJECTED` yang boleh dibanding | `400` pada status lain |
| Hanya pemilik laporan yang boleh mengajukan | Laporan milik orang lain `404`; staf/admin yang bisa membaca laporan tetap `403` |
| Satu banding `PENDING` per laporan | `400`; laporan yang sudah DENIED boleh dibanding ulang |
| Hanya ADMIN yang memutuskan | `403` untuk STUDENT maupun STAFF; STAFF tidak sengaja disamakan dengan admin pada fitur ini |
| Keputusan (`ACCEPTED`/`DENIED`) hanya untuk banding `PENDING` | `400` untuk banding yang sudah diputuskan |
| Banding diterima | Status laporan kembali `PENDING` (masuk antrean lagi); `resolved_at` dibersihkan oleh `Complaint.save()` |
| Banding ditolak | Status laporan tidak berubah; `reviewer`, `response_note`, `reviewed_at` tetap terisi |

Bukti berupa satu gambar, wajib `multipart/form-data`, validasinya sama dengan foto
pengaduan (PNG/JPEG, maksimal 5 MB, allowlist berbasis isi file yang dibaca Pillow).
Untuk laporan `PENCURIAN` dan `PELECEHAN_PERUNDUNGAN` gambar bukti dilarang karena
`/media/` dilayani publik; banding tanpa bukti untuk laporan tersebut tetap boleh.
`evidence` dikembalikan sebagai path `/media/...` tanpa host, sama seperti `image` pada
pengaduan.

Akses mengikuti pola pengaduan: objek milik orang lain membalas `404`, laporan
`PELECEHAN_PERUNDUNGAN` tidak pernah terlihat oleh STAFF (berlaku juga pada endpoint
nested banding), dan admin melihat semuanya.

## Catatan frontend

- Base URL harus berakhir dengan `/api`; service memakai path relatif seperti
  `/complaints/`.
- CORS development hanya mengizinkan `http://localhost:5173`.
- Media disajikan Django hanya saat `DEBUG=True`.
- Saat menerima `401`, lakukan refresh dan simpan refresh token hasil rotasi.

## Verifikasi

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test
```

Suite menguji ownership, akses sensitif, anonimitas, filter yang tidak membocorkan data,
validasi kategori, prioritas otomatis, upload gambar, JWT blacklist, serta pengajuan dan
keputusan banding (`AppealTests`).
