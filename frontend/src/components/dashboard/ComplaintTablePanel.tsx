import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

import StatusBadge from "../ui/StatusBadge";
import PriorityBadge from "../ui/PriorityBadge";
import { getComplaints, type Complaint } from "../../services/complaintService";
import type { Facility } from "../../services/facilityService";
import { subCategoryLabel } from "../../services/complaintService";
import {
  CATEGORY_CONFIG,
  type ComplaintCategory,
} from "../../utils/categoryConfig";
import {
  COMPLAINT_STATUSES,
  STATUS_CONFIG,
} from "../../utils/statusConfig";
import { PRIORITY_CONFIG } from "../../utils/priorityConfig";
import { ageLabel, formatDate, joinFacilities } from "../../utils/complaintStats";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 350;

type SortMode = "NEWEST" | "PRIORITY" | "STATUS";

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "NEWEST", label: "Terbaru" },
  { value: "PRIORITY", label: "Prioritas tertinggi" },
  { value: "STATUS", label: "Status" },
];

const PRIORITY_ORDER: Record<Complaint["priority"], number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

// Status "paling butuh tindakan" diurutkan duluan agar mode urut STATUS
// menampilkan antrean yang belum ditangani di atas.
const STATUS_ORDER: Record<Complaint["status"], number> = {
  PENDING: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  REJECTED: 3,
};

interface ComplaintTablePanelProps {
  // null = tab "Semua" (tanpa filter category di server).
  category: ComplaintCategory | null;
  facilities: Facility[];
  // Kolom pelapor hanya bermakna untuk ADMIN; backend mengirim null untuk
  // role lain, jadi flag ini hanya menyetel lebar kolomnya.
  showReporter: boolean;
}

// Tabel antrean pengaduan per tab. Pencarian, status, dan prioritas difilter
// di server lewat query param endpoint list; urutan dan paginasi dilakukan di
// client karena endpoint belum paginasi.
function ComplaintTablePanel({
  category,
  facilities,
  showReporter,
}: ComplaintTablePanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [sort, setSort] = useState<SortMode>("NEWEST");
  const [page, setPage] = useState(1);

  // Hasil fetch terakhir disimpan bersama "key" param yang dipakai untuk
  // mendapatkannya. loading dihitung dari ketidaksamaan key — bukan state yang
  // diset sinkron di dalam effect — supaya tampilan skeleton tetap benar
  // tanpa setState saat render-effect berjalan.
  const [loaded, setLoaded] = useState<{
    key: string;
    rows: Complaint[];
    failed: boolean;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const params = useMemo(
    () => ({
      category: category ?? undefined,
      status: status || undefined,
      priority: priority || undefined,
      search: searchQuery.trim() || undefined,
    }),
    [category, status, priority, searchQuery],
  );

  // JSON.stringify cukup stabil untuk objek params satu-level ini dan
  // memberi key yang benar untuk perbandingan loading.
  const paramKey = JSON.stringify(params);

  useEffect(() => {
    // Key dikembalikan menjadi objek di dalam effect supaya dependensi cukup
    // paramKey — params yang di-stable oleh useMemo jadi tidak diperlukan.
    const requestParams = JSON.parse(paramKey) as typeof params;

    getComplaints(requestParams)
      .then((envelope) => {
        setLoaded({ key: paramKey, rows: envelope.items, failed: false });
      })
      .catch(() => {
        setLoaded({ key: paramKey, rows: [], failed: true });
      });
  }, [paramKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loading = loaded === null || loaded.key !== paramKey;
  const failed = !loading && loaded !== null && loaded.failed;

  const rows = useMemo(
    () => (loading ? [] : (loaded?.rows ?? [])),
    [loading, loaded],
  );

  // Reset halaman dilakukan di handler event (bukan effect) saat filter atau
  // pencarian berubah.
  const resetPage = () => setPage(1);

  const joined = useMemo(
    () => joinFacilities(rows, facilities),
    [rows, facilities],
  );

  const sorted = useMemo(() => {
    const copy = [...joined];

    copy.sort((a, b) => {
      switch (sort) {
        case "PRIORITY":
          return (
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "STATUS":
          return (
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return copy;
  }, [joined, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const labelForFacility = (row: Complaint): string => {
    if (row.facility !== null) {
      const facility = facilities.find((item) => item.id === row.facility);
      return facility?.name ?? "Fasilitas tidak diketahui";
    }

    // Kategori non-FASILITAS: pakai lokasi kejadian, fallback ke subkategori.
    return (
      row.incident_location?.trim() || subCategoryLabel(row.sub_category) || "-"
    );
  };

  return (
    <section
      aria-labelledby="complaint-table-title"
      className="glass-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="complaint-table-title" className="text-base font-semibold text-slate-900">
            Daftar pengaduan
          </h2>
          <p className="text-xs text-slate-500">
            {loading
              ? "Memuat..."
              : `${sorted.length} pengaduan sesuai filter saat ini`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="glass-pill border-slate-200 bg-white/70 px-3 py-1.5">
            <Search size={14} aria-hidden="true" className="shrink-0 text-slate-500" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                resetPage();
              }}
              placeholder="Cari judul atau deskripsi..."
              aria-label="Cari pengaduan"
              className="w-44 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </label>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              resetPage();
            }}
            aria-label="Filter status"
            className="glass-pill border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">Semua status</option>
            {COMPLAINT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_CONFIG[value].label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              resetPage();
            }}
            aria-label="Filter prioritas"
            className="glass-pill border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">Semua prioritas</option>
            {(Object.keys(PRIORITY_CONFIG) as Array<keyof typeof PRIORITY_CONFIG>).map(
              (value) => (
                <option key={value} value={value}>
                  {PRIORITY_CONFIG[value].label}
                </option>
              ),
            )}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            aria-label="Urutkan"
            className="glass-pill border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed ? (
        <p className="mt-4 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          Gagal memuat daftar pengaduan. Coba muat ulang halaman.
        </p>
      ) : !loading && pageRows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-900/10 px-4 py-10 text-center text-sm text-slate-500">
          Tidak ada pengaduan yang cocok dengan filter ini.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="pb-2 pr-3 font-semibold">Pengaduan</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">Lokasi</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">Status &amp; Prioritas</th>
                {showReporter && (
                  <th scope="col" className="pb-2 pr-3 font-semibold">Pelapor</th>
                )}
                <th scope="col" className="pb-2 font-semibold">Umur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <tr key={`skeleton-${index}`}>
                      <td colSpan={showReporter ? 5 : 4} className="py-3">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-900/10" />
                      </td>
                    </tr>
                  ))
                : pageRows.map((row) => (
                    <tr key={row.id} className="align-middle">
                      <td className="py-3 pr-3">
                        <Link
                          to={`/complaints/${row.id}`}
                          className="font-medium text-slate-900 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          {row.title}
                        </Link>
                        {category === null && (
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              CATEGORY_CONFIG[row.category].chipClassName
                            }`}
                          >
                            {CATEGORY_CONFIG[row.category].label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">
                        {labelForFacility(row)}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={row.status} />
                          <PriorityBadge priority={row.priority} />
                        </div>
                      </td>
                      {showReporter && (
                        <td className="py-3 pr-3 text-xs text-slate-600">
                          {row.is_anonymous
                            ? "Anonim"
                            : (row.reporter_username ?? "-")}
                        </td>
                      )}
                      <td className="py-3 text-xs text-slate-600">
                        <span className="block">{formatDate(row.created_at)}</span>
                        <span className="text-slate-400">
                          {ageLabel(row.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !failed && pageCount > 0 && (
        <nav
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
          aria-label="Halaman tabel pengaduan"
        >
          <p className="text-xs text-slate-500">
            Halaman {currentPage} dari {pageCount}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
              className="glass-pill border-slate-200 bg-white/70 px-2.5 py-1 text-slate-700 outline-none transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.min(pageCount, value + 1))
              }
              disabled={currentPage === pageCount}
              aria-label="Halaman berikutnya"
              className="glass-pill border-slate-200 bg-white/70 px-2.5 py-1 text-slate-700 outline-none transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}

export default ComplaintTablePanel;
