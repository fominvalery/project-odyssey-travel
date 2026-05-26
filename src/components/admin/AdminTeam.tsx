import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Icon from "@/components/ui/icon"

const ROLES = [
  { id: "superadmin", label: "Супер-Админ",  color: "text-red-400 bg-red-500/10",     icon: "ShieldCheck" },
  { id: "admin",      label: "Администратор", color: "text-orange-400 bg-orange-500/10", icon: "Shield" },
  { id: "moderator",  label: "Модератор",     color: "text-yellow-400 bg-yellow-500/10", icon: "ShieldHalf" },
  { id: "realtor",    label: "Риэлтор",       color: "text-blue-400 bg-blue-500/10",   icon: "UserCheck" },
  { id: "client",     label: "Клиент",        color: "text-gray-400 bg-gray-500/10",   icon: "User" },
]

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  basic:  { label: "Базовый",    color: "text-gray-400 bg-gray-500/10" },
  broker: { label: "Брокер",     color: "text-blue-400 bg-blue-500/10" },
  agency: { label: "Агентство",  color: "text-amber-400 bg-amber-500/10" },
}

const VERIFIED_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  verified:   { icon: "BadgeCheck", color: "text-emerald-400", label: "Верифицирован" },
  pending:    { icon: "Clock",      color: "text-yellow-400",  label: "На проверке" },
  rejected:   { icon: "XCircle",    color: "text-red-400",     label: "Отклонён" },
  none:       { icon: "CircleDashed",color: "text-gray-600",   label: "Не подавал" },
}

interface TeamUser {
  id: string
  name: string
  email: string
  phone: string
  company: string
  plan: string
  status: string
  created_at: string
  role?: string
  verified?: string
  activity_score?: number
  last_active?: string
}

export default function AdminTeam({
  users,
  token,
  onRefresh,
}: {
  users: TeamUser[]
  token: string
  onRefresh: () => void
}) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [activeUser, setActiveUser] = useState<TeamUser | null>(null)
  const [roleDialog, setRoleDialog] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState("")

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company || "").toLowerCase().includes(search.toLowerCase())
    const matchPlan = !planFilter || u.plan === planFilter || u.status === planFilter
    return matchSearch && matchPlan
  })

  const stats = {
    total: users.length,
    verified: users.filter(u => u.verified === "verified").length,
    pending: users.filter(u => u.verified === "pending").length,
    brokers: users.filter(u => u.status === "broker").length,
    agencies: users.filter(u => u.status === "agency").length,
  }

  const openUser = (u: TeamUser) => {
    setActiveUser(u)
    setNewRole(u.role || "client")
    setVerifyStatus(u.verified || "none")
  }

  const saveRole = async () => {
    if (!activeUser) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setRoleDialog(false)
    onRefresh()
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Список */}
      <div className={`flex flex-col ${activeUser ? "w-80 border-r border-[#1f1f1f]" : "flex-1"} overflow-hidden`}>
        {/* Статистика */}
        <div className="px-5 pt-5 pb-3 border-b border-[#1f1f1f]">
          <h2 className="font-bold text-lg text-white mb-3">Команда и пользователи</h2>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[
              { label: "Всего",     value: stats.total,    color: "text-white" },
              { label: "Верифиц.",  value: stats.verified, color: "text-emerald-400" },
              { label: "Ожидают",   value: stats.pending,  color: "text-yellow-400" },
              { label: "Брокеров",  value: stats.brokers,  color: "text-blue-400" },
              { label: "Агентств",  value: stats.agencies, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-2.5 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600"
              />
            </div>
            <Select value={planFilter || "all"} onValueChange={v => setPlanFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-36 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
                <SelectValue placeholder="Тариф" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#2a2a2a]">
                <SelectItem value="all">Все тарифы</SelectItem>
                <SelectItem value="basic">Базовый</SelectItem>
                <SelectItem value="broker">Брокер</SelectItem>
                <SelectItem value="agency">Агентство</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onRefresh} variant="ghost" size="icon" className="text-gray-500 hover:text-white">
              <Icon name="RefreshCw" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-sm">Пользователи не найдены</div>
          ) : (
            filtered.map(u => {
              const plan = PLAN_LABELS[u.status] || PLAN_LABELS[u.plan] || PLAN_LABELS.basic
              const verif = VERIFIED_ICONS[u.verified || "none"]
              return (
                <div
                  key={u.id}
                  onClick={() => openUser(u)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#111] transition-colors border-b border-[#141414] ${
                    activeUser?.id === u.id ? "bg-[#111] border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-[#1a1a1a] text-gray-300 text-xs font-bold">
                      {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <Icon name={verif.icon as "BadgeCheck"} className={`h-3.5 w-3.5 shrink-0 ${verif.color}`} />
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${plan.color}`}>
                    {plan.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Детали */}
      {activeUser && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-[#1a1a1a] text-white text-lg font-bold">
                    {activeUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeUser.name}</h2>
                  <p className="text-sm text-gray-400">{activeUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${(PLAN_LABELS[activeUser.status] || PLAN_LABELS.basic).color}`}>
                      {(PLAN_LABELS[activeUser.status] || PLAN_LABELS.basic).label}
                    </span>
                    {(() => {
                      const v = VERIFIED_ICONS[activeUser.verified || "none"]
                      return (
                        <span className={`text-xs flex items-center gap-1 ${v.color}`}>
                          <Icon name={v.icon as "BadgeCheck"} className="h-3 w-3" />
                          {v.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveUser(null)} className="text-gray-600 hover:text-white">
                <Icon name="X" className="h-5 w-5" />
              </button>
            </div>

            {/* Инфо */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 space-y-3 mb-4">
              {[
                { label: "Телефон",   value: activeUser.phone || "—",   icon: "Phone" },
                { label: "Компания",  value: activeUser.company || "—", icon: "Building2" },
                { label: "ID",        value: activeUser.id.slice(0, 12) + "...", icon: "Hash" },
                { label: "Регистрация", value: activeUser.created_at ? new Date(activeUser.created_at).toLocaleDateString("ru-RU") : "—", icon: "Calendar" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                  <Icon name={f.icon as "Phone"} className="h-4 w-4 text-gray-600 shrink-0" />
                  <span className="text-xs text-gray-500 w-28 shrink-0">{f.label}</span>
                  <span className="text-sm text-white">{f.value}</span>
                </div>
              ))}
            </div>

            {/* Управление ролью */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icon name="Shield" className="h-4 w-4 text-gray-500" />
                Роль в системе
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setNewRole(r.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      newRole === r.id
                        ? r.color + " border-current"
                        : "text-gray-500 border-[#2a2a2a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <Icon name={r.icon as "Shield"} className="h-3.5 w-3.5" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Верификация */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icon name="BadgeCheck" className="h-4 w-4 text-gray-500" />
                Верификация профиля
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(VERIFIED_ICONS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setVerifyStatus(k)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      verifyStatus === k
                        ? v.color + " bg-white/5 border-current"
                        : "text-gray-500 border-[#2a2a2a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <Icon name={v.icon as "BadgeCheck"} className="h-3.5 w-3.5" />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Активность */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Icon name="Activity" className="h-4 w-4 text-gray-500" />
                Активность
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Фиксаций",  value: "0", color: "text-violet-400" },
                  { label: "Сделок",    value: "0", color: "text-emerald-400" },
                  { label: "Дней в сервисе", value: activeUser.created_at ? Math.floor((Date.now() - new Date(activeUser.created_at).getTime()) / 86400000) : 0, color: "text-blue-400" },
                ].map(a => (
                  <div key={a.label} className="bg-[#0d0d0d] rounded-xl p-3">
                    <div className={`text-xl font-bold ${a.color}`}>{a.value}</div>
                    <div className="text-xs text-gray-600">{a.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={saveRole}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
