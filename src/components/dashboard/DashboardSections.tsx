import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { STATUS_LABELS } from "@/hooks/useAuth"

// --- CRM ---
export { DashboardCRM } from "./DashboardCRM"

// --- Referral ---
import func2url from "../../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

interface ReferralStats {
  referral_count: number
  referral_count_week: number
  line2_count: number
  activated_count: number
  paid_count: number
  conversion: number
  earned_line1: number
  earned_line2: number
  earned_total: number
  line1_payments: number
  line2_payments: number
  level: {
    name: string
    level: number
    color: string
    commission1: number
    commission2: number
    withdrawal: boolean
  }
  referred_users: { id: string; name: string; email: string; status: string; joined_at: string | null }[]
  ref_code: string
}

const LEVEL_BORDER: Record<string, string> = {
  gray:    "border-gray-500/30 from-gray-900/60",
  blue:    "border-blue-500/30 from-blue-950/60",
  emerald: "border-emerald-500/30 from-emerald-950/60",
  violet:  "border-violet-500/30 from-violet-950/60",
  amber:   "border-amber-500/30 from-amber-950/60",
  rose:    "border-rose-500/30 from-rose-950/60",
}
const LEVEL_ICON_COLOR: Record<string, string> = {
  gray: "text-gray-400 bg-gray-500/20", blue: "text-blue-400 bg-blue-500/20",
  emerald: "text-emerald-400 bg-emerald-500/20", violet: "text-violet-400 bg-violet-500/20",
  amber: "text-amber-400 bg-amber-500/20", rose: "text-rose-400 bg-rose-500/20",
}

const ALL_LEVELS = [
  { name: "Друг",      refs: "1–2 реф.",   percent: "5%",  extra: "",       withdrawal: false },
  { name: "Партнёр",   refs: "3–9 реф.",   percent: "7%",  extra: "",       withdrawal: false },
  { name: "Бизнес",    refs: "10–29 реф.", percent: "7%",  extra: "",       withdrawal: true  },
  { name: "Амбасадор", refs: "30–99 реф.", percent: "10%", extra: "",       withdrawal: true  },
  { name: "Адвокат",   refs: "100+ реф.",  percent: "10%", extra: "+2% L2", withdrawal: true  },
]

interface ReferralProps {
  userId: string
}

export function DashboardReferral({ userId }: ReferralProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`${AUTH_URL}?action=referral-stats&user_id=${encodeURIComponent(userId)}`)
      .then(r => r.text())
      .then(raw => {
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        if (data && !data.error) setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const refLink = `${window.location.origin}/?ref=${stats?.ref_code ?? userId?.slice(0, 8) ?? "xxxxxxxx"}`

  const copyLink = () => {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const level = stats?.level
  const color = level?.color || "blue"
  const borderClass = LEVEL_BORDER[color] || LEVEL_BORDER.blue
  const iconClass = LEVEL_ICON_COLOR[color] || LEVEL_ICON_COLOR.blue

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Партнёрская программа</h1>
      <p className="text-gray-400 text-sm mb-6">Приглашайте друзей и получайте бонусы за каждую регистрацию и активацию.</p>

      {/* Текущий уровень */}
      <div className={`rounded-2xl border ${borderClass} bg-gradient-to-r to-[#0d0d0d] p-5 mb-6 flex items-start gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon name="Award" className="h-6 w-6" />
        </div>
        <div className="flex-1">
          {loading ? (
            <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-2" />
          ) : (
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="font-bold text-white text-lg">{level?.name || "—"}</span>
              {level?.level ? (
                <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-medium">
                  Уровень {level.level}
                </span>
              ) : null}
            </div>
          )}
          <p className="text-sm text-gray-300">
            Комиссия: {level?.commission1 || 5}% от платежей рефералов
            {(level?.commission2 ?? 0) > 0 && ` + ${level!.commission2}% (2-я линия)`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Вывод:{" "}
            {level?.withdrawal
              ? <span className="text-emerald-400">Доступен</span>
              : <span className="text-red-400">Недоступен</span>}
          </p>
        </div>
      </div>

      {/* Уровни */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ALL_LEVELS.map((lvl) => {
          const isActive = level?.name === lvl.name
          return (
            <div key={lvl.name} className={`rounded-xl p-4 text-center border transition-all ${isActive ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f] bg-[#111]"}`}>
              <p className={`text-xs font-semibold mb-1 ${isActive ? "text-blue-400" : "text-gray-400"}`}>{lvl.name}</p>
              <p className="text-xs text-gray-500 mb-2">{lvl.refs}</p>
              <p className={`text-xl font-bold ${isActive ? "text-white" : "text-gray-300"}`}>{lvl.percent}</p>
              {lvl.extra && <p className="text-xs text-violet-400">{lvl.extra}</p>}
              {lvl.withdrawal && <p className="text-xs text-emerald-400 mt-1">Вывод ✓</p>}
            </div>
          )
        })}
      </div>

      {/* Реферальная ссылка */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Ваша реферальная ссылка</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-sm text-gray-300 font-mono truncate">
            {refLink}
          </div>
          <button
            onClick={copyLink}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${copied ? "bg-emerald-600 border-emerald-500" : "bg-[#1a1a1a] border-[#2a2a2a] hover:bg-blue-600"}`}
          >
            <Icon name={copied ? "Check" : "Copy"} className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Статистика — 6 карточек */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {[
          { icon: "MousePointerClick", label: "Переходов",    value: "0",                                              note: "" },
          { icon: "Eye",               label: "За 7 дней",    value: loading ? "…" : String(stats?.referral_count_week ?? 0), note: "" },
          { icon: "UserPlus",          label: "Регистраций",  value: loading ? "…" : String(stats?.referral_count ?? 0),      note: "" },
          { icon: "UserCheck",         label: "Активировано", value: loading ? "…" : String(stats?.activated_count ?? 0),     note: "" },
          { icon: "ShoppingCart",      label: "Оплатили",     value: loading ? "…" : String(stats?.paid_count ?? 0),          note: "" },
          { icon: "TrendingUp",        label: "Конверсия",    value: loading ? "…" : `${stats?.conversion ?? 0}%`,            note: "" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-3 md:p-4 flex flex-col items-center justify-center text-center gap-1">
            <Icon name={s.icon as "Eye"} className="h-5 w-5 text-orange-400 mb-1" />
            <p className="text-xl md:text-2xl font-bold leading-none">{s.value}</p>
            <p className="text-[10px] md:text-xs text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Список рефералов */}
      {!loading && (stats?.referred_users?.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Icon name="Users" className="h-4 w-4 text-blue-400" />
            Мои рефералы ({stats!.referral_count})
          </h2>
          <div className="flex flex-col divide-y divide-[#1f1f1f]">
            {stats!.referred_users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                  {u.name && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    u.status === "broker" ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                    : u.status === "agency" ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {u.status === "broker" ? "Клуб" : u.status === "agency" ? "Агентство" : "Базовый"}
                  </span>
                  {u.joined_at && (
                    <span className="text-xs text-gray-600">
                      {new Date(u.joined_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Баланс и начисления */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Итого заработано */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-950/60 to-[#0d0d0d] border border-blue-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="DollarSign" className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Всего заработано</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {loading ? "…" : `${(stats?.earned_total ?? 0).toLocaleString("ru-RU")} ₽`}
          </p>
          <p className="text-xs text-gray-500">
            {level?.withdrawal
              ? <span className="text-emerald-400">Вывод доступен с уровня {level.name}</span>
              : <span className="text-red-400">Вывод доступен с уровня Бизнес</span>}
          </p>
        </div>

        {/* Линии */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="Layers" className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Линия 1 ({level?.commission1 ?? 5}%)</span>
            </div>
            <p className="text-xl font-bold">
              {loading ? "…" : `${(stats?.earned_line1 ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              с оборота {loading ? "…" : `${(stats?.line1_payments ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
          </div>
          <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="Layers" className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-gray-400">Линия 2 ({level?.commission2 ?? 0}%)</span>
            </div>
            <p className="text-xl font-bold">
              {loading ? "…" : `${(stats?.earned_line2 ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              с оборота {loading ? "…" : `${(stats?.line2_payments ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
          </div>
        </div>
      </div>

      {/* Как это работает */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Lightbulb" className="h-4 w-4 text-blue-400" /> Как это работает
        </h2>
        <div className="flex flex-col gap-3">
          {[
            "Поделитесь своей реферальной ссылкой с друзьями.",
            "Друг регистрируется по вашей ссылке — связь записывается автоматически.",
            "Друг создаёт свой первый объект — вам начисляется 20 бонусов.",
            "Получайте от 5% до 10% от платежей рефералов (в зависимости от уровня).",
            "На уровне «Адвокат» — дополнительно 2% от платежей рефералов ваших рефералов (2-я линия).",
            "Выводите деньги (с уровня Бизнес) или конвертируйте в AI-кредиты.",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
              <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Profile ---

type UserStatus = "basic" | "broker" | "agency"

const STATUS_OPTIONS: { value: UserStatus; label: string; icon: string; desc: string }[] = [
  { value: "basic",    label: "Базовый",              icon: "User",      desc: "По умолчанию" },
  { value: "broker",   label: "Клуб",                 icon: "Zap",       desc: "Участник клуба" },
  { value: "agency",   label: "Агентство / Компания", icon: "Building2", desc: "Крупный игрок" },
]

interface ProfileProps {
  user: { name: string; email: string; plan: string; avatar: string | null; status: UserStatus }
  initials: string
  form: { name: string; phone: string; company: string }
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; company: string }>>
  saved: boolean
  onSave: (e: React.FormEvent) => void
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStatusChange: (status: UserStatus) => void
}

export function DashboardProfile({ user, initials, form, setForm, saved, onSave, onAvatarChange, onStatusChange }: ProfileProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      {/* Аватар + имя */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 flex items-center gap-5 mb-5">
        <div className="relative">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={() => fileRef.current?.click()}>
            {user.avatar ? <AvatarImage src={user.avatar} /> : null}
            <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center border-2 border-[#111]"
          >
            <Icon name="Camera" className="h-3 w-3 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </div>
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Icon name="Star" className="h-3 w-3" />
            {STATUS_LABELS[user.status as keyof typeof STATUS_LABELS] ?? user.status}
          </span>
        </div>
      </div>

      {/* Личные данные */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-6 max-w-xl">
        <h2 className="font-semibold mb-5">Личные данные</h2>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">ФИО</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Телефон</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Компания</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Email</Label>
            <Input value={user.email} disabled className="bg-[#0a0a0a] border-[#1f1f1f] text-gray-600 cursor-not-allowed" />
          </div>
          <Button type="submit" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            {saved ? <span className="flex items-center gap-2"><Icon name="CheckCircle" className="h-4 w-4" />Сохранено</span> : "Сохранить"}
          </Button>
        </form>
      </div>
    </div>
  )
}