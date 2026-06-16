import Icon from "@/components/ui/icon"
import { GlowButton } from "@/components/ui/glow-button"
import { useNavigate } from "react-router-dom"

const BG_IMAGE = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/77802ca7-d47a-43d5-a713-de3479b3fab7.jpg"

const perks: { icon: string; text: string }[] = [
  { icon: "Star", text: "Независимые оценки брокеров" },
  { icon: "BarChart2", text: "Статистика сделок" },
  { icon: "Users", text: "Лучшие специалисты рынка" },
  { icon: "ShieldCheck", text: "Проверенные профессионалы" },
]

export function ReferralBannerSection() {
  const navigate = useNavigate()

  return (
    <section className="pt-4 pb-6 px-4">
      <div
        className="max-w-5xl mx-auto rounded-2xl border border-blue-500/20 p-6 md:p-14 text-center relative overflow-hidden"
        style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#0a0f1e]/80 pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block bg-blue-600/20 text-blue-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-blue-500/30">
            Рейтинг брокеров
          </span>

          <h2 className="text-2xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Рейтинг брокеров<br /> Кабинет-24
          </h2>

          <p className="text-gray-300 text-sm md:text-lg mb-6 md:mb-10 max-w-xl mx-auto">
            Объективный рейтинг специалистов коммерческой недвижимости по сделкам, отзывам и репутации.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-10">
            {perks.map((perk) => (
              <div
                key={perk.text}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center gap-2"
              >
                <Icon name={perk.icon} size={24} className="text-blue-400" />
                <span className="text-white text-xs md:text-sm font-medium text-center leading-snug">{perk.text}</span>
              </div>
            ))}
          </div>

          <GlowButton
            onClick={() => navigate("/referral")}
            className="rounded-xl px-6 py-2.5 text-sm md:px-8 md:py-3 md:text-base w-full md:w-auto"
          >
            Подробнее
          </GlowButton>
        </div>
      </div>
    </section>
  )
}