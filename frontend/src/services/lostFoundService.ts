import api from "./api";

// Nilai enum harus tetap sinkron dengan LostFoundItem.Type dan
// LostFoundItem.Status di backend/apps/lostfound/models.py.
export type LostFoundType = "LOST" | "FOUND";
export type LostFoundStatus = "OPEN" | "RESOLVED";

export interface LostFoundItem {
  id: number;
  type: LostFoundType;
  title: string;
  description: string;
  location: string;
  // Tanggal kejadian dalam format "YYYY-MM-DD" dari DateField backend.
  date: string;
  // Kosong ketika pelapor tidak menuliskan kontak.
  contact: string;
  status: LostFoundStatus;
  reporter: number;
  reporter_name: string;
  // Satu-satunya sumber hak ubah/hapus yang dipercaya frontend. Menghitung
  // ulang izin di client berisiko salah role, jadi tombol aksi hanya tampil
  // saat field ini true.
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

// `reporter` dan `status` sengaja tidak ikut di sini: reporter selalu diisi
// backend dari sesi login (perform_create), dan status baru diatur lewat
// UpdateLostFoundPayload saat menandai selesai.
export interface CreateLostFoundPayload {
  type: LostFoundType;
  title: string;
  description: string;
  location: string;
  date: string;
  contact?: string;
}

// Patch memakai tipe terpisah, bukan Partial<CreateLostFoundPayload>, supaya
// `type` tidak pernah bisa terkirim: backend menolak perubahan tipe dengan 400
// ("Tipe laporan tidak dapat diubah setelah dibuat").
export interface UpdateLostFoundPayload {
  status?: LostFoundStatus;
}

export interface LostFoundListParams {
  type?: LostFoundType;
  status?: LostFoundStatus;
  search?: string;
}

export const LOST_FOUND_TYPE_LABELS: Record<LostFoundType, string> = {
  LOST: "Kehilangan",
  FOUND: "Penemuan",
};

export const LOST_FOUND_STATUS_LABELS: Record<LostFoundStatus, string> = {
  OPEN: "Terbuka",
  RESOLVED: "Selesai",
};

// Endpoint ini mengembalikan array biasa tanpa paginasi dan diurutkan terbaru
// di backend, sama seperti GET /complaints/. Nilai diperlakukan apa adanya
// supaya halaman bisa memfilter dan mencari di client.
export const getLostFoundItems = async (
  params?: LostFoundListParams,
): Promise<LostFoundItem[]> => {
  const response = await api.get("/lost-found/", { params });
  return response.data;
};

export const getLostFoundDetail = async (
  id: number,
): Promise<LostFoundItem> => {
  const response = await api.get(`/lost-found/${id}/`);
  return response.data;
};

export const createLostFoundItem = async (
  payload: CreateLostFoundPayload,
): Promise<LostFoundItem> => {
  const response = await api.post("/lost-found/", payload);
  return response.data;
};

// PATCH dipakai, bukan PUT, supaya hanya status yang berubah dan field lain
// tidak ikut tertimpa oleh nilai state form yang sudah usang.
export const updateLostFoundItem = async (
  id: number,
  payload: UpdateLostFoundPayload,
): Promise<LostFoundItem> => {
  const response = await api.patch(`/lost-found/${id}/`, payload);
  return response.data;
};

export const deleteLostFoundItem = async (id: number): Promise<void> => {
  await api.delete(`/lost-found/${id}/`);
};
