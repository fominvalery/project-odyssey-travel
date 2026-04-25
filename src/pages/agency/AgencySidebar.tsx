import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { STATUS_LABELS, type UserProfile as User } from "@/hooks/useAuth"
import { OrgSummary, RoleCode } from "@/lib/agencyApi"

interface MenuItem {
  id: string
  label: string
  icon: string
  group: "work" | "agency"
}

interface Props {
  org: (OrgSummary & { my_role?: RoleCode }) | null
  orgId: string | undefined
  orgs: OrgSummary[]
  user: User | null
  initials: string
  myRole: RoleCode
  roleName: Record<RoleCode, string>
  section: string
  setSection: (s: string) => void
  visibleItems: MenuItem[]
  onLogout: () => void
}

export default function AgencySidebar({
  org, orgId, orgs, user, initials,
  myRole, roleName, section, setSection,
  visibleItems, onLogout,
}: Props) {
  const navigate = useNavigate()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#1f1f1f] bg-[#0d0d0d] py-6 px-4 shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 px-2">
          <img src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg" alt="Кабинет-24" className="h-8 w-auto object-contain" />
        </button>

        {org && (
          <div className="flex items-center gap-2 px-2 mb-4 pb-4 border-b border-[#1f1f1f]">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
              <Icon name="Building2" className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{org.name}</p>
              <p className="text-[10px] text-violet-400">{roleName[myRole]}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 px-2 mb-1">Рабочее место</p>
          {visibleItems.filter(i => i.group === "work").map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${section === item.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"}`}>
              <Icon name={item.icon as "Star"} fallback="Circle" className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}

          <p className="text-[10px] uppercase tracking-wider text-gray-600 px-2 mb-1 mt-3">Кабинет АН</p>
          {visibleItems.filter(i => i.group === "agency").map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${section === item.id ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"}`}>
              <Icon name={item.icon as "Star"} fallback="Circle" className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}

          <div className="my-2 border-t border-[#1f1f1f]" />
          <button onClick={() => navigate("/marketplace")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors text-left">
            <Icon name="Store" className="h-4 w-4 shrink-0" />Маркетплейс
          </button>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors text-left">
            <Icon name="ArrowLeft" className="h-4 w-4 shrink-0" />Личный кабинет
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-[#1f1f1f]">
          {orgs.length > 1 && (
            <div className="mb-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-1">Другие АН</p>
              {orgs.filter(o => o.id !== orgId).map(o => (
                <button key={o.id} onClick={() => navigate(`/agency/${o.id}`)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a] text-left">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Icon name="Building2" className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs text-white truncate">{o.name}</p>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-8 w-8">
              {user?.avatar ? <AvatarImage src={user.avatar} /> : null}
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user?.name?.split(" ")[0]}</p>
              <p className="text-xs text-gray-500 truncate">{STATUS_LABELS[(user?.status ?? "") as keyof typeof STATUS_LABELS] ?? user?.status}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full">
            <Icon name="LogOut" className="h-4 w-4" />Выйти
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d] border-t border-[#1f1f1f]">
        <div className="flex overflow-x-auto scrollbar-none px-2 py-2 gap-1">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0 relative ${
                section === item.id
                  ? item.group === "agency" ? "text-violet-400" : "text-blue-400"
                  : "text-gray-500"
              }`}
            >
              <Icon name={item.icon as "Star"} fallback="Circle" className="h-5 w-5" />
              <span className="whitespace-nowrap">{item.label}</span>
              {section === item.id && (
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${item.group === "agency" ? "bg-violet-400" : "bg-blue-400"}`} />
              )}
            </button>
          ))}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-gray-500 shrink-0"
          >
            <Icon name="ArrowLeft" className="h-5 w-5" />
            <span className="whitespace-nowrap">Кабинет</span>
          </button>
        </div>
      </div>
    </>
  )
}