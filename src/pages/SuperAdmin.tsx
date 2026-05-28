import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { superadminApi, AdminUser, AdminWithdrawalsResponse } from "@/lib/superadminApi"
import { toast } from "@/hooks/use-toast"
import { STATUS_LABELS } from "@/hooks/useAuth"
import SuperAdminExpiry from "@/components/admin/SuperAdminExpiry"
import { SuperAdminTopBar, SuperAdminTabs } from "@/components/admin/superadmin/SuperAdminHeader"
import SuperAdminUsersTab from "@/components/admin/superadmin/SuperAdminUsersTab"
import SuperAdminWithdrawalsTab from "@/components/admin/superadmin/SuperAdminWithdrawalsTab"
import { LEVELS, MainTab, UsersFilter } from "@/components/admin/superadmin/constants"

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
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)
  const [usersFilter, setUsersFilter] = useState<UsersFilter>("all")
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const levelDropdownRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

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
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdown(null)
      }
    }
    if (levelDropdown || statusDropdown) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [levelDropdown, statusDropdown])

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

  const verifyEmailManually = async (targetId: string, email: string) => {
    if (!user?.id) return
    if (!confirm(`Подтвердить email пользователя ${email} вручную?\n\nПосле этого он сможет войти в систему даже без письма.`)) return
    setVerifyingId(targetId)
    try {
      await superadminApi.verifyEmailManually(user.id, targetId)
      setUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, email_verified: true } : u))
      toast({ title: "Готово", description: `Email ${email} подтверждён` })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось подтвердить", variant: "destructive" })
    } finally {
      setVerifyingId(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadUsers(search.trim()) }

  const unverifiedCount = users.filter((u) => !u.email_verified).length
  const filteredUsers = usersFilter === "unverified" ? users.filter((u) => !u.email_verified) : users

  const handleFilterChange = (f: string) => {
    setStatusFilter(f)
    loadWithdrawals(f)
  }

  if (!user?.isSuperadmin) return null

  const pendingCount = withdrawalsData?.stats?.pending ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SuperAdminTopBar />

      <div className="max-w-6xl mx-auto px-6 py-6">
        <SuperAdminTabs
          mainTab={mainTab}
          setMainTab={setMainTab}
          usersCount={users.length}
          pendingCount={pendingCount}
        />

        {mainTab === "users" && (
          <SuperAdminUsersTab
            users={users}
            filteredUsers={filteredUsers}
            search={search}
            setSearch={setSearch}
            usersLoading={usersLoading}
            updatingId={updatingId}
            verifyingId={verifyingId}
            levelDropdown={levelDropdown}
            setLevelDropdown={setLevelDropdown}
            levelDropdownRef={levelDropdownRef}
            statusDropdown={statusDropdown}
            setStatusDropdown={setStatusDropdown}
            statusDropdownRef={statusDropdownRef}
            usersFilter={usersFilter}
            setUsersFilter={setUsersFilter}
            unverifiedCount={unverifiedCount}
            handleSearch={handleSearch}
            changeStatus={changeStatus}
            changeLevel={changeLevel}
            verifyEmailManually={verifyEmailManually}
          />
        )}

        {mainTab === "withdrawals" && (
          <SuperAdminWithdrawalsTab
            withdrawalsData={withdrawalsData}
            withdrawalsLoading={withdrawalsLoading}
            statusFilter={statusFilter}
            updatingWithdrawalId={updatingWithdrawalId}
            handleFilterChange={handleFilterChange}
            loadWithdrawals={loadWithdrawals}
            changeWithdrawalStatus={changeWithdrawalStatus}
          />
        )}

        {mainTab === "expiry" && user?.id && (
          <SuperAdminExpiry actorId={user.id} />
        )}
      </div>
    </div>
  )
}