import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { superadminApi, AdminUser } from "@/lib/superadminApi"
import { toast } from "@/hooks/use-toast"
import { STATUS_LABELS } from "@/hooks/useAuth"
import { SuperAdminTopBar, SuperAdminTabs } from "@/components/admin/superadmin/SuperAdminHeader"
import SuperAdminUsersTab from "@/components/admin/superadmin/SuperAdminUsersTab"
import SuperAdminObjectsTab from "@/components/admin/superadmin/SuperAdminObjectsTab"
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

  useEffect(() => {
    if (!user) { navigate("/"); return }
    if (!user.isSuperadmin) { navigate("/dashboard"); return }
    loadUsers()
  }, [user?.id])

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

  const deleteUser = async (targetId: string, name: string, email: string) => {
    if (!user?.id) return
    if (!confirm(`Удалить аккаунт «${name || email}»?\n\nЭто действие нельзя отменить. Все данные пользователя будут удалены.`)) return
    setUpdatingId(targetId)
    try {
      await superadminApi.deleteUser(user.id, targetId)
      setUsers((prev) => prev.filter((u) => u.id !== targetId))
      toast({ title: "Готово", description: `Аккаунт ${name || email} удалён` })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось удалить", variant: "destructive" })
    } finally {
      setUpdatingId(null)
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

  if (!user?.isSuperadmin) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SuperAdminTopBar />

      <div className="max-w-6xl mx-auto px-6 py-6">
        <SuperAdminTabs
          mainTab={mainTab}
          setMainTab={setMainTab}
          usersCount={users.length}
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
            deleteUser={deleteUser}
          />
        )}

        {mainTab === "objects" && user?.id && (
          <SuperAdminObjectsTab actorId={user.id} />
        )}

      </div>
    </div>
  )
}