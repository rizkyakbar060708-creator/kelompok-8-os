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
- Backend: `python manage.py check`. `python manage.py test` **hijau tanpa arti** —
  semua `apps/*/tests.py` cuma stub `TestCase` tanpa test method (0 test).
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
- JWT: access 30 menit, refresh 7 hari, rotasi aktif. App `token_blacklist` **tidak**
  terpasang, jadi refresh token lama masih valid dan logout hanya menghapus
  `localStorage`. Interceptor di `api.ts` hanya menyimpan access token baru —
  refresh token hasil rotasi dibuang; aman hanya selama blacklist belum aktif.
- Upload complaint pakai `FormData` dan **Content-Type sengaja tidak diset**; memaksa
  `application/json` merusak boundary multipart.
- `image` dikembalikan sebagai path absolut `/media/...`, dan `config/urls.py` hanya
  menyajikan media saat `DEBUG=True`.

## Gotcha auth & otorisasi

- **Role hanya membatasi tampilan di frontend.** Backend tidak punya `permissions.py`,
  `get_queryset()` scoping, atau ownership check. `GET /api/complaints/` mengembalikan
  seluruh pengaduan ke siapa pun yang terautentikasi, dan `ComplaintDetailView` memakai
  `Complaint.objects.all()`, jadi user A bisa edit/hapus pengaduan user B. Filter
  `reporter === user.id` di dashboard murni kosmetik (lihat TODO di
  `services/complaintService.ts`).
- `reporter` sudah read-only di serializer dan diisi dari access token
  (`perform_create`), jadi jangan kirim field itu saat membuat pengaduan.
- Register selalu memaksa `role=STUDENT` dan **tidak** menjalankan
  `validate_password()` — password lemah diterima.
- Fallback `ProtectedRoute` harus `/forbidden`, bukan kembali ke route yang sedang
  dijaga; kalau tidak, guard dievaluasi ulang dan terjadi infinite redirect loop.
  Jangan diubah tanpa paham alasannya.

## Database & media

- `backend/db.sqlite3` **tidak di-track** (root `.gitignore` punya `*.sqlite3`), meski
  README mengklaim ikut disertakan. Clone baru wajib `python manage.py migrate`.
- `backend/media/` juga di-ignore, jadi foto complaint tidak ikut ter-commit.
- Setelah migrate, database kosong: buat superuser (`python manage.py createsuperuser`)
  dan isi Facility lewat Django admin `/admin/` sebelum pengaduan bisa dibuat.

## Sumber kebenaran & konvensi

- **Kode mengalahkan README.** Perubahan terakhir (belum di-commit) membuat beberapa
  klaim README salah: field `image` kini ada di serializer dan bisa diunggah,
  `reporter` sudah read-only dari token, route `/complaints/:id` sudah terdaftar,
  dan halaman Pengaduan/Buat Pengaduan sudah terhubung API. Baca kode sebelum
  percaya §13 Known Issues.
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
