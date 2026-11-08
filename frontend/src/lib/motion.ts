// Konstanta animasi reveal untuk seluruh aplikasi CampusCare.

// Satu titik pengaturan kecepatan / jeda / jarak animasi reveal (fade + naik
// dari bawah). Semua komponen animasi mengambil nilai dari sini, jadi mengatur
// satu file ini mengubah seluruh halaman sekaligus.
//
// Sengaja hanya animasi opacity dan transform (y, scale) agar berjalan di
// thread compositor: tidak ada animasi width/height/top/left, dan dilarang
// animasi backdrop-filter/blur milik permukaan kaca (liquid glass) karena
// berat dan merusak tampilan blur.

/** Durasi satu animasi reveal, dalam detik. */
export const REVEAL_DURATION = 0.6;

/** Easing reveal: ease-out khas "decelerate", senilai token --ease-liquid
 * di index.css supaya gerak CSS dan Motion terasa satu keluarga. */
export const REVEAL_EASING: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

/** Jarak naik (px): elemen dimulai 24px di bawah posisi akhirnya. */
export const REVEAL_OFFSET_Y = 24;

/** Jeda antar item stagger, dalam detik. */
export const REVEAL_STAGGER = 0.09;

/** Batas total kaskade stagger; daftar panjang dipadatkan agar tidak terasa
 * lambat (lihat cappedStagger). */
export const REVEAL_STAGGER_CAP = 0.8;

/** Reveal saat scroll berjalan sekali per elemen: animasi tidak mengulang
 * saat elemen keluar-masuk layar. */
export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.15,
} as const;

/** Durasi fade antar halaman (transisi route ringan, tanpa exit animation). */
export const PAGE_FADE_DURATION = 0.25;

/** Stagger yang dipadatkan: kalau jumlah item × jeda melewati batas, jeda
 * per item disusutkan supaya kaskade total tetap <= REVEAL_STAGGER_CAP. */
export function cappedStagger(count: number): number {
  if (count > 1 && count * REVEAL_STAGGER > REVEAL_STAGGER_CAP) {
    return REVEAL_STAGGER_CAP / count;
  }

  return REVEAL_STAGGER;
}

/** Transisi reveal standar untuk satu elemen. */
export function revealTransition(delay = 0) {
  return {
    duration: REVEAL_DURATION,
    ease: REVEAL_EASING,
    delay,
  };
}
