import api, { unwrapList, type ListEnvelope } from "./api";

export type FacilityStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface Facility {
  id: number;
  name: string;
  description: string;
  location: string;
  status: FacilityStatus;
  created_at: string;
  updated_at: string;
}

// TODO(backend): serializer /facilities/ masih datar. Kalau nanti sudah nested
// atau ada endpoint statistik, pindahkan pemanggilan ke sini.
export const getFacilities = async (): Promise<ListEnvelope<Facility>> => {
  const response = await api.get("/facilities/");
  return unwrapList<Facility>(response.data);
};

// Field yang boleh dikirim facility. Serializer di backend mewajibkan name
// dan location, description boleh kosong, dan status boleh diisi.
// PATCH dipakai, bukan PUT, supaya field yang tidak ikut dikirim tidak berubah.
export type FacilityWritePayload = Partial<
  Pick<Facility, "name" | "description" | "location" | "status">
>;

// Tulis fasilitas hanya diizinkan untuk role ADMIN di backend
// (IsAdminOrReadOnly di apps/accounts/permissions.py). Fungsi ini tidak
// menambahkan pemeriksaan sendiri; penolakan 403 dari server yang berlaku.
export const createFacility = async (
  payload: FacilityWritePayload,
): Promise<Facility> => {
  const response = await api.post("/facilities/", payload);
  return response.data;
};

export const updateFacility = async (
  id: number,
  payload: FacilityWritePayload,
): Promise<Facility> => {
  const response = await api.patch(`/facilities/${id}/`, payload);
  return response.data;
};

// TIDAK ada deleteFacility di modul ini. Field facility di model Complaint
// memakai on_delete=CASCADE (apps/complaints/models.py), jadi DELETE
// /api/facilities/{id}/ menghapus permanen seluruh pengaduan pada fasilitas
// tersebut. Backend juga tidak punya endpoint untuk menghitung dampaknya.
// Ekspos hanya setelah backend punya pengaman (mis. 409 atau soft delete).