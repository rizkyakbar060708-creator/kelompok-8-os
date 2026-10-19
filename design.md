# CampusCare — Design System

Dokumen ini adalah acuan visual dan interaktif untuk aplikasi CampusCare, ditulis
**berdasarkan implementasi frontend yang benar-benar ada di repository ini**, bukan
deskripsi karangan. Sumber kebenaran adalah kode: `frontend/src/index.css` dan
seluruh file di `frontend/src/**/*.tsx`.

> **Status dokumen:** aktual, diperiksa langsung terhadap source.
> **Cakupan:** frontend saja (`frontend/`). Backend tidak punya lapisan UI.
> **Kode mengalahkan README.** `frontend/README.md` §14 masih menggambarkan tema
> gelap navy dengan token `--color-ink-*` dan filter refraksi SVG — semua itu sudah
> tidak ada. Lihat [§16 Ketidaksesuaian Dokumentasi](#16-ketidaksesuaian-dokumentasi-yang-diketahui).

---

## Daftar Isi

1. [Design Philosophy & Visual Direction](#1-design-philosophy--visual-direction)
2. [Color Palette & CSS Variables](#2-color-palette--css-variables)
3. [Typography & Hierarchy](#3-typography--hierarchy)
4. [Spacing System & Layout](#4-spacing-system--layout)
5. [Border Radius, Shadow, Glass Surface, Blur, Gradient](#5-border-radius-shadow-glass-surface-blur-gradient)
6. [Design Tokens & Aturan Penggunaannya](#6-design-tokens--aturan-penggunaannya)
7. [Komponen UI](#7-komponen-ui)
8. [Aturan Desain Per Halaman](#8-aturan-desain-per-halaman)
9. [Status Pengaduan & Pemetaan Tampilannya](#9-status-pengaduan--pemetaan-tampilannya)
10. [Interaction States](#10-interaction-states)
11. [Responsive Design](#11-responsive-design)
12. [Accessibility & Readability](#12-accessibility--readability)
13. [Empty, Loading, Error, Success States](#13-empty-loading-error-success-states)
14. [Aturan Konsistensi untuk Fitur Berikutnya](#14-aturan-konsistensi-untuk-fitur-berikutnya)
15. [Checklist Review UI](#15-checklist-review-ui)
16. [Ketidaksesuaian Dokumentasi yang Diketahui](#16-ketidaksesuaian-dokumentasi-yang-diketahui)

---

## 1. Design Philosophy & Visual Direction

### 1.1 Premis

CampusCare memakai arah desain **Liquid Glass / Glassmorphism** dengan tema **terang
(light-only)**. Filosofinya dirangkum langsung dari komentar Layer 2–3 di
`index.css:102-115`:

> Setiap permukaan kaca dibangun dari empat bagian:
> **(a) rim** → border 1px + edge light inset (catch light di atas),
> **(b) body** → tint putih transparan, cukup pekat untuk teks gelap,
> **(c) specular** → `::before` sheen yang duduk tepat di atas body,
> **(d) depth** → shadow diffus lembut dengan warna yang warnai backdrop.
> Konten selalu melapis di atasnya (`::before` memakai `z-index: -1`).

### 1.2 Prinsip yang benar-benar dijalankan

| Prinsip | Wujud di kode |
| --- | --- |
| **Light, bukan dark** | `color-scheme: light`, base `#f3f2f9`. Tidak ada mode gelap. |
| **Teks gelap di atas kaca terang** | Ink `#0f172a` / `#1e293b` / `#475569` di atas film putih ≥ 50%. |
| **Warna hanya lewat tints tipis** | Aksen pekat hanya di `.btn-primary`, `.brand-mark`, dan bar aktif sidebar. |
| **Kedalaman dari cahaya, bukan garis tebal** | `inset` highlight di tepi atas, shadow besar beralpha rendah. |
| **Detail mahal hanya di tempat yang tepat** | `backdrop-filter` hanya di glass surface, control, dan orb — tidak pernah di konten padat. |
| **Gerakan lembut & singkat** | Semua transisi 200–320 ms dengan `--ease-liquid`. |
| **Hormati preferensi pengguna** | Blok `prefers-reduced-motion` mematikan transisi & hover-lift. |

### 1.3 Aturan keterbacaan yang eksplisit

`index.css:112-114` menyatakan aturan keras proyek ini:

> Body alpha tidak pernah turun di bawah ~0.5 putih. Teks gelap di atas film putih
> 50%+ di atas backdrop pastel lolos WCAG AA dengan comfortable margin, sementara
> warna di belakangnya tetap terbaca sebagai warna.

**Implikasi untuk agent/developer:** jangan pernah menurunkan alpha putih pada
`rgba(255,255,255,·)` di bawah `0.5` pada permukaan yang menahan teks. Menipiskan
film ke bawah, berapa pun ornamentasinya, berarti melanggar aturan ini.

### 1.4 Visual direction dalam satu kalimat

> Pastel penuh cahaya di belakang, permukaan kaca bening di tengah, teks gelap pekat
> di atas, dan satu sapuan warna indigo–violet–fuchsia sebagai tanda tangan.

---

## 2. Color Palette & CSS Variables

### 2.1 Token yang benar-benar di-*define* (`@theme`, `index.css:3-14`)

```css
--color-surface:  #f3f2f9;
--color-brand-100: #e0e7ff;
--color-brand-200: #c7d2fe;
--color-brand-300: #a5b4fc;
--color-brand-400: #818cf8;
--color-brand-500: #6366f1;
--color-brand-600: #4f46e5;
--color-brand-700: #4338ca;
--ease-liquid:    cubic-bezier(0.22, 1, 0.36, 1);
```

### 2.2 Realitas pemakaian token tersebut

| Token | Dipakai? | Bukti |
| --- | --- | --- |
| `--color-surface` | **Ya**, 1× | `body { background: var(--color-surface) }` (`index.css:27`). |
| `--color-brand-100` … `--color-brand-700` | **Tidak** | Nol referensi di `.tsx`/`.ts`. Utility `bg-brand-*`, `text-brand-*`, `border-brand-*` tidak pernah dipakai. (String `brand-` yang muncul di komponen hanyalah class `.brand-mark`, hal berbeda.) |
| `--ease-liquid` | **Ya, banyak** | Dipakai seluruh blok `transition` di `index.css`. |

> **Konsekuensi:** `--color-brand-*` adalah token *reserved*. Palet indigo yang
> benar-benar tampil berasal dari palet default Tailwind (`indigo-*`, `violet-*`),
> yang kebetulan punya nilai identik di 500–700. Kalau suatu saat faktor `--color-brand-500`
> diubah, tampilan **tidak** ikut berubah kecuali komponennya diporting ke `brand-*`.
> Lihat [§14.4](#14-4-rasterisasi-token-yang-belum-dipakai).

### 2.3 Palet riil — warna yang benar-benar dirender

Hampir semua warna berasal dari palet default Tailwind v4, ditulis inline di `className`.

#### Ink (teks)

| Token Tailwind | Hex | Peran | Contoh pemakaian |
| --- | --- | --- | --- |
| `slate-900` | `#0f172a` | Judul, angka metrik | `text-slate-900` |
| `slate-800` | `#1e293b` | Subjudul baris, nama file | `text-slate-800` |
| `slate-700` | `#334155` | Label form, judul section | `text-slate-700` |
| `slate-600` | `#475569` | Body text sekunder, subtitle | `text-slate-600` |
| `slate-500` | `#64748b` | Meta, muted, ikon | `text-slate-500` |
| `slate-400` | `#94a3b8` | **Dihindari** di atas kaca (kontras 2.5:1) | — |
| `slate-300` | `#cbd5e1` | Track spinner guard | `border-slate-300` |

> Aturan: **jangan pakai `slate-400` untuk teks di atas permukaan kaca.** Alasan ini
> sudah ditulis di `index.css:401-402`.

#### Accent (indigo → violet → fuchsia)

| Warna | Pemakaian |
| --- | --- |
| `indigo-500` `#6366f1` | Titik notifikasi, spinner track, `nav-link-accent` bar, fokus outline |
| `indigo-600` `#4f46e5` | Link aksen, label kategori, ikon chip |
| `indigo-700` `#4338ca` | Teks di chip indigo |
| `violet-700` `#6d28d9` | Hover link (`hover:text-violet-700`) |
| `violet-400/500`, `fuchsia-600` | Gradient teks pada halaman 404/403 |

#### Warna status & tone chip

| Tone | Border / bg | Teks | Dipakai untuk |
| --- | --- | --- | --- |
| Sky | `border-sky-200 bg-sky-50/90` | `sky-700` | Metrik "Total pengaduan"; pill role di Profile |
| Amber | `border-amber-200 bg-amber-50/90` | `amber-700` | Metrik "Diproses"/"Menunggu"; CTA "Butuh tindak lanjut?" |
| Emerald | `border-emerald-200 bg-emerald-50/90` | `emerald-700` | Metrik "Telah selesai"/"Selesai" |
| Rose | `border-rose-200 bg-rose-50/90` | `rose-700` | Metrik "Ditolak" (khusus AdminDashboard) |
| Indigo | `border-indigo-200 bg-indigo-50/90` | `indigo-700` | Chip prioritas di ComplaintDetail |
| Slate | `border-slate-200 bg-white/70` | `slate-600` | Chip "Diperbarui …" |
| Indigo-400 | `bg-indigo-400/25` | — | Orb di dalam panel |
| Sky/Amber/Emerald/Rose 300-400 | `bg-*-*/25` | — | Orb metrik (lihat §8.2) |

> Pola ini konsisten: **chip = `border-*-200 bg-*-50/90 text-*-700`** (border 200,
> background 50 dengan opacity 90, teks 700). Pertahankan pola tiga-part ini.

#### Semantic

| Warna | Nilai | Peran |
| --- | --- | --- |
| Red | `#ef4444` (`red-500`), `#b91c1c` (`red-700`), `#991b1b` | Ikon error, `.alert-error`, `icon-button-danger` |
| Green | `emerald-*` | Status `RESOLVED` |

#### Putih & border

| Pola | Nilai |
| --- | --- |
| Border glass | `rgba(255,255,255,0.55–0.95)` |
| Border hairline (pembatas) | `border-slate-900/8`, `border-slate-900/[0.08]`, `divide-slate-900/[0.07]`, `border-white/45` |
| Overlay scrim | `bg-slate-900/25 backdrop-blur-sm` (mobile sidebar) |
| Hover baris | `hover:bg-white/70`, `hover:bg-white/80` |

### 2.4 Latar ambient (`.app-shell`)

Latar bukan warna datar. `index.css:81-90` menyusun 8 lapisan:

1. **Grain SVG** inline data-URI — `feTurbulence fractalNoise baseFrequency=0.9 numOctaves=3`, 180×180, `opacity 0.025`. Gunanya: mencegah *banding* pada gradien besar.
2. `radial-gradient(42rem 32rem at 88% -12%, rgba(99,102,241,0.34), transparent 62%)` — indigo
3. `radial-gradient(38rem 28rem at 2% 8%, rgba(14,165,233,0.28), transparent 60%)` — sky
4. `radial-gradient(40rem 30rem at 96% 58%, rgba(236,72,153,0.24), transparent 62%)` — pink
5. `radial-gradient(34rem 26rem at 22% 96%, rgba(168,85,247,0.24), transparent 60%)` — purple
6. `radial-gradient(30rem 22rem at 62% 38%, rgba(251,146,60,0.18), transparent 60%)` — orange
7. `radial-gradient(26rem 20rem at 8% 62%, rgba(20,184,166,0.16), transparent 60%)` — teal
8. `linear-gradient(162deg, #f8f7fd 0%, #eef1fb 44%, #f7effb 100%)` — base diagonal

#### `.orb` — sumber cahaya yang melayang

```css
.orb { position: absolute; border-radius: 9999px; pointer-events: none;
       filter: blur(70px); will-change: transform; }
```

- Letak di **atas** base, **di bawah** setiap permukaan (`.glass-*` memakai
  `isolation: isolate` sehingga orbs tetap di belakang konten).
- Di `DashboardLayout` orbs di-*override* jadi `position: fixed` agar tidak ikut scroll.
- Jumlah orbs per halaman saat ini: **4–5** (layout) + 0–2 (di dalam panel/kartu).
- Ukuran kontainer yang dipakai: `h-88 w-88` (22rem), `h-72 w-72`, `h-80 w-80`,
  `h-[28rem]`, `h-44 w-44`, `h-36 w-36`, `h-32 w-32`, `h-28 w-28`, `h-56 w-56`, `h-52 w-52`.
- Alpha orbs: `/15`–`/35`.

> **Rekomendasi (belum ada di kode):** jumlah orbs adalah biaya GPU terbesar di
> aplikasi ini (setiap orb = lapisan `blur(70px)`). Saat menambah halaman, tahan di
> 4–6 orbs total. Lihat §14.6.

---

## 3. Typography & Hierarchy

### 3.1 Font stack (`index.css:29`)

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system,
             BlinkMacSystemFont, "Segoe UI", sans-serif;
```

> **Tidak dapat dipastikan / perlu dicatat:** `Inter` **tidak pernah dimuat**. Tidak
> ada `@font-face`, tidak ada `<link>` Google Fonts di `index.html`, tidak ada file
> font di repo. Akibatnya semua platform jatuh ke `ui-sans-serif`/`system-ui`.
> Kalau memang ingin Inter, langkahnya: tambah file woff2 + `@font-face` +
> `font-display: swap` di `index.css`, atau `<link>` di `index.html` dengan
> `preconnect`. **Status: belum ada — rekomendasi, bukan fakta.**

Pengaturan global lain:

| Properti | Nilai |
| --- | --- |
| `-webkit-font-smoothing` | `antialiased` |
| `text-rendering` | `optimizeLegibility` |
| `button, input, select, textarea` | `font: inherit` |
| Ukuran minimum layout | `body { min-width: 320px }` |

### 3.2 Scale yang benar-benar dipakai

Tidak ada `text-*` kustom selain `.page-title` dan `.eyebrow`; sisanya utilitas Tailwind.

| Peran | Class | Ukuran | Weight | Tracking | Line-height | Warna |
| --- | --- | --- | --- | --- | --- | --- |
| Brand (auth) | `text-3xl font-bold tracking-tight` | 1.875rem | 700 | tight | default | `slate-900` |
| Judul halaman | `.page-title` | 1.5rem | 700 | `-0.025em` | `2rem` | `#0f172a` |
| Subjudul halaman | `.page-subtitle` | 0.875rem | — | — | default | `#475569` |
| Eyebrow | `.eyebrow` | 0.6875rem | 700 | `0.16em` | default | `#4f46e5` |
| H1 error page | `text-2xl font-semibold tracking-tight` | 1.5rem | 600 | tight | default | `slate-900` |
| Angka error | `text-7xl sm:text-8xl font-black` + gradient clip | 4.5/6rem | 900 | tight | default | gradient indigo→violet→fuchsia (404) / amber→orange→rose (403) |
| Judul section | `text-lg / text-xl font-semibold tracking-tight` | 1.125/1.25rem | 600 | tight | default | `slate-900` |
| Sub-section | `text-base font-semibold tracking-tight` | 1rem | 600 | tight | default | `slate-900` |
| Body | `text-sm` | 0.875rem | 400 | — | default / `leading-6` | `slate-600` |
| Deskripsi panjang | `text-sm leading-7 whitespace-pre-line` | 0.875rem | 400 | — | 1.75rem | `slate-600` |
| Label form | `text-sm font-medium` | 0.875rem | 500 | — | default | `slate-700` |
| Meta / caption | `text-xs` | 0.75rem | 400 | — | default | `slate-500` |
| Label chip | `text-xs font-semibold` | 0.75rem | 600 | — | default | tone 700 |
| Micro label (inline) | `text-[10px] font-bold uppercase tracking-[0.18em]` | 0.625rem | 700 | `0.18em` | default | `slate-500` |
| Brand wordmark | `text-[15px] font-bold tracking-tight` | 0.9375rem | 700 | tight | default | `slate-900` |
| Brand sub | `text-[11px] font-medium` | 0.6875rem | 500 | — | default | `slate-500` |
| Kategori di card | `text-xs font-semibold uppercase tracking-[0.12em]` | 0.75rem | 600 | `0.12em` | default | `indigo-600` |

> **Catatan inkonsistensi:** label uppercase inline memakai `tracking-[0.12em]`
> (ComplaintCard, Profile) sementara `.eyebrow` memakai `0.16em`.
> Keduanya menjalankan fungsi yang sama. Lihat §14.2.

### 3.3 Aturan hierarchy

1. **Satu `h1` per halaman**, selalu lewat `.page-title`. Halaman auth memakai
   `text-3xl` untuk brand dan `text-2xl` untuk heading form.
2. **Eyebrow selalu mendahului `page-title`** dengan `mb-2`, dan biasanya diikuti
   `page-subtitle`. Pengecualiannya `ComplaintDetail`, yang memang tidak memakai
   subtitle.
3. **Tracking-tight hanya pada heading**, tidak pernah pada body.
4. **Huruf kapital hanya untuk metadata**: eyebrow, kategori di card.
5. **Label form tidak pernah pakai placeholder sebagai label** — selalu ada
   `<label htmlFor>`.

### 3.4 Text shadow (blooming)

Class `.page-title`, `.page-subtitle`, `.eyebrow`, `.text-muted-ambient` memakai
`text-shadow` putih lembut (`0 1px 12–16px rgba(255,255,255,0.75–0.85)`). Tujuannya:
menjaga keterbacaan heading saat teks duduk persis di atas orb berwarna pekat.

`.text-ambient` (versi terang, `#0f172a`) **terdefinisi tapi tidak terpakai** —
siap dipakai untuk teks terang di luar permukaan kaca.

---

## 4. Spacing System & Layout

### 4.1 Skala

Tailwind v4 dengan skala default (`--spacing` = `0.25rem`). Tidak ada
`tailwind.config.js`; tema hanya lewat `@theme` di CSS.

Nilai yang benar-benar muncul:

| Kategori | Nilai |
| --- | --- |
| Section stack (`space-y-6`) | `1.5rem` |
| Grid antar kartu | `gap-4` |
| Grid antar section | `gap-6` |
| Gap chip/pill | `gap-2`, `gap-3`, `gap-2.5`, `gap-1.5` |
| Padding card | `p-5 sm:p-6` |
| Padding panel/form | `p-6 sm:p-8`, `px-6 py-12 sm:px-10` |
| Padding main | `px-4 py-6 sm:px-6 lg:px-8 lg:py-8` |
| Padding filter bar | `p-3` |
| Padding baris list | `px-5 py-4 sm:px-6` |
| Padding alert | `px-4 py-3` |
| Padding sidebar nav | `px-3 py-7`, item `py-3 pl-4 pr-3` |

> Gaya utama: **konten memakai kelipatan 4px/8px**, dengan kontainer besar memakai
> kelipatan 24px (`p-6`). Ada inkonsistensi kecil (`pl-4 pr-3` pada `.nav-link`
>(item), bukan simetris `px-4`) yang disengaja untuk memberi ruang bagi bar aksen
> 3px di sisi kiri.

### 4.2 Lebar kontainer

| Halaman | Wrapper |
| --- | --- |
| `Dashboard`, `AdminDashboard`, `Complaints` | `mx-auto max-w-7xl space-y-6` |
| `CreateComplaint`, `ComplaintDetail` | `mx-auto max-w-3xl space-y-6` |
| `Profile` | `mx-auto max-w-5xl space-y-6` |
| `Login`, `Register` | `relative w-full max-w-md` |
| `Forbidden`, `NotFound` | `relative w-full max-w-lg` |

### 4.3 Grid utama

| Halaman | Pola |
| --- | --- |
| Dashboard metrik | `grid gap-4 md:grid-cols-3` |
| Dashboard bawah | `grid gap-6 xl:grid-cols-[1.55fr_0.85fr]` |
| Admin metrik | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| Admin bawah | `grid gap-6 xl:grid-cols-[1.55fr_0.85fr]` |
| Daftar pengaduan | `grid gap-4 lg:grid-cols-2` |
| Detail identitas Profile | `grid gap-4 sm:grid-cols-2` |
| Form buat pengaduan | `grid gap-6 sm:grid-cols-2` + `sm:col-span-2` |

> Pola kolom tidak simetris `[1.55fr_0.85fr]` sudah jadi konvensi: konten utama
> lebar, panel ajakan/CTA sempit. Pertahankan untuk halaman dashboard baru.

### 4.4 Chrome aplikasi (`DashboardLayout`)

```
┌──────────────┬──────────────────────────────────────────────┐
│              │  header .glass-nav  h-[4.5rem] sticky top-0  │
│  sidebar     ├──────────────────────────────────────────────┤
│  .glass-     │                                              │
│  sidebar     │  main px-4 py-6 sm:px-6 lg:px-8 lg:py-8     │
│  w-[17.5rem] │  <Outlet />                                  │
│  fixed       │                                              │
└──────────────┴──────────────────────────────────────────────┘
   content di offset: lg:pl-[17.5rem]
```

- **Sidebar**: `fixed inset-y-0 left-0 z-50 w-[17.5rem]`, tinggi layar penuh,
  `flex flex-col`. Off-canvas di bawah `lg` (`-translate-x-full`, transisi
  `duration-300`).
- **Header brand di sidebar**: `h-20 border-b border-white/45 px-5`.
- **Bagian user di footer sidebar**: `glass-card glass-card-hover m-3 rounded-2xl p-3`.
- **Header topbar**: `h-[4.5rem] flex items-center justify-between px-4 sm:px-6 lg:px-8`,
  `sticky top-0 z-30`.
- **Ornamen orbs** di `DashboardLayout` semuanya `fixed` (bukan `absolute`), 5 buah,
  tetap di layar saat konten scroll.

### 4.5 Z-index yang dipakai

| Nilai | Elemen |
| --- | --- |
| `-1` | Sheen `::before` dan hairline `::after` pada permukaan kaca |
| `30` | `.glass-nav` header sticky |
| `40` | Scrim mobile sidebar |
| `50` | Sidebar off-canvas |

Tidak ada token z-index; semua ditulis literal di `className`.

---

## 5. Border Radius, Shadow, Glass Surface, Blur, Gradient

### 5.1 Radius

| Nilai | Dipakai untuk |
| --- | --- |
| `0.4rem` | `.link-accent` |
| `0.5rem` (`rounded-lg`) | Avatar chip kecil di header, tombol toggle password |
| `0.625rem` (`rounded-xl`) | Item sidebar, tombol header, divider di dalam card |
| `0.8rem` | `.icon-button` |
| `0.85rem` | `.input-base`, `.btn-primary`, `.btn-secondary`, `.glass-chip` |
| `1rem` (`rounded-2xl`) | Card, `glass-well`, baris skeleton, avatar sidebar `brand-mark` |
| `1.5rem` (`rounded-3xl`) | Panel besar: auth panel, form pengaduan, empty state, error pages |
| `9999px` | `.orb`, `.glass-pill`, bar aksen `.nav-link-accent`, thumb scrollbar, dot notifikasi, `StatusBadge` |

**Konvensi radius:**

| Jenis permukaan | Radius |
| --- | --- |
| Tombol / input / chip ikon | `0.85rem` (kelas CSS) |
| Kartu konten | `1rem` (`rounded-2xl`) |
| Panel besar (form, auth, empty, error) | `1.5rem` (`rounded-3xl`) |
| Pill / badge | `9999px` |

> Semua kelas `.glass-*` dan `.btn-*` memakai `border-radius: inherit` di `::before`,
> sehingga bentuk specular selalu mengikuti radius induknya. **Kalau radius
> di-override lewat utility Tailwind, specular tetap ikut** — tidak ada masalah,
> tapi pastikan radius utility sesuai tabel di atas.

### 5.2 Scale shadow

Tidak ada token `--shadow-*`. Pola shadow yang dipakai (semua *halus, lebar, alpha rendah*):

| Pola | Nilai | Token |
| --- | --- | --- |
| Depth besar (panel) | `0 28px 60px -32px rgba(49,46,129,.32)` + `0 10px 24px -18px rgba(49,46,129,.22)` | `.glass-panel` |
| Depth card | `0 22px 44px -28px rgba(49,46,129,.32)` + `0 8px 18px -14px rgba(49,46,129,.2)` | `.glass-card` |
| Depth chrome | `0 32px 70px -34px rgba(49,46,129,.34)` + `0 10px 24px -18px rgba(49,46,129,.2)` | `.glass-sidebar`, `.glass-panel-dark` |
| Depth nav | `0 18px 40px -32px rgba(49,46,129,.35)` | `.glass-nav` |
| Depth kontrol | `0 14px 30px -14px rgba(99,102,241,.7)` + `0 3px 8px -4px rgba(30,41,59,.28)` | `.btn-primary` |
| Depth chip | `0 10px 20px -16px rgba(30,41,59,.5)` | `.glass-chip` |
| Inset well | `inset 0 2px 6px rgba(30,41,59,.07)` | `.glass-well` |
| Edge light | `inset 0 1px 0 0 rgba(255,255,255,.88)` | semua glass |
| Edge bawah | `inset 0 -1px 0 0 rgba(148,163,184,.18–.24)` | semua glass |
| Glow aksen | `0 0 10px rgba(99,102,241,.55)` | `.nav-link-accent::before` |
| Glow notifikasi | `shadow-[0_0_10px_rgba(99,102,241,0.65)]` | dot di header |

> **Warna shadow tidak pernah hitam murni.** Semua bayangan besar memakai
> `rgba(49,46,129,·)` (indigo-950) atau `rgba(30,41,59,·)` (slate-800) — selalu
> *diwarnai* sesuai material. Inilah yang membuat kaca terasa premium, bukan
> seperti kartu generik.

### 5.3 Glass surface — tabel lengkap

Semua kelas `.glass-panel`, `.glass-card`, `.glass-panel-dark`, `.glass-sidebar`,
`.glass-nav` berbagi `position: relative; isolation: isolate`.

| Kelas | Border | Background | Backdrop | Sheen (`::before`) | Dipakai di |
| --- | --- | --- | --- | --- | --- |
| `.glass-panel` | `rgba(255,255,255,.70)` | `rgba(255,255,255,.60)` | `blur(28px) saturate(190%)` | Linear 152° `0.72→0.26@22%→0@46%` + radial `130% 90% at 84% -14%` `0.5→0@58%` | Panel auth, panel form, EmptyState, error page |
| `.glass-card` | `rgba(255,255,255,.66)` | `rgba(255,255,255,.56)` | `blur(22px) saturate(180%)` | Linear 148° `0.62→0.18@18%→0@40%` | Kartu metrik, ComplaintCard, kartu Profile, user panel sidebar |
| `.glass-panel-dark` | `rgba(255,255,255,.72)` | `rgba(255,255,255,.70)` | `blur(32px) saturate(190%)` | Linear 176° `0.6→0.14@26%→0@52%` | **Tidak terpakai** (lihat §14.3) |
| `.glass-sidebar` | `rgba(255,255,255,.55)` | `rgba(255,255,255,.62)` | `blur(30px) saturate(190%)` | Linear 176° tipis `0.45→0.10@26%→0@52%` + `::after` hairline 1px di tepi kanan | Sidebar app |
| `.glass-nav` | bawah `rgba(255,255,255,.60)` | `rgba(255,255,255,.55)` | `blur(28px) saturate(190%)` | Linear 180° `0.6→0@62%` | Topbar |
| `.glass-chip` | `rgba(255,255,255,.68)` | `rgba(255,255,255,.60)` | `blur(14px) saturate(170%)` | — (hanya inset) | Chip ikon |
| `.glass-pill` | `rgba(255,255,255,.60)` | (di-*override* utility) | `blur(14px) saturate(170%)` | — | Pill role di Profile, pil Prioritas + "Diperbarui" di ComplaintDetail |
| `.glass-well` | dashed `rgba(100,116,139,.38)` | `rgba(255,255,255,.45)` | `blur(12px)` (tanpa saturate) | — | Dropzone upload foto |

> **Catatan opacity (penting).** `.glass-sidebar` sengaja lebih *rendah* dari
> `.glass-panel-dark` (0.62 vs 0.70) supaya orb tetap terlihat menembus rail.
> Komentar `index.css:236-241` mencatat bahwa versi lama `white/0.70` "terbaca
> seperti lembar putih datar". Jangan menaikkan nilai rail tanpa alasan.

### 5.4 Blur budget

| Nilai | Untuk |
| --- | --- |
| `blur(70px)` | `.orb` |
| `blur(32px)` | `.glass-panel-dark` |
| `blur(30px)` | `.glass-sidebar` |
| `blur(28px)` | `.glass-panel`, `.glass-nav` |
| `blur(22px)` | `.glass-card` |
| `blur(16px)` | `.input-base`, `.btn-secondary` |
| `blur(14px)` | `.glass-chip`, `.glass-pill` |
| `blur(12px)` | `.glass-well` |

Semakin besar permukaan, semakin besar blur. Ini evolusi kosmetik: dari
`14px` (chip kecil) naik ke `28–32px` (panel besar) supaya tepi panel tetap
"cair" dan mendistorsi apa pun yang lewat di belakangnya.

### 5.5 Gradient

| Nama | Definisi | Pemakaian |
| --- | --- | --- |
| **Signature** | `linear-gradient(140deg, #6366f1 0%, #7c5cf0 46%, #a855f7 100%)` | `.btn-primary` background |
| **Signature (versi brand-mark)** | `linear-gradient(140deg, #6366f1 0%, #7c5cf0 48%, #a855f7 100%)` | `.brand-mark` background |
| **Sheen linear** | Bervariasi per permukaan, lihat tabel §5.3 | `::before` |
| **Specular cap (tombol)** | `linear-gradient(180deg, rgba(255,255,255,.28)→0 100%)`, tinggi 46%, border-radius elips | `.btn-primary::after` |
| **Specular cap (brand mark)** | `radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,.32)→0 72%)`, tinggi 54% | `.brand-mark::after` |
| **Alert error** | `linear-gradient(180deg, rgba(254,226,226,.94), rgba(255,241,242,.88))` | `.alert-error` |
| **Teks 404** | `from-indigo-600 via-violet-600 to-fuchsia-600` + `bg-clip-text text-transparent` | `NotFound` |
| **Teks 403** | `from-amber-600 via-orange-600 to-rose-600` + `bg-clip-text text-transparent` | `Forbidden` |
| **Base app** | `linear-gradient(162deg, #f8f7fd, #eef1fb 44%, #f7effb)` | `.app-shell` |

> **Aturan:** ada tepat **satu** gradien solid yang boleh dipakai sebagai warna
> solid pada permukaan besar: signature indigo→violet→fuchsia, dan hanya pada
> `.btn-primary` dan `.brand-mark`. Gradien lain hanya untuk teks dekoratif pada
> halaman error.

### 5.6 Grain

SVG data-URI `feTurbulence` dengan `opacity: 0.025`, tile 180×180, hanya di
`.app-shell`. Fungsinya murni anti-banding pada gradien besar. Jangan dihapus saat
menyesuaikan latar.

---

## 6. Design Tokens & Aturan Penggunaannya

### 6.1 Inventaris token

| Kategori | Token | Sumber | Status |
| --- | --- | --- | --- |
| Surface | `--color-surface: #f3f2f9` | `@theme` | **Aktif** (dipakai di `body`) |
| Brand 100–700 | `--color-brand-*` | `@theme` | **Reserved** (belum dipakai) |
| Easing | `--ease-liquid: cubic-bezier(.22,1,.36,1)` | `@theme` | **Aktif** |
| Durasi | `200 / 220 / 260 / 320 ms` | Hardcoded | Aktif, tidak di-token |
| Radius | 0.4 / 0.8 / 0.85 / 1 / 1.5 rem, 9999px | Hardcoded | Aktif, tidak di-token |
| Blur | 12–70 px | Hardcoded | Aktif, tidak di-token |
| Shadow | 6 pola | Hardcoded | Aktif, tidak di-token |
| Spacing | skala Tailwind | Tailwind v4 | Aktif |
| Typography | skala Tailwind + 3 class | Campuran | Aktif |
| Glass recipe | `.glass-*` | `@layer components` | Aktif, **class-based** |
| Control recipe | `.btn-*`, `.input-base`, `.icon-button`, `.link-accent` | `@layer components` | Aktif, **class-based** |

### 6.2 Aturan penggunaan

1. **Permukaan kaca hanya lewat class `.glass-*`.** Jangan membangun permukaan
   transparan dari `bg-white/60 + backdrop-blur` ad-hoc. Class itu sudah punya
   rim, body, specular, dan depth dalam satu paket.
2. **Class Tailwind hanya untuk *penyesuaian* permukaan, bukan untuk membangunnya.**
   Contoh yang sudah diterima: `glass-chip border-white/70 bg-white/65 text-indigo-600`,
   `glass-card overflow-hidden rounded-2xl p-5`.
3. **Urutan class yang dipakai konsisten di proyek ini:**
   `glass-*` → varian (`glass-card-hover`, `nav-link-active`, `icon-button-danger`) →
   utility Tailwind. Contoh: `className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8"`.
4. **Transisi hanya lewat property yang sudah terdaftar** di kelas CSS. Bila butuh
   transisi baru, tambahkan ke `index.css` dengan `var(--ease-liquid)`, jangan
   `duration-*`/`ease-*` Tailwind di `className`.
5. **Warna teks selalu dari palet ink.** Lihat tabel §2.3.
6. **Setiap state loading wajib punya teks.** Tidak ada spinner telanjang di produksi.
7. **Semua teks UI berbahasa Indonesia** (`AGENTS.md`). Label ikon selalu bahasa
   Indonesia dan deskriptif: "Buka menu", "Tutup menu navigasi", "Hapus foto".

---

## 7. Komponen UI

### 7.1 Peta komponen yang benar-benar ada

| Path | Tipe | Ringkas |
| --- | --- | --- |
| `components/ui/Card.tsx` | Komponen | Glass card wrapper |
| `components/ui/StatusBadge.tsx` | Komponen | Pill status 4 nilai |
| `components/ui/EmptyState.tsx` | Komponen | Panel kosong + aksi |
| `components/complaint/ComplaintCard.tsx` | Komponen | Kartu pengaduan di daftar |
| `components/auth/ProtectedRoute.tsx` | Komponen | Route guard + loading screen |
| `components/auth/DashboardRedirector.tsx` | Komponen | Pilih dashboard per role |
| `layouts/DashboardLayout.tsx` | Layout | Shell + sidebar + topbar |
| `index.css` | Token + recipe | Design system penuh |

### 7.2 Komponen yang **belum ada**

> Dokumen ini tidak mengarang. Berikut komponen yang **tidak** ada di repo
> saat dokumen ini ditulis, beserta status dan rekomendasi:

| Komponen | Status | Rekomendasi |
| --- | --- | --- |
| `Button` (React) | **Tidak ada.** Hanya kelas `.btn-primary` / `.btn-secondary` / `.icon-button` | Jika dibutuhkan varian/ukuran, buat komponen `Button` yang membungkus kelas ini, jangan tambah CSS baru per halaman |
| `Input` / `Select` / `Textarea` | **Tidak ada.** `.input-base` dipakai langsung | Sama: bungkus bila pola ikon-kiri (`pl-10`) mulai banyak berulang |
| `Badge` generik | **Tidak ada.** Hanya `StatusBadge` | `StatusBadge` khusus status; `.glass-pill` + tone adalah jalan untuk badge lain |
| `Modal` / `Dialog` | **Tidak ada sama sekali** | Lihat §14.5 |
| `Toast` / `Snackbar` | **Tidak ada sama sekali** | Lihat §14.5 |
| `Spinner` / `Skeleton` | **Ada `Spinner`.** `components/ui/Spinner.tsx` (cincin, `size`, `className`). Skeleton masih inline | Skeleton masih pola `animate-pulse` inline; konsolidasikan nanti |
| `Table` | **Tidak ada.** Yang dipakai adalah baris list di dalam `Card` | — |
| Chart | **Tidak ada komponen generic.** Hanya `StatusDonut` (SVG) dan `TrendBars` (flex/CSS) di `components/charts/`, keduanya tanpa dependensi chart | Jangan tambahkan library chart; kebutuhan saat ini terpenuhi dua komponen ini |
| Tipe `Status` bersama | **Ada.** `utils/statusConfig.ts` mengekspor `ComplaintStatus`, `COMPLAINT_STATUSES`, `STATUS_CONFIG`, `statusLabel`, `StatusSlice` | Badge, chart, dan label status wajib mengambil dari sini |

### 7.3 `Card` (`components/ui/Card.tsx`)

```tsx
<Card className="...">…</Card>
// → <div class="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 …">
```

- Selalu punya hover-lift.
- `className` di-*append* di belakang class default, jadi utility pemanggil menang
  pada konflik specificity yang sama (mis. `p-0` di Dashboard/AdminDashboard untuk
  card yang berisi header + daftar baris).
- Card yang butuh konten penuh tanpa padding memakai
  `className="overflow-hidden p-0"` dan menambah padding sendiri di header
  (`px-5 py-5 sm:px-6`) serta di baris (`px-5 py-4 sm:px-6`).

### 7.4 `StatusBadge` (`components/ui/StatusBadge.tsx`)

```tsx
<span class="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold {tone}">
```

- **Bukan kaca.** Latar opak Tailwind (`bg-amber-100`, `bg-blue-100`, …).
- Padding: `px-3 py-1`; ukuran: `text-xs font-semibold`; radius penuh.
- Tidak punya ikon atau titik status — warna + teks label.
- Risiko: `statusConfig[status]` **tidak punya fallback**; status di luar 4 nilai
  membuat komponen crash. Saat menambah status baru, tambahkan entri map-nya.

> **Inkonsistensi yang perlu diketahui:** proyek sudah punya `.glass-pill`
> (kaca, `blur(14px)`, radius penuh) yang persis untuk keperluan badge, tapi
> hanya dipakai sekali (pill role di Profile). `StatusBadge` masih memakai
> versi rata. Lihat §14.1 untuk arah konsistensi.

### 7.5 `EmptyState` (`components/ui/EmptyState.tsx`)

```
.glass-panel relative overflow-hidden rounded-3xl px-6 py-14 text-center
├── <span class="orb -right-16 -top-16 h-52 w-52 bg-violet-400/25" />
├── <span class="glass-chip relative h-16 w-16 rounded-2xl border-white/70 bg-white/65 text-indigo-600"><Icon size={24}/></span>
├── <p class="relative mt-5 text-base font-semibold tracking-tight text-slate-900">{title}</p>
├── <p class="relative mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{description}</p>
└── <div class="relative mt-6">{action}</div>
```

Props: `icon: LucideIcon`, `title`, `description`, `action?`.

### 7.6 `ComplaintCard` (`components/complaint/ComplaintCard.tsx`)

```
article.glass-card.glass-card-hover.group.rounded-2xl.p-5
├── header  flex items-start justify-between gap-4
│   ├── kiri: kategori (uppercase indigo 0.12em, mb-1.5) + <h3> judul
│   └── kanan: <StatusBadge>
├── meta    mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600
│   ├── <MapPin size={16} class="text-slate-500"/> lokasi
│   ├── <Calendar size={16} class="text-slate-500"/> tanggal
│   └── <User size={16} class="text-slate-500"/> pelapor (opsional, hanya bila ada nilainya)
└── footer  mt-5 border-t border-slate-900/8 pt-4
    └── Link justify-end text-sm font-semibold text-indigo-600 + ChevronRight
```

Props: `id`, `title`, `category`, `location`, `date`, `status`, dan opsional
`reporter?: string | null`.

- Chevron bergeser `translate-x-0.5` saat card di-hover.
- Ikon meta selalu `size={16}` dengan warna `text-slate-500`.

### 7.7 Button

Tidak ada komponen; tiga resep CSS.

#### `.btn-primary`

| Aspek | Nilai |
| --- | --- |
| Ukuran | `padding .7rem 1rem`, `font-size .875rem`, `font-weight 600` |
| Radius | `0.85rem` |
| Border | `1px solid rgba(255,255,255,.30)` |
| Background | gradient signature 140° |
| Teks | `#ffffff` |
| Layout | `inline-flex items-center center gap-0.5rem` |
| Tambahan | `position: relative; overflow: hidden` |
| Hover | `brightness(1.04) saturate(1.06)` + shadow lebih dalam + `translateY(-1px)` |
| Active | `translateY(0) scale(0.985)` + `inset 0 2px 5px rgba(49,46,129,.38)` |
| Disabled | `cursor: not-allowed; opacity: .6;` shadow disederhanakan |
| Focus | `outline: 2px solid #6366f1; outline-offset: 2px` (`:focus-visible`) |

Ukuran yang dipakai di halaman: `py-3` (full-width di auth), `w-full sm:w-auto`
(dashboard/Complaints), `px-3 py-2 text-xs` (tombol "Ganti" kecil di form upload).

#### `.btn-secondary`

| Aspek | Nilai |
| --- | --- |
| Ukuran | sama dengan primary |
| Radius | `0.85rem` |
| Border | `1px solid rgba(148,163,184,.32)` |
| Background | `rgba(255,255,255,.72)` + `backdrop-filter: blur(16px) saturate(170%)` |
| Teks | `#334155` → hover `#1e293b` |
| Hover | border `indigo .40`, bg `.90`, `translateY(-1px)` |
| Active | `translateY(0) scale(0.985)` |
| **Disabled** | **tidak ada styling `:disabled`** (lihat §10.4) |
| Focus | sama seperti primary |

#### `.icon-button`

| Aspek | Nilai |
| --- | --- |
| Ukuran | ditentukan pemanggil lewat padding (`p-2`, `p-2.5`) |
| Radius | `0.8rem` |
| Border | transparan → `rgba(148,163,184,.30)` saat hover |
| Teks | `#64748b` → `#1e293b` saat hover |
| Hover | bg `rgba(255,255,255,.75)` + `translateY(-1px)` |
| Active | `translateY(0) scale(0.94)` |
| Varian | `.icon-button-danger` → border `red .30`, bg `red-50 .90`, teks `red-700` saat hover |
| Wajib | `aria-label` deskriptif (selalu dipakai di repo) |

### 7.8 Input

`.input-base` — dipakai langsung di `Login`, `Register`, `Complaints`, `CreateComplaint`.

| Aspek | Nilai |
| --- | --- |
| Lebar | `100%` |
| Ukuran | `padding .7rem .875rem`, `font-size .875rem` |
| Radius | `0.85rem` |
| Border | `1px solid rgba(148,163,184,.34)` |
| Background | `rgba(255,255,255,.72)` + `backdrop-filter: blur(16px) saturate(170%)` |
| Teks | `#1e293b` |
| Placeholder | `#64748b` (slate-500, 4.7:1 — lolos AA) |
| Shadow | `inset 0 1px 2px rgba(15,23,42,.05)` + `0 1px 2px rgba(15,23,42,.04)` |
| Hover | border `indigo .34`, bg `.84` |
| Focus | border `indigo .75`, bg `.95`, ring `0 0 0 4px indigo .16` + shadow `0 10px 22px -14px rgba(79,70,229,.55)` |
| Invalid | `border-color: red .60`, ring `0 0 0 4px red .12` (via `aria-invalid="true"`) |
| `<option>` | bg `#ffffff` solid, teks `#1e293b` (UA dropdown tidak bisa transparan) |

Variasi yang dipakai:

| Pola | Class tambahan | Contoh |
| --- | --- | --- |
| Input berikon kiri | `py-3 pl-10` | username, search |
| Input dengan tombol kanan | `py-3 pr-12` | password |
| Compact (filter bar) | `py-2.5` | search & select di Complaints |
| Textarea | `resize-none` | deskripsi (`rows={5}`) |
| Select | `cursor-pointer` | fasilitas, filter status |
| Checkbox | native + `h-4 w-4 rounded border-slate-300 bg-white/70 accent-indigo-600 focus:ring-2 focus:ring-indigo-500/40` | "Ingat saya" |

> **Catatan:** `.input-base` **tidak** punya styling `:disabled`. Lihat §10.4.

### 7.9 Alert

`.alert-error` — dipakai di 6 titik (Login, Register, Complaints, CreateComplaint,
Dashboard, AdminDashboard).

| Aspek | Nilai |
| --- | --- |
| Border | `1px solid rgba(239,68,68,.30)` |
| Background | gradient `rgba(254,226,226,.94)` → `rgba(255,241,242,.88)` |
| Shadow | `inset 0 1px 0 0 rgba(255,255,255,.85)` + `0 14px 28px -22px rgba(185,28,28,.6)` |
| Teks | `#991b1b` |
| Struktur | `flex items-start gap-3` + ikon `TriangleAlert size={17} mt-0.5 shrink-0` |
| Padding | `px-4 py-3 text-sm` (ditambahkan pemanggil) |
| Radius | **ditambahkan pemanggil**: `rounded-xl`. |
| Aksesibilitas | `role="alert"` + `aria-live="polite"` |

> **Bug visual yang perlu diketahui:** di `Dashboard.tsx:119` dan
> `AdminDashboard.tsx:123`, `.alert-error` dipakai pada elemen `<p>` **tanpa
> `rounded-xl`**, sehingga sudutnya siku sementara di halaman lain bulat.
> Perbaiki dengan menambahkan `rounded-xl px-4 py-3`.

### 7.10 Navigasi

| Elemen | Resep |
| --- | --- |
| Item sidebar (idle) | `.nav-link` + `flex items-center gap-3 rounded-xl border py-3 pl-4 pr-3 text-sm font-medium` |
| Item sidebar (aktif) | `.nav-link-active .nav-link-accent` |
| Bar aksen aktif | `::before` 3px × 1.25rem, `#6366f1`, radius penuh, glow, tengah vertikal |
| Ikon nav | `size={18}` |
| Hover | bg putih `.45`, geser `translateX(2px)` |
| Tombol logout (sidebar) | native: `rounded-xl px-2.5 py-2 text-sm text-slate-600 hover:bg-white/80 hover:text-slate-900` |
| Avatar link (topbar) | native: `rounded-xl border border-white/70 bg-white/55 p-1.5 hover:bg-white/80` + `shadow-[inset_0_1px_0_0_rgba(255,255,255,.85)]` |

> `.nav-link:focus-visible` memakai `outline: 2px solid #6366f1; outline-offset: 2px`.

**Isi menu ditentukan role, dalam satu daftar datar.** `navItems` di
`DashboardLayout` mempunyai `roles: readonly Role[]` per item dan di-filter dengan
`item.roles.includes(user.role)`. Tidak ada judul grup: label pemisah tidak
menambah informasi apa pun dan membuat sidebar untuk role dengan satu atau dua
item terlihat setengah kosong.

| Item | STUDENT | STAFF | ADMIN |
| --- | --- | --- | --- |
| Dashboard (`/dashboard`) | ya | tidak | tidak |
| Pengaduan (`/complaints`) | ya | ya | ya |
| Profil (`/profile`) | ya | ya | ya |
| Dashboard (`/admin`) | tidak | tidak | ya |
| Kelola Fasilitas (`/admin/facilities`) | tidak | tidak | ya |
| Statistik (`/admin/reports`) | tidak | tidak | ya |

Tiga aturan yang tidak boleh dilanggar:

1. **Item "Dashboard" pertama hanya untuk STUDENT.** `/dashboard`
   dialihkan ke `/admin` untuk admin dan ke `/complaints` untuk staf, jadi
   memberi mereka tautan itu hanya menghasilkan tautan yang berbalik ke halaman
   lain begitu diklik.
2. **Route `/admin` memakai `end: true`.** Tanpa itu `NavLink` ikut menyala
   saat pengguna berada di `/admin/reports` atau `/admin/facilities`, sehingga
   dua item admin terlihat aktif bersamaan.
3. **Filter menu bukan otorisasi.** Setiap route admin tetap dijaga
   `ProtectedRoute allowedRoles={[ADMIN]}` di `AppRoutes`. Menyembunyikan
   tautan cuma kosmetik.

Dua item bernama "Dashboard" ada di `navItems`, tapi tidak pernah berdampingan:
`/dashboard` hanya untuk STUDENT dan `/admin` hanya untuk ADMIN. Stef tidak
melihat keduanya. Jangan menyamakan nama keduanya tanpa mengecek ulang aturan
filter di atas.

Role didefinisikan sekali di `utils/roles.ts` (`Role`, `isAdmin`, `isManager`,
`roleLabel`), cermin `apps/accounts/permissions.py` di backend. Jangan menulis
perbandingan `role === "ADMIN"` langsung di halaman.

### 7.11 Brand mark

`.brand-mark` — blok gradien dengan specular cap, selalu `display: grid; place-items: center`.

| Konteks | Ukuran | Radius | Isi |
| --- | --- | --- | --- |
| Sidebar logo | `h-10 w-10` | `rounded-xl` | `<ClipboardList size={20}/>` |
| Avatar sidebar | `h-9 w-9` | `rounded-xl` | Inisial, `text-xs font-bold` |
| Auth logo | `h-12 w-12` | `rounded-2xl` | `<LockKeyhole size={21}/>` |
| Avatar Profile | `h-20 w-20` | `rounded-3xl` | Inisial, `text-2xl font-bold` |
| Avatar topbar | native | `rounded-lg` | Inisial `text-[10px] font-bold`, bg putih `.70` |

---

## 8. Aturan Desain Per Halaman

### 8.1 Pola halaman auth (`Login`, `Register`, `Forbidden`, `NotFound`)

```
.app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10
├── 4 × .orb (posisi fixed, varian h-88/h-80/h-72, alpha /25–/35)
└── .relative.w-full.max-w-md | max-w-lg
    ├── header: .brand-mark mx-auto mb-4 h-12 w-12 rounded-2xl  →  h1 text-3xl → p text-sm .text-muted-ambient
    ├── .glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8
    │   └── 1 × .orb di dalam pojok panel
    └── footer: p mt-6 text-center text-xs .text-muted-ambient  "© 2026 CampusCare"
```

Aturan yang berlaku:

1. **Tidak ada sidebar, tidak ada topbar.** Halaman penuh layar, terpusat.
2. **Brand selalu di atas, sebelum panel** — `brand-mark` → `CampusCare` →
   tagline `Sistem Pengaduan Fasilitas Kampus`.
3. **Panel selalu `rounded-3xl`, satu orb di pojok**, konten di dalam dibungkus
   `relative` agar berada di atas orb.
4. **Teks UI = Bahasa Indonesia**, termasuk pesan error.
5. **Error selalu di atas form**, dengan ikon + teks, sebelum field pertama.
6. **Tombol submit `btn-primary w-full py-3`.**
7. **Footer `© 2026 CampusCare`** memakai `.text-muted-ambient` (teks di atas
   latar ambient, bukan di atas kaca).
8. Halaman 403/404 memakai tambahan: `eyebrow` berisi kode error (`Error 403` /
   `Error 404`), angka besar gradient-clipped, dua tombol (`btn-primary` +
   `btn-secondary`) dalam `flex flex-col gap-3 sm:flex-row sm:justify-center`.

> **Perbedaan nyata Login vs Register:** Login punya checkbox "Ingat saya";
> Register tidak. **Checkbox tersebut tidak punya `onChange` dan tidak dikirim
> ke mana pun** — murni dekoratif pada kode saat ini.

### 8.2 Pola halaman dashboard (`Dashboard`, `AdminDashboard`)

```
.mx-auto max-w-7xl space-y-6
├── header section  flex flex-col justify-between gap-5 sm:flex-row sm:items-end
│   ├── eyebrow + page-title + page-subtitle
│   └── <Link class="btn-primary w-full sm:w-auto"> + ikon 18px
├── alert-error (jika error)
├── metrik  grid gap-4 (md|sm|xl):grid-cols-N   → <Card class="group relative overflow-hidden">
│   ├── <span class="orb -right-9 -top-9 h-28 w-28 {tone} transition-transform duration-500 ease-out group-hover:scale-125"/>
│   ├── label text-sm font-medium text-slate-600
│   ├── nilai text-3xl font-bold tracking-tight text-slate-900   ("—" saat loading)
│   ├── detail text-xs font-medium text-slate-500                ("Memuat..." saat loading)
│   └── <span class="glass-chip h-11 w-11 shrink-0 {tone}"><Icon size={20}/></span>
└── bawah  grid gap-6 xl:grid-cols-[1.55fr_0.85fr]
    ├── <Card class="overflow-hidden p-0">  daftar terbaru
    └── <Card class="relative overflow-hidden">  panel ajakan (CTA)
```

| Perilaku | Nilai |
| --- | --- |
| Jumlah metrik | 3 (user) / 4 (admin) |
| Maks baris daftar terbaru | 5 (user) / 6 (admin) |
| Ukuran orb metrik | `h-28 w-28`, posisi `-right-9 -top-9` |
| Interaksi orb | `group-hover:scale-125` dengan `duration-500 ease-out` |
| Baris daftar | `<Link>` baris penuh, `hover:bg-white/70`, `glass-chip h-10 w-10` sebagai ikon, `StatusBadge` di kanan |
| Pembatas baris | `divide-y divide-slate-900/[0.07]` |
| Panel CTA | 1–2 orb, `glass-chip h-11 w-11` amber, judul `text-lg`, body `text-sm leading-6`, `btn-secondary mt-5` |

Nada metrik (user): Total=`sky`, Diproses=`amber`, Selesai=`emerald`.
Nada metrik (admin): Total=`sky`, Menunggu=`amber`, Selesai=`emerald`, Ditolak=`rose`.

> Loading metrik memakai `"—"` (em dash) untuk angka dan literal `"Memuat..."` untuk
> detail, **bukan** skeleton. Skeleton hanya dipakai di daftar terbaru.

### 8.3 Pola daftar (`Complaints`)

```
.mx-auto max-w-7xl space-y-6
├── header (eyebrow "Daftar laporan" + page-title "Pengaduan" + subtitle + tombol)
├── filter bar  .glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center
│   ├── input pencarian  (ikon Search di left-3.5, aria-label, py-2.5 pl-10)
│   └── select status  (aria-label, cursor-pointer py-2.5 sm:w-56)
└── konten: spinner → error panel → grid card → EmptyState
```

Aturan:

- **Filter bar memakai `glass-panel` dengan `rounded-2xl p-3`** — lebih rapat dari
  panel auth (`rounded-3xl p-8`), karena isinya alat, bukan konten.
- **Filter bersifat client-side**, tidak menyentuh API.
- **Satu `EmptyState` untuk dua kondisi**, dibedakan lewat teks:
  - data kosong → ikon `SearchX`… (catatan: kondisi "kosong" juga memakai ikon
    `SearchX`; ikon `FileText` akan lebih tepat, tapi ini kondisi aktual sekarang)
  - filter tidak match → judul "Pengaduan tidak ditemukan" + aksi "Reset filter"
- **Kartu selalu 2 kolom di `lg` ke atas** (`grid gap-4 lg:grid-cols-2`).
- Baris `Prioritas {priority}` pada kartu menerima **nilai enum mentah** dari API
  (mis. "Prioritas HIGH"), bukan label Indonesia. Lihat §9.2.
- Meta kartu tambahan (ikon `User` + username pelapor) dirender hanya bila
  `complaint.reporter_username` truthy, jadi bagi role lain tidak ada elemen kosong
  yang tersisa di baris meta.
- **Tombol "Buat Pengaduan"** di header disembunyikan untuk `STAFF` dan subtitle
  diganti, karena halaman itu adalah antrean tidy-up mereka, bukan halaman melapor.

### 8.4 Pola form (`CreateComplaint`)

```
.mx-auto max-w-3xl space-y-6
├── link kembali  (inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600, mb-4)
├── eyebrow + page-title + page-subtitle
├── alert-error
└── form  .glass-panel relative overflow-hidden space-y-6 rounded-3xl p-6 sm:p-8
    ├── orb (-right-20 -top-20 h-56 w-56 indigo)
    ├── grid sm:grid-cols-2 gap-6
    │   ├── judul  (sm:col-span-2)
    │   └── select fasilitas, dikelompokkan per gedung (sm:col-span-2)
    ├── textarea deskripsi (rows=5, resize-none)
    ├── blok foto (label + input hidden + glass-well / preview card)
    └── action bar  border-t border-slate-900/[0.08] pt-6
                   flex flex-col-reverse gap-3 sm:flex-row sm:justify-end
                   [btn-secondary Batal] [btn-primary Kirim]
```

Aturan yang berlaku:

1. **Action bar memakai `flex-col-reverse`** supaya tombol utama berada di atas
   pada mobile — ini keputusan yang disengaja untuk menjangkai ibu jari.
2. **Dropzone adalah `<button type="button">`**, bukan `<label>`, dengan
   `accept="image/png,image/jpeg"` pada input file tersembunyi. Input file hidup
   di luar cabang render agar bisa dipakai ulang (lihat komentar di
   `CreateComplaint.tsx:69-73`).
3. **Batas ukuran dicek di client** (5 MB) *dan* tetap divalidasi ulang oleh
   backend. Pesan error ditulis dalam Bahasa Indonesia dan menyebut ukuran file
   terpilih.
4. **Preview** memakai `aspect-video object-cover rounded-xl border-white/60 shadow-inner`
   agar tinggi form tidak melompat saat foto berganti orientasi.
5. **Baris file terpilih** memakai `.glass-card` dengan `glass-chip` ikon, nama file
   `truncate`, ukuran dalam KB, tombol "Ganti" (`btn-secondary px-3 py-2 text-xs`)
   dan tombol hapus (`icon-button icon-button-danger` dengan `aria-label="Hapus foto"`).
6. **Tidak ada indikator karakter tersisa** untuk textarea.

### 8.5 Pola detail (`ComplaintDetail`)

```
.mx-auto max-w-3xl space-y-6
├── link kembali + eyebrow "Detail laporan" + page-title "Detail Pengaduan"   (tanpa subtitle)
├── kondisi: loading skeleton / not-found / error / konten
└── konten:
    ├── <Card> judul + meta (MapPin, Calendar) + StatusBadge, dengan orb indigo
    ├── <Card> foto (hanya bila complaint.image truthy), img rounded-2xl object-cover
    ├── <Card> pil Prioritas + pil "Diperbarui …" (keduanya .glass-pill)
    │         lalu sub-section "Deskripsi" text-sm leading-7 whitespace-pre-line
    ├── <Card> kartu "Pelapor" — HANYA untuk ADMIN, dengan orb indigo
    ├── <Card> "Tindak lanjut" — HANYA untuk STAFF/ADMIN, dengan orb violet
    ├── baris aksi  flex flex-col-reverse gap-3 sm:flex-row sm:justify-end
    │         [Hapus pengaduan (danger, sm:mr-auto)] [Kembali ke Daftar]
    └── alert-error (satu panel, dipakai bersama oleh Simpan dan Hapus)
```

Aturan:

- **Foto hanya dirender bila `complaint.image` truthy.** `null` (tidak diunggah)
  maupun string kosong (pengaduan lama) sama-sama disembunyikan.
- **`alt` deskriptif**: `Foto pengaduan: {title}`.
- **Id tidak valid dicek saat render** (`Number.isInteger`), bukan setelah fetch —
  tidak ada spinner untuk id sampah.
- **Tiga kondisi kegagalan dibedakan**: id invalid / 404 → panel "tidak ditemukan"
  tanpa tombol reload; error lain → panel error dengan tombol "Muat ulang halaman".
  Keduanya `role="alert"` dan memakai `glass-panel rounded-2xl` (bukan `rounded-3xl`
  seperti `EmptyState`).
- **Baris meta header hanya lokasi + tanggal.** Identitas pelapor tidak lagi
  diselipkan sebagai `<span>` telanjang di sana — dulu ia tenggelam di antara ikon
  meta dan sulit dibaca. Sekarang jadi kartu info sendiri dengan pola yang sama
  persis dengan kartu detail `Profile` (§8.6): `glass-chip h-11 w-11` ikon
  `User size={19}` + label uppercase tracking-`0.12em` + username `truncate`.
  Backend hanya mengisi `reporter_username` untuk `ADMIN`, jadi kartu ini
  otomatis hilang untuk mahasiswa dan staf.
- **Panel "Tindak lanjut"** memakai `select .input-base cursor-pointer` untuk status dan
  prioritas, `grid gap-4 sm:grid-cols-2`, serta `btn-primary` "Simpan Perubahan" yang
  ganti jadi spinner + "Menyimpan..." saat `disabled`. Label memakai `htmlFor` +
  `text-xs font-semibold uppercase tracking-[0.12em] text-slate-500`.
- **Tombol "Hapus pengaduan"** memakai `btn-secondary` + override merah ad-hoc (pola yang
  sama dengan tombol keluar di `Profile`, §8.6) plus `sm:mr-auto` supaya mendarat di kiri
  baris aksi. Konfirmasi memakai `window.confirm` native karena repo belum punya `Modal`
  (§7.2). Setelah berhasil, navigasi ke `/complaints`.
- **Satu `alert-error` untuk kedua aksi**, diletakkan setelah baris aksi supaya tetap
  tampil untuk role yang tidak punya panel tindak lanjut.
- Penutupan tombol mengikuti hak role: admin selalu, mahasiswa hanya miliknya yang masih
  `PENDING`. Staf tidak pernah melihat tombol ini.

### 8.6 Pola profil (`Profile`)

```
.mx-auto max-w-5xl space-y-6
├── eyebrow + page-title + page-subtitle
├── <Card> header identitas: brand-mark h-20 w-20 + nama + pill role (.glass-pill) + deskripsi
├── grid sm:grid-cols-2 gap-4  → 4 kartu detail (glass-chip ikon + label uppercase + nilai)
└── <Card> "Keamanan akun" + btn-secondary dengan override merah
```

- Tombol keluar di Profile memakai `btn-secondary` **plus** override ad-hoc:
  `border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800`.
  Ini satu-satunya variasi "danger" pada `.btn-secondary` di seluruh repo.

### 8.7 Pola loading guard (`ProtectedRoute`)

```
.app-shell flex min-h-screen flex-col items-center justify-center gap-3
├── <span class="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500"/>
└── <p class="text-sm text-slate-600">Memuat halaman...</p>
```

> Perhatikan: ini **gaya spinner keempat** yang berbeda dari tiga lainnya (§13.2).

---

## 9. Status Pengaduan & Pemetaan Tampilannya

### 9.1 Status → label → warna

Sumber: `components/ui/StatusBadge.tsx`.

| Enum (API) | Label Indonesia | Warna | Makna |
| --- | --- | --- | --- |
| `PENDING` | **Menunggu** | `bg-amber-100 text-amber-700` | Laporan masuk, belum ditindaklanjuti |
| `IN_PROGRESS` | **Diproses** | `bg-blue-100 text-blue-700` | Sudah dikerjakan pengelola |
| `RESOLVED` | **Selesai** | `bg-emerald-100 text-emerald-700` | Sudah diperbaiki |
| `REJECTED` | **Ditolak** | `bg-red-100 text-red-700` | Tidak dilanjutkan |

Gaya badge: `inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold`.

Teks Indonesia dipakai konsisten di tiga tempat: badge, dropdown filter status
(`Complaints.tsx`), dan label metrik dashboard ("Menunggu"/"Diproses" dalam
konteks metrik).

### 9.2 Prioritas

Sumber: `ComplaintDetail.tsx`.

| Enum | Label Indonesia | Warna pil |
| --- | --- | --- |
| `LOW` | Rendah | slate — `border-slate-200 bg-white/70 text-slate-600` |
| `MEDIUM` | Sedang | amber — `border-amber-200 bg-amber-50/90 text-amber-700` |
| `HIGH` | Tinggi | indigo — `border-indigo-200 bg-indigo-50/90 text-indigo-700` |

Gaya pil: `glass-pill gap-1.5 px-3 py-1.5 text-xs font-semibold` + ikon
`ClipboardList size={13}`.

> **Perbaikan dari sebelumnya:** dulu prioritas memakai `.glass-chip` yang
> resepnya `display: grid` + `place-items: center` + radius `0.85rem` — dipakai
> untuk **ikon tunggal** dalam kotak persegi. Dipaksa jadi baris ikon + teks,
> grid menyusun keduanya vertikal di dalam `h-9`, jadi kelihatan rusak.
> `.glass-pill` (`inline-flex` + `rounded-full`) memang sejak awal resep untuk
> badge; sekarang dipakai di sini dan di pil role `Profile`.

> **Ketidaksesuaian lain yang masih ada:** di `Complaints.tsx` baris kategori
> kartu diisi `` `Prioritas ${complaint.priority}` `` — jadi pengguna melihat
> literal **"Prioritas HIGH"**, bukan "Prioritas Tinggi". Perbaiki dengan memakai
> map yang sama seperti di `ComplaintDetail`.

### 9.3 Di mana status tampil

| Lokasi | Peran |
| --- | --- |
| Kartu di daftar pengaduan | `StatusBadge` di kanan atas |
| Baris "Pengaduan terbaru" di dashboard | `StatusBadge` di kanan baris |
| Detail pengaduan | `StatusBadge` di kanan header card |
| Filter di halaman Complaints | `<option>` dengan label sama |

### 9.4 Aturan menambah status baru

1. Backend: tambahkan ke `TextChoices` di model.
2. `services/complaintService.ts`: perluas union `Complaint["status"]`.
3. `StatusBadge.tsx`: tambahkan entri `statusConfig` (**wajib** — tidak ada fallback).
4. `Complaints.tsx`: tambahkan `<option>` baru di select filter.
5. Urutan warna: amber → blue → emerald → red. Status baru harus punya warna
   semantiknya sendiri, bukan warna yang sudah terpakai.
6. `ComplaintCard.tsx`: salin union tipe `Status` (atau, lebih baik, ekspor dari service).

---

## 10. Interaction States

### 10.1 Hover — sudah ada

| Elemen | Efek |
| --- | --- |
| `.glass-card-hover` | border & bg naik, shadow dalam, `translateY(-2px)`, `320ms` |
| `.nav-link` | bg putih `.45`, warna ke `slate-900`, `translateX(2px)`, `260ms` |
| `.nav-link-active` | bg putih `.62` |
| `.btn-primary` | `brightness(1.04) saturate(1.06)`, shadow lebih dalam, `translateY(-1px)`, `220ms` |
| `.btn-secondary` | border/bg naik, `translateY(-1px)`, `220ms` |
| `.icon-button` | border + bg putih `.75`, `translateY(-1px)`, `220ms` |
| `.icon-button-danger` | varian merah |
| `.input-base` | border indigo `.34`, bg `.84` — hanya saat **tidak focus** |
| `.glass-well` | border indigo `.50`, bg `.66`, `260ms` |
| `.link-accent` | bg indigo `.14`, warna `indigo-800`, `200ms` |
| Baris daftar dashboard | `hover:bg-white/70` |
| Orb metrik | `group-hover:scale-125`, `duration-500 ease-out` |
| Chevron di kartu | `group-hover:translate-x-0.5` |
| Link "Lihat semua" | `text-indigo-600` → `hover:text-violet-700` |
| Chip di baris dashboard | border/bg naik, ikon jadi indigo, transisi `transition` |

### 10.2 Focus — sudah ada, **tidak merata**

| Elemen | Styling |
| --- | --- |
| `.input-base:focus` | Ring 4px indigo `.16` + border `.75` + bg `.95` (menggunakan `:focus`, bukan `:focus-visible`) |
| `.btn-primary / .btn-secondary / .icon-button :focus-visible` | `outline: 2px solid #6366f1; outline-offset: 2px` |
| `.nav-link:focus-visible` | sama |

> **Yang TIDAK punya focus style (celah aksesibilitas nyata):**
> - Baris daftar dashboard (`<Link>` dengan `hover:bg-white/70`)
> - Link "Lihat semua" di header card
> - Link avatar di topbar
> - Tombol logout di sidebar dan di Profile
> - Tombol toggle lihat password
> - Tombol "Ganti" / "Hapus foto" memang punya `icon-button`, tapi tombol
>   "Kembali ke Pengaduan" dan tombol `glass-well` dropzone tidak.
> - Checkbox "Ingat saya" hanya punya `focus:ring-2` dari utility seadanya.
>
> Lihat §12.3 untuk rekomendasi perbaikannya.

### 10.3 Active — sudah ada

| Elemen | Efek |
| --- | --- |
| `.btn-primary:active` | `translateY(0) scale(0.985)` + `inset 0 2px 5px rgba(49,46,129,.38)` |
| `.btn-secondary:active` | `translateY(0) scale(0.985)` |
| `.icon-button:active` | `translateY(0) scale(0.94)` |

Skala press: primary/secondary `0.985` (halus), icon `0.94` (lebih tegas
karena target kecil). `.nav-link` **tidak** punya state press.

### 10.4 Disabled — sangat terbatas

| Elemen | Styling |
| --- | --- |
| `.btn-primary:disabled` | `cursor: not-allowed; opacity: 0.6;` + shadow disederhanakan |
| `.btn-secondary:disabled` | **tidak ada** |
| `.icon-button:disabled` | **tidak ada** |
| `.input-base:disabled` | **tidak ada** |
| `<select disabled>` di CreateComplaint | tanpa styling khusus; mengandalkan default UA |

> **Rekomendasi:** tambahkan `:disabled` untuk `.btn-secondary`, `.icon-button`,
> dan `.input-base` dengan pola yang sama seperti primary — `cursor: not-allowed;
> opacity: 0.6` — plus hilangkan efek hover. Lihat §14.7.

### 10.5 Loading

| Tempat | Perlakuan |
| --- | --- |
| Tombol submit | `disabled` + ganti label dengan spinner + teks progres |
| Tombol biasa (non-submit) | **tidak ada pola disable-with-spinner** |
| Konten daftar | skeleton atau spinner penuh |
| Metrik dashboard | teks `"—"` + `"Memuat..."` |
| Guard route | layar penuh dengan spinner + teks |

**Teks progres yang dipakai:** `"Memproses..."` (Login), `"Mendaftarkan..."` (Register),
`"Mengirim..."` (CreateComplaint).

> Pola yang dipakai: `<>{spinner} {teks}</>` di dalam tombol, spinner `shrink-0`.
> Teks **tidak pernah hilang** saat loading — pengguna selalu tahu apa yang terjadi.

### 10.6 Transition — konvensi durasi

| Durasi | Dipakai oleh |
| --- | --- |
| `200ms` | `.link-accent` |
| `220ms` | `.input-base`, `.btn-primary`, `.btn-secondary`, `.icon-button` |
| `260ms` | `.nav-link`, `.glass-well` |
| `300ms` | Transisi sidebar (`transition-transform duration-300`) |
| `320ms` | `.glass-card` |
| `500ms` | Skala orb metrik (`duration-500 ease-out`) |
| `1ms` | Semua, bila `prefers-reduced-motion: reduce` |

Semua memakai `var(--ease-liquid)` kecuali transisi sidebar (`duration-300` Tailwind
→ `ease` default cubic-bezier) dan orb (`ease-out`).

---

## 11. Responsive Design

### 11.1 Breakpoint

Tailwind v4 default. Yang terpakai: **`sm` (40rem/640px), `md` (48rem/768px),
`lg` (64rem/1024px), `xl` (80rem/1280px)**. `2xl` tidak pernah dipakai.
Hitungan pemakaian di `src/**/*.tsx`: `sm:` 58, `lg:` 9, `xl:` 3, `md:` 1.

> Hanya **satu** kemunculan `md:` — `grid md:grid-cols-3` di Dashboard. Semua
> layout lain bertumpu pada `sm` dan `lg`.

### 11.2 Tabel breakpoint

| Komponen | Mobile | `sm` (≥640) | `lg` (≥1024) | `xl` (≥1280) |
| --- | --- | --- | --- | --- |
| Sidebar | off-canvas (`-translate-x-full`), scrim `bg-slate-900/25 backdrop-blur-sm` | tetap off-canvas | `lg:translate-x-0` permanen, scrim & tombol tutup hilang |
| Konten | padding `px-4 py-6` | `sm:px-6` | `lg:px-8 lg:py-8` + `lg:pl-[17.5rem]` |
| Topbar | sapaan disembunyikan (`hidden sm:block`), teks "CampusCare" tampil | sapaan tampil, avatar link `sm:flex` | — |
| Tombol header halaman | `w-full` | `sm:w-auto` | — |
| Card | `p-5` | `p-6` | — |
| Panel besar | `p-6` | `p-8` | — |
| Metrik Dashboard | 1 kolom | 1 kolom | `md:grid-cols-3` |
| Metrik Admin | 1 kolom | `sm:grid-cols-2` | — | `xl:grid-cols-4` |
| Dashboard bawah | 1 kolom | 1 kolom | 1 kolom | `xl:grid-cols-[1.55fr_0.85fr]` |
| Daftar pengaduan | 1 kolom | 1 kolom | `lg:grid-cols-2` | — |
| Filter bar | `flex-col` | `sm:flex-row items-center`, select `sm:w-56` | — |
| Form pengaduan | 1 kolom | `sm:grid-cols-2` (field utama tetap `col-span-2`) | — |
| Action bar form | `flex-col-reverse` (tombol utama di atas) | `sm:flex-row sm:justify-end` | — |
| Profile header | `flex-col items-center text-center` | `sm:flex-row sm:text-left sm:gap-6` | — |
| Kartu detail Profile | 1 kolom | `sm:grid-cols-2` | — |
| Halaman auth/error | `px-4 py-10`, tombol `flex-col` | `sm:flex-row sm:justify-center` | — |

### 11.3 Aturan responsif yang berlaku

1. **Tombol aksi utama selalu penuh di mobile**, `sm:w-auto` di atas. Tidak ada
   tombol sekecil itu yang sulit dijangkau ibu jari.
2. **Sidebar berubah dari rail ke off-canvas tepat di `lg`** — breakpoint yang
   sama dengan `lg:pl-[17.5rem]`, jadi tidak ada celah.
3. **Ornamen `.orb` di `DashboardLayout` memakai `position: fixed`** agar tidak
   bergeser saat konten panjang. Hapus `fixed` hanya bila orbs terasa mengganggu
   navigasi di layar kecil.
4. **`overflow-x-hidden` pada `.app-shell` di layout** mencegah orbs menyebabkan
   scroll horizontal.
5. **Tidak ada media query di `index.css`** — seluruh responsivitas ada di TSX.
   Ini keputusan sadar: permukaan kaca tidak berubah opasitas/blur antar breakpoint.

---

## 12. Accessibility & Readability

### 12.1 Yang sudah benar

| Aspek | Implementasi |
| --- | --- |
| Bahasa dokumen | `<html lang="id">` |
| Judul & deskripsi | `<title>` + `meta description` + `meta theme-color="#f3f2f9"` |
| Label form | Semua input punya `<label htmlFor>` (Login, Register, CreateComplaint) |
| Label ikon | Semua `icon-button` punya `aria-label` ("Buka menu", "Tutup menu", "Hapus foto", "Notifikasi", "Tampilkan password", "Sembunyikan password") |
| Control tanpa label teks | Input pencarian & select filter punya `aria-label` |
| Error | `role="alert"` + `aria-live="polite"` di Login, Register, Complaints, CreateComplaint |
| Error validasi | `aria-invalid` di field auth |
| Gambar | `alt` deskriptif di preview upload dan foto pengaduan |
| Kontras teks | Ink gelap di film putih ≥50%; placeholder `slate-500` (4.7:1) dipilih spesifik karena `slate-400` (2.5:1) ditolak |
| Motion | `prefers-reduced-motion` mematikan semua transisi & hover-lift |
| Tap highlight | `-webkit-tap-highlight-color: transparent` pada `button:not(:disabled)` dan `a` |
| Target sentuh | Tombol besar minimal `py-3` di mobile; `icon-button p-2` (36px) di desktop |
| Scrollbar | Thumb kustom 10px dengan radius penuh, tidak mengganggu |

### 12.2 Batas minimum kontras

Nilai rasio berikut adalah **perkiraan** berdasarkan warna tinta dan film putih;
belum diukur dengan alat kontras. Verifikasi ulang bila nilai film kaca berubah.

| Kombinasi | Rasio (perkiraan) | Status |
| --- | --- | --- |
| `slate-900` di atas film putih 0.56–0.95 | ≥ 12:1 | AAA |
| `slate-600` di atas film putih 0.56 | ≥ 5.2:1 | AA |
| `slate-500` di atas film putih 0.6 | ≥ 4.6:1 | AA |
| `slate-400` di atas film putih | 2.5:1 | **Dilarang** |
| Putih di atas gradien `.btn-primary` | ≥ 4.5:1 | AA |
| `amber-700` di `amber-100` | ≥ 4.5:1 | AA |
| `sky-700` di `sky-50/90` | ≥ 4.5:1 | AA |

### 12.3 Kekurangan yang perlu diperbaiki

Tidak ada klaim bahwa semua sudah baik. Berikut temuan nyata:

1. **Focus ring hilang pada beberapa kontrol interaktif** (daftar §10.2). Sediakan
   `:focus-visible` global minimal seperti
   `a:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px }`
   di `@layer base`.
2. **Checkbox "Ingat saya" tidak fungsional** — tidak ada `onChange`, tidak dikirim
   ke mana pun. Selama begitu, kontrol yang tidak melakukan apa pun sebaiknya
   dihapus; kalau memang mau dipakai, implementasikan perilakunya.
3. **Region loading tidak diumumkan** — tidak ada `aria-busy` pada kontainer daftar
   maupun `role="status"` pada spinner. Tambahkan `aria-live="polite"` +
   `aria-busy={isLoading}`.
4. **Status mengandalkan warna + teks**: aman karena label teks selalu ada. Jangan
   pernah membuat varian badge yang hanya dibedakan warna.
5. **Tidak ada skip link** ke konten utama, dan `<main>` tidak punya `id`.
6. **Fokus tidak dipindah saat route berubah** — pindah halaman dari daftar ke
   detail akan menyisakan fokus pada elemen yang sudah tidak ada.
7. **Checkbox native** memakai styling seadanya; pertahankan elemen native agar
   keyboard tetap berfungsi, jangan hanya andalkan `accent-*`.
8. **Sidebar off-canvas tidak menjebak fokus** — `Tab` bisa menjauh ke konten di
   belakangnya saat terbuka di mobile.
9. **Grain + blur + 5 orb** adalah beban GPU nyata. Jika ditemukan masalah
   performa di perangkat kelas bawah, turunkan jumlah orb lebih dulu
   (§14.6), bukan kurangi kontras teks.
10. **Ornamen dekoratif tidak disembunyikan dari screen reader** — `.orb` sudah
    benar dengan `pointer-events: none`, tetapi layar baca tetap membacanya sebagai
    elemen kosong. Tambahkan `aria-hidden="true"` pada orbs.

---

## 13. Empty, Loading, Error, Success States

### 13.1 Peta lengkap state per halaman

| Halaman | Loading | Kosong | Error | Sukses |
| --- | --- | --- | --- | --- |
| `Login` | Tombol `disabled` + spinner + "Memproses..." | — | `alert-error` di atas form | `navigate()` ke dashboard/admin |
| `Register` | Tombol `disabled` + spinner + "Mendaftarkan..." | — | `alert-error` (pesan pertama dari backend) | `navigate("/login")` |
| `Dashboard` | Metrik: `"—"` + `"Memuat..."`. Daftar: 3 skeleton bar `h-14` `animate-pulse` | Blok di dalam card daftar: `glass-chip h-12 w-12` + "Belum ada pengaduan" | `<p class="alert-error" role="alert">` (**tanpa radius — bug**) | — |
| `AdminDashboard` | Sama; daftar: 3 skeleton | "Belum ada pengaduan masuk" | Sama (**tanpa radius — bug**) | — |
| `Complaints` | Spinner tengah + "Memuat pengaduan..." | `<EmptyState>` (dua varian teks) | Panel `glass-panel rounded-2xl` + tombol "Muat ulang halaman" (`window.location.reload()`) | — |
| `CreateComplaint` | Select Disabled "Memuat fasilitas..."; tombol Kirim `disabled` | — | `alert-error` | `navigate("/complaints")` — **tanpa konfirmasi** |
| `ComplaintDetail` | 3 skeleton `h-20` + spinner tengah | — | Dua panel: 404 (tanpa tombol reload) dan error umum (dengan reload) | — |
| `Profile` | — | — | — | — (data dari context, selalu ada) |
| `ProtectedRoute` | Layar penuh: spinner 9×9 + "Memuat halaman..." | — | — | — |

### 13.2 Loader yang ada — **empat gaya berbeda**

| Lokasi | Markup |
| --- | --- |
| `Login`, `Register` | `h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white` (di dalam tombol putih) |
| `CreateComplaint` | `<LoaderCircle size={17} className="animate-spin" />` (di dalam tombol gradient) |
| `Complaints`, `ComplaintDetail` | `<LoaderCircle size={30/26} className="animate-spin" />` |
| `ProtectedRoute` | `h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500` |

> **Rekomendasi:** konsolidasikan jadi satu komponen `<Spinner size="sm|md|lg" />` yang
> menerima `color="on-brand" | "on-surface"`. Lihat §14.5.

### 13.3 Skeleton yang ada — satu pola

```
<div className="relative space-y-3 px-5 py-6 sm:px-6">
  {[0,1,2].map(row => <div key={row} className="h-14 animate-pulse rounded-2xl bg-slate-900/[0.05]" />)}
</div>
```

`ComplaintDetail` memakai tinggi `h-20` untuk skeletony. Tinggi skeleton **tidak**
mengikuti tinggi baris asli (yang bervariasi) — diterima sebagai penyederhanaan.

### 13.4 Empty state

Dua varian dalam satu komponen:

| Situasi | Judul | Deskripsi | Aksi |
| --- | --- | --- | --- |
| Belum ada data sama sekali | "Belum ada pengaduan" | "Pengaduan yang kamu buat akan muncul di sini." | tombol "Reset filter" |
| Data ada, filter tidak match | "Pengaduan tidak ditemukan" | "Coba gunakan kata kunci atau filter yang berbeda." | tombol "Reset filter" |

Ikon: `SearchX` untuk keduanya (pilihan aktual saat ini).

### 13.5 Error state

Dua pola berbeda dalam repo:

| Pola | Struktur | Dipakai di |
| --- | --- | --- |
| **Inline alert** | `alert-error` + ikon + teks, sebelum konten | Login, Register, CreateComplaint |
| **Panel penuh** | `glass-panel rounded-2xl` + ikon `AlertCircle size={30} text-red-500` + pesan + tombol reload | Complaints, ComplaintDetail |
| **Baris polos** | `<p className="alert-error" role="alert">` | Dashboard, AdminDashboard |

Pesan error yang ada (semua Bahasa Indonesia, tunggal, tanpa detail teknis):
`"Username atau password salah."`, `"Terjadi kesalahan pada server."`,
`"Tidak dapat terhubung ke server."`, `"Sesi kamu habis. Silakan masuk kembali."`,
`"Data tidak valid."`, `"Gagal memuat pengaduan. …"`.

### 13.6 Success state — **tidak ada**

Tidak ada toast, snackbar, banner sukses, atau animasi konfirmasi di repo.
`CreateComplaint` langsung `navigate("/complaints")` setelah berhasil.

> **Rekomendasi (prioritas rendah, bukan kondisi sekarang):** tambahkan pustaka
> toast kecil atau banner sukses di halaman tujuan agar pengguna tahu pengaduannya
> benar-benar terkirim. Sampai itu ada, jangan menulis di dokumentasi maupun di UI
> bahwa konfirmasi sudah ada.

---

## 14. Aturan Konsistensi untuk Fitur Berikutnya

> Bagian ini berisi **rekomendasi**, bukan deskripsi kondisi. Yang sudah ada
> ditandai eksplisit.

### 14.1 Badge dan pill

- **Kondisi sekarang:** `.glass-pill` dipakai di role `Profile` dan di pil
  Prioritas + "Diperbarui" `ComplaintDetail` (§9.2); `StatusBadge` masih
  datar/rata.
- **Rekomendasi:** jadikan `.glass-pill` sebagai satu-satunya badge, dengan tone
  border/bg/teks mengikuti pola chip yang sudah ada
  (`border-*-200 bg-*-50/90 text-*-700`). Pertahankan label teks — jangan pernah
  menyimpan makna hanya di warna.
- Untuk badge status dengan latar opak seperti sekarang, tidak apa-apa;
  yang penting seragam: radius `9999px`, `text-xs font-semibold`, padding `px-3 py-1`.

### 14.2 Typography

- **Rekomendasi:** samakan tracking uppercase metadata pada `0.14em` (atau gunakan
  `.eyebrow` di mana-mana). Saat ini ada tiga nilai: `0.12em`, `0.16em`, `0.18em`.
- **Rekomendasi:** judgement sederhana: heading selalu `font-semibold` atau
  `font-bold` + `tracking-tight`; jangan `font-medium` untuk heading.

### 14.3 Glass class yang belum terpakai

- **Kondisi sekarang:** `.glass-panel-dark` didefinisikan lengkap tetapi nol
  pemakaian. Sidebar memakai `.glass-sidebar`.
- **Rekomendasi:** pertahankan untuk kebutuhan "panel kaca terpekat" (mis. modal
  atau panel admin), atau hapus agar tidak ada resep mati. Saat ini biarkan —
  tidak berbahaya, tapi jangan pakai `.glass-panel-dark` untuk sidebar karena
  `.glass-sidebar` sengaja lebih tembus pandang (alasan di `index.css:236-241`).

### 14.4 Rasterisasi token yang belum dipakai

- **Kondisi sekarang:** `--color-brand-100..700` tidak dipakai; komponen memakai
  `indigo-*` langsung.
- **Rekomendasi (pilih salah satu, jangan campur):**
  1. **Rasterisasi bertahap** — ganti `text-indigo-600` → `text-brand-600` di file
   baru saja yang kamu sentuh, sehingga token jadi perlahan benar; atau
  2. **Hapus blok brand** dari `@theme` dan dokumentasikan palet Tailwind sebagai
     sumber warna resmi.
- Yang **tidak** boleh terjadi: memakai `brand-*` di satu halaman dan `indigo-*` di
  halaman lain tanpa alasan yang ditulis.

### 14.5 Komponen yang sebaiknya ditambahkan

Prioritas dari paling berguna:

| Prioritas | Komponen | Alasan |
| --- | --- | --- |
| Tinggi | `<Spinner>` | 4 gaya berbeda saat ini; konsolidasikan |
| Tinggi | `Button` (React) | Menghapus pengulangan `w-full sm:w-auto` + ikon + state loading |
| Sedang | `<Toast>` | Success state tidak ada sama sekali (§13.6) |
| Sedang | `<Modal>` / `<ConfirmDialog>` | Belum ada; dibutuhkan sebelum ada aksi destruktif (hapus pengaduan) |
| Sedang | `<Alert>` | `alert-error` dipakai 6× dengan markup yang hampir identik; tambahkan `alert-success` / `alert-warning` sekalian |
| Rendah | `Skeleton` | Konsolidasikan pola `animate-pulse` |
| Rendah | `Input` | Menghapus pengulangan ikon-kiri `pl-10` |

> Untuk modal: bila dibuat, permukaan WAJIB `glass-panel rounded-3xl`, backdrop
> `bg-slate-900/25 backdrop-blur-sm` (pola yang sama dengan scrim sidebar mobile),
> dan **wajib** mengimplementasikan focus trap + tombol Escape untuk menutup.

### 14.6 Ornamen

- **Rekomendasi:** batas 4–6 orb per halaman. Orbs adalah lapisan `blur(70px)`
  termahal di aplikasi ini; jangan menambah tanpa mengurangi yang lain.
- Ornamen **tidak boleh** berada di belakang teks yang tidak punya permukaan kaca
  atau `text-shadow` putih.
- Tambahkan `aria-hidden="true"` pada orbs (lihat §12.3).

### 14.7 State yang wajib ada di setiap kontrol baru

Setiap elemen interaktif baru **wajib** punya: default, hover, active, focus-visible,
disabled, dan (bila relevan) loading. Gunakan `var(--ease-liquid)` dan durasi dari
§10.6, serta sertakan blok `prefers-reduced-motion` bila punya transisi baru.

### 14.8 Aturan halaman baru

1. Bungkus dengan `mx-auto max-w-{3xl|5xl|7xl} space-y-6` sesuai densitas konten.
2. Header halaman: `eyebrow` + `page-title` + `page-subtitle`, dengan aksi utama
   di kanan (`flex-col sm:flex-row sm:items-end`).
3. Panel besar: `glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8`
   + 1 orb + konten dibungkus `relative`.
4. Kartu daftar: `glass-card glass-card-hover rounded-2xl p-5`.
5. Status pengaduan selalu lewat `<StatusBadge>`, tidak pernah badge ad-hoc.
6. Semua teks Bahasa Indonesia; label ikon Bahasa Indonesia dan deskriptif.
7. Pilih state kosong/loading/error dari peta §13.1 — jangan pernah melepas halaman tanpa status.
8. Jangan menambahkan file CSS baru; semua permukaan kaca dari `index.css`.

---

## 15. Checklist Review UI

Gunakan sebelum menyatakan sebuah UI selesai. Centang berdasarkan **kode**, bukan
persepsi visual.

### 15.1 Struktur & token

- [ ] Halaman dibungkus `mx-auto max-w-* space-y-6` dengan lebar yang sesuai.
- [ ] Ada tepat satu heading utama, diberi gaya lewat `.page-title`.
- [ ] Eyebrow memakai `.eyebrow` (bukan nilai tracking arbitrer).
- [ ] Tidak ada warna hex atau `rgb()` baru di dalam `.tsx`.
- [ ] Warna teks berasal dari palet ink §2.3.
- [ ] `slate-400` tidak dipakai untuk teks di atas kaca.

### 15.2 Permukaan kaca

- [ ] Semua permukaan kaca memakai class `.glass-*` (bukan `backdrop-blur` manual).
- [ ] Alpha body tetap ≥ 0.5.
- [ ] Radius mengikuti tabel §5.1 (kontrol `0.85rem`, kartu `1rem`, panel `1.5rem`).
- [ ] `border-radius: inherit` untuk sheen `::before` tidak ditimpa manual.
- [ ] Ornamen memakai `.orb`, bukan gradient inline besar.

### 15.3 Komponen

- [ ] Tombol utama `btn-primary`, sekunder `btn-secondary`, ikon `icon-button`.
- [ ] Tombol punya ikon `size={17}`–`size={18}` dengan `gap` dari CSS.
- [ ] Input/select/textarea memakai `.input-base` + `cursor-pointer` bila select.
- [ ] Ada `<label htmlFor>` untuk setiap field, bukan hanya placeholder.
- [ ] Badge status lewat `<StatusBadge>`, bukan span berwarna manual.
- [ ] Ikon chip lewat `.glass-chip` + tone `border-*-200 bg-*-50/90 text-*-700`.
- [ ] Brand mark lewat `.brand-mark`.

### 15.4 States

- [ ] Ada state loading (tidak pernah request tanpa indikator).
- [ ] Loading tidak menghilangkan konteks — spinner **dan** teks.
- [ ] Ada state kosong dengan judul + deskripsi (+ aksi bila relevan).
- [ ] Ada state error dengan pesan Bahasa Indonesia yang bisa ditindaklanjuti.
- [ ] Tombol yang memicu request punya `disabled` selama loading.
- [ ] Aksi destruktif selalu butuh konfirmasi *(belum ada modal — lihat §14.5)*.

### 15.5 Interaksi

- [ ] Hover ada pada semua elemen interaktif.
- [ ] `:focus-visible` terlihat pada **semua** elemen interaktif baru.
- [ ] Active state memakai `scale` halus (0.94–0.985).
- [ ] Disabled tidak bisa di-hover/di-active.
- [ ] Transisi memakai `var(--ease-liquid)` dan durasi dari §10.6.
- [ ] Bila menambah transisi baru, class-nya ikut didaftarkan di blok
      `prefers-reduced-motion`.

### 15.6 Responsif

- [ ] Tombol aksi `w-full sm:w-auto`.
- [ ] Grid punya titik patah yang masuk akal; tidak ada kolom < 320px.
- [ ] Teks panjang di-`truncate` atau `break-words`.
- [ ] Tidak ada scroll horizontal (perhatikan orbs `fixed` + `overflow-x-hidden`).
- [ ] Sudah disemak di 320px, 768px, dan 1440px.

### 15.7 Aksesibilitas

- [ ] Semua `icon-button` punya `aria-label` deskriptif.
- [ ] Error punya `role="alert"`; loading punya `aria-live`/`aria-busy`.
- [ ] Gambar punya `alt` yang mendeskripsikan isi, bukan nama file.
- [ ] Ornamen dekoratif diberi `aria-hidden="true"`.
- [ ] Kontras teks utama ≥ 4.5:1.
- [ ] Semua teks UI Bahasa Indonesia.

### 15.8 Konsistensi dengan kode yang ada

- [ ] Error alert memakai `rounded-xl px-4 py-3` (pola di Login/Register).
- [ ] Empty state memakai komponen `<EmptyState>` yang sudah ada, bukan panel manual.
- [ ] Link kembali memakai pola `inline-flex items-center gap-2 text-sm font-medium
      text-slate-600 hover:text-indigo-600`.
- [ ] Baris daftar memakai `px-5 py-4 sm:px-6` + `hover:bg-white/70`.
- [ ] Label enum API diterjemahkan ke Bahasa Indonesia sebelum tampil.

### 15.9 Verifikasi teknis

- [ ] `npm run lint` bersih.
- [ ] `npm run build` (menjalankan `tsc -b`, jadi type-check ikut) bersih.
- [ ] Tidak ada file CSS baru; semua gaya masuk `@layer components` di `index.css`.
- [ ] Tidak ada class Tailwind utility yang bentrok dengan nama class kustom.

---

## 16. Ketidaksesuaian Dokumentasi yang Diketahui

Bagian ini ada supaya pembaca tidak tertipu sumber lain.

| Sumber | Klaim | Kondisi aktual |
| --- | --- | --- |
| `frontend/README.md` §14 | Tema "di atas latar **navy gelap**" | Tema **terang**; `color-scheme: light`, base `#f3f2f9` |
| `frontend/README.md` §14 | Token `--color-ink-950/900/800`, `--color-brand-300..600` dengan hex biru `#a6c0ff` dst | Token tersebut **tidak ada**. Yang ada `--color-surface` + `--color-brand-100..700` dengan ramp indigo |
| `frontend/README.md` §14 | `index.html` mendefinisikan tiga SVG filter refraksi | `index.html` tidak punya filter sama sekali; tidak ada `backdrop-filter: url(#…)` |
| `frontend/README.md` §14 | `.orb` memakai `blur(80px)` | `blur(70px)` |
| `frontend/README.md` §14 | `.glass-panel-dark` = "Glass untuk sidebar" | Sidebar memakai `.glass-sidebar`; `.glass-panel-dark` **tidak terpakai** |
| `frontend/README.md` §12 | `Complaints.tsx` masih data hardcoded | Sudah memanggil `GET /complaints/` + `GET /facilities/` |
| `frontend/README.md` §12 | `CreateComplaint.tsx` hanya `console.log` | Sudah POST multipart ke `/complaints/` |
| `frontend/README.md` | — | `pages/user/ComplaintDetail.tsx` ada dan sudah terdaftar di route |
| `AGENTS.md` | — | Benar soal design system liquid glass; tidak menyebut detail warna |

> Jika dokumen ini bertentangan dengan kode, **kode yang benar** dan dokumen ini
> yang perlu diperbarui.

---

## Lampiran A — Rujukan file

| Kebutuhan | File |
| --- | --- |
| Semua token & resep | `frontend/src/index.css` |
| Shell, sidebar, topbar | `frontend/src/layouts/DashboardLayout.tsx` |
| Kartu generik | `frontend/src/components/ui/Card.tsx` |
| Badge status | `frontend/src/components/ui/StatusBadge.tsx` |
| Empty state | `frontend/src/components/ui/EmptyState.tsx` |
| Kartu pengaduan | `frontend/src/components/complaint/ComplaintCard.tsx` |
| Prioritas & label | `frontend/src/pages/user/ComplaintDetail.tsx` |
| Agregasi & format tanggal | `frontend/src/utils/complaintStats.ts` |
| Route & guard | `frontend/src/routes/AppRoutes.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx` |

## Lampiran B — Perintah verifikasi

```bash
cd frontend
npm run lint     # ESLint flat config (frontend/eslint.config.js)
npm run build    # tsc -b + vite build → type-check ikut terverifikasi
```

Tidak ada test runner di frontend dan tidak ada CI. Verifikasi manual checklist
§15 tetap wajib dilakukan sebelum menyatakan UI selesai.