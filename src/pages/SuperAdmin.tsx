import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { superadminApi, AdminUser } from "@/lib/superadminApi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { toast } from "@/hooks/use-toast"
import { STATUS_LABELS } from "@/hooks/useAuth"

type Tab = "users"

const STATUS_COLORS: Record<string, string> = {
  basic: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  broker: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  agency: "bg-violet-500/15 text-violet-300 border-violet-500/30",
}

const LEVEL_COLORS: Record<string, string> = {
  gray:    "bg-gray-500/10 text-gray-500 border-gray-500/20",
  blue:    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  violet:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  amber:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  rose:    "bg-rose-500/15 text-rose-300 border-rose-500/30",
}

const LEVELS = [
  { name: "Друг",     color: "blue",    desc: "1–2 реф. • 5%" },
  { name: "Партнёр",  color: "emerald", desc: "3–9 реф. • 7%" },
  { name: "Бизнес",   color: "violet",  desc: "10–29 реф. • 7%" },
  { name: "Амбасадор",color: "amber",   desc: "30–99 реф. • 10%" },
  { name: "Адвокат",  color: "rose",    desc: "100+ реф. • 10%+2%" },
]

export default function SuperAdmin() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [tab] = useState<Tab>("users")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [levelDropdown, setLevelDropdown] = useState<string | null>(null)
  const levelDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }
    if (!user.isSuperadmin) {
      navigate("/dashboard")
      return
    }
    loadUsers()
  }, [user?.id])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(e.target as Node)) {
        setLevelDropdown(null)
      }
    }
    if (levelDropdown) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [levelDropdown])

  const loadUsers = async (q = "") => {
    if (!user?.id) return
    setLoading(true)
    try {
      const list = await superadminApi.listUsers(user.id, q)
      setUsers(list)
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось загрузить",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (targetId: string, status: "basic" | "broker" | "agency") => {
    if (!user?.id) return
    setUpdatingId(targetId)
    try {
      await superadminApi.updateStatus(user.id, status, targetId)
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, status, plan: status === "basic" ? "basic" : status === "broker" ? "pro" : "proplus" } : u))
      )
      toast({ title: "Готово", description: `Статус изменён на «${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}»` })
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось изменить",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const changeLevel = async (targetId: string, levelName: string) => {
    if (!user?.id) return
    setLevelDropdown(null)
    setUpdatingId(targetId)
    try {
      await superadminApi.updateLevel(user.id, targetId, levelName)
      const lvl = LEVELS.find((l) => l.name === levelName)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetId
            ? { ...u, referral_level: { name: levelName, level: LEVELS.findIndex(l => l.name === levelName) + 1, color: lvl?.color || "gray" } }
            : u
        )
      )
      toast({ title: "Готово", description: `Уровень изменён на «${levelName}»` })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось изменить", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(search.trim())
  }

  if (!user?.isSuperadmin) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
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

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 border-b border-[#1f1f1f]">
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "users" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            <Icon name="Users" size={14} className="inline mr-1.5" />
            Пользователи
            {users.length > 0 && <span className="ml-2 text-xs text-gray-500">({users.length})</span>}
          </button>
        </div>

        {tab === "users" && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по email, имени или телефону"
                  className="pl-9 bg-[#0d0d0d] border-[#1f1f1f] text-white"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : "Найти"}
              </Button>
            </form>

            <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
              {loading && users.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />
                  Загрузка…
                </div>
              ) : users.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Icon name="Users" size={20} className="mx-auto mb-2 opacity-50" />
                  Пользователей не найдено
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0a0a0a] text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Пользователь</th>
                        <th className="px-4 py-3 text-left font-medium">Контакты</th>
                        <th className="px-4 py-3 text-left font-medium">Статус</th>
                        <th className="px-4 py-3 text-left font-medium">Уровень</th>
                        <th className="px-4 py-3 text-left font-medium">Объявления</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-t border-[#1f1f1f] hover:bg-[#111]">
                          <td className="px-4 py-3">
                            <div className="font-medium flex items-center gap-1.5">
                              {u.name || "—"}
                              {u.is_superadmin && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-bold">
                                  Админ
                                </span>
                              )}
                            </div>
                            {u.company && <div className="text-xs text-gray-500">{u.company}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-300">{u.email}</div>
                            {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {(["basic", "broker", "agency"] as const).map((s) => (
                                <button
                                  key={s}
                                  disabled={updatingId === u.id}
                                  onClick={() => u.status !== s && changeStatus(u.id, s)}
                                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                                    u.status === s
                                      ? STATUS_COLORS[s] + " cursor-default"
                                      : "border-[#2a2a2a] text-gray-500 hover:text-white hover:border-gray-500 hover:bg-white/5"
                                  } ${updatingId === u.id ? "opacity-50" : ""}`}
                                >
                                  {updatingId === u.id && u.status !== s ? (
                                    <Icon name="Loader2" size={10} className="animate-spin inline" />
                                  ) : (
                                    STATUS_LABELS[s]
                                  )}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative" ref={levelDropdown === u.id ? levelDropdownRef : undefined}>
                              <button
                                disabled={updatingId === u.id}
                                onClick={() => setLevelDropdown(levelDropdown === u.id ? null : u.id)}
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 transition-all hover:opacity-80 ${
                                  u.referral_level?.level
                                    ? LEVEL_COLORS[u.referral_level.color] || LEVEL_COLORS.gray
                                    : LEVEL_COLORS.gray
                                } ${updatingId === u.id ? "opacity-50" : ""}`}
                              >
                                {updatingId === u.id
                                  ? <Icon name="Loader2" size={10} className="animate-spin" />
                                  : u.referral_level?.level
                                    ? u.referral_level.name
                                    : "—"
                                }
                                <Icon name="ChevronDown" size={10} />
                              </button>
                              {u.referral_count > 0 && (
                                <span className="text-[10px] text-gray-500 pl-1 block">{u.referral_count} реф.</span>
                              )}
                              {levelDropdown === u.id && (
                                <div className="absolute z-50 top-full mt-1 left-0 w-44 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                                  {LEVELS.map((lvl) => (
                                    <button
                                      key={lvl.name}
                                      onClick={() => changeLevel(u.id, lvl.name)}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1f1f1f] transition-colors ${
                                        u.referral_level?.name === lvl.name ? "bg-[#1a1a1a]" : ""
                                      }`}
                                    >
                                      <div>
                                        <span className={`font-medium ${
                                          lvl.color === "blue" ? "text-blue-300"
                                          : lvl.color === "emerald" ? "text-emerald-300"
                                          : lvl.color === "violet" ? "text-violet-300"
                                          : lvl.color === "amber" ? "text-amber-300"
                                          : "text-rose-300"
                                        }`}>{lvl.name}</span>
                                        <span className="text-gray-500 ml-1.5">{lvl.desc}</span>
                                      </div>
                                      {u.referral_level?.name === lvl.name && (
                                        <Icon name="Check" size={12} className="text-blue-400 shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {u.listings_used}
                            {u.listings_extra > 0 && <span className="text-emerald-400"> +{u.listings_extra}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}