import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"

interface Stats {
  total_users: number
  new_users_week: number
  total_offers: number
  active_offers: number
  total_fixations: number
  pending_fixations: number
  deal_fixations: number
  brokers: number
  agencies: number
}

const QUICK_ACTIONS = [
  { icon: "UserPlus",    label: "Добавить пользователя",  section: "users",      color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { icon: "FolderPlus", label: "Добавить объект",         section: "offers",     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { icon: "BookmarkPlus",label: "Журнал фиксаций",        section: "fixations",  color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { icon: "Send",       label: "Запустить рассылку",      section: "marketing",  color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { icon: "FileText",   label: "Создать статью",          section: "content",    color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { icon: "Users",      label: "Управление командой",     section: "team",       color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
]

export default function AdminDashboard({
  users,
  onSection,
}: {
  users: { status: string }[]
  onSection: (s: string) => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const brokers = users.filter(u => u.status === "broker").length
    const agencies = users.filter(u => u.status === "agency").length
    setStats({
      total_users: users.length,
      new_users_week: 0,
      total_offers: 0,
      active_offers: 0,
      total_fixations: 0,
      pending_fixations: 0,
      deal_fixations: 0,
      brokers,
      agencies,
    })
  }, [users])

  const metrics = stats ? [
    {
      label: "Пользователей",
      value: stats.total_users,
      sub: `${stats.brokers} брокеров · ${stats.agencies} агентств`,
      icon: "Users",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Объектов в базе",
      value: stats.active_offers,
      sub: `Всего: ${stats.total_offers}`,
      icon: "FolderOpen",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Активных фиксаций",
      value: stats.pending_fixations,
      sub: `Сделок: ${stats.deal_fixations}`,
      icon: "BookmarkCheck",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Конверсия",
      value: stats.total_fixations ? `${Math.round((stats.deal_fixations / stats.total_fixations) * 100)}%` : "—",
      sub: `Из ${stats.total_fixations} фиксаций`,
      icon: "TrendingUp",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ] : []

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Заголовок */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Центр управления</h2>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <Icon name={m.icon as "Users"} className={`h-5 w-5 ${m.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${m.color} mb-1`}>{m.value}</div>
            <div className="text-sm text-white font-medium mb-0.5">{m.label}</div>
            <div className="text-xs text-gray-600">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Быстрые действия */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.section}
              onClick={() => onSection(a.section)}
              className={`flex items-center gap-3 p-4 rounded-xl border ${a.color} hover:opacity-80 transition-opacity text-left`}
            >
              <Icon name={a.icon as "Send"} className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium text-white">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Разделы платформы */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Разделы платформы</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: "users",
              icon: "Users",
              title: "Пользователи",
              desc: "Управление аккаунтами, роли, верификация, история активности",
              color: "border-blue-500/20",
            },
            {
              id: "offers",
              icon: "FolderOpen",
              title: "База / Проекты",
              desc: "CRUD объектов, фильтры, фото, видео, комиссии, презентации",
              color: "border-emerald-500/20",
            },
            {
              id: "fixations",
              icon: "BookmarkCheck",
              title: "Фиксации",
              desc: "Журнал всех фиксаций, управление статусами, воронка сделок",
              color: "border-violet-500/20",
            },
            {
              id: "team",
              icon: "UsersRound",
              title: "Команда",
              desc: "Структура агентств, роли сотрудников, верификация документов",
              color: "border-cyan-500/20",
            },
            {
              id: "content",
              icon: "FileText",
              title: "Контент",
              desc: "Статьи, новости, шаблоны документов, генератор отчётов",
              color: "border-amber-500/20",
            },
            {
              id: "marketing",
              icon: "Megaphone",
              title: "Маркетинг",
              desc: "Email и Telegram рассылки, аналитика, рекламные кампании",
              color: "border-pink-500/20",
            },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => onSection(s.id)}
              className={`bg-[#111] border ${s.color} rounded-2xl p-5 text-left hover:bg-[#161616] transition-colors group`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon name={s.icon as "Users"} className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="font-semibold text-white">{s.title}</span>
                <Icon name="ArrowRight" className="h-4 w-4 text-gray-700 group-hover:text-gray-400 transition-colors ml-auto" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
