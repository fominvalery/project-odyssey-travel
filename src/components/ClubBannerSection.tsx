import Icon from "@/components/ui/icon"
import { GlowButton } from "@/components/ui/glow-button"
import { useNavigate } from "react-router-dom"

const BG_IMAGE = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/1ea4abe3-37e5-4db8-9984-0a8f76563081.jpg"

const perks: { icon: string; text: string }[] = [
  { icon: "Crown", text: "Закрытая сеть брокеров" },
  { icon: "Shield", text: "CRM и лиды" },
  { icon: "Sparkles", text: "ИИ-ассистент" },
  { icon: "TrendingUp", text: "Аналитика по объектам" },
]

export function ClubBannerSection() {
  const navigate = useNavigate()

  return (
    <section className="pt-4 pb-6 px-4">
      <div
        className="max-w-5xl mx-auto rounded-2xl border border-violet-500/20 p-10 md:p-14 text-center relative overflow-hidden"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#0a0a0a]/80 pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block bg-violet-600/20 text-violet-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-violet-500/30">
            Закрытый клуб профессионалов
          </span>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Закрытый клуб —<br className="hidden md:block" /> Открытые возможности
          </h2>

          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Платформа для тех, кто делает сделки — а не ждёт их. Объекты, партнёры и реальные комиссии.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {perks.map((perk) => (
              <div
                key={perk.text}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2"
              >
                <Icon name={perk.icon} size={28} className="text-violet-400" />
                <span className="text-white text-sm font-medium text-center">{perk.text}</span>
              </div>
            ))}
          </div>

          <GlowButton
            onClick={() => navigate("/club")}
            className="rounded-xl px-8 py-3 text-base"
          >
            Подробнее
          </GlowButton>
        </div>
      </div>
    </section>
  )
}