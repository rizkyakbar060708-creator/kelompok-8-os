import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  getComplaintSummary,
  type ComplaintSummary,
} from "../services/complaintService"

interface ComplaintSummaryContextValue {
  // Hasil GET /api/complaints/summary/ terakhir. Backend sudah menghitung
  // agregat dari queryset ter-scope role, jadi badge sidebar tidak perlu
  // mengecek ulang hak akses. null berarti fetch pertama belum selesai atau
  // gagal: konsumen cukup menyembunyikan badge, never me-render sidebar rusak.
  summary: ComplaintSummary | null
  // Mengambil ulang summary. Dipanggil setelah pengaduan dibuat, diubah
  // (status/priority), atau dihapus supaya badge sidebar tidak basi sampai
  // reload. Ini request ringan yang dibaca beberapa komponen, bukan re-fetch
  // daftar pengaduan milik halaman.
  refresh: () => void
}

const ComplaintSummaryContext = createContext<ComplaintSummaryContextValue | null>(
  null,
)

export function ComplaintSummaryProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<ComplaintSummary | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let active = true

    getComplaintSummary()
      .then((data) => {
        if (active) {
          setSummary(data)
        }
      })
      .catch(() => {
        // Gagal fetch: summary tetap null. Sidebar menyembunyikan badge
        // daripada menampilkan angka palsu (0) atau merusak layout.
        if (active) {
          setSummary(null)
        }
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  return (
    <ComplaintSummaryContext.Provider value={{ summary, refresh }}>
      {children}
    </ComplaintSummaryContext.Provider>
  )
}

// Hook ini diletakkan bersama provider supaya konsumen cukup mengimpor satu
// modul; eslint-disable sama seperti AuthContext.tsx karena file ini mengekspor
// komponen sekaligus hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useComplaintSummary(): ComplaintSummaryContextValue {
  const value = useContext(ComplaintSummaryContext)

  if (!value) {
    throw new Error(
      "useComplaintSummary harus dipakai di dalam ComplaintSummaryProvider",
    )
  }

  return value
}
