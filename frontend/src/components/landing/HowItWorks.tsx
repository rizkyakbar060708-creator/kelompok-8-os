import { CheckCircle2, FileText, Settings, UserCheck } from "lucide-react"

import Card from "../../components/ui/Card"

interface Step {
  icon: React.ElementType
  title: string
  description: string
}

const STEPS: readonly Step[] = [
  {
    icon: FileText,
    title: "Mahasiswa membuat pengaduan",
    description:
      "Isi judul, pilih kategori, tambahkan deskripsi, dan unggah foto bukti jika diperlukan.",
  },
  {
    icon: UserCheck,
    title: "Admin menerima dan menugaskan laporan",
    description:
      "Admin meninjau pengaduan masuk dan menugaskannya kepada petugas yang terkait.",
  },
  {
    icon: Settings,
    title: "Staff menangani pengaduan",
    description:
      "Petugas memproses laporan, melakukan tindak lanjut, dan mengupdate status.",
  },
  {
    icon: CheckCircle2,
    title: "Mahasiswa memantau hasil penyelesaian",
    description:
      "Pemilik pengaduan dapat memantau status dan melihat hasil penanganannya.",
  },
]

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon

  return (
    <Card className="glass-card overflow-hidden flex flex-col items-center text-center h-full">
      <div className="flex items-center justify-center mb-3">
        <span className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/65 text-indigo-600">
          <Icon size={20} />
        </span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h3>
      <p className="text-xs text-slate-600 leading-5 px-2">
        {step.description}
      </p>
      {index < STEPS.length - 1 && (
        <div className="mt-1 self-center w-px h-4 bg-slate-300/[0.4] hidden sm:block" />
      )}
    </Card>
  )
}

function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="eyebrow">Proses pengaduan</span>
          <h2 className="page-title mt-2 mb-4">Bagaimana CampusCare Bekerja?</h2>
          <p className="page-subtitle">
            Dari penyampaian keluhan hingga penyelesaian, setiap tahap dapat
            Anda pantau dengan jelas.
          </p>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-6 lg:gap-8 items-center"
        >
          {STEPS.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
