import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

import Navbar from "../../components/landing/Navbar"
import Hero from "../../components/landing/Hero"
import Categories from "../../components/landing/Categories"
import HowItWorks from "../../components/landing/HowItWorks"
import FAQ from "../../components/landing/FAQ"
import FinalCta from "../../components/landing/FinalCta"
import Footer from "../../components/landing/Footer"

function LandingPage() {
  const navigate = useNavigate()
  const { user, isReady } = useAuth()

  const handlePrimaryCta = () => {
    // Halaman publik tetap dapat diakses, tetapi aksi utama membuat pengaduan
    // memerlukan sesi. Saat sesi belum siap atau belum ada user, arahkan ke
    // login agar user tidak tersesat.
    if (!isReady || !user) {
      navigate("/login")
      return
    }
    navigate("/complaints/create")
  }

  return (
    <div className="app-shell relative overflow-hidden min-h-screen">
      <div className="orb fixed right-[-10rem] top-[-6rem] h-[26rem] w-[26rem] bg-blue-500/25" />
      <div className="orb fixed bottom-[-8rem] left-[-8rem] h-[24rem] w-[24rem] bg-violet-500/20" />
      <div className="orb fixed right-[20%] bottom-[10%] h-[20rem] w-[20rem] bg-pink-400/15" />
      <div className="orb fixed left-[10%] top-[40%] h-[16rem] w-[16rem] bg-amber-300/15" />

      <Navbar />

      <main className="relative">
        <Hero onPrimaryCta={handlePrimaryCta} />
        <Categories />
        <HowItWorks />
        <FAQ />
        <FinalCta onCta={handlePrimaryCta} />
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
