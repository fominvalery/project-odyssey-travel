import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"
import { MainTab } from "./constants"

export function SuperAdminTopBar() {
  const navigate = useNavigate()
  return (
    <header className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={16} />
          В дашборд
        </button>
        <div className="h-5 w-px bg-[#1f1f1f]" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
            <Icon name="Shield" size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Супер-Админ</h1>
            <p className="text-xs text-gray-500 mt-0.5">Панель управления платформой</p>
          </div>
        </div>
      </div>
    </header>
  )
}

interface TabsProps {
  mainTab: MainTab
  setMainTab: (t: MainTab) => void
  usersCount: number
}

export function SuperAdminTabs({ mainTab, setMainTab, usersCount }: TabsProps) {
  return (
    <div className="flex gap-2 mb-6 border-b border-[#1f1f1f]">
      {([
        { id: "users" as const, icon: "Users", label: "Пользователи", count: usersCount },
      ]).map((t) => (
        <button
          key={t.id}
          onClick={() => setMainTab(t.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            mainTab === t.id ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          <Icon name={t.icon as "Users"} size={14} />
          {t.label}
          {t.count > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium text-gray-500">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default SuperAdminTopBar