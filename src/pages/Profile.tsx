import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthContext } from "@/context/AuthContext"
import type { UserProfile } from "@/hooks/useAuth"

const STATUS_OPTIONS: { value: UserProfile["status"]; label: string; icon: string; desc: string }[] = [
  { value: "resident", label: "Резидент", icon: "Home", desc: "По умолчанию" },
  { value: "broker", label: "Брокер (Агент)", icon: "Briefcase", desc: "Профессиональный агент" },
  { value: "agency", label: "Агентство", icon: "Building2", desc: "Агентство недвижимости" },
  { value: "investor", label: "Инвестор", icon: "TrendingUp", desc: "Инвестиции в недвижимость" },
  { value: "buyer", label: "Покупатель", icon: "ShoppingBag", desc: "Ищу объект для покупки" },
  { value: "owner", label: "Собственник", icon: "Key", desc: "Владею объектами" },
]

const PLAN_LABELS: Record<string, string> = {
  green: "Грин",
  pro: "Про",
  proplus: "Про+",
  constructor: "Конструктор",
}

export default function Profile() {
  const { user, updateProfile, logout } = useAuthContext()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    company: user?.company ?? "",
  })
  const [saved, setSaved] = useState(false)

  if (!user) {
    navigate("/")
    return null
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateProfile({ avatar: ev.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  function handleLogout() {
    logout()
    navigate("/")
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Шапка */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[#1f1f1f]">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" className="h-4 w-4" />
          <span className="text-sm">На главную</span>
        </button>
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 10.5L12 3L21 10.5V21H15V15H9V21H3V10.5Z" fill="#8B5CF6" />
            <rect x="9" y="15" width="6" height="6" fill="#8B5CF6" opacity="0.6" />
          </svg>
          <span className="text-sm font-semibold">Кабинет-24</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <Icon name="LogOut" className="h-4 w-4 mr-1.5" />
          Выйти
        </Button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Аватар и имя */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileRef.current?.click()}>
              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="bg-violet-600 text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-700 border-2 border-[#141414]"
            >
              <Icon name="Camera" className="h-3.5 w-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-lg font-bold">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs text-violet-400">
              <Icon name="Star" className="h-3 w-3" />
              {PLAN_LABELS[user.plan] ?? user.plan}
            </div>
          </div>
        </div>

        {/* Статус на платформе */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Статус на платформе</h2>
          <p className="text-xs text-gray-500 mb-4">Определяет ваши возможности и отображение в системе</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = user.status === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => updateProfile({ status: opt.value })}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    active
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-[#262626] bg-[#0f0f0f] hover:border-[#3a3a3a]"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-violet-500/20" : "bg-[#1f1f1f]"}`}>
                    <Icon name={opt.icon} className={`h-4 w-4 ${active ? "text-violet-400" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${active ? "text-white" : "text-gray-400"}`}>{opt.label}</p>
                    <p className="text-xs text-gray-600">{opt.desc}</p>
                  </div>
                  {active && <Icon name="CheckCircle" className="ml-auto h-4 w-4 text-violet-400 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Личные данные */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Личные данные</h2>
          <p className="text-xs text-gray-500 mb-5">Редактируйте информацию о себе</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">ФИО</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0f0f0f] border-[#262626] text-white focus:border-violet-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Телефон</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-[#0f0f0f] border-[#262626] text-white focus:border-violet-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Компания</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="bg-[#0f0f0f] border-[#262626] text-white focus:border-violet-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Email</Label>
              <Input
                value={user.email}
                disabled
                className="bg-[#0a0a0a] border-[#1f1f1f] text-gray-600 cursor-not-allowed"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saved ? (
                <span className="flex items-center gap-2">
                  <Icon name="CheckCircle" className="h-4 w-4" /> Сохранено
                </span>
              ) : "Сохранить изменения"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}