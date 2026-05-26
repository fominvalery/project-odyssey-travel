import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import { STATUS_LABELS } from "@/hooks/useAuth"
import AggOffersAdmin from "@/components/admin/AggOffersAdmin"
import AggFixationsAdmin from "@/components/admin/AggFixationsAdmin"
import AdminDashboard from "@/components/admin/AdminDashboard"
import AdminTeam from "@/components/admin/AdminTeam"
import AdminOfficeTeam from "@/components/admin/AdminOfficeTeam"
import AdminOfficeCard from "@/components/admin/AdminOfficeCard"
import AdminOfficeDeals from "@/components/admin/AdminOfficeDeals"
import AdminContent from "@/components/admin/AdminContent"
import AdminMarketing from "@/components/admin/AdminMarketing"

const ADMIN_URL = "https://functions.poehali.dev/0628c75d-0129-48e8-9794-82bd87b83906"

const STATUS_COLORS: Record<string, string> = {
  basic:  "text-gray-400 bg-gray-500/10",
  broker: "text-blue-400 bg-blue-500/10",
  agency: "text-amber-400 bg-amber-500/10",
}

type Section = "home" | "users" | "team" | "office_team" | "office_depts" | "office_invites" | "office_card" | "office_deals" | "offers" | "fixations" | "content" | "marketing"

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  company: string
  plan: string
  status: string
  avatar: string
  created_at: string
  role?: string
  verified?: string
}

const NAV_GROUPS = [
  {
    label: "Главное",
    items: [
      { id: "home",          icon: "LayoutDashboard", label: "Дашборд",        color: "text-red-400" },
    ],
  },
  {
    label: "Онлайн Офис",
    items: [
      { id: "office_card",    icon: "CreditCard",      label: "Карточка",       color: "text-orange-400" },
      { id: "office_team",    icon: "UsersRound",      label: "Команда",        color: "text-violet-400" },
      { id: "office_depts",   icon: "Network",         label: "Отделы",         color: "text-blue-400" },
      { id: "office_invites", icon: "Mail",            label: "Приглашения",    color: "text-emerald-400" },
      { id: "office_deals",   icon: "Handshake",       label: "Сделки",         color: "text-amber-400" },
    ],
  },
  {
    label: "База объектов",
    items: [
      { id: "offers",         icon: "FolderOpen",      label: "Проекты / База", color: "text-emerald-400" },
      { id: "fixations",      icon: "BookmarkCheck",   label: "CRM Фиксации",   color: "text-violet-400" },
    ],
  },
  {
    label: "Платформа",
    items: [
      { id: "content",        icon: "FileText",        label: "Контент",        color: "text-amber-400" },
      { id: "marketing",      icon: "Megaphone",       label: "Маркетинг",      color: "text-pink-400" },
    ],
  },
  {
    label: "Пользователи",
    items: [
      { id: "users",          icon: "Users",           label: "Все аккаунты",   color: "text-blue-400" },
      { id: "team",           icon: "Shield",          label: "Роли / Верификация", color: "text-cyan-400" },
    ],
  },
]

export default function AdminPanel() {
  const { user, register, logout } = useAuthContext()
  const navigate = useNavigate()

  const [section, setSection] = useState<Section>("home")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.isSuperadmin) {
      navigate("/dashboard")
      return
    }
    refreshUsers()
  }, [user])

  async function refreshUsers() {
    setLoading(true)
    try {
      const res = await fetch(ADMIN_URL, { headers: { "X-Admin-Token": "k24admin" } })
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Удалить пользователя?")) return
    setDeleting(userId)
    await fetch(`${ADMIN_URL}/users/${userId}`, {
      method: "DELETE",
      headers: { "X-Admin-Token": "k24admin" },
    })
    await refreshUsers()
    setDeleting(null)
    if (activeUser?.id === userId) setActiveUser(null)
  }

  function loginAs(u: AdminUser) {
    logout()
    register({
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.company,
      plan: u.plan,
    })
    navigate("/dashboard")
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company || "").toLowerCase().includes(search.toLowerCase())
  )

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 text-red-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Сайдбар */}
      <aside className="w-60 border-r border-[#1f1f1f] bg-[#0d0d0d] flex flex-col py-5 px-3 shrink-0 overflow-y-auto">
        {/* Логотип */}
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <Icon name="ShieldCheck" className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">Кабинет-24</div>
            <div className="text-xs text-gray-600 mt-0.5">Внутренний офис</div>
          </div>
        </div>

        {/* Навигация */}
        <nav className="flex-1 space-y-5">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-1.5">
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id as Section)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full ${
                      section === item.id
                        ? "bg-white/5 text-white"
                        : "text-gray-500 hover:text-white hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <Icon
                      name={item.icon as "Users"}
                      className={`h-4 w-4 ${section === item.id ? item.color : ""}`}
                    />
                    {item.id === "users" ? `${item.label} (${users.length})` : item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Нижняя часть */}
        <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex flex-col gap-0.5">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <Icon name="LayoutDashboard" className="h-4 w-4" />
            Мой кабинет (ЛК)
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <Icon name="Home" className="h-4 w-4" />
            На главную
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Icon name="LogOut" className="h-4 w-4" />
            Выйти из офиса
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 flex overflow-hidden">

        {/* Дашборд */}
        {section === "home" && (
          <AdminDashboard users={users} onSection={(s) => setSection(s as Section)} />
        )}

        {/* Роли / Верификация */}
        {section === "team" && (
          <AdminTeam users={users} token="k24admin" onRefresh={refreshUsers} />
        )}

        {/* Онлайн Офис — Команда */}
        {section === "office_team" && (
          <AdminOfficeTeam tab="members" token="k24admin" allUsers={users.map(u => ({ id: u.id, name: u.name, email: u.email }))} />
        )}

        {/* Онлайн Офис — Отделы */}
        {section === "office_depts" && (
          <AdminOfficeTeam tab="departments" token="k24admin" allUsers={users.map(u => ({ id: u.id, name: u.name, email: u.email }))} />
        )}

        {/* Онлайн Офис — Приглашения */}
        {section === "office_invites" && (
          <AdminOfficeTeam tab="invites" token="k24admin" allUsers={users.map(u => ({ id: u.id, name: u.name, email: u.email }))} />
        )}

        {/* Онлайн Офис — Карточка */}
        {section === "office_card" && <AdminOfficeCard />}

        {/* Онлайн Офис — Сделки */}
        {section === "office_deals" && <AdminOfficeDeals />}

        {/* База объектов */}
        {section === "offers" && <AggOffersAdmin token="k24admin" />}

        {/* Фиксации */}
        {section === "fixations" && <AggFixationsAdmin token="k24admin" />}

        {/* Контент */}
        {section === "content" && <AdminContent />}

        {/* Маркетинг */}
        {section === "marketing" && <AdminMarketing totalUsers={users.length} />}

        {/* Пользователи */}
        {section === "users" && (
          <div className={`flex flex-col ${activeUser ? "w-80 border-r border-[#1f1f1f]" : "flex-1"} overflow-hidden`}>
            <div className="p-5 border-b border-[#1f1f1f]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">Пользователи</h2>
                <button onClick={refreshUsers} className="text-gray-500 hover:text-white transition-colors">
                  <Icon name="RefreshCw" className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Поиск по имени, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-600 text-sm">Пользователи не найдены</div>
              ) : (
                filtered.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setActiveUser(u)}
                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#111] transition-colors border-b border-[#141414] ${
                      activeUser?.id === u.id ? "bg-[#111] border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-[#1a1a1a] text-gray-300 text-xs font-bold">
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[u.status] || "text-gray-400 bg-gray-500/10"}`}>
                      {STATUS_LABELS[u.status as keyof typeof STATUS_LABELS] || u.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Детали пользователя */}
        {section === "users" && activeUser && (
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
                    <h2 className="text-xl font-bold">{activeUser.name}</h2>
                    <p className="text-sm text-gray-400">{activeUser.email}</p>
                    <span className={`mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full ${STATUS_COLORS[activeUser.status] || "text-gray-400 bg-gray-500/10"}`}>
                      {STATUS_LABELS[activeUser.status as keyof typeof STATUS_LABELS] || activeUser.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setActiveUser(null)} className="text-gray-600 hover:text-white">
                  <Icon name="X" className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5 space-y-3 mb-4">
                {[
                  { label: "Телефон",    value: activeUser.phone || "—",   icon: "Phone" },
                  { label: "Компания",   value: activeUser.company || "—", icon: "Building2" },
                  { label: "Статус",     value: activeUser.status || "—",  icon: "User" },
                  { label: "ID",         value: activeUser.id,             icon: "Hash" },
                  { label: "Регистрация",value: activeUser.created_at ? new Date(activeUser.created_at).toLocaleDateString("ru-RU") : "—", icon: "Calendar" },
                ].map((field) => (
                  <div key={field.label} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                    <Icon name={field.icon as "Phone"} className="h-4 w-4 text-gray-600 shrink-0" />
                    <span className="text-xs text-gray-500 w-36 shrink-0">{field.label}</span>
                    <span className="text-sm text-white truncate">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => loginAs(activeUser)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <Icon name="LogIn" className="h-4 w-4 mr-2" />
                  Войти в кабинет этого пользователя
                </Button>
                <Button
                  onClick={() => setSection("team")}
                  variant="outline"
                  className="w-full border-[#2a2a2a] text-gray-400 hover:text-white bg-transparent rounded-xl"
                >
                  <Icon name="Shield" className="h-4 w-4 mr-2" />
                  Управление ролью и верификацией
                </Button>
                <Button
                  onClick={() => handleDelete(activeUser.id)}
                  disabled={deleting === activeUser.id}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl bg-transparent"
                >
                  {deleting === activeUser.id
                    ? <span className="flex items-center gap-2"><Icon name="Loader2" className="h-4 w-4 animate-spin" />Удаление...</span>
                    : <span className="flex items-center gap-2"><Icon name="Trash2" className="h-4 w-4" />Удалить пользователя</span>
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}