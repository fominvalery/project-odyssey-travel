import Icon from "@/components/ui/icon"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts"
import { type ObjectData } from "@/components/AddObjectWizard"
import { type Metrics, type Period, SOURCE_COLORS } from "./AnalyticsTypes"

interface Props {
  data: Metrics
  period: Period
  categoryData: { name: string; value: number }[]
}

export default function AnalyticsCharts({ data, period, categoryData }: Props) {
  const periodDays = parseInt(period)
  const slicedActivity = data.activity

  const funnel = [
    { stage: "Просмотры",  value: data.views,    color: "#3b82f6" },
    { stage: "Лиды",       value: data.leads,    color: "#a78bfa" },
    { stage: "Заявки",     value: data.requests, color: "#f59e0b" },
    { stage: "Сделки",     value: data.deals,    color: "#10b981" },
  ]

  const statCards = [
    { label: "Просмотров",  value: String(data.views),     icon: "Eye",           color: "text-blue-400",    bg: "bg-blue-500/10" },
    { label: "Лидов",       value: String(data.leads),     icon: "UserPlus",      color: "text-violet-400",  bg: "bg-violet-500/10" },
    { label: "Заявок",      value: String(data.requests),  icon: "ClipboardList", color: "text-amber-400",   bg: "bg-amber-500/10" },
    { label: "Конверсия",   value: `${data.conversion}%`,  icon: "TrendingUp",    color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Объектов",    value: String(data.objects),   icon: "Building2",     color: "text-sky-400",     bg: "bg-sky-500/10" },
    { label: "Сделок",      value: String(data.deals),     icon: "Handshake",     color: "text-pink-400",    bg: "bg-pink-500/10" },
  ]

  return (
    <>
      {/* Карточки метрик */}
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

      {/* График активности */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 mb-5">
        <h2 className="font-semibold mb-4">Активность за {period} дней</h2>
        {slicedActivity.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
            Пока нет данных за этот период
          </div>
        ) : (
          <>
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
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} interval={Math.max(0, Math.floor(periodDays / 6))} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
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
          </>
        )}
      </div>

      {/* Воронка + категории */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Воронка конверсии</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => {
              const maxVal = funnel[0].value || 1
              const pct = Math.max((f.value / maxVal) * 100, f.value > 0 ? 2 : 0)
              const next = funnel[i + 1]
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
                  {next && next.value > 0 && f.value > 0 && (
                    <p className="text-[10px] text-gray-600 mt-0.5 text-right">
                      {((next.value / f.value) * 100).toFixed(0)}% переход
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Объекты по категориям</h2>
          {categoryData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-500">
              Нет объектов
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: "#1f1f1f" }}
                />
                <Bar dataKey="value" name="Объектов" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Динамика заявок и лидов */}
      {slicedActivity.length > 0 && (
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4">Динамика заявок и лидов</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={slicedActivity.filter((_, i) => i % Math.max(1, Math.floor(periodDays / 14)) === 0)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
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
      )}

      {/* Источники лидов и сделок */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <Icon name="PieChart" className="h-4 w-4 text-violet-400" />
            Откуда приходят лиды
          </h2>
          <p className="text-xs text-gray-500 mb-4">Распределение заявок по источникам за {period} дн.</p>
          {data.by_source.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
              Нет данных по источникам
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.by_source.map((s, i) => ({
                    name: s.source,
                    value: s.total,
                    fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="#0a0a0a"
                >
                  {data.by_source.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12, color: "#fff" }}
                  formatter={(v: number, name: string) => {
                    const total = data.by_source.reduce((s, x) => s + x.total, 0)
                    const pct = total > 0 ? Math.round((v / total) * 1000) / 10 : 0
                    return [`${v} (${pct}%)`, name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <Icon name="Trophy" className="h-4 w-4 text-emerald-400" />
            Сделки по источникам
          </h2>
          <p className="text-xs text-gray-500 mb-4">Какие каналы реально продают</p>
          {data.by_source.filter(s => s.deals > 0).length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
              Сделок ещё не было
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.by_source
                    .filter(s => s.deals > 0)
                    .map((s, i) => ({
                      name: s.source,
                      value: s.deals,
                      fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
                    }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="#0a0a0a"
                />
                <Tooltip
                  contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 12, fontSize: 12, color: "#fff" }}
                  formatter={(v: number, name: string) => {
                    const total = data.by_source.reduce((s, x) => s + x.deals, 0)
                    const pct = total > 0 ? Math.round((v / total) * 1000) / 10 : 0
                    return [`${v} (${pct}%)`, name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  )
}
