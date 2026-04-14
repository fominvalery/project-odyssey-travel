import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"

type Section = "dashboard" | "objects" | "crm" | "referral" | "profile"

const PLAN_LABELS: Record<string, string> = {
  green: "FREE",
  pro: "ПРО",
  proplus: "Про+",
  constructor: "Конструктор",
}

const navItems = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "objects", label: "Объекты", icon: "Building2" },
  { id: "crm", label: "CRM", icon: "Users" },
  { id: "referral", label: "Рефералы", icon: "Gift" },
  { id: "profile", label: "Профиль", icon: "User" },
] as const

interface Props {
  section: Section
  setSection: (s: Section) => void
  user: { name: string; email: string; plan: string; avatar: string | null }
  initials: string
  onLogout: () => void
}

export default function DashboardSidebar({ section, setSection, user, initials, onLogout }: Props) {
  const navigate = useNavigate()

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
            onClick={onLogout}
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
    </>
  )
}
