import { ArrowRight, Send } from "lucide-react"

import Illustration from "./Illustration"

interface HeroProps {
  onPrimaryCta: () => void
}

function Hero({ onPrimaryCta }: HeroProps) {
  return (
    <section id="beranda" className="relative pt-20 pb-32 sm:pt-32 sm:pb-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 sm:gap-16 lg:gap-24">
          <div className="space-y-6 order-2 sm:order-1">
            <span className="eyebrow inline-flex items-center gap-2 text-indigo-600">
              Platform resmi kampus
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              Sampaikan Keluhan, Wujudkan Perubahan.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-7 max-w-xl">
              Platform pengaduan kampus yang memudahkan mahasiswa menyampaikan
              masalah, memantau penanganan, dan ikut menciptakan lingkungan
              kampus yang lebih baik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
              <button
                type="button"
                onClick={onPrimaryCta}
                className="btn-primary w-full sm:w-auto text-sm"
              >
                <Send size={16} className="shrink-0" />
                Buat Pengaduan
              </button>
              <a
                href="#cara-kerja"
                className="btn-secondary w-full sm:w-auto text-sm flex items-center justify-center gap-2"
              >
                Pelajari Cara Kerja <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="order-1 sm:order-2 flex justify-center">
            <Illustration className="w-full max-w-sm sm:max-w-md lg:max-w-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
