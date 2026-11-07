import {
  AlertCircle,
  ArrowUpDown,
  Building2,
  CircleAlert,
  Compass,
  ExternalLink,
  MapPin,
  RefreshCw,
  SearchX,
  TriangleAlert,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import Modal from "../../components/ui/Modal"
import Spinner from "../../components/ui/Spinner"
import { useAuth } from "../../contexts/AuthContext"
import { getFacilities, type Facility } from "../../services/facilityService"
import { getFacilityStatusMeta } from "../../utils/facilityStatus"
import {
  ROOM_TYPE_CONFIG,
  STAIR_ROW,
  facilitiesForRoom,
  floorLevelFacilities,
  getRoomsForFloor,
  unmappedFacilities,
  type FloorNumber,
  type Room,
  type RoomType,
} from "../../utils/floorPlan"
import { isAdmin, STAFF } from "../../utils/roles"

// 4 Mode Tampilan: Semua Lantai, Lantai 1, Lantai 2, Lantai 3
const FLOOR_MODES = ["ALL", 1, 2, 3] as const
type FloorMode = (typeof FLOOR_MODES)[number]

function FloorPlan() {
  const { user } = useAuth()
  const [activeMode, setActiveMode] = useState<FloorMode>("ALL")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const [facilities, setFacilities] = useState<Facility[] | null>(null)
  const [isPaginated, setIsPaginated] = useState(false)
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  // Ambil daftar fasilitas kampus dari backend
  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const envelope = await getFacilities()
        if (!active) return

        setFacilities(envelope.items)
        setIsPaginated(envelope.isPaginated)
        setError("")
      } catch {
        if (!active) return
        setFacilities([])
        setError("Gagal memuat daftar fasilitas. Periksa koneksi ke server.")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [retryKey])

  const isLoading = facilities === null
  const allFacilities = useMemo(() => facilities ?? [], [facilities])

  // Fasilitas belum terpetakan (khusus admin)
  const unmappedList = useMemo(
    () => unmappedFacilities(allFacilities),
    [allFacilities],
  )

  // Fasilitas untuk ruangan yang sedang dibuka di modal
  const selectedRoomFacilities = useMemo(() => {
    if (!selectedRoom) return []
    return facilitiesForRoom(selectedRoom, allFacilities)
  }, [selectedRoom, allFacilities])

  const isStaff = user?.role === STAFF

  // Render teks dan hierarki sel ruangan persis sesuai gambar sumber
  const renderRoomContent = (room: Room) => {
    if (room.id === "l1-dekan-akademik") {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center p-2">
          <p className="font-bold text-xs uppercase leading-snug tracking-tight text-slate-900">
            RUANG DEKAN & STRUKTURAL FAKULTAS
          </p>
          <span className="my-0.5 text-[10px] font-semibold tracking-wider text-slate-500">
            SERTA
          </span>
          <p className="font-bold text-xs uppercase leading-snug tracking-tight text-slate-900">
            RUANG PELAYANAN AKADEMIK FTI
          </p>
        </div>
      )
    }

    if (!room.kode) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center p-1.5">
          <p className="font-bold text-xs uppercase tracking-tight text-slate-900">
            {room.nama}
          </p>
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-1.5">
        <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
          Ruang {room.kode}
        </p>
        <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-slate-700 tracking-tight">
          ({(room.alias || room.nama).toUpperCase()})
        </p>
      </div>
    )
  }

  // Komponen tombol ruangan interaktif
  const RoomButton = ({ room }: { room: Room }) => {
    const roomFacilities = facilitiesForRoom(room, allFacilities)
    const facilityCount = roomFacilities.length
    const config = ROOM_TYPE_CONFIG[room.tipe]

    const ariaLabel = `Ruang ${room.kode ? `${room.kode} · ` : ""}${room.nama}, tipe ${config.label}, ${
      facilityCount > 0 ? `${facilityCount} fasilitas terdaftar` : "belum ada data fasilitas"
    }`

    return (
      <button
        type="button"
        onClick={() => setSelectedRoom(room)}
        aria-label={ariaLabel}
        style={{
          gridRow: `${room.rowStart} / span ${room.rowSpan}`,
        }}
        className={`group relative flex flex-col justify-between rounded-xl border p-2 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${config.cardClass}`}
      >
        {facilityCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full border border-slate-900/[0.08] bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-xs"
            title={`${facilityCount} fasilitas`}
          >
            <Building2 size={11} className="text-slate-500" />
            <span>{facilityCount}</span>
          </span>
        )}

        {renderRoomContent(room)}
      </button>
    )
  }

  return (
    <div className="relative mx-auto max-w-7xl space-y-6 overflow-x-hidden">
      {/* Ornamen latar liquid glass (dibatasi 4, diberi aria-hidden) */}
      <span
        aria-hidden="true"
        className="orb pointer-events-none -left-20 -top-20 h-72 w-72 bg-indigo-400/20"
      />
      <span
        aria-hidden="true"
        className="orb pointer-events-none -right-20 top-40 h-80 w-80 bg-violet-400/20"
      />
      <span
        aria-hidden="true"
        className="orb pointer-events-none bottom-40 left-1/3 h-64 w-64 bg-sky-400/20"
      />
      <span
        aria-hidden="true"
        className="orb pointer-events-none -bottom-20 right-10 h-72 w-72 bg-purple-400/15"
      />

      {/* 1. Floor Mode Switcher — Di bagian kiri atas area konten, tepat di sebelah kanan sidebar */}
      <div className="flex items-center justify-start">
        <div
          role="tablist"
          aria-label="Mode denah lantai"
          className="glass-panel inline-flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5 shadow-xs"
        >
          {FLOOR_MODES.map((mode) => {
            const isSelected = activeMode === mode
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                id={`floor-mode-${mode}`}
                aria-selected={isSelected}
                aria-controls="floor-mode-content"
                onClick={() => setActiveMode(mode)}
                className={`glass-pill border-white/70 px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white/60 text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                {mode === "ALL" ? "Semua Lantai" : `Lantai ${mode}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Header halaman */}
      <div>
        <p className="eyebrow mb-1">Denah Kelas Reguler Siang Banjarmasin</p>
        <h1 className="page-title text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Prodi TI & Prodi SI FTI UNISKA
        </h1>
        <p className="page-subtitle mt-1">
          Denah interaktif fasilitas dan ruang perkuliahan Gedung B.
        </p>
      </div>

      {/* State Error bila gagal memuat fasilitas */}
      {error && (
        <div
          role="alert"
          className="alert-error flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <CircleAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="btn-secondary text-xs"
          >
            <RefreshCw size={14} />
            Coba lagi
          </button>
        </div>
      )}

      {/* Catatan jika data fasilitas terpaginasi */}
      {isPaginated && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p>
            Daftar fasilitas yang dimuat dibatasi pada halaman pertama API.
            Beberapa fasilitas mungkin belum tertaut sampai pembaruan backend mendatang.
          </p>
        </div>
      )}

      {/* Legenda tipe ruang */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Compass size={15} />
          <span>Legenda Tipe Ruang</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-medium text-slate-700">
          {(Object.keys(ROOM_TYPE_CONFIG) as RoomType[]).map((tipe) => {
            const config = ROOM_TYPE_CONFIG[tipe]
            return (
              <div key={tipe} className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${config.dotClass}`}
                  aria-hidden="true"
                />
                <span>{config.label}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 text-slate-500">
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded-xs bg-red-100 text-red-600 text-[10px] font-bold border border-red-200"
              aria-hidden="true"
            >
              =
            </span>
            <span className="text-red-600 font-semibold">Tangga</span>
          </div>
        </div>
      </div>

      {/* 3. Area Utama: Denah Gedung B */}
      <div
        id="floor-mode-content"
        role="region"
        aria-label="Denah Gedung B"
        className="glass-panel relative overflow-hidden rounded-3xl p-4 sm:p-7"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Spinner size={32} />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Memuat denah dan data fasilitas...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900/[0.06] pb-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {activeMode === "ALL"
                    ? "Denah Lengkap Gedung B FTI (Semua Lantai)"
                    : `Potongan Denah — Lantai ${activeMode}`}
                </h2>
                <p className="text-xs text-slate-600">
                  Klik pada ruangan untuk melihat daftar fasilitas di dalamnya.
                </p>
              </div>
            </div>

            {/* MODE 1: SEMUA LANTAI (4 KOLOM SESUAI GAMBAR SUMBER DENGAN B4.1 & B4.2) */}
            {activeMode === "ALL" && (
              <div className="overflow-x-auto pb-4">
                <div className="flex items-stretch gap-3 min-w-[760px] lg:min-w-[880px] justify-center mx-auto">
                  {/* Label vertikal GEDUNG B di sisi kiri */}
                  <div className="flex items-center justify-center rounded-xl border border-slate-300/80 bg-slate-100/90 px-3.5 py-6 shadow-xs select-none">
                    <span className="font-extrabold text-slate-800 tracking-[0.35em] text-sm uppercase [writing-mode:vertical-lr] rotate-180">
                      GEDUNG B
                    </span>
                  </div>

                  {/* 4 Kolom untuk Lantai 1, 2, 3, 4 */}
                  <div className="grid grid-cols-4 gap-3 flex-1 max-w-5xl">
                    {/* KOLOM 1: LANTAI 1 */}
                    <div className="flex flex-col">
                      <div className="rounded-t-xl bg-slate-200/80 border border-slate-300/80 p-2 text-center font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5">
                        Lantai 1
                      </div>
                      <div
                        className="grid gap-2 flex-1"
                        style={{
                          gridTemplateRows: "repeat(9, minmax(56px, 1fr))",
                        }}
                      >
                        {getRoomsForFloor(1).map((room) => (
                          <RoomButton key={room.id} room={room} />
                        ))}
                        <div
                          style={{ gridRow: `${STAIR_ROW} / span 1` }}
                          aria-hidden="true"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/90 px-2 py-1 text-center font-bold text-xs uppercase tracking-wider text-red-600 select-none shadow-xs"
                        >
                          <ArrowUpDown size={14} className="text-red-500" />
                          <span>TANGGA / LANTAI 1</span>
                        </div>
                      </div>
                    </div>

                    {/* KOLOM 2: LANTAI 2 */}
                    <div className="flex flex-col">
                      <div className="rounded-t-xl bg-slate-200/80 border border-slate-300/80 p-2 text-center font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5">
                        Lantai 2
                      </div>
                      <div
                        className="grid gap-2 flex-1"
                        style={{
                          gridTemplateRows: "repeat(9, minmax(56px, 1fr))",
                        }}
                      >
                        {getRoomsForFloor(2).map((room) => (
                          <RoomButton key={room.id} room={room} />
                        ))}
                        <div
                          style={{ gridRow: `${STAIR_ROW} / span 1` }}
                          aria-hidden="true"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/90 px-2 py-1 text-center font-bold text-xs uppercase tracking-wider text-red-600 select-none shadow-xs"
                        >
                          <ArrowUpDown size={14} className="text-red-500" />
                          <span>TANGGA / LANTAI 2</span>
                        </div>
                      </div>
                    </div>

                    {/* KOLOM 3: LANTAI 3 */}
                    <div className="flex flex-col">
                      <div className="rounded-t-xl bg-slate-200/80 border border-slate-300/80 p-2 text-center font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5">
                        Lantai 3
                      </div>
                      <div
                        className="grid gap-2 flex-1"
                        style={{
                          gridTemplateRows: "repeat(9, minmax(56px, 1fr))",
                        }}
                      >
                        {getRoomsForFloor(3).map((room) => (
                          <RoomButton key={room.id} room={room} />
                        ))}
                        <div
                          style={{ gridRow: `${STAIR_ROW} / span 1` }}
                          aria-hidden="true"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/90 px-2 py-1 text-center font-bold text-xs uppercase tracking-wider text-red-600 select-none shadow-xs"
                        >
                          <ArrowUpDown size={14} className="text-red-500" />
                          <span>TANGGA / LANTAI 3</span>
                        </div>
                      </div>
                    </div>

                    {/* KOLOM 4: LANTAI 4 (B4.1 DAN B4.2 PADA BARIS 8 DAN 9) */}
                    <div className="flex flex-col">
                      <div className="rounded-t-xl bg-slate-200/80 border border-slate-300/80 p-2 text-center font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5">
                        Lantai 4
                      </div>
                      <div
                        className="grid gap-2 flex-1"
                        style={{
                          gridTemplateRows: "repeat(9, minmax(56px, 1fr))",
                        }}
                      >
                        {getRoomsForFloor(4).map((room) => (
                          <RoomButton key={room.id} room={room} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2, 3, 4: FOKUS SATU LANTAI (LANTAI 1, LANTAI 2, ATAU LANTAI 3) */}
            {activeMode !== "ALL" && (
              <div className="space-y-4">
                <div className="overflow-x-auto pb-2">
                  <div
                    className="grid gap-2.5 min-w-[280px] sm:min-w-[460px] max-w-2xl mx-auto"
                    style={{
                      gridTemplateRows: "repeat(9, minmax(56px, auto))",
                    }}
                  >
                    {/* Hanya menampilkan ruangan lantai terpilih */}
                    {getRoomsForFloor(activeMode as FloorNumber).map((room) => (
                      <RoomButton key={room.id} room={room} />
                    ))}

                    {/* Tangga baris 5 untuk Lantai 1, 2, atau 3 */}
                    <div
                      style={{ gridRow: `${STAIR_ROW} / span 1` }}
                      aria-hidden="true"
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/90 py-2.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-red-600 select-none shadow-xs"
                    >
                      <ArrowUpDown size={15} className="text-red-500" />
                      <span>TANGGA / LANTAI {activeMode}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bagian Fasilitas Tingkat Lantai (Bila ada yang hanya mencantumkan lantai) */}
      {(() => {
        const relevantFloorFacilities =
          activeMode === "ALL"
            ? [1, 2, 3].flatMap((f) => floorLevelFacilities(f as FloorNumber, allFacilities))
            : floorLevelFacilities(activeMode as FloorNumber, allFacilities)

        if (relevantFloorFacilities.length === 0) return null

        return (
          <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
              <MapPin size={18} className="text-indigo-600" />
              <h3>
                {activeMode === "ALL"
                  ? "Fasilitas Tingkat Lantai (Ruang Belum Ditentukan)"
                  : `Fasilitas di Lantai ${activeMode} (Ruang Belum Ditentukan)`}
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Fasilitas berikut tercatat berada di Gedung B, namun belum dialokasikan ke nomor/nama ruang tertentu pada sistem.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relevantFloorFacilities.map((facility) => {
                const status = getFacilityStatusMeta(facility.status)
                const isInactive = facility.status === "INACTIVE"
                return (
                  <div
                    key={facility.id}
                    className="glass-card flex flex-col justify-between rounded-2xl p-4 space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-slate-900">
                          {facility.name}
                        </h4>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      {facility.description && (
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                          {facility.description}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-slate-500 font-mono">
                        Lokasi: {facility.location}
                      </p>
                    </div>

                    {!isStaff && (
                      <div className="pt-1">
                        {isInactive ? (
                          <span className="text-[11px] text-slate-500 italic">
                            Fasilitas nonaktif, pengaduan ditutup
                          </span>
                        ) : (
                          <Link
                            to={`/complaints/create?facility=${facility.id}`}
                            className="btn-secondary mt-1 justify-center text-xs py-1.5"
                          >
                            Laporkan Masalah
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Panel Fasilitas Belum Terpetakan (KHUSUS ADMIN) */}
      {isAdmin(user?.role) && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4 border-slate-300/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                <AlertCircle size={18} className="text-indigo-600" />
                <h3>Fasilitas Belum Terpetakan (Panel Admin)</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Fasilitas berikut tidak cocok dengan ruangan maupun lantai mana
                pun di Gedung B. Sesuaikan kolom lokasi fasilitas di menu Kelola
                Fasilitas.
              </p>
            </div>

            <Link
              to="/admin/facilities"
              className="btn-secondary self-start sm:self-auto text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
            >
              <span>Kelola Fasilitas</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          {unmappedList.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-center text-xs font-medium text-emerald-800">
              Semua fasilitas sudah terpetakan dengan baik pada denah gedung!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="divide-y divide-slate-900/[0.06] rounded-2xl border border-slate-900/[0.08] bg-white/60">
                {unmappedList.map((facility) => {
                  const status = getFacilityStatusMeta(facility.status)
                  return (
                    <div
                      key={facility.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {facility.name}
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          Lokasi saat ini:{" "}
                          <span className="font-mono text-slate-800">
                            {facility.location || "(Kosong)"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <Link
                          to="/admin/facilities"
                          className="link-accent font-semibold text-xs"
                        >
                          Ubah Lokasi
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Ruangan Saat Ruang Diklik */}
      <Modal
        open={selectedRoom !== null}
        onClose={() => setSelectedRoom(null)}
        title={
          selectedRoom
            ? `${selectedRoom.kode ? `Ruang ${selectedRoom.kode} · ` : ""}${selectedRoom.nama}`
            : ""
        }
      >
        {selectedRoom && (
          <div className="space-y-5">
            {/* Metadata Ruang */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  ROOM_TYPE_CONFIG[selectedRoom.tipe].badgeClass
                }`}
              >
                {ROOM_TYPE_CONFIG[selectedRoom.tipe].label}
              </span>
              <span className="glass-pill border-white/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
                Lantai {selectedRoom.lantai}
              </span>
              {selectedRoom.alias && selectedRoom.alias !== selectedRoom.nama && (
                <span className="text-xs text-slate-500 font-medium">
                  ({selectedRoom.alias.toUpperCase()})
                </span>
              )}
            </div>

            {/* Daftar Fasilitas di Ruang Tersebut */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900/[0.06] pb-2">
                <h4 className="font-semibold text-sm text-slate-900">
                  Fasilitas di Ruangan Ini
                </h4>
                <span className="text-xs font-medium text-slate-500">
                  {selectedRoomFacilities.length} fasilitas
                </span>
              </div>

              {selectedRoomFacilities.length === 0 ? (
                /* State Kosong Ruang Tanpa Fasilitas */
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6 text-center">
                  <SearchX className="mx-auto text-slate-400" size={32} />
                  <p className="mt-2.5 text-sm font-semibold text-slate-900">
                    Belum ada data fasilitas untuk ruang ini
                  </p>
                  <p className="mt-1 text-xs text-slate-600 max-w-xs mx-auto">
                    Data fasilitas untuk ruangan ini belum terdaftar di sistem
                    atau penulisan lokasi belum mencantumkan kode ruangan.
                  </p>
                </div>
              ) : (
                /* Daftar Kartu Fasilitas */
                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                  {selectedRoomFacilities.map((facility) => {
                    const status = getFacilityStatusMeta(facility.status)
                    const isInactive = facility.status === "INACTIVE"
                    return (
                      <div
                        key={facility.id}
                        className="rounded-xl border border-slate-900/[0.08] bg-white/70 p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-sm text-slate-900">
                            {facility.name}
                          </h5>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {facility.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {facility.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {facility.location}
                          </span>

                          {!isStaff && (
                            <div>
                              {isInactive ? (
                                <span className="text-[11px] text-slate-500 italic">
                                  Fasilitas nonaktif, pengaduan ditutup
                                </span>
                              ) : (
                                <Link
                                  to={`/complaints/create?facility=${facility.id}`}
                                  className="btn-secondary text-xs py-1 px-3"
                                  onClick={() => setSelectedRoom(null)}
                                >
                                  Laporkan masalah
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FloorPlan
