// DRF membalas kesalahan validasi dalam beberapa bentuk sekaligus: {"detail":
// "..."}, {"facility": ["wajib diisi", "..."]}, atau {"non_field_errors": [...]}.
//
// Halaman pengaduan dan halaman fasilitas butuh membaca bentuk yang sama.
// Fungsi ini mengumpulkan semua pesan jadi satu kalimat supaya tidak ada satu
// halaman yang menampilkan kunci teknis mentah ("non_field_errors") ke user.
//
// Selalu kembalikan null kalau tidak ada pesan yang bisa dibaca: pemanggil
// menulis pesan cadangannya sendiri, dan pesan bawaan tidak boleh menutupi
// alasan sebenarnya dari penolakan server.
export function errorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => errorMessage(item))
      .filter((item): item is string => Boolean(item));

    return messages.length > 0 ? messages.join(" ") : null;
  }

  if (payload && typeof payload === "object") {
    const messages = Object.values(payload as Record<string, unknown>)
      .map((value) => errorMessage(value))
      .filter((value): value is string => Boolean(value));

    return messages.length > 0 ? messages.join(" ") : null;
  }

  return null;
}