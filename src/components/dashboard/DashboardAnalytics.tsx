import { useState } from "react"
import Icon from "@/components/ui/icon"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { type ObjectData } from "@/components/AddObjectWizard"

// ── Генерация данных активности за 30 дней ───────────────────────────────────

function generateActivityData() {
  const data = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" })
    data.push({
      date: label,
      просмотры: Math.floor(Math.random() * 15 + 1),
      заявки: Math.floor(Math.random() * 3),
      лиды: Math.floor(Math.random() * 2),
    })
  }
  return data
}

const ACTIVITY_DATA = generateActivityData()

const TRAFFIC_DATA = [
  { name: "Маркетплейс", value: 33, color: "#3b82f6" },
  { name: "Прямой",      value: 26, color: "#22c55e" },
  { name: "Реклама",     value: 18, color: "#a78bfa" },
  { name: "Рефералы",    value: 13, color: "#f59e0b" },
  { name: "Соцсети",     value: 10, color: "#ec4899" },
]

const FUNNEL_DATA = [
  { stage: "Просмотры",  value: 124, color: "#3b82f6" },
  { stage: "Лиды",       value: 8,   color: "#a78bfa" },
  { stage: "Заявки",     value: 3,   color: "#f59e0b" },
  { stage: "Переговоры", value: 1,   color: "#22c55e" },
  { stage: "Сделки",     value: 0,   color: "#10b981" },
]

const CATEGORY_DATA = [
  { name: "Коммерция",   value: 45 },
  { name: "Инвестиции",  value: 30 },
  { name: "Новостройки", value: 15 },
  { name: "Торги",       value: 10 },
]

// ── Типы периода ──────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90"

// ── Компонент ─────────────────────────────────────────────────────────────────

interface Props {
  objects: ObjectData[]
  leadsCount?: number
}

export default function DashboardAnalytics({ objects, leadsCount = 3 }: Props) {
  const [period, setPeriod] = useState<Period>("30")

  const periodDays = parseInt(period)
  const slicedActivity = ACTIVITY_DATA.slice(-periodDays)

  const totalViews = slicedActivity.reduce((s, d) => s + d.просмотры, 0)
  const totalLeads = slicedActivity.reduce((s, d) => s + d.лиды, 0)
  const totalRequests = slicedActivity.reduce((s, d) => s + d.заявки, 0)
  const conversion = totalViews > 0 ? ((totalRequests / totalViews) * 100).toFixed(1) : "0.0"

  const statCards = [
    { label: "Просмотров",  value: String(totalViews),      icon: "Eye",        color: "text-blue-400",    bg: "bg-blue-500/10" },
    { label: "Лидов",       value: String(leadsCount),      icon: "UserPlus",   color: "text-violet-400",  bg: "bg-violet-500/10" },
    { label: "Заявок",      value: String(totalRequests),   icon: "ClipboardList", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Конверсия",   value: `${conversion}%`,        icon: "TrendingUp", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Объектов",    value: String(objects.length),  icon: "Building2",  color: "text-sky-400",     bg: "bg-sky-500/10" },
    { label: "Сделок",      value: "0",                     icon: "Handshake",  color: "text-pink-400",    bg: "bg-pink-500/10" },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Заголовок + период */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Аналитика</h1>
          <p className="text-sm text-gray-500 mt-0.5">Последние {period} дней</p>
        </div>
        <div className="flex gap-1 bg-[#111] border border-[#1f1f1f] rounded-xl p-1">
          {(["7", "30", "90"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >{p} дн.</button>
          ))}
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <Icon name={s.icon as "Eye"} className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Активность + источники */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* График активности */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Активность за {period} дней</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={slicedActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval={Math.floor(periodDays / 6)} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Area type="monotone" dataKey="просмотры" stroke="#3b82f6" fill="url(#gViews)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="лиды" stroke="#a78bfa" fill="url(#gLeads)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />Просмотры</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-0.5 bg-violet-400 inline-block rounded" />Лиды</span>
          </div>
        </div>

        {/* Источники трафика */}
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Источники трафика</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={TRAFFIC_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {TRAFFIC_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {TRAFFIC_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Воронка конверсии + категории */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Воронка */}
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Воронка конверсии</h2>
          <div className="space-y-3">
            {FUNNEL_DATA.map((f, i) => {
              const maxVal = FUNNEL_DATA[0].value || 1
              const pct = Math.max((f.value / maxVal) * 100, f.value > 0 ? 2 : 0)
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{f.stage}</span>
                    <span className="text-white font-medium">{f.value}</span>
                  </div>
                  <div className="h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ width: `${pct}%`, background: f.color }}
                    />
                  </div>
                  {i < FUNNEL_DATA.length - 1 && FUNNEL_DATA[i + 1].value > 0 && (
                    <p className="text-[10px] text-gray-600 mt-0.5 text-right">
                      {((FUNNEL_DATA[i + 1].value / (f.value || 1)) * 100).toFixed(0)}% переход
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Объекты по категориям */}
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Объекты по категориям</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CATEGORY_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: "#1f1f1f" }}
              />
              <Bar dataKey="value" name="Заявок" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Динамика заявок */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
        <h2 className="font-semibold mb-4">Динамика заявок и лидов</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={slicedActivity.filter((_, i) => i % Math.max(1, Math.floor(periodDays / 14)) === 0)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: "#1f1f1f" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            <Bar dataKey="заявки" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="лиды" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
