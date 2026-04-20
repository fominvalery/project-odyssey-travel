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
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../backend/func2url.json"

const YOOKASSA_URL = (func2url as Record<string, string>)["yookassa-yookassa"]

function getReturnUrl(): string {
  const origin = window.location.origin
  const base = origin.startsWith("http://") ? origin.replace("http://", "https://") : origin
  return `${base}/dashboard`
}

interface ClubPayDialogProps {
  open: boolean
  onClose: () => void
}

function ClubPayDialog({ open, onClose }: ClubPayDialogProps) {
  const { user } = useAuthContext()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const PLAN_PRICE = 990

  const effectiveEmail = user?.email || email
  const effectiveName = user?.name || name

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
      amount: PLAN_PRICE,
      userEmail: effectiveEmail,
      userName: effectiveName,
      description: "Тариф Клуб — 1 месяц",
      returnUrl: getReturnUrl(),
      cartItems: [{ id: "club", name: "Тариф Клуб", quantity: 1, price: PLAN_PRICE }],
      orderType: "subscription",
      userId: user?.id,
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
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Icon name="Zap" className="h-4 w-4 text-violet-400" />
            </div>
            Тариф Клуб — 990 ₽/мес
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {user ? (
            <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3 flex items-center gap-3">
              <Icon name="User" className="h-4 w-4 text-violet-400 shrink-0" />
              <div className="text-sm">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">Укажите ваши данные — на email придёт чек.</p>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Имя</label>
                <Input
                  placeholder="Иван Иванов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email для чека</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500"
                />
              </div>
            </>
          )}

          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4 flex items-center justify-between">
            <span className="font-semibold text-white">Итого</span>
            <span className="text-xl font-bold text-white">990 ₽</span>
          </div>

          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

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
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isLoading ? "Загрузка..." : "Оплатить 990 ₽"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const plans = [
  {
    id: "basic",
    name: "Базовый",
    badge: null,
    price: "Бесплатно",
    period: "навсегда",
    description: "3 объявления бесплатно каждый месяц + докупка по необходимости",
    color: "border-green-500/30",
    accentColor: "text-green-400",
    badgeBg: "",
    buttonClass: "bg-[#252525] text-white hover:bg-[#2f2f2f]",
    features: [
      { text: "3 объявления бесплатно каждый месяц", included: true },
      { text: "Профиль участника платформы", included: true },
      { text: "Реферальная программа", included: true },
      { text: "Поддержка", included: true },
      { text: "Маркетплейс", included: true },
    ],
  },
  {
    id: "pro",
    name: "Клуб",
    badge: "Популярный",
    price: "990 ₽",
    period: "в месяц",
    description: "Для агентств недвижимости и небольших команд",
    color: "border-violet-500/50",
    accentColor: "text-violet-400",
    badgeBg: "bg-violet-500/20 text-violet-300",
    buttonClass: "bg-violet-600 hover:bg-violet-700 text-white",
    features: [
      { text: "До 50 объектов на маркетплейсе", included: true },
      { text: "Полная CRM (до 200 клиентов)", included: true },
      { text: "Все 4 направления недвижимости", included: true },
      { text: "Реферальная программа", included: true },
      { text: "Объекты с торгов", included: true },
      { text: "Базовая аналитика", included: true },
      { text: "Брендирование профиля", included: false },
      { text: "Выделенный менеджер", included: false },
    ],
  },
  {
    id: "proplus",
    name: "Про+",
    badge: "Для крупных",
    price: "24 900 ₽",
    period: "в месяц",
    description: "Для крупных агентств и девелоперских компаний",
    color: "border-amber-500/30",
    accentColor: "text-amber-400",
    badgeBg: "bg-amber-500/20 text-amber-300",
    buttonClass: "bg-[#252525] text-white hover:bg-[#2f2f2f]",
    features: [
      { text: "Неограниченное количество объектов", included: true },
      { text: "CRM без ограничений", included: true },
      { text: "Все 4 направления недвижимости", included: true },
      { text: "Расширенная реферальная программа", included: true },
      { text: "Объекты с торгов + аукционы", included: true },
      { text: "Расширенная аналитика и отчёты", included: true },
      { text: "Брендирование профиля компании", included: true },
      { text: "Выделенный менеджер", included: true },
    ],
  },
]

const constructorFeatures = [
  { icon: "Building2", label: "Количество объектов" },
  { icon: "Users", label: "Размер базы клиентов" },
  { icon: "BarChart2", label: "Глубина аналитики" },
  { icon: "Share2", label: "Реферальный процент" },
  { icon: "Headphones", label: "Уровень поддержки" },
  { icon: "Layers", label: "Направления недвижимости" },
]

export function PricingSection() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("basic")
  const [clubPayOpen, setClubPayOpen] = useState(false)

  function openModal(planId: string) {
    if (planId === "pro") {
      setClubPayOpen(true)
    } else {
      setSelectedPlan(planId)
      setModalOpen(true)
    }
  }

  return (
    <section className="px-4 md:px-8 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="inline-block rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400 mb-4">
          ТАРИФЫ
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Выберите формат участия
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          От бесплатного старта до корпоративного решения — найдите тариф, который подходит вашему бизнесу
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl bg-[#141414] border ${plan.color} p-6 flex flex-col ${plan.id === "pro" ? "ring-1 ring-violet-500/30" : ""}`}
          >
            {plan.badge && (
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-medium ${plan.badgeBg}`}>
                {plan.badge}
              </span>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-bold mb-1 ${plan.accentColor}`}>{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-gray-500 mb-1">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Icon
                    name={feature.included ? "CheckCircle" : "XCircle"}
                    className={`h-4 w-4 flex-shrink-0 ${feature.included ? plan.accentColor : "text-gray-700"}`}
                  />
                  <span className={`text-sm ${feature.included ? "text-gray-300" : "text-gray-600"}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full rounded-full ${plan.buttonClass}`}
              onClick={() => openModal(plan.id)}
            >
              {plan.id === "basic" ? "Начать бесплатно" : "Выбрать тариф"}
            </Button>
          </div>
        ))}
      </div>

      {/* Конструктор тарифа */}
      <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                <Icon name="Settings2" className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Конструктор тарифа</h3>
                <p className="text-xs text-gray-500">Настройте под задачи вашей компании</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-lg">
              Выберите только те модули, которые нужны вашему бизнесу. Платите за реальные возможности, а не за лишние функции.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-1 max-w-sm">
            {constructorFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-[#262626] px-3 py-2">
                <Icon name={f.icon} className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Стоимость рассчитывается индивидуально — от 199 ₽</p>
          <Button
            className="rounded-full border border-violet-500 text-violet-400 bg-transparent hover:bg-violet-500/10 px-6"
            onClick={() => openModal("constructor")}
          >
            Собрать тариф
          </Button>
        </div>
      </div>

      <RegisterModal open={modalOpen} onOpenChange={setModalOpen} planId={selectedPlan} />
      <ClubPayDialog open={clubPayOpen} onClose={() => setClubPayOpen(false)} />
    </section>
  )
}