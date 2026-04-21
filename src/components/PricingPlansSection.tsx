import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { plans, type Plan } from "@/components/pricing/pricingPlansData"
import { BuyAdsDialog } from "@/components/pricing/BuyAdsDialog"

export function PricingPlansSection() {
  const navigate = useNavigate()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null)
  const [buyAdsOpen, setBuyAdsOpen] = useState(false)

  function handlePlanClick(plan: Plan) {
    if (plan.id === "pro") {
      navigate("/register")
    } else if (plan.comingSoon) {
      setComingSoonPlan(plan.name)
    } else {
      setRegisterOpen(true)
    }
  }

  return (
    <section className="px-4 md:px-8 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-blue-500 text-sm font-semibold uppercase tracking-widest mb-3">Тарифы</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">От одного объекта — до сотен</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-7 flex flex-col gap-5 ${
              plan.featured
                ? "border-2 border-blue-600 bg-[#0d1520]"
                : "border border-[#1f1f1f] bg-[#111111]"
            }`}
          >
            {plan.featured && plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${plan.featured ? "bg-blue-900/60" : "bg-[#1a1a1a]"}`}>
              <Icon name={plan.icon as "Shield"} className={`h-5 w-5 ${plan.featured ? "text-blue-400" : "text-gray-400"}`} />
            </div>

            <div>
              <h3 className="text-white font-bold text-lg">{plan.name}</h3>
              <p className="text-gray-400 text-sm mt-0.5">{plan.desc}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
            </div>

            <ul className="flex flex-col gap-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <Icon name="Check" className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.id !== "basic" && (
              <Button
                onClick={() => handlePlanClick(plan)}
                className={`mt-auto rounded-xl w-full ${
                  plan.featured
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#2a2a2a]"
                }`}
              >
                {plan.id === "pro" ? "Выбрать тариф" : "Узнать подробнее"}
              </Button>
            )}
          </div>
        ))}
      </div>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="basic" />

      {/* Модальное окно "В разработке" */}
      <Dialog open={!!comingSoonPlan} onOpenChange={() => setComingSoonPlan(null)}>
        <DialogContent className="max-w-md bg-[#111] border-[#262626] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="Clock" className="h-4 w-4 text-amber-400" />
              </div>
              Тариф «{comingSoonPlan}» — скоро
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <p className="text-gray-300 text-sm leading-relaxed">
              Данный тариф находится в стадии разработки и будет доступен в ближайшее время.
            </p>

            <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Пока доступно</p>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="Shield" className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Тариф Базовый — Бесплатно</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    3 объявления бесплатно каждый месяц, профиль, реферальная программа, маркетплейс
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setComingSoonPlan(null)}
                className="flex-1 border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                Закрыть
              </Button>
              <Button
                onClick={() => { setComingSoonPlan(null); setRegisterOpen(true) }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Начать с Базового
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BuyAdsDialog open={buyAdsOpen} onClose={() => setBuyAdsOpen(false)} />
    </section>
  )
}