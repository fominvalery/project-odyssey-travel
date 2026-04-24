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
      <section className="relative px-4 py-12 text-center overflow-hidden">
        {/* Сетка — от середины вниз */}
        <div className="absolute inset-x-0 bottom-0 top-1/2 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[
              { cx: "10%", cy: "20%", r: 3, d: "2.5s" }, { cx: "30%", cy: "10%", r: 4, d: "3.1s" },
              { cx: "55%", cy: "25%", r: 3, d: "2.8s" }, { cx: "75%", cy: "15%", r: 4, d: "3.5s" },
              { cx: "90%", cy: "40%", r: 3, d: "2.2s" }, { cx: "20%", cy: "60%", r: 4, d: "3.8s" },
              { cx: "50%", cy: "80%", r: 3, d: "2.6s" }, { cx: "80%", cy: "70%", r: 3, d: "3.2s" },
              { cx: "40%", cy: "50%", r: 4, d: "2.3s" }, { cx: "65%", cy: "55%", r: 3, d: "3.4s" },
            ].map((node, i) => (
              <g key={i}>
                <circle cx={node.cx} cy={node.cy} r={node.r * 5} fill="#6366f1" opacity="0.06">
                  <animate attributeName="opacity" values="0.03;0.12;0.03" dur={node.d} repeatCount="indefinite"/>
                </circle>
                <circle cx={node.cx} cy={node.cy} r={node.r} fill="#a5b4fc">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur={node.d} repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            {[
              ["10%","20%","30%","10%"], ["30%","10%","55%","25%"], ["55%","25%","75%","15%"],
              ["75%","15%","90%","40%"], ["20%","60%","40%","50%"], ["40%","50%","65%","55%"],
              ["65%","55%","80%","70%"], ["50%","80%","65%","55%"], ["10%","20%","20%","60%"],
            ].map(([x1,y1,x2,y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#818cf8" strokeWidth="1" opacity="0.3"/>
            ))}
          </svg>
          {/* Плавное появление сверху */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        </div>

        <div className="relative max-w-2xl mx-auto">
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