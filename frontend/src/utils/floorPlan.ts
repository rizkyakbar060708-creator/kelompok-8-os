import type { Facility } from "../services/facilityService"

// Tipe ruang denah Gedung B FTI UNISKA Banjarmasin
export type RoomType = "kelas" | "lab" | "layanan" | "penyimpanan"

export interface Room {
  id: string
  kode?: string
  nama: string
  alias?: string
  lantai: 1 | 2 | 3 | 4
  tipe: RoomType
  rowStart: number
  rowSpan: number
}

// Konfigurasi visual tipe ruang denah (menggunakan tint indigo / violet / sky / slate)
// Catatan: Dilarang memakai warna status pengaduan (amber/biru/emerald/merah)
// maupun warna kategori sidebar agar arti visual tidak tumpang tindih.
export interface RoomTypeConfig {
  label: string
  cardClass: string
  badgeClass: string
  dotClass: string
}

export const ROOM_TYPE_CONFIG: Record<RoomType, RoomTypeConfig> = {
  kelas: {
    label: "Ruang Kelas",
    cardClass: "border-indigo-200 bg-indigo-50/90 text-indigo-900 hover:border-indigo-300 hover:bg-indigo-100/90",
    badgeClass: "border-indigo-200 bg-indigo-100 text-indigo-800",
    dotClass: "bg-indigo-500",
  },
  lab: {
    label: "Laboratorium",
    cardClass: "border-violet-200 bg-violet-50/90 text-violet-900 hover:border-violet-300 hover:bg-violet-100/90",
    badgeClass: "border-violet-200 bg-violet-100 text-violet-800",
    dotClass: "bg-violet-500",
  },
  layanan: {
    label: "Layanan & Kantor",
    cardClass: "border-sky-200 bg-sky-50/90 text-sky-900 hover:border-sky-300 hover:bg-sky-100/90",
    badgeClass: "border-sky-200 bg-sky-100 text-sky-800",
    dotClass: "bg-sky-500",
  },
  penyimpanan: {
    label: "Penyimpanan",
    cardClass: "border-slate-200 bg-slate-50/90 text-slate-900 hover:border-slate-300 hover:bg-slate-100/90",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-800",
    dotClass: "bg-slate-500",
  },
}

// Baris 5 adalah tangga di lantai 1, 2, dan 3 sebagai pemisah non-interaktif
export const STAIR_ROW = 5

// Data statis seluruh ruang Gedung B FTI
// Lantai 1: tidak ada kode B1.x pada gambar sumber sehingga kode dikosongkan
// Lantai 4: hanya memuat B4.1 dan B4.2 (tanpa tangga atau placeholder fiktif)
export const BUILDING_B_ROOMS: readonly Room[] = [
  // --- LANTAI 1 ---
  {
    id: "l1-gudang",
    nama: "Gudang",
    alias: "Penyimpanan",
    lantai: 1,
    tipe: "penyimpanan",
    rowStart: 1,
    rowSpan: 1,
  },
  {
    id: "l1-ormawa",
    nama: "Ruang Ormawa FTI",
    alias: "Ormawa FTI",
    lantai: 1,
    tipe: "layanan",
    rowStart: 2,
    rowSpan: 1,
  },
  {
    id: "l1-lsp",
    nama: "Ruang LSP",
    alias: "LSP",
    lantai: 1,
    tipe: "layanan",
    rowStart: 3,
    rowSpan: 1,
  },
  {
    id: "l1-tunggu-dosen",
    nama: "Ruang Tunggu Dosen",
    alias: "Tunggu Dosen",
    lantai: 1,
    tipe: "layanan",
    rowStart: 4,
    rowSpan: 1,
  },
  // Baris 5: Tangga
  {
    id: "l1-dekan-akademik",
    nama: "Ruang Dekan & Struktural Fakultas serta Ruang Pelayanan Akademik FTI",
    alias: "Pelayanan Akademik FTI",
    lantai: 1,
    tipe: "layanan",
    rowStart: 6,
    rowSpan: 4,
  },

  // --- LANTAI 2 ---
  {
    id: "b2-1",
    kode: "B2.1",
    nama: "Ruang 1",
    alias: "Ruang 1",
    lantai: 2,
    tipe: "kelas",
    rowStart: 1,
    rowSpan: 1,
  },
  {
    id: "b2-2",
    kode: "B2.2",
    nama: "Ruang 2",
    alias: "Ruang 2",
    lantai: 2,
    tipe: "kelas",
    rowStart: 2,
    rowSpan: 1,
  },
  {
    id: "b2-3",
    kode: "B2.3",
    nama: "Ruang 3",
    alias: "Ruang 3",
    lantai: 2,
    tipe: "kelas",
    rowStart: 3,
    rowSpan: 2,
  },
  // Baris 5: Tangga
  {
    id: "b2-4",
    kode: "B2.4",
    nama: "Lab P. IoT",
    alias: "Lab IoT",
    lantai: 2,
    tipe: "lab",
    rowStart: 6,
    rowSpan: 1,
  },
  {
    id: "b2-5",
    kode: "B2.5",
    nama: "Ruang Baca",
    alias: "Ruang Baca",
    lantai: 2,
    tipe: "layanan",
    rowStart: 7,
    rowSpan: 1,
  },
  {
    id: "b2-6",
    kode: "B2.6",
    nama: "Lab SI",
    alias: "Lab SI",
    lantai: 2,
    tipe: "lab",
    rowStart: 8,
    rowSpan: 1,
  },
  {
    id: "b2-7",
    kode: "B2.7",
    nama: "Lab Citra",
    alias: "Lab Citra",
    lantai: 2,
    tipe: "lab",
    rowStart: 9,
    rowSpan: 1,
  },

  // --- LANTAI 3 ---
  {
    id: "b3-1",
    kode: "B3.1",
    nama: "Ruang 4",
    alias: "Ruang 4",
    lantai: 3,
    tipe: "kelas",
    rowStart: 1,
    rowSpan: 1,
  },
  {
    id: "b3-2",
    kode: "B3.2",
    nama: "Ruang 5",
    alias: "Ruang 5",
    lantai: 3,
    tipe: "kelas",
    rowStart: 2,
    rowSpan: 1,
  },
  {
    id: "b3-3",
    kode: "B3.3",
    nama: "Ruang 6",
    alias: "Ruang 6",
    lantai: 3,
    tipe: "kelas",
    rowStart: 3,
    rowSpan: 1,
  },
  {
    id: "b3-4",
    kode: "B3.4",
    nama: "Ruang 7",
    alias: "Ruang 7",
    lantai: 3,
    tipe: "kelas",
    rowStart: 4,
    rowSpan: 1,
  },
  // Baris 5: Tangga
  {
    id: "b3-5",
    kode: "B3.5",
    nama: "Ruang 8",
    alias: "Ruang 8",
    lantai: 3,
    tipe: "kelas",
    rowStart: 6,
    rowSpan: 1,
  },
  {
    id: "b3-6",
    kode: "B3.6",
    nama: "Ruang 11",
    alias: "Ruang 11",
    lantai: 3,
    tipe: "kelas",
    rowStart: 7,
    rowSpan: 1,
  },
  {
    id: "b3-7",
    kode: "B3.7",
    nama: "Ruang 9",
    alias: "Ruang 9",
    lantai: 3,
    tipe: "kelas",
    rowStart: 8,
    rowSpan: 1,
  },
  {
    id: "b3-8",
    kode: "B3.8",
    nama: "Ruang 10",
    alias: "Ruang 10",
    lantai: 3,
    tipe: "kelas",
    rowStart: 9,
    rowSpan: 1,
  },

  // --- LANTAI 4 (ASUMSI SUMBER) ---
  // Hanya dua ruang ini yang ada di sumber. Tidak ada tangga atau ruang lain.
  {
    id: "b4-1",
    kode: "B4.1",
    nama: "Ruang 13",
    alias: "Ruang 13",
    lantai: 4,
    tipe: "kelas",
    rowStart: 8,
    rowSpan: 1,
  },
  {
    id: "b4-2",
    kode: "B4.2",
    nama: "Ruang 12",
    alias: "Ruang 12",
    lantai: 4,
    tipe: "kelas",
    rowStart: 9,
    rowSpan: 1,
  },
]

export const FLOORS = [1, 2, 3, 4] as const
export type FloorNumber = (typeof FLOORS)[number]

export function getRoomsForFloor(floor: FloorNumber): Room[] {
  return BUILDING_B_ROOMS.filter((room) => room.lantai === floor)
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Catatan arsitektur:
// Pencocokan fasilitas ke ruang denah saat ini dilakukan secara murni di frontend
// lewat normalisasi teks bebas field Facility.location. Konvensi yang diharapkan:
// "Gedung B - B2.1" atau "Gedung B - Lab SI".
// Lokasi tanpa nama "Gedung B" dianggap belum terpetakan. Titik pada kode ruang
// selalu di-escape, dan boundary regex (depan & belakang) menjamin tidak ada
// kecocokan prefix salah (misal "Ruang 1" tidak mencocokkan "Ruang 10" sampai "Ruang 13",
// dan "B2.1" tidak mencocokkan "B2.10").

/**
 * Mengecek apakah lokasi secara eksplisit menyebut Gedung B (atau variasinya).
 * Lokasi tanpa nama Gedung B dianggap belum terpetakan.
 */
export function hasGedungB(location: string): boolean {
  if (!location) return false
  const norm = location.toLowerCase()
  return /(?:gedung|gd\.?)\s*[-_]?\s*b(?![a-zA-Z0-9])/i.test(norm)
}

/**
 * Membuat ekspresi reguler dengan batas depan dan belakang yang ketat.
 * Mendukung variasi spasi atau tanda hubung antar kata.
 */
function createBoundaryRegex(token: string): RegExp {
  const escaped = escapeRegex(token.trim()).replace(/\s+/g, "[\\s\\-_]+")
  return new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?![0-9a-zA-Z])`, "i")
}

/**
 * Mencocokkan fasilitas ke sebuah ruangan tertentu.
 * Fasilitas yang cocok ke beberapa ruangan akan muncul di semua ruangan tersebut tanpa duplikat.
 */
export function facilitiesForRoom(room: Room, facilities: Facility[]): Facility[] {
  return facilities.filter((facility) => {
    const loc = facility.location
    if (!loc || !hasGedungB(loc)) {
      return false
    }

    // 1. Cek kode ruang (mis. "B2.1" dengan titik di-escape)
    if (room.kode && createBoundaryRegex(room.kode).test(loc)) {
      return true
    }

    // 2. Cek nama ruang (mis. "Ruang Ormawa FTI", "Lab Citra")
    if (room.nama && createBoundaryRegex(room.nama).test(loc)) {
      return true
    }

    // 3. Cek alias ruang (mis. "Ruang 1" tidak akan mencocokkan "Ruang 10".."Ruang 13")
    if (room.alias && createBoundaryRegex(room.alias).test(loc)) {
      return true
    }

    return false
  })
}

/**
 * Mendeteksi apakah fasilitas cocok ke salah satu ruangan di seluruh Gedung B.
 */
export function isMatchedToAnyRoom(facility: Facility, allRooms: readonly Room[] = BUILDING_B_ROOMS): boolean {
  return allRooms.some((room) => facilitiesForRoom(room, [facility]).length > 0)
}

/**
 * Mencari fasilitas yang lokasinya menyebut lantai tertentu di Gedung B tanpa spesifik ruang
 * (misal "Gedung B - Lantai 2" atau "Gedung B - Lt. 2").
 */
export function floorLevelFacilities(
  floor: FloorNumber,
  facilities: Facility[],
  allRooms: readonly Room[] = BUILDING_B_ROOMS,
): Facility[] {
  const floorPattern = new RegExp(`(?:lantai|lt\\.?|floor)\\s*${floor}(?![0-9])`, "i")

  return facilities.filter((facility) => {
    const loc = facility.location
    if (!loc || !hasGedungB(loc)) {
      return false
    }

    // Jangan masukkan fasilitas yang sudah terpetakan ke ruang spesifik
    if (isMatchedToAnyRoom(facility, allRooms)) {
      return false
    }

    // Cek apakah lokasinya menyebut lantai ini
    return floorPattern.test(loc)
  })
}

/**
 * Mendapatkan daftar fasilitas yang belum terpetakan (tidak cocok ke ruang mana pun
 * dan juga bukan fasilitas tingkat lantai di Gedung B).
 * Lokasi tanpa nama Gedung B atau berformat bebas otomatis masuk ke sini.
 * Khusus untuk panel admin.
 */
export function unmappedFacilities(
  facilities: Facility[],
  allRooms: readonly Room[] = BUILDING_B_ROOMS,
): Facility[] {
  return facilities.filter((facility) => {
    // 1. Lokasi tanpa "Gedung B" otomatis belum terpetakan di denah Gedung B
    if (!hasGedungB(facility.location)) {
      return true
    }

    // 2. Sudah cocok ke salah satu ruang
    if (isMatchedToAnyRoom(facility, allRooms)) {
      return false
    }

    // 3. Cocok sebagai fasilitas tingkat lantai di salah satu lantai 1-4
    for (const floor of FLOORS) {
      const floorPattern = new RegExp(`(?:lantai|lt\\.?|floor)\\s*${floor}(?![0-9])`, "i")
      if (floorPattern.test(facility.location)) {
        return false
      }
    }

    return true
  })
}
