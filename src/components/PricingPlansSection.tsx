import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useYookassa } from "@/components/extensions/yookassa/useYookassa"
import func2url from "../../backend/func2url.json"

function getReturnUrl(): string {
  const origin = window.location.origin
  const base = origin.startsWith("http://") ? origin.replace("http://", "https://") : origin
  return `${base}/dashboard`
}

const YOOKASSA_URL = (func2url as Record<string, string>)["yookassa-yookassa"]

const plans = [
  {
    id: "basic",
    icon: "Shield",
    name: "Базовый",
    desc: "Для старта: три бесплатных объявления каждый месяц",
    price: "Бесплатно",
    period: "",
    featured: false,
    comingSoon: false,
    features: [
      "3 объявления бесплатно каждый месяц",
      "Профиль участника платформы",
      "Реферальная программа",
      "Маркетплейс",
      "Поддержка",
    ],
  },
  {
    id: "pro",
    icon: "Zap",
    name: "ПРО",
    desc: "Для максимальной автоматизации",
    price: "4 900 ₽",
    period: "/ мес",
    featured: true,
    badge: "Выгодный",
    comingSoon: true,
    features: [
      "Всё что в тарифе Базовый",
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
    desc: "Для масштабных задач Компании/Агентства",
    price: "14 900 ₽",
    period: "/ мес",
    featured: false,
    comingSoon: true,
    features: [
      "Всё что в тарифе Про",
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

// Ступенчатая стоимость объявлений
const PRICE_PER_AD = 199
const DISCOUNT_TIERS = [
  { from: 1,  to: 9,   discount: 0,   label: "1–9 объявлений" },
  { from: 10, to: 24,  discount: 10,  label: "10–24 объявления" },
  { from: 25, to: 49,  discount: 20,  label: "25–49 объявлений" },
  { from: 50, to: 100, discount: 30,  label: "50–100 объявлений" },
]

function getDiscount(qty: number): number {
  const tier = DISCOUNT_TIERS.find((t) => qty >= t.from && qty <= t.to)
  return tier ? tier.discount : 30
}

function calcPrice(qty: number): number {
  const discount = getDiscount(qty)
  return Math.round(qty * PRICE_PER_AD * (1 - discount / 100))
}

interface BuyAdsDialogProps {
  open: boolean
  onClose: () => void
  userEmail?: string
  userName?: string
}

function BuyAdsDialog({ open, onClose, userEmail = "", userName = "" }: BuyAdsDialogProps) {
  const [qty, setQty] = useState(5)
  const [email, setEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const total = calcPrice(qty)
  const discount = getDiscount(qty)
  const currentTier = DISCOUNT_TIERS.find((t) => qty >= t.from && qty <= t.to) ?? DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]
  const effectiveEmail = userEmail || email

  const { createPayment, isLoading } = useYookassa({
    apiUrl: YOOKASSA_URL,
    onError: (e) => setErrorMsg(e.message),
  })

  async function handlePay() {
    setErrorMsg("")
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setErrorMsg("Введите корректный email")
      return
    }
    const response = await createPayment({
      amount: total,
      userEmail: effectiveEmail,
      userName,
      description: `Объявления ×${qty} — тариф Базовый`,
      returnUrl: getReturnUrl(),
      cartItems: [{ id: "ads", name: `Объявления ×${qty}`, quantity: qty, price: Math.round(PRICE_PER_AD * (1 - discount / 100)) }],
      orderType: "listings",
    })
    if (response?.payment_url) {
      window.location.href = response.payment_url
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-[#111] border-[#262626] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <Icon name="ShoppingCart" className="h-4 w-4 text-blue-400" />
            </div>
            Докупить объявления
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Слайдер количества */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Количество объявлений</span>
              <span className="text-lg font-bold text-white">{qty} шт.</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#2a2a2a] accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1</span>
              <span>100</span>
            </div>
          </div>

          {/* Ступенчатые скидки */}
          <div className="grid grid-cols-2 gap-2">
            {DISCOUNT_TIERS.map((tier) => (
              <div
                key={tier.from}
                className={`rounded-lg p-2.5 border text-xs transition-colors ${
                  currentTier.from === tier.from
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500"
                }`}
              >
                <div className="font-semibold">{tier.label}</div>
                <div>{tier.discount > 0 ? `скидка ${tier.discount}%` : "базовая цена"}</div>
              </div>
            ))}
          </div>

          {/* Итог */}
          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Цена за объявление</span>
              <span className="text-sm text-white">
                {Math.round(PRICE_PER_AD * (1 - discount / 100))} ₽
                {discount > 0 && (
                  <span className="ml-1.5 text-xs text-gray-500 line-through">{PRICE_PER_AD} ₽</span>
                )}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Скидка</span>
                <span className="text-sm text-green-400">−{discount}%</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a] mt-2">
              <span className="font-semibold text-white">Итого</span>
              <span className="text-xl font-bold text-white">{total.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email для чека</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={userEmail || email}
              readOnly={!!userEmail}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              Отмена
            </Button>
            <Button
              onClick={handlePay}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Загрузка..." : `Оплатить ${total.toLocaleString("ru-RU")} ₽`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PricingPlansSection() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null)
  const [buyAdsOpen, setBuyAdsOpen] = useState(false)

  function handlePlanClick(plan: typeof plans[0]) {
    if (plan.comingSoon) {
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

            {plan.id === "basic" && (
              <button
                onClick={() => setBuyAdsOpen(true)}
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
              >
                <Icon name="Plus" className="h-3.5 w-3.5" />
                Докупить дополнительные объявления — от 199 ₽
              </button>
            )}

            <Button
              onClick={() => handlePlanClick(plan)}
              className={`mt-auto rounded-xl w-full ${
                plan.featured
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#2a2a2a]"
              }`}
            >
              {plan.comingSoon ? "Узнать подробнее" : "Начать бесплатно"}
            </Button>
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