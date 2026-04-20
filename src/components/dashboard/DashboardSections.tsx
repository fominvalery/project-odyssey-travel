import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"

const PLAN_LABELS: Record<string, string> = {
  basic: "Базовый",
  pro: "Клуб",
  proplus: "Про+",
  business: "Бизнес",
  constructor: "Конструктор",
}

// --- CRM ---
export { DashboardCRM } from "./DashboardCRM"

// --- Referral ---

interface ReferralProps {
  userId: string
}

export function DashboardReferral({ userId }: ReferralProps) {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Партнёрская программа</h1>
      <p className="text-gray-400 text-sm mb-6">Приглашайте друзей и получайте бонусы за каждую регистрацию и активацию.</p>

      {/* Текущий уровень */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/60 to-[#1a0a0a] p-5 mb-6 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
          <Icon name="Award" className="h-6 w-6 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-bold text-white text-lg">Друг</span>
            <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-medium">Уровень 1</span>
          </div>
          <p className="text-sm text-gray-300">Комиссия: 5% от платежей рефералов</p>
          <p className="text-xs text-gray-500 mt-0.5">Вывод: <span className="text-red-400">Недоступен</span></p>
        </div>
      </div>

      {/* Уровни */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { name: "Друг", refs: "1–2 реф.", percent: "5%", withdrawal: false, active: true },
          { name: "Партнёр", refs: "3–9 реф.", percent: "7%", withdrawal: false, active: false },
          { name: "Бизнес", refs: "10–29 реф.", percent: "7%", withdrawal: true, active: false },
          { name: "Амбассадор", refs: "30–99 реф.", percent: "10%", withdrawal: true, active: false },
          { name: "Адвокат", refs: "100+ реф.", percent: "10%", extra: "+2% L2", withdrawal: true, active: false },
        ].map((lvl) => (
          <div key={lvl.name} className={`rounded-xl p-4 text-center border ${lvl.active ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f] bg-[#111]"}`}>
            <p className={`text-xs font-semibold mb-1 ${lvl.active ? "text-blue-400" : "text-gray-400"}`}>{lvl.name}</p>
            <p className="text-xs text-gray-500 mb-2">{lvl.refs}</p>
            <p className={`text-xl font-bold ${lvl.active ? "text-white" : "text-gray-300"}`}>{lvl.percent}</p>
            {lvl.extra && <p className="text-xs text-violet-400">{lvl.extra}</p>}
            {lvl.withdrawal && <p className="text-xs text-emerald-400 mt-1">Вывод ✓</p>}
          </div>
        ))}
      </div>

      {/* Реферальная ссылка */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Ваша реферальная ссылка</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-sm text-gray-300 font-mono truncate">
            {`${window.location.origin}/?ref=${userId?.slice(0, 8) ?? "xxxxxxxx"}`}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?ref=${userId?.slice(0, 8) ?? "xxxxxxxx"}`)}
            className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:bg-blue-600 transition-colors shrink-0"
          >
            <Icon name="Copy" className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: "MousePointerClick", label: "Переходов", value: "0" },
          { icon: "Eye", label: "За 7 дней", value: "0" },
          { icon: "UserPlus", label: "Регистраций", value: "0" },
          { icon: "TrendingUp", label: "Конверсия", value: "0%" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4 text-center">
            <Icon name={s.icon as "Eye"} className="h-5 w-5 text-blue-400 mx-auto mb-2" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Баланс */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: "DollarSign", label: "Доступно к выводу", sub: "Всего заработано: 0 ₽", value: "0 ₽", highlight: true },
          { icon: "Gift", label: "Бонусный баланс", sub: "Только для трат внутри платформы", value: "0" },
          { icon: "Layers", label: "Линия 1 (5%)", sub: "0 начислений", value: "0 ₽" },
          { icon: "Layers", label: "Линия 2 (2%)", sub: "0 начислений", value: "0 ₽" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.highlight ? "bg-blue-950/40 border-blue-500/20" : "bg-[#111111] border-[#1f1f1f]"}`}>
            <Icon name={s.icon as "Gift"} className={`h-5 w-5 mb-2 ${s.highlight ? "text-blue-400" : "text-gray-500"}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Как это работает */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Lightbulb" className="h-4 w-4 text-blue-400" /> Как это работает
        </h2>
        <div className="flex flex-col gap-3">
          {[
            "Поделитесь своей реферальной ссылкой с друзьями.",
            "Друг регистрируется — получает 10 приветственных бонусов.",
            "Друг создаёт свой первый объект — вам начисляется 20 бонусов.",
            "Получайте от 5% до 10% от платежей рефералов (в зависимости от уровня)",
            "На уровне 5 «Адвокат бренда» — дополнительно 2% от платежей рефералов ваших рефералов (2-я линия)",
            "Выводите деньги (с уровня 3) или конвертируйте в AI-кредиты",
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
            {PLAN_LABELS[user.plan] ?? user.plan}
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