// Backend menyajikan media di origin yang sama dengan API, yaitu host dari
// VITE_API_URL. Field image di response pengaduan bernilai "/media/..." tanpa
// host, jadi kalau dipakai langsung sebagai src, browser akan menerjemahkannya
// relatif terhadap origin frontend (localhost:5173) dan hasilnya 404, karena
// Vite tidak menyajikan folder media. Karena itu path harus diubah lebih dulu
// ke URL absolut yang menunjuk ke origin backend.
//
// Origin diambil dari VITE_API_URL supaya hanya ada satu sumber konfigurasi
// dan tidak ada alamat yang ditulis manual.
function apiOrigin(): string {
  const base = import.meta.env.VITE_API_URL;

  try {
    return new URL(base).origin;
  } catch {
    // VITE_API_URL belum diisi. Kembalikan string kosong supaya resolveMediaUrl
    // tetap mengembalikan path relatif, yaitu perilaku lama, tanpa membuat
    // seluruh modul gagal dimuat.
    return "";
  }
}

/**
 * Ubah path media dari backend menjadi URL yang bisa dimuat browser.
 *
 * Mengembalikan null untuk input kosong supaya pemanggil cukup menulis
 * `if (url)` alih-alih memeriksa string kosong maupun null satu per satu.
 * Path yang sudah absolut (http:// atau https://) dikembalikan apa adanya
 * supaya aman kalau someday backend mengirim URL lengkap.
 */
export function resolveMediaUrl(
  path: string | null | undefined,
): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = apiOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return `${origin}${normalized}`;
}
