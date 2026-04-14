import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"

type Section = "dashboard" | "objects" | "crm" | "profile"

const PLAN_LABELS: Record<string, string> = {
  green: "FREE",
  pro: "ПРО",
  proplus: "Про+",
  constructor: "Конструктор",
}

const MOCK_OBJECTS = [
  { id: 1, title: "Торговое помещение на первой линии", city: "Москва, ЦАО", price: "18 500 000 ₽", area: "142 м²", status: "Активен", type: "Коммерческая" },
  { id: 2, title: "Офисный блок в бизнес-центре B+", city: "Москва, СЗАО", price: "42 000 000 ₽", area: "310 м²", status: "На модерации", type: "Коммерческая" },
]

const MOCK_LEADS = [
  { id: 1, name: "Алексей Петров", phone: "+7 900 123-45-67", object: "Торговое помещение", source: "AI-чат", status: "Новый", date: "10 апр" },
  { id: 2, name: "Ирина Смирнова", phone: "+7 911 987-65-43", object: "Офисный блок", source: "Лендинг", status: "Активный", date: "12 апр" },
  { id: 3, name: "Дмитрий Козлов", phone: "+7 925 555-00-11", object: "Торговое помещение", source: "Маркетплейс", status: "Закрыт", date: "14 апр" },
]

export default function Dashboard() {
  const { user, updateProfile, logout } = useAuthContext()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>("dashboard")
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", company: user?.company ?? "" })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user) {
    navigate("/")
    return null
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

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
    reader.onload = (ev) => updateProfile({ avatar: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  const navItems = [
    { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { id: "objects", label: "Объекты", icon: "Building2" },
    { id: "crm", label: "CRM", icon: "Users" },
    { id: "profile", label: "Профиль", icon: "User" },
  ] as const

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Боковое меню */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#1f1f1f] bg-[#0d0d0d] py-6 px-4 shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-8 px-2">
          <img
            src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"
            alt="Кабинет-24"
            className="h-8 w-auto object-contain"
          />
        </button>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                section === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <Icon name={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#1f1f1f]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-8 w-8">
              {user.avatar ? <AvatarImage src={user.avatar} /> : null}
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name.split(" ")[0]}</p>
              <p className="text-xs text-gray-500 truncate">{PLAN_LABELS[user.plan] ?? user.plan}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/") }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <Icon name="LogOut" className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Мобильное меню */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d] border-t border-[#1f1f1f] flex justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-xs transition-colors ${
              section === item.id ? "text-blue-400" : "text-gray-500"
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Дашборд */}
        {section === "dashboard" && (
          <div className="p-6 md:p-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-1">Добро пожаловать, {user.name.split(" ")[0]}!</h1>
            <p className="text-gray-400 text-sm mb-8">Тариф: <span className="text-blue-400 font-medium">{PLAN_LABELS[user.plan] ?? user.plan}</span></p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Объектов", value: "2", icon: "Building2", color: "text-blue-400" },
                { label: "Лидов", value: "3", icon: "Users", color: "text-emerald-400" },
                { label: "Просмотров", value: "124", icon: "Eye", color: "text-violet-400" },
                { label: "Сделок", value: "0", icon: "Handshake", color: "text-amber-400" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
                  <Icon name={stat.icon as "Building2"} className={`h-5 w-5 mb-3 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon name="Building2" className="h-4 w-4 text-blue-400" /> Последние объекты
                </h2>
                <div className="flex flex-col gap-3">
                  {MOCK_OBJECTS.map((obj) => (
                    <div key={obj.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">{obj.title}</p>
                        <p className="text-xs text-gray-500">{obj.price}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${obj.status === "Активен" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {obj.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon name="Users" className="h-4 w-4 text-emerald-400" /> Последние лиды
                </h2>
                <div className="flex flex-col gap-3">
                  {MOCK_LEADS.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.object}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        lead.status === "Новый" ? "bg-blue-500/10 text-blue-400" :
                        lead.status === "Активный" ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-gray-500/10 text-gray-400"
                      }`}>{lead.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Объекты */}
        {section === "objects" && (
          <div className="p-6 md:p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Мои объекты</h1>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
                <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить объект
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {MOCK_OBJECTS.map((obj) => (
                <div key={obj.id} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-900/40 flex items-center justify-center shrink-0">
                      <Icon name="Building2" className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{obj.title}</p>
                      <p className="text-sm text-gray-400">{obj.city} · {obj.area}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-white">{obj.price}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${obj.status === "Активен" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {obj.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-[#2a2a2a] p-10 text-center">
              <Icon name="Plus" className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Добавьте первый объект</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
                Добавить объект
              </Button>
            </div>
          </div>
        )}

        {/* CRM */}
        {section === "crm" && (
          <div className="p-6 md:p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">CRM — Лиды</h1>
              <div className="flex gap-2">
                {["Все", "Новый", "Активный", "Закрыт"].map((s) => (
                  <button key={s} className="text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {MOCK_LEADS.map((lead) => (
                <div key={lead.id} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 text-sm font-bold text-gray-400">
                      {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.phone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{lead.object} · {lead.source}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      lead.status === "Новый" ? "bg-blue-500/10 text-blue-400" :
                      lead.status === "Активный" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>{lead.status}</span>
                    <p className="text-xs text-gray-600 mt-1">{lead.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Профиль */}
        {section === "profile" && (
          <div className="p-6 md:p-8 max-w-xl">
            <h1 className="text-2xl font-bold mb-6">Профиль</h1>

            <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-6 flex items-center gap-5 mb-5">
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
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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

            <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-6">
              <h2 className="font-semibold mb-5">Личные данные</h2>
              <form onSubmit={handleSave} className="space-y-4">
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
        )}
      </main>
    </div>
  )
}
