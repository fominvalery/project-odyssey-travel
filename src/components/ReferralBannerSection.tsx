import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useNavigate } from "react-router-dom"

const perks: { icon: string; text: string }[] = [
  { icon: "BadgePercent", text: "До 30% с каждого реферала" },
  { icon: "Infinity", text: "Бессрочные выплаты" },
  { icon: "Users", text: "Многоуровневая система" },
  { icon: "Wallet", text: "Вывод в любое время" },
]

export function ReferralBannerSection() {
  const navigate = useNavigate()

  return (
    <section className="pt-6 pb-20 px-4">
      <div className="max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-blue-500/20 p-10 md:p-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <span className="inline-block bg-blue-600/20 text-blue-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-blue-500/30">
            Реферальная программа
          </span>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Зарабатывай,<br className="hidden md:block" /> рекомендуя платформу
          </h2>

          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Приглашай коллег и партнёров — получай пассивный доход с каждой их оплаты навсегда.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {perks.map((perk) => (
              <div
                key={perk.text}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2"
              >
                <Icon name={perk.icon} size={28} className="text-blue-400" />
                <span className="text-white text-sm font-medium text-center">{perk.text}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => navigate("/referral")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl text-base"
          >
            Подробнее
          </Button>
        </div>
      </div>
    </section>
  )
}