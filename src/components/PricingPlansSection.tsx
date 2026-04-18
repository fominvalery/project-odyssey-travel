import { useState } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"

const plans = [
  {
    id: "free",
    icon: "Shield",
    name: "Грин",
    desc: "Для частных риэлторов и тестирования",
    price: "Бесплатно",
    period: "",
    featured: false,
    features: [
      "Размещение объектов без ограничений",
      "CRM и воронка продаж",
      "Дашборд",
      "Аналитика",
      "Реферальная программа",
      "Архив",
      "Размещение объектов на Маркетплейс",
    ],
  },
  {
    id: "pro",
    icon: "Zap",
    name: "ПРО",
    desc: "Для агентств и застройщиков",
    price: "4 900 ₽",
    period: "/ мес",
    featured: true,
    badge: "Выгодный",
    features: [
      "Всё что в тарифе Грин",
      "Брендированный лендинг под каждый объект",
      "Генерация видео, презентаций, контент-плана",
      "ИИ-автопилот для ТГ-ботов",
      "Конструктор шахматки",
      "CRM с ИИ-агентами",
      "Зона для сделок",
    ],
  },
  {
    id: "business",
    icon: "Crown",
    name: "БИЗНЕС",
    desc: "Для масштабных задач и девелоперов",
    price: "14 900 ₽",
    period: "/ мес",
    featured: false,
    features: [
      "До 90 объектов",
      "ИИ-генерация лендингов и презентаций",
      "ИИ-генерация видео и постов для соцсетей",
      "Конструктор шахматки",
      "CRM с ИИ-агентами",
      "Приватные чаты с партнёрами",
      "Комнаты для сделок",
      "Хранение документов",
    ],
  },
]

export function PricingPlansSection() {
  const [registerOpen, setRegisterOpen] = useState(false)

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

            <Button
              onClick={() => setRegisterOpen(true)}
              className={`mt-auto rounded-xl w-full ${
                plan.featured
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#2a2a2a]"
              }`}
            >
              Начать бесплатно
            </Button>
          </div>
        ))}
      </div>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="green" />
    </section>
  )
}