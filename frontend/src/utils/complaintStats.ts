import type { Complaint } from "../services/complaintService";
import { subCategoryLabel } from "../services/complaintService";
import type { Facility } from "../services/facilityService";
import {
  COMPLAINT_STATUSES,
  type StatusSlice,
} from "./statusConfig";

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  resolutionRate: number;
}

export interface ComplaintRow extends Complaint {
  location: string;
  facilityName: string;
}

export function buildStats(complaints: Complaint[]): ComplaintStats {
  const count = (status: Complaint["status"]) =>
    complaints.filter((complaint) => complaint.status === status).length;

  const total = complaints.length;
  const resolved = count("RESOLVED");

  return {
    total,
    pending: count("PENDING"),
    inProgress: count("IN_PROGRESS"),
    resolved,
    rejected: count("REJECTED"),
    resolutionRate: total === 0 ? 0 : (resolved / total) * 100,
  };
}

// Serializer /complaints/ masih mengembalikan facility sebagai integer PK, jadi
// nama dan lokasi harus di-join di client.
export function joinFacilities(
  complaints: Complaint[],
  facilities: Facility[],
): ComplaintRow[] {
  const byId = new Map(facilities.map((facility) => [facility.id, facility]));

  return complaints
    .map((complaint) => {
      // Kategori AKADEMIK/KEAMANAN tidak punya fasilitas, jadi facility null.
      const facility =
        complaint.facility === null
          ? undefined
          : byId.get(complaint.facility);

      return {
        ...complaint,
        facilityName: facility?.name ?? "Tanpa fasilitas",
        location: facility?.location ?? "Tidak terkait fasilitas",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateFormatter.format(date);
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(1).replace(".", ",")}%`;
}

// Urutan status tetap mengikuti COMPLAINT_STATUSES supaya legenda chart,
// kartu metrik, dan tabel laporan tidak pernah berbeda urutan.
export function statusSlices(complaints: Complaint[]): StatusSlice[] {
  return COMPLAINT_STATUSES.map((status) => ({
    status,
    count: complaints.filter((complaint) => complaint.status === status).length,
  }));
}

export interface PriorityCount {
  priority: Complaint["priority"];
  count: number;
}

export const COMPLAINT_PRIORITIES: readonly Complaint["priority"][] = [
  "HIGH",
  "MEDIUM",
  "LOW",
];

export function priorityCounts(complaints: Complaint[]): PriorityCount[] {
  return COMPLAINT_PRIORITIES.map((priority) => ({
    priority,
    count: complaints.filter((complaint) => complaint.priority === priority)
      .length,
  }));
}

// Antrean tindak lanjut: hanya PENDING, paling lama duluan. Urutan ini yang
// dipakai dashboard untuk memutuskan siapa yang harus mengerjakan berikutnya.
// Generik supaya ComplaintRow (sudah punya facilityName) tetap utuh saat
// dipanggil dari halaman yang butuh nama fasilitas.
export function pendingQueue<T extends Complaint>(complaints: T[]): T[] {
  return complaints
    .filter((complaint) => complaint.status === "PENDING")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
}

export interface FacilityLoad {
  facilityId: number;
  facilityName: string;
  location: string;
  total: number;
  unresolved: number;
}

const UNRESOLVED_STATUSES: readonly Complaint["status"][] = [
  "PENDING",
  "IN_PROGRESS",
];

// Ranking fasilitas dihitung dari baris pengaduan yang benar-benar diterima
// server. Backend tidak punya endpoint agregasi per fasilitas, jadi ini murni
// turunan data; kalau nanti paginasi aktif, angkanya hanya mewakili baris yang
// diterima dan harus dilabeli demikian.
export function facilityLoad(
  rows: ComplaintRow[],
  limit = 5,
): FacilityLoad[] {
  const totals = new Map<number, FacilityLoad>();

  for (const row of rows) {
    // Ranking per fasilitas hanya bermakna untuk pengaduan yang punya fasilitas.
    if (row.facility === null) {
      continue;
    }

    const entry = totals.get(row.facility) ?? {
      facilityId: row.facility,
      facilityName: row.facilityName,
      location: row.location,
      total: 0,
      unresolved: 0,
    };

    entry.total += 1;

    if (UNRESOLVED_STATUSES.includes(row.status)) {
      entry.unresolved += 1;
    }

    totals.set(row.facility, entry);
  }

  return [...totals.values()]
    .sort((a, b) => b.total - a.total || a.facilityName.localeCompare(b.facilityName))
    .slice(0, limit);
}

export interface TrendPoint {
  // Tanggal dalam format YYYY-MM-DD sebagai key bucket.
  date: string;
  // Label siap tampil, mis. "12 Nov".
  label: string;
  count: number;
}

// Jumlah pengaduan per hari untuk N hari terakhir. Bucket yang kosong tetap
// dibuat supaya garis grafik tidak melompati tanggal.
export function dailyTrend(
  complaints: Complaint[],
  days = 14,
  today = new Date(),
): TrendPoint[] {
  const buckets = new Map<string, number>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);

    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);

    buckets.set(toDateKey(day), 0);
  }

  for (const complaint of complaints) {
    const created = new Date(complaint.created_at);

    if (Number.isNaN(created.getTime())) {
      continue;
    }

    const key = toDateKey(created);

    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([key, count]) => {
    const date = new Date(`${key}T00:00:00`);

    return {
      date: key,
      label: date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      count,
    };
  });
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Umur pengaduan tertua yang masih menunggu, dalam hari bulat. Dipakai sebagai
// peringatan nyata kalau antrean sudah lama tidak ditangani, bukan SLA.
export function oldestPendingAgeDays(complaints: Complaint[]): number {
  const oldest = pendingQueue(complaints)[0];

  if (!oldest) {
    return 0;
  }

  const elapsed = Date.now() - new Date(oldest.created_at).getTime();

  if (Number.isNaN(elapsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

// --- Jendela waktu & perbandingan periode -----------------------------------

// Semua pengaduan yang dibuat dalam N hari terakhir. days null = tanpa batas
// (rentang "semua").
export function inWindow<T extends Complaint>(
  complaints: T[],
  days: number | null,
  today = new Date(),
): T[] {
  if (days === null) {
    return complaints;
  }

  const cutoff = new Date(today);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  return complaints.filter(
    (complaint) =>
      !Number.isNaN(new Date(complaint.created_at).getTime()) &&
      new Date(complaint.created_at) >= cutoff,
  );
}

export interface PeriodDelta {
  current: number;
  previous: number;
  // Selisih bertanda; positif berarti periode ini melebihi periode sebelumnya.
  diff: number;
}

// Pengaduan dibuat pada periode ini versus periode sepanjang sama sebelum itu.
// Pemanggil menentukan arah baik/buruk (menunggu naik itu buruk, selesai naik
// itu baik), jadi fungsi ini sengaja netral.
export function periodDelta(
  complaints: Complaint[],
  days: number,
  today = new Date(),
): PeriodDelta {
  const currentRows = inWindow(complaints, days, today);

  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (2 * days - 1));

  const previousRows = complaints.filter(
    (complaint) =>
      !Number.isNaN(new Date(complaint.created_at).getTime()) &&
      new Date(complaint.created_at) >= start &&
      new Date(complaint.created_at) < new Date(start.getTime() + (days * 86_400_000)),
  );

  const current = currentRows.length;
  const previous = previousRows.length;

  return { current, previous, diff: current - previous };
}

// Format delta siap tampil: selalu ada tanda, dan periode sebelumnya yang
// kosong dilabeli "baru" supaya angka pertama tidak terlihat seperti lonjakan
// dramatis dari nol.
export function formatDelta(delta: PeriodDelta): string | null {
  if (delta.previous === 0) {
    return delta.current === 0 ? null : `+${delta.current} baru`;
  }

  return delta.diff > 0 ? `+${delta.diff}` : `${delta.diff}`;
}

// Arah perubahan dipisah dari nilai baik/buruknya yang memang milik metrik.
export type DeltaTone = "good" | "bad" | "neutral";

// --- Rata-rata waktu penyelesaian----------------------------------------

export function avgResolutionHours(complaints: Complaint[]): number | null {
  const durations = complaints
    .filter(
      (complaint) =>
        complaint.resolved_at !== null &&
        !Number.isNaN(new Date(complaint.resolved_at).getTime()),
    )
    .map(
      (complaint) =>
        (new Date(complaint.resolved_at as string).getTime() -
          new Date(complaint.created_at).getTime()) /
        3_600_000,
    )
    .filter((hours) => Number.isFinite(hours) && hours >= 0);

  if (durations.length === 0) {
    return null;
  }

  return durations.reduce((sum, hours) => sum + hours, 0) / durations.length;
}

// "3,5 jam" atau "2,1 hari" — satunya saja, dipilih unit yang paling mudah
// dibaca. Rounding ke satu desimal dengan koma desimal Indonesia.
export function formatResolutionHours(hours: number | null): string {
  if (hours === null) {
    return "—";
  }

  if (hours < 48) {
    return `${hours.toFixed(1).replace(".", ",")} jam`;
  }

  return `${(hours / 24).toFixed(1).replace(".", ",")} hari`;
}

// --- Ringkasan per kategori ----------------------------------------------

export interface CategoryStats {
  category: Complaint["category"];
  total: number;
  slices: StatusSlice[];
  highPriority: number;
  resolutionRate: number;
  // Rata-rata waktu penyelesaian kategori ini, dalam jam (null saat belum ada
  // yang selesai).
  avgResolution: number | null;
  trend7: TrendPoint[];
}

// Status per kategori + hitungan prioritas + tren 7 hari. Semua dihitung dari
// baris yang sama dengan kartu lain supaya tidak ada dua angka yang
// bertentangan di satu halaman.
export function buildCategoryStats(
  complaints: Complaint[],
  today = new Date(),
): Record<Complaint["category"], CategoryStats> {
  const categories: Complaint["category"][] = [
    "FASILITAS",
    "AKADEMIK",
    "KEAMANAN",
  ];

  const result = {} as Record<Complaint["category"], CategoryStats>;

  for (const category of categories) {
    const rows = complaints.filter(
      (complaint) => complaint.category === category,
    );
    const slices = statusSlices(rows);
    const resolved =
      slices.find((slice) => slice.status === "RESOLVED")?.count ?? 0;

    result[category] = {
      category,
      total: rows.length,
      slices,
      highPriority: rows.filter((row) => row.priority === "HIGH").length,
      resolutionRate:
        rows.length === 0 ? 0 : (resolved / rows.length) * 100,
      avgResolution: avgResolutionHours(rows),
      trend7: dailyTrend(rows, 7, today),
    };
  }

  return result;
}

// --- Umur pengaduan -------------------------------------------------------

// "Hari ini", "5 jam lalu", "3 hari lalu" — untuk kolom umur di tabel.
export function ageLabel(value: string, now = new Date()): string {
  const created = new Date(value);

  if (Number.isNaN(created.getTime())) {
    return "-";
  }

  const elapsedMs = now.getTime() - created.getTime();

  if (elapsedMs < 0) {
    return "Hari ini";
  }

  const hours = Math.floor(elapsedMs / 3_600_000);

  if (hours < 1) {
    return "Baru saja";
  }

  if (hours < 24) {
    return `${hours} jam lalu`;
  }

  const days = Math.floor(hours / 24);

  return `${days} hari lalu`;
}

export const ATTENTION_AGE_DAYS = 3;

export function unresolvedStatus(
  complaint: Complaint,
): boolean {
  return (
    complaint.status === "PENDING" || complaint.status === "IN_PROGRESS"
  );
}

// Panel "Perlu perhatian": HIGH apapun statusnya, atau pengaduan yang belum
// ditindaklanjuti lebih dari 3 hari (konstanta di atas, supaya aturan satu
// angka ini bisa diuji langsung).
export function needsAttention(
  complaint: Complaint,
  now = new Date(),
): boolean {
  if (!unresolvedStatus(complaint)) {
    return false;
  }

  if (complaint.priority === "HIGH") {
    return true;
  }

  const created = new Date(complaint.created_at);

  if (Number.isNaN(created.getTime())) {
    return false;
  }

  return (
    now.getTime() - created.getTime() > ATTENTION_AGE_DAYS * 86_400_000
  );
}

// Alasan singkat mengapa baris ini masuk panel perhatian, untuk ditampilkan
// lebih dari sekadar warna.
export function attentionReason(
  complaint: Complaint,
  now = new Date(),
): string {
  if (complaint.priority === "HIGH") {
    if (unresolvedStatus(complaint) && isOverAgeThreshold(complaint, now)) {
      return "Prioritas tinggi dan menunggu lebih dari 3 hari";
    }

    return "Prioritas tinggi";
  }

  return `Belum ditangani ${Math.floor(
    (now.getTime() - new Date(complaint.created_at).getTime()) / 86_400_000,
  )} hari`;
}

function isOverAgeThreshold(complaint: Complaint, now: Date): boolean {
  return (
    now.getTime() - new Date(complaint.created_at).getTime() >
    ATTENTION_AGE_DAYS * 86_400_000
  );
}

export interface SituationCount {
  label: string;
  count: number;
}

// 5 lokasi paling sering: nama fasilitas untuk pengaduan ber-fasilitas, teks
// lokasi kejadian (fallback label sub-kategori) untuk kategori lain. Logika
// label ini identik dengan _location_label di backend supaya angka top-5 yang
// dihitung frontend tidak berbeda dengan versi backend bila dibandingkan.
export function topSituations(
  rows: ComplaintRow[],
  limit = 5,
): SituationCount[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = (
      row.facility !== null
        ? row.facilityName
        : row.incident_location?.trim() ||
          subCategoryLabel(row.sub_category) ||
          ""
    ).trim();

    if (label === "") {
      continue;
    }

    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}