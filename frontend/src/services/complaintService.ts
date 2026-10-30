import api, { unwrapList, type ListEnvelope } from "./api";

export interface Complaint {
  id: number;
  reporter: number;
  // Hanya diisi untuk role ADMIN; backend mengirim null untuk role lain.
  reporter_username?: string | null;
  facility: number;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  // URL absolut dari MEDIA_URL. null saat pengaduan dibuat tanpa foto.
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateComplaintPayload {
  facility: number;
  title: string;
  description: string;
  image?: File | null;
}

// Hanya status dan priority yang boleh dikirim lewat sini; field lain ikut
// ditolak backend untuk role yang tidak berhak.
export interface UpdateComplaintPayload {
  status?: Complaint["status"];
  priority?: Complaint["priority"];
}

// Endpoint ini mengembalikan SELURUH baris tanpa paginasi, jadi filter,
// pencarian, dan statistik masih dihitung di client sampai backend menambahkan
// paginasi dan endpoint agregasi. Envelope dikembalikan apa adanya supaya
// pemanggil tahu apakah angka yang dihitungnya mencakup semua baris atau hanya
// halaman pertama.
export const getComplaints = async (): Promise<ListEnvelope<Complaint>> => {
  const response = await api.get("/complaints/");
  return unwrapList<Complaint>(response.data);
};

export const getComplaintDetail = async (
  id: number,
): Promise<Complaint> => {
  const response = await api.get(`/complaints/${id}/`);
  return response.data;
};

// `reporter` sengaja tidak ikut. Backend mengabaikannya dan selalu memakai
// user dari access token (perform_create di ComplaintListCreateView), jadi
// field itu read-only di serializer.
export const createComplaint = async (
  payload: CreateComplaintPayload,
): Promise<Complaint> => {
  const formData = new FormData();

  formData.append("facility", String(payload.facility));
  formData.append("title", payload.title);
  formData.append("description", payload.description);

  if (payload.image) {
    formData.append("image", payload.image);
  }

  // Content-Type sengaja tidak diset. Axel wajib menulis sendiri boundary
  // multipart; kalau dipaksa "application/json" backend tidak akan mem-parse
  // file dan field biasa ikut jadi rusak.
  const response = await api.post("/complaints/", formData);
  return response.data;
};

// PATCH dipakai, bukan PUT, supaya hanya field yang dikirim yang berubah.
export const updateComplaint = async (
  id: number,
  payload: UpdateComplaintPayload,
): Promise<Complaint> => {
  const response = await api.patch(`/complaints/${id}/`, payload);
  return response.data;
};

export const deleteComplaint = async (id: number): Promise<void> => {
  await api.delete(`/complaints/${id}/`);
};
