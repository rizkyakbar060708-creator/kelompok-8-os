import { Send } from "lucide-react"

interface FinalCtaProps {
  onCta: () => void
}

function FinalCta({ onCta }: FinalCtaProps) {
  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 mx-auto max-w-3xl px-4 sm:px-6">
        <span className="orb absolute -right-14 -top-14 h-56 w-56 bg-indigo-400/20" />
        <span className="orb absolute left-14 bottom-10 h-48 w-48 bg-violet-400/15" />

        <div className="relative max-w-md mx-auto text-center">
          <span className="eyebrow block text-center mb-3">Mari memulai</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
            Punya Masalah di Kampus?
          </h2>
          <p className="text-sm text-slate-600 mb-8 leading-6">
            Jangan biarkan masalah tidak tersampaikan. Laporkan melalui
            CampusCare.
          </p>
          <button
            type="button"
            onClick={onCta}
            className="btn-primary w-full sm:w-auto text-sm flex items-center justify-center gap-2"
          >
            <Send size={16} className="shrink-0" />
            Mulai Sekarang
          </button>
        </div>
      </div>
    </section>
  )
}

export default FinalCta
