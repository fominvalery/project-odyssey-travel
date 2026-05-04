import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import Icon from "@/components/ui/icon"

const SOURCE_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f43f5e",
  "#a3a3a3",
]

interface SourceStat {
  source: string
  total: number
  deals: number
}

interface Props {
  sources: SourceStat[]
  views: number
  leads: number
  deals: number
  title?: string
}

export default function SourcesAndFunnel({
  sources,
  views,
  leads,
  deals,
  title = "Источники и воронка",
}: Props) {
  const totalLeads = sources.reduce((s, x) => s + x.total, 0)
  const totalDeals = sources.reduce((s, x) => s + x.deals, 0)

  const dataLeads = sources.map((s, i) => ({
    name: s.source,
    value: s.total,
    fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }))
  const dataDeals = sources
    .filter((s) => s.deals > 0)
    .map((s, i) => ({
      name: s.source,
      value: s.deals,
      fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }))

  const pct = (a: number, b: number) =>
    b > 0 ? Math.round((a / b) * 1000) / 10 : 0

  const viewsToLeads = pct(leads, views)
  const leadsToDeals = pct(deals, leads)
  const overall = pct(deals, views)

  const tooltipStyle = {
    contentStyle: {
      background: "#141414",
      border: "1px solid #262626",
      borderRadius: 12,
      fontSize: 12,
      color: "#fff",
    },
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Источники лидов */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-white">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Icon name="PieChart" className="h-4 w-4 text-violet-400" />
            Откуда приходят лиды
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Распределение всех заявок по источникам
          </div>
          {totalLeads === 0 ? (
            <div className="text-center text-slate-500 py-12 text-sm">
              Нет данных по лидам
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dataLeads}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="#0a0a0a"
                >
                  {dataLeads.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: number, name: string) => [
                    `${v} (${pct(v, totalLeads)}%)`,
                    name,
                  ]}
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

        {/* Конверсия по источникам */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-white">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Icon name="Trophy" className="h-4 w-4 text-emerald-400" />
            Сделки по источникам
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Какие каналы реально продают
          </div>
          {totalDeals === 0 ? (
            <div className="text-center text-slate-500 py-12 text-sm">
              Сделок ещё не было
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dataDeals}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="#0a0a0a"
                >
                  {dataDeals.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: number, name: string) => [
                    `${v} (${pct(v, totalDeals)}%)`,
                    name,
                  ]}
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

      {/* Воронка */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-white">
        <div className="font-semibold mb-1 flex items-center gap-2">
          <Icon name="Filter" className="h-4 w-4 text-blue-400" />
          {title}: воронка
        </div>
        <div className="text-xs text-slate-400 mb-5">
          Просмотры → Лиды → Сделки
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <FunnelStep
            icon="Eye"
            label="Просмотры"
            value={views}
            color="text-violet-400"
            bg="from-violet-500/20 to-violet-500/5"
          />
          <FunnelStep
            icon="Users"
            label="Лиды"
            value={leads}
            color="text-blue-400"
            bg="from-blue-500/20 to-blue-500/5"
            badge={views > 0 ? `${viewsToLeads}% от просмотров` : undefined}
          />
          <FunnelStep
            icon="Handshake"
            label="Сделки"
            value={deals}
            color="text-emerald-400"
            bg="from-emerald-500/20 to-emerald-500/5"
            badge={leads > 0 ? `${leadsToDeals}% от лидов` : undefined}
          />
        </div>

        {views > 0 && (
          <div className="text-center text-xs text-slate-400">
            Сквозная конверсия:{" "}
            <span className="text-white font-semibold">{overall}%</span> —
            от просмотра до сделки
          </div>
        )}
      </div>
    </div>
  )
}

function FunnelStep({
  icon,
  label,
  value,
  color,
  bg,
  badge,
}: {
  icon: string
  label: string
  value: number
  color: string
  bg: string
  badge?: string
}) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${bg} border border-white/10 p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-slate-300">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value.toLocaleString("ru-RU")}</div>
      {badge && (
        <div className="text-[11px] text-slate-400 mt-1">{badge}</div>
      )}
    </div>
  )
}
