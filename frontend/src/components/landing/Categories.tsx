import { Building2, BookOpen, ShieldAlert } from "lucide-react"

import Card from "../../components/ui/Card"

interface Category {
  icon: React.ElementType
  title: string
  description: string
  examples: string[]
}

const CATEGORIES: readonly Category[] = [
  {
    icon: Building2,
    title: "Pengaduan Fasilitas",
    description: "Laporkan kerusakan atau kendala fasilitas kampus.",
    examples: [
      "Kerusakan fasilitas kelas",
      "Toilet",
      "AC dan kipas",
      "Listrik",
      "Internet",
    ],
  },
  {
    icon: BookOpen,
    title: "Pengaduan Akademik",
    description: "Sampaikan kendala terkait kegiatan dan pelayanan akademik.",
    examples: [
      "Jadwal kuliah",
      "Dosen tidak hadir tanpa informasi",
      "Kesalahan nilai",
      "Kendala KRS",
      "Pelayanan akademik",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Pengaduan Keamanan",
    description: "Laporkan permasalahan keamanan di lingkungan kampus.",
    examples: [
      "Kehilangan barang",
      "Kendaraan dan parkiran",
      "Pencurian",
      "Gangguan keamanan",
      "Pelecehan dan perundungan",
    ],
  },
]

function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon

  return (
    <Card className="glass-card glass-card-hover overflow-hidden flex flex-col h-full">
        <div className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/65 text-indigo-600 mb-3">
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 mb-1">
        {category.title}
      </p>
      <p className="text-sm font-semibold text-slate-900 mb-3 leading-6">
        {category.description}
      </p>
      <div className="mt-auto">
        <p className="text-xs text-slate-500 leading-5 mb-3">
          {category.examples.join(" · ")}
        </p>
      </div>
    </Card>
  )
}

function Categories() {
  return (
    <section id="kategori" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="eyebrow">Jenis pengaduan</span>
          <h2 className="page-title mt-2 mb-4">Pilih kategori keluhan Anda</h2>
          <p className="page-subtitle">
            Setiap pengaduan difasilitasi tim kampus sesuai dengan tanggung
            jawabnya.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:max-w-4xl mx-auto">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.title} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
