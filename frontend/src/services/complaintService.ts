import api from "./api";

export interface Complaint {
  id: number;
  reporter: number;
  facility: number;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
  updated_at: string;
}

// TODO(backend): endpoint ini mengembalikan SELURUH pengaduan untuk siapa pun yang
// terautentikasi, karena ComplaintsView belum punya get_queryset() scoping per user.
// Filter `reporter === user.id` di dashboard hanya kosmetik (render), bukan akses
// control. Shahih bilangnya setelah backend menambah:
//   - ComplaintListCreateView.get_queryset() -> filter reporter=request.user
//   - perform_create() -> paksa reporter=request.user (sekarang bisa di-spoof client)
//   - ComplaintDetailView -> ownership check
//   - GET /api/complaints/stats/ untuk agregasi admin (dashboard admin sekarang
//     menghitung di client dari list penuh, dan endpoint ini belum ada)
export const getComplaints = async (): Promise<Complaint[]> => {
  const response = await api.get("/complaints/");
  return response.data;
};  