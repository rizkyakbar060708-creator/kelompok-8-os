import api from "./api";

export interface Complaint {
  id: number;
  reporter: number;
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

// TODO(backend): endpoint ini mengembalikan SELURUH pengaduan untuk siapa pun yang
// terautentikasi, karena ComplaintsView belum punya get_queryset() scoping per user.
// Filter `reporter === user.id` di dashboard hanya kosmetik (render), bukan akses
// control. Shahih bilangnya setelah backend menambah:
//   - ComplaintListCreateView.get_queryset() -> filter reporter=request.user
//   - ComplaintDetailView -> ownership check
//   - GET /api/complaints/stats/ untuk agregasi admin (dashboard admin sekarang
//     menghitung di client dari list penuh, dan endpoint ini belum ada)
export const getComplaints = async (): Promise<Complaint[]> => {
  const response = await api.get("/complaints/");
  return response.data;
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
