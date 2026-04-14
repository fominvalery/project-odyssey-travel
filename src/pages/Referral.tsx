import { useState } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

const levels = [
  {
    name: "Друг", refs: "1–2 рефералов",
    cashback1: "5%", cashback2: null,
    icon: "UserPlus", bg: "bg-[#0f1a2e]", iconColor: "text-blue-400", iconBg: "bg-blue-500/20",
    perks: ["Реферальная ссылка", "Бонус 10 токенов за регистрацию", "20 бонусов за первый объект реферала"],
    badge: { label: "Копилка бонусов", color: "bg-[#1a2a3a] text-blue-300 border border-blue-500/30" },
  },
  {
    name: "Партнёр", refs: "3–9 рефералов",
    cashback1: "7%", cashback2: null,
    icon: "Users", bg: "bg-[#0f1f18]", iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20",
    perks: ["Повышенный кэшбэк 7%", "Приоритетная поддержка", "Доступ к закрытому Telegram-чату"],
    badge: { label: "Копилка бонусов", color: "bg-[#1a2a3a] text-blue-300 border border-blue-500/30" },
  },
  {
    name: "Бизнес-партнёр", refs: "10–29 рефералов",
    cashback1: "7%", cashback2: null,
    icon: "Target", bg: "bg-[#1a0f2e]", iconColor: "text-violet-400", iconBg: "bg-violet-500/20",
    perks: ["Вывод средств открыт", "Персональный менеджер", "Со-брендинг материалы"],
    badge: { label: "Вывод открыт", color: "bg-[#1a2a1a] text-emerald-300 border border-emerald-500/30" },
  },
  {
    name: "Амбассадор", refs: "30–99 рефералов",
    cashback1: "10%", cashback2: null,
    icon: "Award", bg: "bg-[#1f1800]", iconColor: "text-amber-400", iconBg: "bg-amber-500/20",
    perks: ["Кэшбэк 10%", "Значок амбассадора в профиле", "Ранний доступ к новым функциям"],
    badge: { label: "Вывод открыт", color: "bg-[#1a2a1a] text-emerald-300 border border-emerald-500/30" },
  },
  {
    name: "Адвокат бренда", refs: "100+ рефералов",
    cashback1: "10%", cashback2: "2%",
    icon: "Gem", bg: "bg-[#1f0a0a]", iconColor: "text-rose-400", iconBg: "bg-rose-500/20",
    perks: ["10% с 1-й линии + 2% со 2-й", "VIP-статус и эксклюзивные условия", "Участие в развитии продукта"],
    badge: { label: "Вывод открыт", color: "bg-[#1a2a1a] text-emerald-300 border border-emerald-500/30" },
  },
]

const steps = [
  { icon: "UserPlus", title: "Зарегистрируйтесь", desc: "Создайте бесплатный аккаунт и получите уникальную реферальную ссылку" },
  { icon: "Gift", title: "Приглашайте", desc: "Делитесь ссылкой с коллегами и партнёрами из сферы недвижимости" },
  { icon: "TrendingUp", title: "Получайте доход", desc: "Зарабатывайте процент с каждого платежа привлечённых пользователей" },
  { icon: "Rocket", title: "Растите в статусе", desc: "Больше рефералов — выше уровень, процент и привилегии" },
]

export default function Referral() {
  const [refs, setRefs] = useState(5)
  const [plan, setPlan] = useState(9900)

  const income = Math.round(refs * plan * 0.15)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-4 py-1.5 text-sm text-gray-300 mb-8">
          <Icon name="Gift" className="h-4 w-4 text-violet-400" />
          Партнёрская программа
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
          Зарабатывайте вместе с нами
        </h1>

        <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          Приглашайте профессионалов рынка недвижимости и получайте
          растущий процент от их платежей. 5 уровней роста — от бонусов до
          пассивного дохода со второй линии.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium">
            Стать партнёром
            <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" className="rounded-full border-[#262626] bg-[#141414] text-white hover:bg-[#1f1f1f] px-8 py-3 text-base font-medium">
            Рассчитать доход
            <Icon name="Calculator" className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Как это работает */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Как это работает</h2>
        <p className="text-gray-400 text-center mb-12">Четыре простых шага к партнёрскому доходу</p>
        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={i} className="relative bg-[#111827] border border-[#1e2a3a] rounded-2xl p-6 flex flex-col gap-4">
              {/* Номер шага */}
              <div className="absolute -top-3.5 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shadow-lg">
                {i + 1}
              </div>
              {/* Иконка */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 mt-2">
                <Icon name={s.icon} className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="px-6 py-16 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Преимущества программы</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: "Zap", title: "Пассивный доход", desc: "Зарабатывайте на каждом платеже приглашённых — без дополнительных усилий" },
              { icon: "Shield", title: "Прозрачная аналитика", desc: "Отслеживайте рефералов, начисления и выплаты в реальном времени" },
              { icon: "Crown", title: "Пятиуровневая система", desc: "Растите от «Друга» до «Адвоката бренда» — на высших уровнях доход и со второй линии" },
              { icon: "Star", title: "Бонусы за активность", desc: "10 токенов за регистрацию реферала и 20 бонусов за его первый объект" },
              { icon: "BadgeCheck", title: "Статус и признание", desc: "Значок амбассадора, VIP-поддержка и ранний доступ к новым функциям" },
              { icon: "Wallet", title: "Удобный вывод", desc: "Выводите заработанные средства удобным способом от уровня Бизнес-партнёр" },
            ].map((item, i) => (
              <div key={i} className="bg-[#111827] border border-[#1e2a3a] rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20">
                  <Icon name={item.icon} className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 уровней */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">5 уровней роста</h2>
          <p className="text-gray-400 text-center mb-12">Чем больше рефералов — тем выше ваш статус, процент и привилегии</p>
          <div className="flex flex-col gap-4">
            {levels.map((l, i) => (
              <div key={i} className={`${l.bg} border border-[#1e2a3a] rounded-2xl flex flex-col md:flex-row overflow-hidden`}>
                {/* Левая часть */}
                <div className="flex flex-col items-center justify-center gap-2 px-8 py-6 min-w-[180px]">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${l.iconBg}`}>
                    <Icon name={l.icon} className={`h-6 w-6 ${l.iconColor}`} />
                  </div>
                  <div className="text-lg font-bold text-white mt-1">{l.name}</div>
                  <div className="text-xs text-gray-400">{l.refs}</div>
                </div>

                {/* Правая часть */}
                <div className="flex flex-1 items-center justify-between px-8 py-6 border-t md:border-t-0 md:border-l border-[#1e2a3a] gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-medium text-gray-300">
                      Кэшбэк 1-я линия: <span className="text-blue-400 font-bold">{l.cashback1}</span>
                      {l.cashback2 && <> &nbsp; 2-я линия: <span className="text-blue-400 font-bold">{l.cashback2}</span></>}
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {l.perks.map((p, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                          <Icon name="Check" className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`hidden md:flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap ${l.badge.color}`}>
                    <Icon name="Wallet" className="h-3.5 w-3.5" />
                    {l.badge.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Калькулятор */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">Рассчитайте ваш доход</h2>
          <p className="text-gray-400 text-sm text-center mb-8">Примерный расчёт на уровне «Партнёр» (15%)</p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Количество рефералов</span>
                <span className="text-white font-semibold">{refs} чел.</span>
              </div>
              <input
                type="range" min={1} max={50} value={refs}
                onChange={(e) => setRefs(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Средний тариф реферала</span>
                <span className="text-white font-semibold">{plan.toLocaleString()} ₽/мес</span>
              </div>
              <input
                type="range" min={4900} max={24900} step={5000} value={plan}
                onChange={(e) => setPlan(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div className="bg-[#0f0f0f] border border-violet-500/20 rounded-xl p-6 text-center">
              <div className="text-sm text-gray-400 mb-1">Ваш ежемесячный доход</div>
              <div className="text-4xl font-bold text-violet-400">{income.toLocaleString()} ₽</div>
              <div className="text-xs text-gray-600 mt-2">в месяц при 15% комиссии</div>
            </div>
          </div>

          <Button className="w-full mt-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white py-3">
            Стать партнёром
            <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  )
}