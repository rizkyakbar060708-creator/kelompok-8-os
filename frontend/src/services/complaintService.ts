import api, { unwrapList, type ListEnvelope } from "./api";

export interface Complaint {
  id: number;
  reporter: number;
  // Hanya diisi untuk role ADMIN; backend mengirim null untuk role lain.
  reporter_username?: string | null;
  facility: number | null;
  category: "FASILITAS" | "AKADEMIK" | "KEAMANAN";
  // Laporan lama yang dibuat sebelum fitur ini boleh punya nilai kosong.
  sub_category: string | null;
  incident_location: string | null;
  // ISO timestamp, atau null saat laporan tanpa waktu kejadian.
  incident_date: string | null;
  is_anonymous: boolean;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  // URL absolut dari MEDIA_URL. null saat pengaduan dibuat tanpa foto.
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubCategoryOption {
  value: string;
  label: string;
}

export interface ComplaintCategory {
  value: string;
  label: string;
  sub_categories: SubCategoryOption[];
}

export interface CreateComplaintPayload {
  facility?: number | null;
  category: "FASILITAS" | "AKADEMIK" | "KEAMANAN";
  // Kosong/null hanya sah untuk FASILITAS; backend mewajibkannya untuk
  // AKADEMIK dan KEAMANAN.
  sub_category: string | null;
  incident_location?: string | null;
  incident_date?: string | null;
  is_anonymous: boolean;
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

  if (payload.facility !== undefined && payload.facility !== null) {
    formData.append("facility", String(payload.facility));
  }
  formData.append("category", payload.category);

  if (payload.sub_category) {
    formData.append("sub_category", payload.sub_category);
  }
  if (payload.incident_location) {
    formData.append("incident_location", payload.incident_location);
  }
  if (payload.incident_date) {
    formData.append("incident_date", payload.incident_date);
  }

  // DRF BooleanField multipart menerima "true"/"false", jadi checkbox yang
  // tidak dicentang tetap dikirim eksplisit alih-alih dihilangkan.
  formData.append("is_anonymous", String(payload.is_anonymous));

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

export const getComplaintCategories = async (): Promise<ComplaintCategory[]> => {
  const response = await api.get("/complaints/categories/");
  return response.data;
};

// Sub-kategori dikonsumsi di halaman daftar (badge, filter, kartu) di luar
// alur create; map ini menghindari fetch ulang endpoint kategori cukup untuk
// sekadar menampilkan label. Nilai harus tetap sinkron dengan backend.
export const SUB_CATEGORY_LABELS: Record<string, string> = {
  JADWAL_KULIAH: "Jadwal kuliah",
  DOSEN_TIDAK_HADIR: "Dosen tidak hadir",
  KESALAHAN_NILAI: "Kesalahan nilai",
  KENDALA_KRS: "Kendala KRS",
  PELAYANAN_AKADEMIK: "Pelayanan akademik",
  KEHILANGAN_BARANG: "Kehilangan barang",
  MASALAH_PARKIR: "Masalah parkir",
  PENCURIAN: "Pencurian",
  GANGGUAN_KEAMANAN: "Gangguan keamanan",
  PELECEHAN_PERUNDUNGAN: "Pelecehan atau perundungan",
};

export const subCategoryLabel = (value: string | null): string | null =>
  value && SUB_CATEGORY_LABELS[value] ? SUB_CATEGORY_LABELS[value] : null;

// "Berbahaya" pada media: foto untuk dua sub-kategori ini ditolak backend
// (media dilayani langsung di /media/ tanpa pemeriksaan permission).
export const SENSITIVE_IMAGE_SUB_CATEGORIES: readonly string[] = [
  "PENCURIAN",
  "PELECEHAN_PERUNDUNGAN",
];
