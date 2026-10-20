import api, { unwrapList, type ListEnvelope } from "./api";

// Tipe pengguna yang dikembalikan endpoint manajemen admin (/api/users/).
// Sengaja dipisah dari tipe User di AuthContext (id, username, role) karena
// endpoint admin membawa lebih banyak field dan tidak boleh dicampur dengan
// data sesi yang datang dari /auth/me/.
export interface AdminUser {
  id: number;
  username: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
  is_active: boolean;
  date_joined: string;
  complaints_count: number;
}

// Role yang boleh dipilih admin saat mengubah role pengguna. Nilai ini mirip
// enum User.Role di backend dan disesuaikan agar konsisten.
export type AdminRole = "STUDENT" | "STAFF" | "ADMIN";

export interface UpdateUserRolePayload {
  role: AdminRole;
}

export interface ResetUserPasswordPayload {
  password: string;
}

// Endpoint /api/users/ mengembalikan array penuh (tanpa paginasi), sama seperti
// daftar pengaduan dan fasilitas. Envelope dibungkus lewat unwrapList agar
// pemanggil tahu apakah respons mencakup semua baris.
export const getUsers = async (): Promise<ListEnvelope<AdminUser>> => {
  const response = await api.get("/users/");
  return unwrapList<AdminUser>(response.data);
};

// PATCH /api/users/<id>/ hanya mengubah role. Field lain (is_active,
// date_joined, complaints_count) read-only di backend.
export const updateUserRole = async (
  id: number,
  payload: UpdateUserRolePayload,
): Promise<AdminUser> => {
  const response = await api.patch(`/users/${id}/`, payload);
  return response.data;
};

// POST /api/users/<id>/password/ mereset password pengguna lain oleh admin.
// Respons 204 tanpa body (password tidak pernah dikembalikan).
export const resetUserPassword = async (
  id: number,
  payload: ResetUserPasswordPayload,
): Promise<void> => {
  await api.post(`/users/${id}/password/`, payload);
};
