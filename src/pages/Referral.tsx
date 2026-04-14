import { useState } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

const levels = [
  { level: 1, name: "Старт", percent: 10, desc: "Бонус за каждый платёж вашего реферала" },
  { level: 2, name: "Партнёр", percent: 15, desc: "Повышенный процент при 5+ активных рефералах" },
  { level: 3, name: "Эксперт", percent: 20, desc: "Доступ ко второй линии рефералов" },
  { level: 4, name: "Профи", percent: 25, desc: "Пассивный доход со второй линии" },
  { level: 5, name: "Элита", percent: 30, desc: "Максимальный процент + персональный менеджер" },
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

      {/* 5 уровней */}
      <section className="px-6 py-16 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">5 уровней роста</h2>
          <p className="text-gray-400 text-center mb-12">Чем больше партнёров — тем выше ваш процент</p>
          <div className="grid md:grid-cols-5 gap-4">
            {levels.map((l) => (
              <div key={l.level} className="bg-[#141414] border border-[#262626] rounded-2xl p-5 flex flex-col gap-2 hover:border-violet-500/40 transition-colors">
                <div className="text-xs text-gray-500 font-medium">Уровень {l.level}</div>
                <div className="text-2xl font-bold text-violet-400">{l.percent}%</div>
                <div className="text-sm font-semibold text-white">{l.name}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{l.desc}</div>
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