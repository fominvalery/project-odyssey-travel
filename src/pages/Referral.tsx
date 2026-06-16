import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { GlowButton } from "@/components/ui/glow-button"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"
import { Footer } from "@/components/Footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import func2url from "../../backend/func2url.json"

const RATING_URL = (func2url as Record<string, string>)["agent-rating"]

const STATUSES = [
  { name: "Друг",      refs: "1–2 реф.",   icon: "UserPlus", color: "from-blue-600 to-cyan-600",    border: "border-blue-500/30",   desc: "Начало пути на платформе" },
  { name: "Партнёр",  refs: "3–9 реф.",   icon: "Users",    color: "from-emerald-600 to-teal-600", border: "border-emerald-500/30", desc: "Активный участник сети" },
  { name: "Бизнес",   refs: "10–29 реф.", icon: "Target",   color: "from-violet-600 to-purple-600",border: "border-violet-500/30",  desc: "Профессиональный брокер" },
  { name: "Амбасадор",refs: "30–99 реф.", icon: "Award",    color: "from-amber-500 to-orange-500", border: "border-amber-500/30",   desc: "Лидер своего сегмента" },
  { name: "Лидер",    refs: "100+ реф.",  icon: "Gem",      color: "from-rose-600 to-pink-600",    border: "border-rose-500/30",    desc: "Топ платформы" },
]

const FORMULA = [
  { icon: "Handshake", label: "Закрытая сделка",    points: "+50",  color: "text-blue-400",   bg: "bg-blue-500/10" },
  { icon: "Users",     label: "Реферал",             points: "+10",  color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: "Building2", label: "Активное объявление", points: "+5",   color: "text-emerald-400",bg: "bg-emerald-500/10" },
  { icon: "UserCheck", label: "Лид в CRM",           points: "+3",   color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  { icon: "Clock",     label: "Месяц на платформе",  points: "+1",   color: "text-gray-400",   bg: "bg-gray-500/10" },
  { icon: "Star",      label: "Пункт профиля",       points: "+5",   color: "text-amber-400",  bg: "bg-amber-500/10" },
]

const BENEFITS = [
  { icon: "TrendingUp", title: "Позиция в Сети",      desc: "Высокий рейтинг — выше в списке брокеров. Тебя видят первым когда партнёры ищут с кем работать" },
  { icon: "Shield",     title: "Доверие партнёров",   desc: "Лидер с высоким рейтингом вызывает доверие. Партнёры охотнее идут на совместные сделки" },
  { icon: "Zap",        title: "Приоритет в сделках", desc: "При прочих равных партнёр с более высоким рейтингом получает предложение первым" },
]

const AGENT_STATUS_COLORS: Record<string, string> = {
  "Лидер":     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Амбасадор": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "Бизнес":    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Партнёр":   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Друг":      "bg-gray-500/15 text-gray-300 border-gray-500/30",
}

interface Agent {
  id: string
  name: string
  avatar_url: string | null
  city: string
  specializations: string[]
  agent_status: string
  points: number
  rank: number
  activity: string
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function Referral() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [topAgents, setTopAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)

  useEffect(() => {
    fetch(`${RATING_URL}?limit=10&offset=0`)
      .then(r => r.json())
      .then(data => setTopAgents(Array.isArray(data.agents) ? data.agents : []))
      .catch(() => {})
      .finally(() => setLoadingAgents(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/1ea4abe3-37e5-4db8-9984-0a8f76563081.jpg"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-[#0a0a0a]/20 to-[#0a0a0a]" />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-4 py-1.5 text-sm text-gray-300 mb-8">
            <Icon name="Trophy" className="h-4 w-4 text-amber-400" />
            Рейтинг брокеров
          </div>

          <h1 className="text-3xl md:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
            Рейтинг брокеров<br />Кабинет-24
          </h1>

          <p className="text-gray-400 text-base md:text-lg max-w-xl mb-8 leading-relaxed">
            Объективная система оценки брокеров на основе реальных показателей —
            сделок, активности, опыта и вклада в платформу.
          </p>

          <GlowButton
            onClick={() => setRegisterOpen(true)}
            className="rounded-full px-6 py-2.5 text-sm md:px-8 md:py-3 md:text-base w-full sm:w-auto"
          >
            Войти и улучшить рейтинг
            <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
          </GlowButton>
        </div>
      </section>

      {/* Формула очков */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Как считается рейтинг</h2>
        <p className="text-gray-400 text-center mb-12">Каждое действие на платформе приносит очки</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FORMULA.map((f) => (
            <div key={f.label} className={`rounded-2xl border border-[#1f1f1f] ${f.bg} p-5 flex items-center gap-4`}>
              <div className="shrink-0">
                <Icon name={f.icon as "Star"} className={`h-6 w-6 ${f.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 leading-tight">{f.label}</p>
                <p className={`text-xl font-bold ${f.color}`}>{f.points}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5 статусов */}
      <section className="px-6 py-16 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">5 статусов</h2>
          <p className="text-gray-400 text-center mb-12">Статус определяет твоё место в общем рейтинге</p>
          <div className="grid md:grid-cols-5 gap-4">
            {STATUSES.map((s) => (
              <div key={s.name} className={`rounded-2xl border ${s.border} bg-[#111] p-5 flex flex-col items-center text-center gap-3`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon name={s.icon as "Star"} className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.refs}</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">
            Статус определяется количеством приглашённых рефералов. Внутри статуса — сортировка по очкам.
          </p>
        </div>
      </section>

      {/* Что даёт рейтинг */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Что даёт высокий рейтинг</h2>
        <p className="text-gray-400 text-center mb-12">Реальные преимущества для брокера</p>
        <div className="grid md:grid-cols-3 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-[#111827] border border-[#1e2a3a] rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20">
                <Icon name={b.icon as "Star"} className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white">{b.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Топ-10 агентов */}
      <section className="px-6 py-16 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Топ брокеров</h2>
          <p className="text-gray-400 text-center mb-12">Лучшие участники платформы прямо сейчас</p>

          {loadingAgents ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topAgents.map((a) => {
                const badgeColor = AGENT_STATUS_COLORS[a.agent_status] || ""
                return (
                  <div key={a.id} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4 flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-600 w-6 text-right shrink-0">#{a.rank}</span>
                    <Avatar className="h-10 w-10 shrink-0">
                      {a.avatar_url ? <AvatarImage src={a.avatar_url} /> : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs font-bold">
                        {getInitials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                        {a.agent_status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
                            {a.agent_status}
                          </span>
                        )}
                      </div>
                      {a.city && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Icon name="MapPin" size={10} />
                          {a.city}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-amber-400 font-medium shrink-0">★ {a.points}</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <GlowButton
              onClick={() => setRegisterOpen(true)}
              className="rounded-full px-8 py-3 text-base"
            >
              Войти и занять своё место
              <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
            </GlowButton>
          </div>
        </div>
      </section>

      <Footer />
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  )
}
