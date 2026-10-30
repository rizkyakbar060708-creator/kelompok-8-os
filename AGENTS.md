# AGENTS.md — CampusCare

Aplikasi pengaduan fasilitas kampus: Django REST Framework (JWT) + React/Vite/TS.
Dua aplikasi terpisah, tidak berbagi kode, komunikasi murni HTTP/JSON.

## Aturan Kerja Agent

### Scope dan Branch

- Jangan berpindah branch atau membuat branch baru kecuali diminta secara eksplisit.
- Untuk pekerjaan UI, pertahankan branch `ui` dan ubah file frontend saja.
- Jangan mengubah file backend, database, atau konfigurasi backend ketika tugas hanya menyangkut UI.
- Jika tugas membutuhkan perubahan di luar scope yang diminta, jelaskan alasannya dan minta persetujuan sebelum melakukannya.

### Git dan Perubahan File

- Jangan menjalankan operasi Git yang mengubah repository, termasuk checkout, switch, commit, merge, reset, stash, atau push, tanpa instruksi eksplisit.
- Periksa status repository dan perubahan yang sudah ada sebelum mulai bekerja.
- Jangan menimpa atau menghapus perubahan pengguna yang belum di-commit.
- Jangan membuat file baru jika kebutuhan dapat dipenuhi dengan struktur yang sudah ada, kecuali pembuatan file memang diperlukan.

### Workflow

- Baca instruksi project dan file kode terkait sebelum membuat perubahan.
- Untuk pekerjaan UI, baca `design.md` dan periksa implementasi aktual di frontend.
- Untuk tugas yang kompleks, analisis masalah dan ajukan rencana sebelum mengimplementasikan perubahan.
- Jangan mengklaim suatu tes berhasil jika tes tersebut belum benar-benar dijalankan.
- Setelah perubahan, jalankan validasi yang relevan dan laporkan hasil aktualnya.
- Jelaskan file yang diubah, alasan perubahan, hasil validasi, dan masalah yang belum terselesaikan.

## Peta repo

| Path | Isi |
| --- | --- |
| `backend/` | Django API (`config/` = settings+urls, `apps/{accounts,facilities,complaints}`) |
| `frontend/` | React SPA (`src/{pages,components,services,contexts,utils,routes}`) |
| `README.md`, `backend/README.md`, `frontend/README.md` | Dokumentasi lengkap, **sebagian besar sudah usang** (lihat di bawah) |

Entry point: `backend/manage.py`, `backend/config/settings.py`, `backend/config/urls.py`,
`frontend/src/main.tsx`, `frontend/src/routes/AppRoutes.tsx`, `frontend/src/services/api.ts`.

## Menjalankan

```bash
# backend/ (venv lokal sudah ada: .venv)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # http://127.0.0.1:8000

# frontend/
npm install
npm run dev                        # http://localhost:5173
```

`frontend/.env` **tidak** ada di git — buat manual:

```env
VITE_API_URL="http://127.0.0.1:8000/api"
```

Backend tidak punya `.env` sama sekali; `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, dan
`CORS_ALLOWED_ORIGINS` ditulis langsung di `config/settings.py`. Changing `SECRET_KEY`
membatalkan **seluruh** token JWT yang sedang berlaku.

## Verifikasi

- Frontend: `npm run lint` lalu `npm run build` (`build` menjalankan `tsc -b` + vite build,
  jadi type-check sudah termasuk). Tidak ada runner test di frontend.
- Backend: `python manage.py check`, lalu `python manage.py test` — suite di
  `apps/accounts/tests.py` dan `apps/complaints/tests.py` sudah punya test method
  yangsungguhan (otorisasi, blacklist token, upload gambar). Jalankan dari
  `backend/` dengan venv lokal: `.\.venv\Scripts\python.exe manage.py test`.
  Lambatnya (~2 menit) berasal dari pembuatan PNG besar untuk tes batas ukuran.
- `python manage.py makemigrations --check --dry-run` harus keluar `No changes detected`.
  App `token_blacklist` membawa migrasinya sendiri di dalam paket, jadi memasang
  blacklist **tidak** menambah file migrasi di repo ini. `0002_alter_user_managers.py`
  ada karena `UserManager` kustom di `accounts` mengubah state model — isinya
  `managers=[]` jadi tidak mengubah apa pun saat runtime.
- Tidak ada CI, pre-commit, atau formatter. Hanya ESLint flat config
  (`frontend/eslint.config.js`); tidak ada Prettier.

## Gotcha API (ludah ke backend)

- **Base URL harus berakhiran `/api`.** Semua service memakai path relatif tanpa `/api`
  (`api.get("/complaints/")` → `.../api/complaints/`). Jangan menambahkan `/api` lagi
  di dalam service. Pengecualian: refresh di `services/api.ts` memakai URL penuh
  `${VITE_API_URL}/auth/refresh/`.
- **Semua URL backend wajib trailing slash** — tanpa itu Django balas 301.
- **CORS hanya mengizinkan `http://localhost:5173`** (`settings.py`). Buka frontend lewat
  `localhost`, bukan `127.0.0.1`, atau seluruh request API diblokir.
- JWT: access 30 menit, refresh 7 hari, rotasi **dan** blacklist aktif
  (`token_blacklist` sudah terpasang). Setiap refresh mengembalikan refresh token
  baru dan **token lama langsung dibatalkan**, jadi frontend wajib menyimpan
  `refresh` hasil rotasi (`services/api.ts`) — kalau dibuang, sesi user berikutnya
  langsung 401. Logout memanggil `POST /api/auth/blacklist/` dan selalu membersihkan
  `localStorage`, jadi kegagalan request tidak membuat user terjebak login.
  Endpoint blacklist **wajib** memakai `BlacklistView` di `apps/accounts/views.py`,
  bukan `TokenBlacklistView` bawaan: yang bawaan mewarisi `TokenViewBase` dengan
  `permission_classes = ()` sehingga siapa pun bisa mencabut token milik orang lain.
- Upload complaint pakai `FormData` dan **Content-Type sengaja tidak diset**; memaksa
  `application/json` merusak boundary multipart.
- `image` dikembalikan sebagai path `/media/...` **tanpa host**. Pakai
  `resolveMediaUrl()` dari `utils/media.ts` sebelum memakainya sebagai `src`;
  path mentah akan dicari di origin frontend dan 404. `config/urls.py` hanya
  menyajikan media saat `DEBUG=True`.

## Gotcha auth & otorisasi

Tiga role: `STUDENT`, `STAFF`, `ADMIN`. Pembanding role terpusat di
`apps/accounts/permissions.py` lewat `is_admin()` dan `is_manager()`; jangan
menulis `user.role == "..."` langsung di tempat lain, karena frontend menentukan
akses dari field yang sama dan konsistensi dua sisi akan cepat rusak.

**Field `role` adalah satu-satunya sumber kebenaran.** `is_superuser` sengaja
tidak ikut dihitung: flag itu hanya mengatur akses ke situs `/admin/` Django,
bukan ke API. Kalau digabung, akun berlabel `STUDENT` yang dibuat lewat
`createsuperuser` akan berperilaku seperti admin penuh — persis kekacauan yang
pernah terjadi di repo ini. Supaya akun paradoxical itu tidak muncul,
`UserManager.create_superuser()` di `apps/accounts/models.py` sudah mengisi
`role=ADMIN` secara default (akun lama yang sudah terlanjur ada harus diubah
manual lewat `/admin/`).

| Aksi | STUDENT | STAFF | ADMIN |
| --- | --- | --- | --- |
| Lihat daftar/detail pengaduan | miliknya saja | semua | semua |
| Ubah `status`/`priority` | tidak | ya | ya |
| Hapus pengaduan | miliknya, hanya saat `PENDING` | tidak | semua |
| Nama pelapor (`reporter_username`) | null | null | terisi |
| Tulis fasilitas | tidak | tidak | ya |

- **Ownership pengaduan ditegakkan di backend.** `ScopedComplaintMixin.get_queryset()`
  memfilter `reporter=request.user`; `is_manager()` (STAFF/ADMIN) tetap melihat semua.
  Karena filtering terjadi di queryset, pengaduan milik orang lain balas **404**,
  bukan 403, sehingga id milik orang lain tidak bisa diprobe. Endpoint list ikut
  terlindungi, sedangkan `IsManagerOrOwner` hanya lapisan kedua yang menutup celah kalau
  suatu saat ada view yang lupa melakukan scoping.
- **`status` dan `priority` hanya boleh diubah pengelola** (STAFF/ADMIN).
  `ComplaintSerializer.validate()` menolak dua field itu untuk selain pengelola,
  termasuk saat create. Tanpa ini pemilik bisa menandai pengaduannya sendiri
  sebagai `RESOLVED`. Perbandingan saat create memakai **default model**
  (`_current_value()`), bukan `None` dari instance yang belum ada — kalau tidak,
  form yang mengirim nilai default ikut ditolak padahal tidak mengubah apa pun.
- **Hapus pengaduan diatur `CanDeleteComplaint`** di `apps/complaints/permissions.py`
  (bukan di `accounts` supaya app itu tidak tahu model pengaduan): admin bebas,
  mahasiswa hanya miliknya yang masih `PENDING`, staf selalu 403. Permission ini
  hanya berlaku untuk method DELETE; untuk method lain ia selalu `true` karena
  `IsManagerOrOwner` yang mengurus.
- **`reporter_username` read-only dan hanya diisi untuk admin**
  (`SerializerMethodField`). Dihitung di serializer, bukan disembunyikan di
  frontend, supaya identitas pelapor benar-benar tidak pernah dikirim ke role lain.
- Fasilitas tetap hanya ADMIN yang menulis (`IsAdminOrReadOnly`).
- `reporter` read-only di serializer dan diisi dari access token (`perform_create`),
  jadi jangan kirim field itu saat membuat pengaduan.
- Register memaksa `role=STUDENT` (field `role` tidak ada di `RegisterSerializer`,
  jadi client tidak bisa mendaftar sebagai ADMIN) **dan** menjalankan
  `validate_password()` lewat `django.contrib.auth.password_validation`.
  Cara membuat akun `STAFF`/`ADMIN`: daftar seperti biasa, lalu ubah kolom Role
  lewat Django admin `/admin/` pada user tersebut. `createsuperuser` sudah otomatis
  mengisi `role=ADMIN`, jadi tidak perlu diubah manual.
- Rate limit global aktif di `settings.py` (`AnonRateThrottle` 60/menit,
  `UserRateThrottle` 300/menit). State-nya in-memory per proses, jadi di produksi
  multi-worker angka ini tidak berlaku konsisten tanpa cache bersama.
- Fallback `ProtectedRoute` harus `/forbidden`, bukan kembali ke route yang sedang
  dijaga; kalau tidak, guard dievaluasi ulang dan terjadi infinite redirect loop.
  Jangan diubah tanpa paham alasannya.

## Peta endpoint manajemen pengguna (khusus ADMIN)

| Method | URL | Akses | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/users/` | ADMIN | Daftar semua pengguna, diurutkan username. `complaints_count` dari `annotate(Count("complaints"))`. Tanpa password. |
| PATCH | `/api/users/<id>/` | ADMIN | Hanya mengubah `role`. Admin tidak boleh mengubah role akun sendiri (400, Bahasa Indonesia). |
| POST | `/api/users/<id>/password/` | ADMIN | Atur ulang password pengguna lain. Body `{"password": "..."}` divalidasi lewat `django.contrib.auth.password_validation.validate_password(password, user=target)`. Simpan lewat `set_password`. Semua refresh token target masuk blacklist. Respons 204 tanpa body. Password tidak pernah dikembalikan, disimpan, atau ditampilkan dalam bentuk apa pun. |

Gotcha otorisasi:

- `/api/users/` khusus **ADMIN** untuk semua method (termasuk GET). Jangan gunakan
  `IsAdminOrReadOnly` karena itu membuka read untuk semua role.
- Admin **tidak boleh mengubah role akun miliknya sendiri** (400, pesan Bahasa
  Indonesia). Aturan ini sendiri sudah menjamin minimal satu admin tersisa, jadi
  tidak perlu guard "admin terakhir".
- Password disimpan sebagai hash oleh Django (`set_password`). API dan UI tidak
  pernah menyimpan, mengembalikan, atau menampilkan password dalam bentuk apa pun.
  Reset password oleh admin mencabut semua refresh token milik target agar sesi
  lama tidak dapat digunakan lagi.

## TODO yang sengaja ditunda

Belum dikerjakan, sengaja dikecualikan dari perbaikan sekarang:

- Pagination untuk `GET /api/complaints/` (endpoint masih mengembalikan seluruh
  baris) dan endpoint agregasi statistik untuk dashboard admin.
- Nested facility di serializer supaya frontend tidak perlu join PK ke daftar
  fasilitas di client.
- Cache daftar fasilitas antar halaman (sekarang di-fetch ulang tiap navigasi).
- Index database untuk `Complaint.created_at` dan `Complaint.status`, plus
  `select_related("facility")` di queryset.
- Thumbnail untuk foto pengaduan (sekarang file asli dilayani apa adanya).

## Database & media

- `backend/db.sqlite3` **tidak di-track** (root `.gitignore` punya `*.sqlite3`), meski
  README mengklaim ikut disertakan. Clone baru wajib `python manage.py migrate`.
- `backend/media/` juga di-ignore, jadi foto complaint tidak ikut ter-commit.
- Setelah migrate, database kosong: buat superuser (`python manage.py createsuperuser`)
  dan isi Facility lewat Django admin `/admin/` sebelum pengaduan bisa dibuat.

## Sumber kebenaran & konvensi

- **Kode mengalahkan README.** Klaim §13 Known Issues di README sudah usang:
  field `image` kini ada di serializer dan bisa diunggah, `reporter` sudah
  read-only dari token, ownership pengaduan ditegakkan di backend, dan
  `token_blacklist` sudah aktif. Baca kode sebelum percaya §13.
- Commit: Conventional Commits (`feat:`, `chore:`, `feat(frontend):`).
- Docs, komentar kode, dan teks UI berbahasa Indonesia. Komentar menjelaskan *kenapa*
  sebuah keputusan diambil (mis. batas `DATA_UPLOAD_MAX_MEMORY_SIZE` di
  `settings.py` sengaja lebih besar dari batas 5 MB serializer). Ikuti gaya itu —
  jangan menambah komentar untuk hal yang sudah jelas dari kode.
- UI memakai design system "liquid glass" (`glass-panel`, `glass-card`, `glass-chip`,
  `brand-mark`) yang didefinisikan di `frontend/src/index.css`; pakai class itu, bukan
  utility Tailwind ad-hoc untuk permukaan kaca.
- Vite memakai React Compiler lewat `@rolldown/plugin-babel` + `reactCompilerPreset()`
  di `vite.config.ts`.

- `design.md` adalah referensi desain frontend. Baca bagian yang relevan sebelum mengubah UI, termasuk token CSS, komponen, permukaan kaca, interaksi, breakpoint, dan aksesibilitas.
- `design.md` mendokumentasikan kondisi desain dan kode pada saat analisis dilakukan. Selalu verifikasi implementasi aktual sebelum mengandalkan klaim atau nomor baris di dokumen tersebut.
- Jangan menganggap rekomendasi atau komponen yang direncanakan di `design.md` sudah diimplementasikan.
- Pertahankan konsistensi visual dan keterbacaan. Jangan menambahkan efek liquid glass yang mengurangi kontras atau aksesibilitas.
- Perbarui `design.md` jika perubahan yang disetujui secara material mengubah design system atau dokumentasi desain.
