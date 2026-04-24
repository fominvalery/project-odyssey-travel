import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { useMyOrgs } from "@/hooks/useMyOrgs"
import AddStatusModal from "@/components/agency/AddStatusModal"
import { STATUS_LABELS } from "@/hooks/useAuth"

type Section = "dashboard" | "objects" | "crm" | "analytics" | "referral" | "club" | "messages" | "profile" | "support"

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
  { id: "club",       label: "Сеть",      icon: "Zap" },
  { id: "messages",   label: "Сообщения", icon: "MessageSquare" },
  { id: "referral",   label: "Рефералы",  icon: "Gift" },
  { id: "profile",    label: "Профиль",   icon: "User" },
] as const

interface Props {
  section: Section
  setSection: (s: Section) => void
  user: { name: string; email: string; plan: string; avatar: string | null; status?: string; isSuperadmin?: boolean }
  initials: string
  onLogout: () => void
  unreadMessages?: number
}

export default function DashboardSidebar({ section, setSection, user, initials, onLogout, unreadMessages = 0 }: Props) {
  const navigate = useNavigate()
  const { orgs, reload: reloadOrgs } = useMyOrgs()
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  const isBasic = !user.isSuperadmin && (!user.status || user.status === "basic")
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
          {navItems.map((item) => {
            const isClub = item.id === "club"
            const isMessages = item.id === "messages"
            const isActive = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? isClub || isMessages ? "bg-violet-600 text-white" : "bg-blue-600 text-white"
                    : isClub
                      ? "text-violet-400 hover:text-white hover:bg-violet-500/20 border border-violet-500/20"
                      : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isMessages && unreadMessages > 0 && (
                  <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </button>
            )
          })}

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
          {/* Мои агентства — показываем всем у кого есть членство */}
          {orgs.length > 0 && (
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
              <p className="text-xs text-gray-500 truncate">{STATUS_LABELS[user.status as keyof typeof STATUS_LABELS] ?? user.status}</p>
            </div>
          </div>
          {user.isSuperadmin && (
            <button
              onClick={() => navigate("/superadmin")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:text-gray-400 hover:bg-[#1a1a1a] transition-colors w-full mb-1"
            >
              <Icon name="Shield" className="h-4 w-4" />
              Супер-Админ
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <Icon name="LogOut" className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Мобильное меню — горизонтальная прокрутка */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d] border-t border-[#1f1f1f]">
        <div className="flex overflow-x-auto scrollbar-none px-2 py-2 gap-1">
          {/* Агентства */}
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/agency/${o.id}`)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0 text-gray-500 hover:text-violet-400"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <Icon name="Building2" className="h-3 w-3 text-white" />
              </div>
              <span className="whitespace-nowrap max-w-[60px] truncate">{o.name}</span>
            </button>
          ))}
          {(isBasic
            ? [
                { id: "objects",   label: "Объекты",    icon: "Building2",     action: "section" },
                { id: "referral",  label: "Рефералы",   icon: "Gift",          action: "section" },
                { id: "profile",   label: "Профиль",    icon: "User",          action: "section" },
                { id: "marketplace", label: "Маркетплейс", icon: "Store",      action: "navigate" },
                { id: "support",   label: "Поддержка",  icon: "Headphones",    action: "section" },
              ]
            : [
                { id: "dashboard", label: "Главная",    icon: "LayoutDashboard", action: "section" },
                { id: "objects",   label: "Объекты",    icon: "Building2",       action: "section" },
                { id: "crm",       label: "CRM",        icon: "Users",           action: "section" },
                { id: "analytics", label: "Аналитика",  icon: "BarChart2",       action: "section" },
                { id: "club",      label: "Сеть",       icon: "Zap",             action: "section" },
                { id: "messages",  label: "Сообщения",  icon: "MessageSquare",   action: "section" },
                { id: "referral",  label: "Рефералы",   icon: "Gift",            action: "section" },
                { id: "profile",   label: "Профиль",    icon: "User",            action: "section" },
                { id: "marketplace", label: "Маркетплейс", icon: "Store",        action: "navigate" },
                { id: "support",   label: "Поддержка",  icon: "Headphones",      action: "section" },
              ]
          ).map((item) => {
            const isActive = section === item.id
            const hasUnread = item.id === "messages" && unreadMessages > 0
            return (
              <button
                key={item.id}
                onClick={() => item.action === "navigate" ? navigate(`/${item.id}`) : setSection(item.id as Section)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0 relative ${
                  isActive ? "text-violet-400" : "text-gray-500"
                }`}
              >
                <div className="relative">
                  <Icon name={item.icon} className="h-5 w-5" />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
                <span className="whitespace-nowrap">{item.label}</span>
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-violet-400 rounded-full" />}
              </button>
            )
          })}
          {/* Выйти */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-red-400 shrink-0 transition-colors"
          >
            <Icon name="LogOut" className="h-5 w-5" />
            <span className="whitespace-nowrap">Выйти</span>
          </button>
        </div>
      </div>

      <AddStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onCreated={reloadOrgs}
      />
    </>
  )
}