import api, { unwrapList, type ListEnvelope } from "./api";

// Nilai enum harus tetap sinkron dengan Appeal.Status di backend.
export type AppealStatus = "PENDING" | "ACCEPTED" | "DENIED";

export interface Appeal {
  id: number;
  // Id laporan yang dibandingkan; dipakai mengaitkan banding ke halaman detail.
  complaint: number;
  complaint_title: string;
  status: AppealStatus;
  reason: string;
  // Path "/media/..." tanpa host, atau null saat tanpa bukti gambar. WAJIB
  // dilewati resolveMediaUrl() sebelum dipakai sebagai src gambar.
  evidence: string | null;
  // Catatan admin saat memutus banding; kosong selama belum diputuskan.
  response_note: string;
  // null sampai admin menerima/menolak banding.
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// `evidence` dirender di halaman banding admin hanya sebagai informasi; tipe
// ini tidak membawa decorator apa pun supaya bentuknya sama dengan respons API.
export interface CreateAppealPayload {
  reason: string;
  evidence?: File | null;
}

export interface DecideAppealPayload {
  status: "ACCEPTED" | "DENIED";
  response_note?: string;
}

// Endpoint ini mengembalikan array biasa tanpa paginasi, terbaru dulu — sama
// seperti GET /complaints/. unwrapList tetap dipakai supaya kalau backend suatu
// saat memakai amplop paginasi, pemanggil tetap membaca field yang sama.
export const getComplaintAppeals = async (
  complaintId: number,
): Promise<ListEnvelope<Appeal>> => {
  const response = await api.get(`/complaints/${complaintId}/appeals/`);
  return unwrapList<Appeal>(response.data);
};

// Pengiriman banding selalu multipart/form-data. Content-Type sengaja tidak
// diset: axios wajib menulis sendiri boundary multipart; kalau dipaksa
// "application/json", file bukti tidak akan ter-parse di backend.
export const createAppeal = async (
  complaintId: number,
  payload: CreateAppealPayload,
): Promise<Appeal> => {
  const formData = new FormData();

  formData.append("reason", payload.reason);

  if (payload.evidence) {
    formData.append("evidence", payload.evidence);
  }

  const response = await api.post(
    `/complaints/${complaintId}/appeals/`,
    formData,
  );
  return response.data;
};

// Antrean banding khusus ADMIN. Endpoint ini membalas 403 untuk role lain,
// jadi pemanggil wajib sudah memeriksa isAdmin() sebelum memanggil fungsi ini.
export const getAppealQueue = async (): Promise<ListEnvelope<Appeal>> => {
  const response = await api.get("/appeals/", {
    params: { status: "PENDING" },
  });
  return unwrapList<Appeal>(response.data);
};

// PATCH dipakai, bukan PUT, supaya hanya status dan catatan yang berubah.
// response_note ikut hanya bila diisi: mengirim string kosong akan menimpa
// catatan lama tanpa alasan, sedangkan field yang dihilangkan tidak menyentuh
// kolom tersebut di backend.
export const decideAppeal = async (
  id: number,
  payload: DecideAppealPayload,
): Promise<Appeal> => {
  const body: Record<string, unknown> = { status: payload.status };

  if (payload.response_note) {
    body.response_note = payload.response_note;
  }

  const response = await api.patch(`/appeals/${id}/`, body);
  return response.data;
};
