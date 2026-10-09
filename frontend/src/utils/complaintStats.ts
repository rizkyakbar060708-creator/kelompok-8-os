import type { Complaint } from "../services/complaintService";
import type { Facility } from "../services/facilityService";

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