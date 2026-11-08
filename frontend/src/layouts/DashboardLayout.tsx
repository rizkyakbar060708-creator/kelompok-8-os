import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  PackageSearch,
  PencilRuler,
  Plus,
  ShieldCheck,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useState, type CSSProperties } from "react"

import Reveal from "../components/ui/Reveal"
import RevealList, { RevealItem } from "../components/ui/RevealList"

import { useComplaintSummary, ComplaintSummaryProvider } from "../contexts/ComplaintSummaryContext"
import { useAuth } from "../contexts/AuthContext"
import {
  ADMIN,
  ROLES,
  STUDENT,
  roleLabel,
  type Role,
} from "../utils/roles"
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  categoryPath,
  type ComplaintCategory,
} from "../utils/categoryConfig"
import type {
  Complaint,
  ComplaintSummary,
} from "../services/complaintService"

const ALL_ROLES = ROLES

// Jeda antar kelompok animasi layout (sidebar, topbar) dalam detik. Dipakai
// Reveal sebagai delay berjenjang supaya elemen muncul berurutan, bukan
// serentak.
const REVEAL_STAGGER = 0.08

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles: readonly Role[];
  // NavLink aktif secara default kalau path-nya prefix dari URL saat ini, jadi
  // "/admin" ikut menyala saat pengguna berada di "/admin/reports". `end`
  // memaksa pencocokan persis dan dipakai pada route induk.
  end?: boolean;
}

// Bagian Umum tetap datar. Ada dua tautan "Dashboard" di daftar ini, tapi
// tidak pernah tampil bersamaan: yang pertama hanya untuk STUDENT dan
// yang kedua (/admin) hanya untuk ADMIN.
//
// Filter menu di sini murni kosmetik, bukan otorisasi: setiap route tetap
// dijaga ProtectedRoute di AppRoutes.
//
// Struktur sidebar: bagian Umum datar di atas, lalu tiga grup kategori
// accordion di bawahnya. Pembeda antar bagian hanya jarak vertikal (margin) —
// tanpa label seksi, judul kecil, atau garis pemisah, karena itu semua hanya
// menambah ornamen tanpa informasi baru. Urutan grup mengikuti CATEGORY_ORDER.

const navItems: readonly NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: Home, roles: [STUDENT] },
  { name: "Semua Pengaduan", path: "/complaints", icon: FileText, roles: ALL_ROLES, end: true },
  // Item ini path datar tanpa query string, jadi NavLink bawaan sudah cukup
  // untuk aktivasi tanpa opsi `end` tambahan (tidak ada route turunannya).
  { name: "Lost & Found", path: "/lost-found", icon: PackageSearch, roles: ALL_ROLES },
  { name: "Profil", path: "/profile", icon: User, roles: ALL_ROLES },
  {
    name: "Dashboard",
    path: "/admin",
    icon: ShieldCheck,
    roles: [ADMIN],
    end: true,
  },
  {
    name: "Kelola Fasilitas",
    path: "/admin/facilities",
    icon: PencilRuler,
    roles: [ADMIN],
  },
  {
    name: "Statistik",
    path: "/admin/reports",
    icon: BarChart3,
    roles: [ADMIN],
  },
  {
    name: "Kelola Pengguna",
    path: "/admin/users",
    icon: Users,
    roles: [ADMIN],
  },
]

// Ikon kotak berwarna di header tiap grup kategori — pembeda visual utama
// antar grup karena bagian ini sengaja tanpa teks label maupun garis pemisah.
const CATEGORY_GROUP_ICONS: Record<ComplaintCategory, LucideIcon> = {
  KEAMANAN: ShieldCheck,
  FASILITAS: Building2,
  AKADEMIK: GraduationCap,
}

// Urutan grup kategori di sidebar (atas ke bawah), terpisah dari urutan chip
// di halaman lain supaya kalau nanti diurut ulang tidak saling kacau.
const CATEGORY_ORDER: readonly ComplaintCategory[] = CATEGORIES

interface CategoryStatusRow {
  label: string;
  status: Complaint["status"];
  icon: LucideIcon;
}

// Baris status pakai ikon netral slate, bukan tint PENDING/Diproses seperti
// StatusBadge di kartu: KEAMANAN itu amber dan PENDING juga amber di
// statusConfig, jadi menyalin warna status ke sini berisiko terlihat seperti
// grup Keamanan yang menyala aneh. Label teks sudah cukup memberi arti.
const CATEGORY_STATUS_ROWS: readonly CategoryStatusRow[] = [
  { label: "Menunggu", status: "PENDING", icon: Clock3 },
  { label: "Diproses", status: "IN_PROGRESS", icon: LoaderCircle },
  { label: "Selesai", status: "RESOLVED", icon: CircleCheck },
]

function DashboardLayout() {
  return (
    <ComplaintSummaryProvider>
      <DashboardLayoutShell />
    </ComplaintSummaryProvider>
  )
}

// Komponen grup kategori diberi key dari route yang aktif: setiap kali grup
// route aktif berubah, subtree di-remount dan state diinisialisasi ulang dari
// route — itu mekanisme "grup otomatis terbuka" tanpa effect yang menyalin
// route ke state pada tiap navigasi.
const categoryForPath = (pathname: string): ComplaintCategory | null =>
  CATEGORY_ORDER.find((category) =>
    pathname.startsWith(categoryPath(category)),
  ) ?? null

function DashboardLayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { summary } = useComplaintSummary()
  const initial = user?.username?.slice(0, 1).toUpperCase() || "U"

  const activeRouteCategory = categoryForPath(location.pathname)

  // Satu grup kategori terbuka dalam satu waktu. Inisialisasi dari route
  // aktif supaya masuk ke route kategori langsung membuka grupnya; key juga
  // dibawa di div pembungkus di bawah sehingga pindah antar route kategori
  // me-remount subtree ini dan state di-reinit dari route, tanpa effect
  // tambahan yang menyalin route ke state.
  const [openCategory, setOpenCategory] = useState<ComplaintCategory | null>(
    activeRouteCategory,
  )

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="app-shell relative overflow-x-hidden">
      <div className="orb fixed right-[-9rem] top-[-8rem] h-[28rem] w-[28rem] bg-blue-500/30" />
      <div className="orb fixed bottom-[-10rem] left-[-9rem] h-[26rem] w-[26rem] bg-violet-500/25" />
      <div className="orb fixed left-[42%] top-[22%] h-[22rem] w-[22rem] bg-pink-400/25" />
      <div className="orb fixed right-[18%] bottom-[6%] h-[20rem] w-[20rem] bg-amber-300/25" />
      <div className="orb fixed left-[12%] top-[58%] h-[18rem] w-[18rem] bg-cyan-400/20" />

      {sidebarOpen && (
        <button
          aria-label="Tutup menu navigasi"
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`glass-sidebar fixed inset-y-0 left-0 z-50 flex w-[17.5rem] transform flex-col text-slate-700 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/45 px-5">
          <Reveal as="div" className="flex items-center gap-3" delay={0}>
            <NavLink
              to="/dashboard"
              className="flex items-center gap-3"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="brand-mark h-10 w-10 rounded-xl">
                <ClipboardList size={20} />
              </span>

              <span>
                <span className="block text-[15px] font-bold tracking-tight text-slate-900">
                  CampusCare
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                  Fasilitas Kampus
                </span>
              </span>
            </NavLink>
          </Reveal>

          <Reveal delay={REVEAL_STAGGER}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="icon-button p-2 lg:hidden"
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </Reveal>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-7">
          <div className="space-y-1.5">
            <RevealList as="div" className="space-y-1.5">
              {navItems
                .filter((item) => item.roles.includes(user?.role ?? STUDENT))
                .map((item) => (
                  <RevealItem key={item.path}>
                    <NavRow
                      item={item}
                      badge={item.path === "/complaints" ? summary?.total : undefined}
                      onNavigate={() => setSidebarOpen(false)}
                    />
                  </RevealItem>
                ))}
            </RevealList>
          </div>

          {/* Grup kategori: pembeda terhadap bagian Umum hanya margin ini.
              key dari route memicu remount (lihat komentar state di atas)
              sehingga grup route aktif selalu terbuka otomatis. */}
          <div
            className="mt-6 space-y-3"
            key={activeRouteCategory ?? "umum"}
          >
            <RevealList as="div" className="space-y-3">
              {CATEGORY_ORDER.map((category) => (
                <RevealItem key={category}>
                  <CategoryGroup
                    category={category}
                    isOpen={openCategory === category}
                    onToggle={() =>
                      setOpenCategory((current) =>
                        current === category ? null : category,
                      )
                    }
                    summary={summary}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </RevealItem>
              ))}
            </RevealList>
          </div>
        </nav>

        <div className="glass-card glass-card-hover m-3 rounded-2xl p-3">
          <Reveal delay={REVEAL_STAGGER * 2}>
            <div className="flex items-center gap-3 px-1 py-1.5">
            <span className="brand-mark h-9 w-9 shrink-0 rounded-xl text-xs font-bold">
              {initial}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.username || "Pengguna"}
              </p>
              <p className="truncate text-xs capitalize text-slate-500">
                {roleLabel(user?.role)}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-900"
          >
            <LogOut size={16} />
            Keluar
          </button>
          </Reveal>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[17.5rem]">
        <header className="glass-nav sticky top-0 z-30">
          <Reveal as="div" className="flex h-[4.5rem] items-center justify-between px-4 sm:px-6 lg:px-8" delay={REVEAL_STAGGER * 2}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="icon-button p-2 lg:hidden"
                aria-label="Buka menu"
              >
                <Menu size={21} />
              </button>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Selamat datang, {user?.username || "Pengguna"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pantau fasilitas kampus dengan mudah.
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-900 sm:hidden">
                CampusCare
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="icon-button relative p-2.5" aria-label="Notifikasi">
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.65)]" />
              </button>

              <NavLink
                to="/profile"
                className="hidden items-center gap-2 rounded-xl border border-white/70 bg-white/55 p-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] transition hover:bg-white/80 sm:flex"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/70 bg-white/70 text-[10px] font-bold text-slate-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                  {initial}
                </span>
              </NavLink>
            </div>
          </Reveal>
        </header>

        <main className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavRow({
  item,
  badge,
  onNavigate,
}: {
  item: NavItem;
  badge: number | undefined;
  onNavigate: () => void;
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl border py-3 pl-4 pr-3 text-sm font-medium ${
          isActive ? "nav-link-active nav-link-accent" : "nav-link"
        }`
      }
    >
      <Icon size={18} />
      <span className="flex-1 truncate">{item.name}</span>
      <CountBadge value={badge} />
    </NavLink>
  )
}

function CountBadge({ value }: { value: number | undefined }) {
  if (value === undefined) {
    return null
  }

  return (
    <span className="rounded-full bg-slate-900/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
      {value}
    </span>
  )
}

// Baris di dalam submenu kategori. Indent pl-11 sejajar dengan teks header
// grup (kotak ikon 36px + gap), ukuran teks dikecilkan satu tingkat supaya
// tingkat kedua terbaca sebagai isi grup, bukan item sejajar.
const subRowClass = (active: boolean) =>
  `flex items-center gap-2.5 rounded-xl border py-2 pl-11 pr-2.5 text-[13px] font-medium ${
    active ? "nav-link-active nav-link-accent" : "nav-link"
  }`

function CategoryGroup({
  category,
  isOpen,
  onToggle,
  summary,
  onNavigate,
}: {
  category: ComplaintCategory;
  isOpen: boolean;
  onToggle: () => void;
  summary: ComplaintSummary | null;
  onNavigate: () => void;
}) {
  const location = useLocation()
  const path = categoryPath(category)
  const config = CATEGORY_CONFIG[category]
  const GroupIcon = CATEGORY_GROUP_ICONS[category]
  const groupPanelId = `sidebar-group-${category.toLowerCase()}`

  // Bar aktif submenu kategori memakai warna kategorinya, bukan indigo
  // universal bagian Umum. ::before membaca CSS var, jadi cukup menimpa var
  // ini di tiap baris submenu (berlaku hanya saat kelas accent ada).
  const accentStyle = {
    "--nav-accent-color": config.chartColor,
    "--nav-accent-glow": `${config.chartColor}8c`,
  } as CSSProperties

  const headerActive = location.pathname.startsWith(path)
  const summaryActive =
    location.pathname === path && location.search === ""

  // urgent_by_category dihitung backend dengan aturan yang sama seperti
  // needsAttention (belum selesai PENDING/IN_PROGRESS, dan HIGH atau umur
  // > 3 hari) dari queryset ter-scope role. Dot disembunyikan kalau summary
  // gagal dimuat supaya tidak pernah ada dot palsu.
  const urgentCount = summary?.urgent_by_category[category] ?? 0
  const total = summary?.by_category[category]

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={groupPanelId}
        style={headerActive ? accentStyle : undefined}
        className={`group flex w-full items-center gap-3 rounded-xl border py-2 pl-2 pr-2 text-sm font-semibold ${
          headerActive ? "nav-link-active nav-link-accent" : "nav-link"
        }`}
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/60 ${config.chipClassName}`}
        >
          <GroupIcon size={16} />
        </span>

        <span className="flex-1 truncate text-left">{config.label}</span>

        {urgentCount > 0 && (
          <>
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]"
            />
            {/* Dot di atas aria-hidden; teks ini yang memberi makna ke screen
                reader tanpa menambah teks visual, sesuai batasan desain. */}
            <span className="sr-only">Ada pengaduan mendesak</span>
          </>
        )}

        <CountBadge value={total} />

        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div id={groupPanelId} className="mt-1 space-y-1">
          <NavLink
            to={path}
            onClick={onNavigate}
            style={accentStyle}
            className={subRowClass(summaryActive)}
          >
            <span className="flex-1 truncate">Ringkasan</span>
          </NavLink>

          {CATEGORY_STATUS_ROWS.map(({ label, status, icon: RowIcon }) => (
            <NavLink
              key={status}
              to={`${path}?status=${status}`}
              onClick={onNavigate}
              style={accentStyle}
              // NavLink yang membawa search hanya menyala kalau query-nya
              // cocok, jadi baris "Menunggu" tidak salah aktif di Ringkasan.
              className={({ isActive }) => subRowClass(isActive)}
            >
              <RowIcon size={15} className="shrink-0 text-slate-500" />
              <span className="flex-1 truncate">{label}</span>
              <CountBadge
                value={summary?.by_status_per_category[category][status]}
              />
            </NavLink>
          ))}

          <NavLink
            to={`/complaints/create?category=${category}`}
            onClick={onNavigate}
            className={subRowClass(false)}
          >
            <Plus size={15} className="shrink-0 text-slate-500" />
            <span className="flex-1 truncate">
              Buat Laporan {config.label}
            </span>
          </NavLink>
        </div>
      )}
    </div>
  )
}

export default DashboardLayout
