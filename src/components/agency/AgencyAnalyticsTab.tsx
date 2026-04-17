import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { agencyApi, OrgAnalytics, ROLE_TITLES } from "@/lib/agencyApi"
import { useAuthContext } from "@/context/AuthContext"

interface Props {
  orgId: string
}

const DEPT_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f43f5e",
]

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number | string
  icon: string
  color: string
}) {
  return (
    <Card className="bg-white/5 border-white/10 p-5 text-white">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
        >
          <Icon name={icon} size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-400">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  )
}

export default function AgencyAnalyticsTab({ orgId }: Props) {
  const { user } = useAuthContext()
  const [data, setData] = useState<OrgAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !orgId) return
    setLoading(true)
    agencyApi
      .orgAnalytics(user.id, orgId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false))
  }, [user, orgId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Icon name="Loader2" size={24} className="animate-spin mr-3" />
        Загружаем аналитику...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-10 text-center text-slate-400">
        <Icon name="AlertCircle" size={32} className="mx-auto mb-2 opacity-50" />
        {error || "Нет данных"}
      </div>
    )
  }

  const { summary, dept_objects, dept_leads, top_by_objects, top_by_leads } = data

  // Данные для графика объектов по отделам
  const deptChartObjects = dept_objects.map((d, i) => ({
    name: d.dept_name.length > 14 ? d.dept_name.slice(0, 14) + "…" : d.dept_name,
    fullName: d.dept_name,
    Объектов: d.total,
    Опубликовано: d.published,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }))

  // Данные для графика лидов по отделам
  const deptChartLeads = dept_leads.map((d, i) => ({
    name: d.dept_name.length > 14 ? d.dept_name.slice(0, 14) + "…" : d.dept_name,
    fullName: d.dept_name,
    Лидов: d.total,
    Сделок: d.deals,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }))

  const tooltipStyle = {
    contentStyle: {
      background: "#141414",
      border: "1px solid #262626",
      borderRadius: 12,
      fontSize: 12,
    },
    labelStyle: { color: "#9ca3af" },
  }

  return (
    <div className="space-y-5">
      {/* Итоговые метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Объектов всего"
          value={summary.total_objects}
          icon="Building2"
          color="from-violet-500 to-indigo-500"
        />
        <StatCard
          label="Опубликовано"
          value={summary.published_objects}
          icon="Globe"
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          label="Лидов всего"
          value={summary.total_leads}
          icon="Users"
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          label="Сделок"
          value={summary.total_deals}
          icon="Handshake"
          color="from-pink-500 to-rose-500"
        />
      </div>

      {/* Графики по отделам */}
      {dept_objects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Объекты по отделам */}
          <Card className="bg-white/5 border-white/10 p-5 text-white">
            <div className="font-semibold mb-1">Объекты по отделам</div>
            <div className="text-xs text-slate-400 mb-4">
              Общее количество и опубликованные
            </div>
            {deptChartObjects.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">
                Нет объектов, привязанных к отделам
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={deptChartObjects}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, name) => [v, name]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? ""
                    }
                  />
                  <Bar dataKey="Объектов" radius={[4, 4, 0, 0]}>
                    {deptChartObjects.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="Опубликовано"
                    radius={[4, 4, 0, 0]}
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Лиды по отделам */}
          <Card className="bg-white/5 border-white/10 p-5 text-white">
            <div className="font-semibold mb-1">Лиды по отделам</div>
            <div className="text-xs text-slate-400 mb-4">
              Всего лидов и закрытых сделок
            </div>
            {deptChartLeads.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">
                Нет лидов, привязанных к отделам
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={deptChartLeads}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, name) => [v, name]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? ""
                    }
                  />
                  <Bar dataKey="Лидов" radius={[4, 4, 0, 0]}>
                    {deptChartLeads.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="Сделок"
                    radius={[4, 4, 0, 0]}
                    fill="#ec4899"
                    fillOpacity={0.7}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}

      {/* Топ сотрудников */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Топ по объектам */}
        <Card className="bg-white/5 border-white/10 p-5 text-white">
          <div className="font-semibold mb-1">Топ по объектам</div>
          <div className="text-xs text-slate-400 mb-4">Сотрудники с наибольшим числом объектов</div>
          {top_by_objects.filter((e) => e.objects_count! > 0).length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">
              Нет объектов, привязанных к агентству
            </div>
          ) : (
            <div className="space-y-2">
              {top_by_objects
                .filter((e) => (e.objects_count ?? 0) > 0)
                .map((e, i) => (
                  <div key={e.user_id} className="flex items-center gap-3">
                    <div className="text-xs text-slate-500 w-4 text-right shrink-0">
                      {i + 1}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                      <AvatarFallback className="bg-violet-500/30 text-violet-200 text-xs">
                        {e.full_name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.full_name}</div>
                      <div className="text-[11px] text-slate-400">{e.role_title}</div>
                    </div>
                    <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/30">
                      {e.objects_count} объ.
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Топ по лидам */}
        <Card className="bg-white/5 border-white/10 p-5 text-white">
          <div className="font-semibold mb-1">Топ по лидам</div>
          <div className="text-xs text-slate-400 mb-4">Сотрудники с наибольшим числом лидов</div>
          {top_by_leads.filter((e) => e.leads_count! > 0).length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">
              Нет лидов, привязанных к агентству
            </div>
          ) : (
            <div className="space-y-2">
              {top_by_leads
                .filter((e) => (e.leads_count ?? 0) > 0)
                .map((e, i) => (
                  <div key={e.user_id} className="flex items-center gap-3">
                    <div className="text-xs text-slate-500 w-4 text-right shrink-0">
                      {i + 1}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-blue-500/30 text-blue-200 text-xs">
                        {e.full_name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.full_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {ROLE_TITLES[e.role_code]}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                        {e.leads_count} лид.
                      </Badge>
                      {(e.deals_count ?? 0) > 0 && (
                        <Badge className="bg-pink-500/20 text-pink-200 border-pink-500/30">
                          {e.deals_count} сд.
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Подсказка о привязке */}
      {summary.total_objects === 0 && summary.total_leads === 0 && (
        <Card className="bg-violet-500/10 border-violet-500/20 p-5 text-white">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={18} className="text-violet-300 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-300 leading-relaxed">
              Данные аналитики появятся, когда сотрудники начнут добавлять объекты
              и лиды через личный кабинет с привязкой к агентству. Для этого при
              создании объекта или лида нужно указывать агентство и отдел.
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
