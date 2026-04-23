import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import {
  agencyApi,
  Department,
  Employee,
  InviteRow,
  OrgSummary,
  OrgFull,
  RoleCode,
  isAdmin,
} from "@/lib/agencyApi"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useMyOrgs } from "@/hooks/useMyOrgs"
import { STATUS_LABELS } from "@/hooks/useAuth"
import AgencyCardTab from "@/components/agency/AgencyCardTab"
import AgencyEmployeesTab from "@/components/agency/AgencyEmployeesTab"
import AgencyDepartmentsTab from "@/components/agency/AgencyDepartmentsTab"
import { AgencyInvitesTab, AgencyAboutTab } from "@/components/agency/AgencyInvitesTab"
import AgencyAnalyticsTab from "@/components/agency/AgencyAnalyticsTab"
import AgencyDealsTab from "@/components/agency/AgencyDealsTab"
import AgencyReviewsTab from "@/components/agency/AgencyReviewsTab"
import InviteModal from "@/components/agency/InviteModal"
import DepartmentModal from "@/components/agency/DepartmentModal"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

type AgencyTab = "card" | "analytics" | "employees" | "departments" | "deals" | "invites" | "reviews" | "about"

const TABS: { id: AgencyTab; label: string; icon: string }[] = [
  { id: "card",        label: "Карточка АН",  icon: "Building2" },
  { id: "analytics",   label: "Аналитика",    icon: "BarChart2" },
  { id: "employees",   label: "Сотрудники",   icon: "Users" },
  { id: "departments", label: "Отделы",       icon: "Layers" },
  { id: "deals",       label: "Сделки",       icon: "Handshake" },
  { id: "invites",     label: "Приглашения",  icon: "UserPlus" },
  { id: "reviews",     label: "Отзывы",       icon: "Star" },
  { id: "about",       label: "О нас",        icon: "Info" },
]

export default function Agency() {
  const { id: orgId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const { orgs } = useMyOrgs()

  const [tab, setTab] = useState<AgencyTab>("card")
  const [org, setOrg] = useState<(OrgSummary & { my_role: RoleCode }) | null>(null)
  const [orgFull, setOrgFull] = useState<OrgFull | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [deptFilter, setDeptFilter] = useState("all")

  useEffect(() => {
    if (!user) { navigate("/"); return }
    if (!orgId) return
    localStorage.setItem("k24_active_org", orgId)
    void reload()
  }, [user, orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function reload() {
    if (!user || !orgId) return
    setLoading(true)
    setError(null)
    try {
      const [o, emp, inv, deps, full] = await Promise.all([
        agencyApi.getOrg(user.id, orgId),
        agencyApi.listEmployees(user.id, orgId),
        agencyApi.listInvites(user.id, orgId).catch(() => [] as InviteRow[]),
        agencyApi.listDepartments(user.id, orgId).catch(() => [] as Department[]),
        agencyApi.getOrgFull(user.id, orgId).catch(() => null),
      ])
      setOrg(o as OrgSummary & { my_role: RoleCode })
      setOrgFull(full)
      setEmployees(emp)
      setInvites(inv)
      setDepartments(deps)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(targetUserId: string, role: RoleCode) {
    if (!user || !orgId) return
    try {
      await agencyApi.updateEmployee(user.id, orgId, { user_id: targetUserId, role_code: role })
      toast({ title: "Роль обновлена" })
      reload()
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  async function changeDepartment(targetUserId: string, deptId: string | null) {
    if (!user || !orgId) return
    try {
      await agencyApi.updateEmployee(user.id, orgId, { user_id: targetUserId, department_id: deptId })
      toast({ title: "Отдел обновлён" })
      reload()
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  async function confirmDeleteDept() {
    if (!user || !orgId || !deletingDept) return
    try {
      await agencyApi.deleteDepartment(user.id, orgId, deletingDept.id)
      toast({ title: "Отдел архивирован" })
      setDeletingDept(null)
      reload()
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  const initials = user ? (user.name || user.email).slice(0, 2).toUpperCase() : "?"
  const isDirector = org ? isAdmin(org.my_role) : false
  const isFounder = org?.my_role === "founder"

  // ── Sidebar ────────────────────────────────────────────────────────
  const Sidebar = (
    <aside className="hidden md:flex flex-col w-60 border-r border-[#1f1f1f] bg-[#0d0d0d] py-6 px-4 shrink-0">
      {/* Лого */}
      <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-8 px-2">
        <img
          src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"
          alt="Кабинет-24"
          className="h-8 w-auto object-contain"
        />
      </button>

      {/* Навигация — табы АН */}
      <nav className="flex flex-col gap-1 flex-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              tab === t.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <Icon name={t.icon as "Star"} fallback="Circle" className="h-4 w-4 shrink-0" />
            {t.label}
          </button>
        ))}

        <div className="my-1 border-t border-[#1f1f1f]" />

        {/* Назад в ЛК */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        >
          <Icon name="LayoutDashboard" className="h-4 w-4 shrink-0" />
          Личный кабинет
        </button>

        <button
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        >
          <Icon name="Store" className="h-4 w-4 shrink-0" />
          Маркетплейс
        </button>
      </nav>

      {/* Другие агентства */}
      <div className="mt-auto pt-4 border-t border-[#1f1f1f]">
        {orgs.length > 1 && (
          <div className="mb-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-1">Мои агентства</div>
            {orgs.filter(o => o.id !== orgId).map(o => (
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
              </button>
            ))}
          </div>
        )}

        {/* Пользователь */}
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

        <button
          onClick={() => { logout(); navigate("/") }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
        >
          <Icon name="LogOut" className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  )

  // ── Loading / Error ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex">
        {Sidebar}
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <Icon name="Loader2" className="h-6 w-6 animate-spin" />
            <span>Загружаем кабинет агентства...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex">
        {Sidebar}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon name="AlertCircle" className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="font-semibold mb-1">{error || "Кабинет не найден"}</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-3">В личный кабинет</Button>
          </div>
        </main>
      </div>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {Sidebar}

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Топ-бар */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm"
            >
              <Icon name="ArrowLeft" className="h-4 w-4" />
              ЛК
            </button>
            <span className="text-gray-700">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <Icon name="Building2" className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-white font-medium text-sm">{org.name}</span>
              <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                {org.my_role === "founder" ? "Учредитель" : org.my_role === "director" ? "Директор" : "Участник"}
              </span>
            </div>
          </div>
          {isDirector && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Icon name="UserPlus" className="h-4 w-4" />
              Пригласить
            </button>
          )}
        </div>

        {/* Контент таба */}
        <div className="p-6 md:p-8 max-w-5xl">
          {tab === "card" && orgFull && user && orgId && (
            <AgencyCardTab org={orgFull} userId={user.id} orgId={orgId} onSaved={setOrgFull} />
          )}

          {tab === "analytics" && orgId && (
            <AgencyAnalyticsTab orgId={orgId} />
          )}

          {tab === "employees" && (
            <AgencyEmployeesTab
              employees={employees}
              departments={departments}
              deptFilter={deptFilter}
              setDeptFilter={setDeptFilter}
              isDirector={isDirector}
              isFounder={isFounder}
              currentUserId={user?.id}
              onChangeRole={changeRole}
              onChangeDepartment={changeDepartment}
            />
          )}

          {tab === "departments" && (
            <AgencyDepartmentsTab
              departments={departments}
              isDirector={isDirector}
              onCreate={() => { setEditingDept(null); setDeptModalOpen(true) }}
              onEdit={(d) => { setEditingDept(d); setDeptModalOpen(true) }}
              onDelete={(d) => setDeletingDept(d)}
            />
          )}

          {tab === "deals" && user && orgId && (
            <AgencyDealsTab
              userId={user.id}
              orgId={orgId}
              myRole={org.my_role}
              employees={employees}
            />
          )}

          {tab === "invites" && (
            <AgencyInvitesTab invites={invites} />
          )}

          {tab === "reviews" && orgId && (
            <AgencyReviewsTab
              orgId={orgId}
              userId={user?.id ?? null}
              userName={user?.name ?? ""}
            />
          )}

          {tab === "about" && (
            <AgencyAboutTab org={org} />
          )}
        </div>
      </main>

      {/* Модалки */}
      {orgId && (
        <>
          <InviteModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            orgId={orgId}
            departments={departments}
            onInvited={reload}
            canInviteDirector={isFounder}
          />
          <DepartmentModal
            open={deptModalOpen}
            onClose={() => setDeptModalOpen(false)}
            orgId={orgId}
            employees={employees}
            department={editingDept}
            onSaved={reload}
          />
        </>
      )}

      <Dialog open={!!deletingDept} onOpenChange={(v) => !v && setDeletingDept(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить отдел?</DialogTitle>
            <DialogDescription>
              Отдел «{deletingDept?.name}» будет архивирован. Сотрудники останутся в агентстве.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDept(null)}>Отмена</Button>
            <Button onClick={confirmDeleteDept} className="bg-red-500 hover:bg-red-600 text-white">Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
