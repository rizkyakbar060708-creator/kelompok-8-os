import type { Complaint } from "../services/complaintService";
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
      const facility = byId.get(complaint.facility);

      return {
        ...complaint,
        facilityName: facility?.name ?? "Fasilitas tidak dikenal",
        location: facility?.location ?? "Lokasi tidak tersedia",
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