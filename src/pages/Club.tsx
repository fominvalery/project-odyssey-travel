import { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import Icon from "@/components/ui/icon"
import { GlowButton } from "@/components/ui/glow-button"
import { RegisterModal } from "@/components/RegisterModal"
import { ClubPayDialog } from "@/components/pricing/ClubPayDialog"
import { useAuthContext } from "@/context/AuthContext"
import { ClubHero } from "@/components/club/ClubHero"
import { ClubFeatures } from "@/components/club/ClubFeatures"
import { ClubHowItWorks, ClubNetwork, ClubMembersMarquee } from "@/components/club/ClubMembers"

export default function Club() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const { user } = useAuthContext()

  const handleCtaClick = () => {
    if (user) {
      setPayOpen(true)
    } else {
      setRegisterOpen(true)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <ClubHero onRegister={() => setRegisterOpen(true)} />

      {/* ── Цифры ─────────────────────────────────────────────────────────── */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "500+", label: "Участников в сети", icon: "Users" },
            { value: "1 200+", label: "Объектов в базе", icon: "Building2" },
            { value: "340", label: "Сделок закрыто", icon: "Handshake" },
            { value: "38", label: "Городов присутствия", icon: "MapPin" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <Icon name={stat.icon as "Users"} className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">* Данные приведены в ознакомительных целях и будут обновляться по мере роста платформы</p>
      </section>

      <ClubFeatures />

      <ClubHowItWorks />

      <ClubNetwork />

      <ClubMembersMarquee />

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Здесь не ждут сделок —<br className="hidden sm:block" /> здесь их создают.
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Никакого воздуха. Только объекты, партнёры и реальные сделки.
          </p>
          <GlowButton
            onClick={handleCtaClick}
            className="px-10 py-4 rounded-xl text-base font-bold"
          >
            Вступить в Клуб
          </GlowButton>
        </div>
      </section>

      <Footer />

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="basic" />
      <ClubPayDialog open={payOpen} onClose={() => setPayOpen(false)} />
    </main>
  )
}
