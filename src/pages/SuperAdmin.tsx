import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { superadminApi, AdminUser, AdminWithdrawal, AdminWithdrawalsResponse } from "@/lib/superadminApi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { toast } from "@/hooks/use-toast"
import { STATUS_LABELS } from "@/hooks/useAuth"

type MainTab = "users" | "withdrawals"

const STATUS_COLORS: Record<string, string> = {
  basic:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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

const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  paid:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
}

const LEVELS = [
  { name: "Друг",      color: "blue",    desc: "1–2 реф. • 5%" },
  { name: "Партнёр",   color: "emerald", desc: "3–9 реф. • 7%" },
  { name: "Бизнес",    color: "violet",  desc: "10–29 реф. • 7%" },
  { name: "Амбасадор", color: "amber",   desc: "30–99 реф. • 10%" },
  { name: "Адвокат",   color: "rose",    desc: "100+ реф. • 10%+2%" },
]

export default function SuperAdmin() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [mainTab, setMainTab] = useState<MainTab>("users")

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState("")
  const [usersLoading, setUsersLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [levelDropdown, setLevelDropdown] = useState<string | null>(null)
  const levelDropdownRef = useRef<HTMLDivElement>(null)

  // Withdrawals tab state
  const [withdrawalsData, setWithdrawalsData] = useState<AdminWithdrawalsResponse | null>(null)
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [updatingWithdrawalId, setUpdatingWithdrawalId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) { navigate("/"); return }
    if (!user.isSuperadmin) { navigate("/dashboard"); return }
    loadUsers()
  }, [user?.id])

  useEffect(() => {
    if (mainTab === "withdrawals" && !withdrawalsData) {
      loadWithdrawals()
    }
  }, [mainTab])

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
    setUsersLoading(true)
    try {
      const list = await superadminApi.listUsers(user.id, q)
      setUsers(list)
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось загрузить", variant: "destructive" })
    } finally {
      setUsersLoading(false)
    }
  }

  const loadWithdrawals = async (filter = statusFilter) => {
    if (!user?.id) return
    setWithdrawalsLoading(true)
    try {
      const data = await superadminApi.listWithdrawals(user.id, filter)
      setWithdrawalsData(data)
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось загрузить", variant: "destructive" })
    } finally {
      setWithdrawalsLoading(false)
    }
  }

  const changeStatus = async (targetId: string, status: "basic" | "broker" | "agency") => {
    if (!user?.id) return
    setUpdatingId(targetId)
    try {
      await superadminApi.updateStatus(user.id, status, targetId)
      setUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, status, plan: status === "basic" ? "basic" : status === "broker" ? "pro" : "proplus" } : u))
      toast({ title: "Готово", description: `Статус изменён на «${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}»` })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось изменить", variant: "destructive" })
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
      setUsers((prev) => prev.map((u) => u.id === targetId
        ? { ...u, referral_level: { name: levelName, level: LEVELS.findIndex(l => l.name === levelName) + 1, color: lvl?.color || "gray" } }
        : u
      ))
      toast({ title: "Готово", description: `Уровень изменён на «${levelName}»` })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось изменить", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const changeWithdrawalStatus = async (requestId: number, status: string) => {
    if (!user?.id) return
    setUpdatingWithdrawalId(requestId)
    try {
      await superadminApi.updateWithdrawalStatus(user.id, requestId, status)
      setWithdrawalsData((prev) => {
        if (!prev) return prev
        const statusLabels: Record<string, string> = {
          pending: "На рассмотрении", approved: "Одобрена", paid: "Выплачено", rejected: "Отклонена"
        }
        const updated = prev.requests.map((r) =>
          r.id === requestId ? { ...r, status, status_label: statusLabels[status] || status } : r
        )
        const stats = {
          pending:    updated.filter(r => r.status === "pending").length,
          approved:   updated.filter(r => r.status === "approved").length,
          paid:       updated.filter(r => r.status === "paid").length,
          total_paid: updated.filter(r => r.status === "paid").reduce((s, r) => s + (r.amount || 0), 0),
        }
        return { ...prev, requests: updated, stats }
      })
      toast({ title: "Готово", description: status === "paid" ? "Помечено как выплачено" : "Статус обновлён" })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Ошибка", variant: "destructive" })
    } finally {
      setUpdatingWithdrawalId(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadUsers(search.trim()) }

  const handleFilterChange = (f: string) => {
    setStatusFilter(f)
    loadWithdrawals(f)
  }

  if (!user?.isSuperadmin) return null

  const pendingCount = withdrawalsData?.stats?.pending ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
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

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Навигация по разделам */}
        <div className="flex gap-2 mb-6 border-b border-[#1f1f1f]">
          {([
            { id: "users" as const,       icon: "Users",      label: "Пользователи",   count: users.length },
            { id: "withdrawals" as const,  icon: "ArrowDownToLine", label: "Вывод средств", count: pendingCount, badge: pendingCount > 0 },
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  t.badge ? "bg-amber-500/20 text-amber-300" : "text-gray-500"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* === Раздел: Пользователи === */}
        {mainTab === "users" && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по email, имени или телефону"
                  className="pl-9 bg-[#0d0d0d] border-[#1f1f1f] text-white" />
              </div>
              <Button type="submit" disabled={usersLoading}>
                {usersLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : "Найти"}
              </Button>
            </form>

            <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
              {usersLoading && users.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />Загрузка…
                </div>
              ) : users.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Icon name="Users" size={20} className="mx-auto mb-2 opacity-50" />Пользователей не найдено
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
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-bold">Админ</span>
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
                                <button key={s} disabled={updatingId === u.id}
                                  onClick={() => u.status !== s && changeStatus(u.id, s)}
                                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                                    u.status === s ? STATUS_COLORS[s] + " cursor-default" : "border-[#2a2a2a] text-gray-500 hover:text-white hover:border-gray-500 hover:bg-white/5"
                                  } ${updatingId === u.id ? "opacity-50" : ""}`}>
                                  {updatingId === u.id && u.status !== s
                                    ? <Icon name="Loader2" size={10} className="animate-spin inline" />
                                    : STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative" ref={levelDropdown === u.id ? levelDropdownRef : undefined}>
                              <button disabled={updatingId === u.id}
                                onClick={() => setLevelDropdown(levelDropdown === u.id ? null : u.id)}
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 transition-all hover:opacity-80 ${
                                  LEVEL_COLORS[u.referral_level?.color] || LEVEL_COLORS.blue
                                } ${updatingId === u.id ? "opacity-50" : ""}`}>
                                {updatingId === u.id
                                  ? <Icon name="Loader2" size={10} className="animate-spin" />
                                  : (u.referral_level?.name || "Друг")}
                                <Icon name="ChevronDown" size={10} />
                              </button>
                              {u.referral_count > 0 && <span className="text-[10px] text-gray-500 pl-1 block">{u.referral_count} реф.</span>}
                              {levelDropdown === u.id && (
                                <div className="absolute z-50 top-full mt-1 left-0 w-44 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                                  {LEVELS.map((lvl) => (
                                    <button key={lvl.name} onClick={() => changeLevel(u.id, lvl.name)}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1f1f1f] transition-colors ${u.referral_level?.name === lvl.name ? "bg-[#1a1a1a]" : ""}`}>
                                      <div>
                                        <span className={`font-medium ${lvl.color === "blue" ? "text-blue-300" : lvl.color === "emerald" ? "text-emerald-300" : lvl.color === "violet" ? "text-violet-300" : lvl.color === "amber" ? "text-amber-300" : "text-rose-300"}`}>{lvl.name}</span>
                                        <span className="text-gray-500 ml-1.5">{lvl.desc}</span>
                                      </div>
                                      {u.referral_level?.name === lvl.name && <Icon name="Check" size={12} className="text-blue-400 shrink-0" />}
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

        {/* === Раздел: Вывод средств === */}
        {mainTab === "withdrawals" && (
          <div>
            {/* Статистика */}
            {withdrawalsData?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "На рассмотрении", value: withdrawalsData.stats.pending,    color: "text-amber-300",   icon: "Clock" },
                  { label: "Одобрено",         value: withdrawalsData.stats.approved,   color: "text-blue-300",    icon: "CheckCircle" },
                  { label: "Выплачено",        value: withdrawalsData.stats.paid,       color: "text-emerald-300", icon: "Banknote" },
                  { label: "Итого выплачено",  value: `${withdrawalsData.stats.total_paid.toLocaleString("ru-RU")} ₽`, color: "text-white", icon: "DollarSign" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] p-4">
                    <Icon name={s.icon as "Clock"} size={14} className={`${s.color} mb-2`} />
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Фильтр */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { value: "",         label: "Все" },
                { value: "pending",  label: "На рассмотрении" },
                { value: "approved", label: "Одобрены" },
                { value: "paid",     label: "Выплачены" },
                { value: "rejected", label: "Отклонены" },
              ].map((f) => (
                <button key={f.value} onClick={() => handleFilterChange(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    statusFilter === f.value ? "bg-blue-600 text-white border-blue-500" : "border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500"
                  }`}>
                  {f.label}
                </button>
              ))}
              <button onClick={() => loadWithdrawals(statusFilter)} className="ml-auto px-3 py-1.5 rounded-lg text-xs border border-[#2a2a2a] text-gray-400 hover:text-white flex items-center gap-1">
                <Icon name="RefreshCw" size={12} />
                Обновить
              </button>
            </div>

            <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
              {withdrawalsLoading ? (
                <div className="p-10 text-center text-gray-500">
                  <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />Загрузка…
                </div>
              ) : !withdrawalsData?.requests?.length ? (
                <div className="p-10 text-center text-gray-500">
                  <Icon name="Inbox" size={20} className="mx-auto mb-2 opacity-50" />Заявок нет
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0a0a0a] text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Пользователь</th>
                        <th className="px-4 py-3 text-left font-medium">Реквизиты</th>
                        <th className="px-4 py-3 text-left font-medium">Сумма</th>
                        <th className="px-4 py-3 text-left font-medium">Дата</th>
                        <th className="px-4 py-3 text-left font-medium">Статус</th>
                        <th className="px-4 py-3 text-right font-medium">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalsData.requests.map((w: AdminWithdrawal) => (
                        <tr key={w.id} className="border-t border-[#1f1f1f] hover:bg-[#111]">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{w.user_name || "—"}</div>
                            <div className="text-xs text-gray-500">{w.user_email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium">{w.entity_label} · {w.full_name}</div>
                            <div className="text-xs text-gray-500">ИНН: {w.inn}</div>
                            {w.bank_name && <div className="text-xs text-gray-600">{w.bank_name} · {w.account}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {w.amount != null
                              ? <span className="font-semibold text-white">{w.amount.toLocaleString("ru-RU")} ₽</span>
                              : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {w.created_at ? new Date(w.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${WITHDRAWAL_STATUS_COLORS[w.status] || WITHDRAWAL_STATUS_COLORS.pending}`}>
                              {w.status_label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end flex-wrap">
                              {w.status === "pending" && (
                                <>
                                  <button disabled={updatingWithdrawalId === w.id}
                                    onClick={() => changeWithdrawalStatus(w.id, "approved")}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-blue-500/40 text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                    Одобрить
                                  </button>
                                  <button disabled={updatingWithdrawalId === w.id}
                                    onClick={() => changeWithdrawalStatus(w.id, "rejected")}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                    Отклонить
                                  </button>
                                </>
                              )}
                              {w.status === "approved" && (
                                <button disabled={updatingWithdrawalId === w.id}
                                  onClick={() => changeWithdrawalStatus(w.id, "paid")}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-1">
                                  <Icon name="Check" size={10} />
                                  Выплачено
                                </button>
                              )}
                              {(w.status === "paid" || w.status === "rejected") && (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                              {updatingWithdrawalId === w.id && (
                                <Icon name="Loader2" size={14} className="animate-spin text-gray-400" />
                              )}
                            </div>
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