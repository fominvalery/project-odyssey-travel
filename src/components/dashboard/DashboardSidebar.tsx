import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { useMyOrgs } from "@/hooks/useMyOrgs"
import AddStatusModal from "@/components/agency/AddStatusModal"

type Section = "dashboard" | "objects" | "crm" | "analytics" | "referral" | "profile" | "support"

const PLAN_LABELS: Record<string, string> = {
  basic: "Базовый",
  pro: "ПРО",
  proplus: "Про+",
  constructor: "Конструктор",
}

// Пункты меню для basic
const basicNavItems = [
  { id: "objects",   label: "Объекты",   icon: "Building2" },
  { id: "referral",  label: "Рефералы",  icon: "Gift" },
  { id: "profile",   label: "Профиль",   icon: "User" },
] as const

// Полное меню для broker/agency
const fullNavItems = [
  { id: "dashboard",  label: "Дашборд",   icon: "LayoutDashboard" },
  { id: "objects",    label: "Объекты",   icon: "Building2" },
  { id: "crm",        label: "CRM",       icon: "Users" },
  { id: "analytics",  label: "Аналитика", icon: "BarChart2" },
  { id: "referral",   label: "Рефералы",  icon: "Gift" },
  { id: "profile",    label: "Профиль",   icon: "User" },
] as const

interface Props {
  section: Section
  setSection: (s: Section) => void
  user: { name: string; email: string; plan: string; avatar: string | null; status?: string }
  initials: string
  onLogout: () => void
}

export default function DashboardSidebar({ section, setSection, user, initials, onLogout }: Props) {
  const navigate = useNavigate()
  const { orgs, reload: reloadOrgs } = useMyOrgs()
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  const isBasic = !user.status || user.status === "basic"
  const navItems = isBasic ? basicNavItems : fullNavItems

  return (
    <>
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

          <div className="my-1 border-t border-[#1f1f1f]" />

          <button
            onClick={() => navigate("/marketplace")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            <Icon name="Store" className="h-4 w-4 shrink-0" />
            Маркетплейс
          </button>

          <button
            onClick={() => setSection("support")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              section === "support"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <Icon name="Headphones" className="h-4 w-4 shrink-0" />
            Поддержка
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-[#1f1f1f]">
          {/* Мои агентства — только для agency */}
          {!isBasic && orgs.length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-1">
                Мои агентства
              </div>
              {orgs.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/agency/${o.id}`)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a] text-left group"
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Icon name="Building2" className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate text-white">{o.name}</div>
                    <div className="text-[10px] text-violet-300 truncate">{o.role_title}</div>
                  </div>
                  <Icon name="ChevronRight" className="h-3.5 w-3.5 text-gray-500 group-hover:text-white shrink-0" />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setStatusModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-500/15 to-pink-500/15 border border-violet-500/30 text-violet-200 hover:from-violet-500/25 hover:to-pink-500/25 transition-colors"
          >
            <Icon name="Plus" className="h-3.5 w-3.5" />
            Добавить статус
          </button>

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
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <Icon name="LogOut" className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Мобильное меню */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d] border-t border-[#1f1f1f] flex justify-around px-2 py-2">
        {isBasic ? (
          // Базовый: Объекты, Рефералы, Профиль, Маркетплейс, Поддержка
          <>
            {(["objects", "referral", "profile"] as const).map((id) => {
              const icons: Record<string, string> = { objects: "Building2", referral: "Gift", profile: "User" }
              const labels: Record<string, string> = { objects: "Объекты", referral: "Рефералы", profile: "Профиль" }
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    section === id ? "text-blue-400" : "text-gray-500"
                  }`}
                >
                  <Icon name={icons[id]} className="h-5 w-5" />
                  {labels[id]}
                </button>
              )
            })}
            <button
              onClick={() => navigate("/marketplace")}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-gray-500"
            >
              <Icon name="Store" className="h-5 w-5" />
              Маркетплейс
            </button>
            <button
              onClick={() => setSection("support")}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                section === "support" ? "text-blue-400" : "text-gray-500"
              }`}
            >
              <Icon name="Headphones" className="h-5 w-5" />
              Поддержка
            </button>
          </>
        ) : (
          // Полное меню
          (["dashboard", "objects", "analytics", "crm", "support"] as const).map((id) => {
            const icons: Record<string, string> = {
              dashboard: "LayoutDashboard",
              objects: "Building2",
              analytics: "BarChart2",
              crm: "Users",
              support: "Headphones",
            }
            const labels: Record<string, string> = {
              dashboard: "Главная",
              objects: "Объекты",
              analytics: "Аналитика",
              crm: "CRM",
              support: "Поддержка",
            }
            return (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                  section === id ? "text-blue-400" : "text-gray-500"
                }`}
              >
                <Icon name={icons[id]} className="h-5 w-5" />
                {labels[id]}
              </button>
            )
          })
        )}
      </div>

      <AddStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onCreated={reloadOrgs}
      />
    </>
  )
}