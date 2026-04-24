import { useEffect, useState, useCallback } from "react"
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
  ROLE_LEVEL,
} from "@/lib/agencyApi"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useMyOrgs } from "@/hooks/useMyOrgs"
import { useAgencyObjects } from "@/hooks/useAgencyData"
import { STATUS_LABELS } from "@/hooks/useAuth"

import AgencyCardTab from "@/components/agency/AgencyCardTab"
import AgencyEmployeesTab from "@/components/agency/AgencyEmployeesTab"
import AgencyDepartmentsTab from "@/components/agency/AgencyDepartmentsTab"
import { AgencyInvitesTab } from "@/components/agency/AgencyInvitesTab"
import AgencyAnalyticsTab from "@/components/agency/AgencyAnalyticsTab"
import AgencyDealsTab from "@/components/agency/AgencyDealsTab"
import AgencyReviewsTab from "@/components/agency/AgencyReviewsTab"
import InviteModal from "@/components/agency/InviteModal"
import DepartmentModal from "@/components/agency/DepartmentModal"
import { DashboardCRM } from "@/components/dashboard/DashboardCRM"
import DashboardObjects from "@/components/dashboard/DashboardObjects"
import DashboardClub from "@/components/dashboard/DashboardClub"
import DashboardMessages from "@/components/dashboard/DashboardMessages"
import { DashboardProfile } from "@/components/dashboard/DashboardProfile"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"
import type { ProfileForm } from "@/components/dashboard/DashboardProfile"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import func2url from "../../backend/func2url.json"

// ── RBAC ─────────────────────────────────────────────────────────────────────
function roleLevel(role: RoleCode): number { return ROLE_LEVEL[role] ?? 0 }
function canSee(role: RoleCode, minRole: RoleCode): boolean {
  return roleLevel(role) >= roleLevel(minRole)
}

type AgencySection =
  | "objects" | "crm" | "analytics" | "network" | "messages" | "profile"
  | "card" | "employees" | "departments" | "deals" | "invites" | "reviews"

interface MenuItem {
  id: AgencySection
  label: string
  icon: string
  minRole: RoleCode
  group: "work" | "agency"
}

const MENU_ITEMS: MenuItem[] = [
  { id: "objects",     label: "Объекты",     icon: "Building2",   minRole: "broker",   group: "work" },
  { id: "crm",         label: "CRM",         icon: "Users",       minRole: "broker",   group: "work" },
  { id: "analytics",   label: "Аналитика",   icon: "BarChart2",   minRole: "rop",      group: "work" },
  { id: "network",     label: "Сеть",        icon: "Zap",         minRole: "broker",   group: "work" },
  { id: "messages",    label: "Сообщения",   icon: "MessageSquare", minRole: "broker", group: "work" },
  { id: "profile",     label: "Профиль",     icon: "User",        minRole: "broker",   group: "work" },
  { id: "card",        label: "Карточка АН", icon: "Building2",   minRole: "broker",   group: "agency" },
  { id: "employees",   label: "Команда",     icon: "Users",       minRole: "rop",      group: "agency" },
  { id: "departments", label: "Отделы",      icon: "Layers",      minRole: "director", group: "agency" },
  { id: "deals",       label: "Сделки",      icon: "TrendingUp",  minRole: "broker",   group: "agency" },
  { id: "invites",     label: "Приглашения", icon: "UserPlus",    minRole: "rop",      group: "agency" },
]

export default function Agency() {
  const { id: orgId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout, updateProfile } = useAuthContext()
  const { orgs } = useMyOrgs()

  const [section, setSection] = useState<AgencySection>("objects")
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
  const [showWizard, setShowWizard] = useState(false)
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null)
  const [catFilter, setCatFilter] = useState("Все")
  const [statusFilter, setStatusFilter] = useState("Все")
  const [objSearch, setObjSearch] = useState("")
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? "", lastName: user?.lastName ?? "",
    middleName: user?.middleName ?? "", name: user?.name ?? "",
    phone: user?.phone ?? "", company: user?.company ?? "",
    city: user?.city ?? "", specializations: user?.specializations ?? [],
    bio: user?.bio ?? "", experience: user?.experience ?? "",
    telegram: user?.telegram ?? "", vk: user?.vk ?? "",
    max: user?.max ?? "", website: user?.website ?? "",
  })
  const [profileSaved, setProfileSaved] = useState(false)

  const myRole = org?.my_role ?? "broker"
  const myDeptId = employees.find(e => e.user_id === user?.id)?.department_id ?? null
  const isRop = myRole === "rop"

  const { objects, loading: loadingObjects, reload: reloadObjects } = useAgencyObjects({
    userId: user?.id ?? "",
    orgId: orgId ?? "",
    deptId: isRop ? myDeptId : null,
  })

  useEffect(() => {
    if (!user) { navigate("/"); return }
    if (!orgId) return
    localStorage.setItem("k24_active_org", orgId)
    void reload()
  }, [user, orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(async () => {
    if (!user || !orgId) return
    setLoading(true); setError(null)
    try {
      const [o, emp, inv, deps, full] = await Promise.all([
        agencyApi.getOrg(user.id, orgId),
        agencyApi.listEmployees(user.id, orgId),
        agencyApi.listInvites(user.id, orgId).catch(() => [] as InviteRow[]),
        agencyApi.listDepartments(user.id, orgId).catch(() => [] as Department[]),
        agencyApi.getOrgFull(user.id, orgId).catch(() => null),
      ])
      setOrg(o as OrgSummary & { my_role: RoleCode })
      setOrgFull(full); setEmployees(emp); setInvites(inv); setDepartments(deps)
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка") }
    finally { setLoading(false) }
  }, [user, orgId])

  async function changeRole(targetUserId: string, role: RoleCode) {
    if (!user || !orgId) return
    try { await agencyApi.updateEmployee(user.id, orgId, { user_id: targetUserId, role_code: role }); toast({ title: "Роль обновлена" }); reload() }
    catch (e) { toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" }) }
  }
  async function changeDepartment(targetUserId: string, deptId: string | null) {
    if (!user || !orgId) return
    try { await agencyApi.updateEmployee(user.id, orgId, { user_id: targetUserId, department_id: deptId }); toast({ title: "Отдел обновлён" }); reload() }
    catch (e) { toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" }) }
  }
  async function confirmDeleteDept() {
    if (!user || !orgId || !deletingDept) return
    try { await agencyApi.deleteDepartment(user.id, orgId, deletingDept.id); toast({ title: "Отдел архивирован" }); setDeletingDept(null); reload() }
    catch (e) { toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" }) }
  }
  async function handleDeleteObject(id: string) {
    if (!user?.id || !confirm("Удалить объект?")) return
    try { await fetch(`${func2url.objects}?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`, { method: "DELETE" }); reloadObjects() }
    catch (e) { void e }
  }
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    updateProfile({ firstName: profileForm.firstName, lastName: profileForm.lastName, middleName: profileForm.middleName, name: `${profileForm.firstName} ${profileForm.lastName}`.trim(), phone: profileForm.phone, company: profileForm.company, city: profileForm.city, specializations: profileForm.specializations, bio: profileForm.bio, experience: profileForm.experience, telegram: profileForm.telegram, vk: profileForm.vk, max: profileForm.max, website: profileForm.website })
    setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000)
  }

  const initials = user ? (user.name || user.email).slice(0, 2).toUpperCase() : "?"
  const isDirector = isAdmin(myRole)
  const isFounder = myRole === "founder"
  const visibleItems = MENU_ITEMS.filter(item => canSee(myRole, item.minRole))

  const roleName: Record<RoleCode, string> = {
    founder: "Учредитель", director: "Директор", rop: "Руководитель отдела",
    broker: "Брокер", manager: "Менеджер", marketer: "Маркетолог",
    accountant: "Бухгалтер", lawyer: "Юрист", mortgage_broker: "Ипотечный брокер",
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = (
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
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0"><Icon name="Building2" className="h-3 w-3 text-white" /></div>
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
        <button onClick={() => { logout(); navigate("/") }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full">
          <Icon name="LogOut" className="h-4 w-4" />Выйти
        </button>
      </div>
    </aside>
  )

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {Sidebar}
      <main className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400"><Icon name="Loader2" className="h-6 w-6 animate-spin" /><span>Загружаем кабинет...</span></div>
      </main>
    </div>
  )

  if (error || !org) return (
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {Sidebar}

      {showWizard && user && (
        <AddObjectWizard
          onClose={() => { setShowWizard(false); setEditingObject(null) }}
          onSave={(obj) => { void obj; reloadObjects(); setShowWizard(false) }}
          userId={user.id}
          initial={editingObject ?? undefined}
        />
      )}

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">{org.name}</p>
          {isDirector && (
            <button onClick={() => setInviteOpen(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              <Icon name="UserPlus" className="h-4 w-4" />Пригласить
            </button>
          )}
        </div>

        <div className="p-6 md:p-8">
          {section === "objects" && (
            <DashboardObjects
              objects={objects} loading={loadingObjects}
              showWizard={false} setShowWizard={setShowWizard}
              editingObject={editingObject}
              onEdit={(obj) => { setEditingObject(obj); setShowWizard(true) }}
              onDelete={handleDeleteObject}
              onWizardSaved={(obj) => { void obj; reloadObjects() }}
              onWizardClose={() => { setShowWizard(false); setEditingObject(null) }}
              catFilter={catFilter} setCatFilter={setCatFilter}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              objSearch={objSearch} setObjSearch={setObjSearch}
              userId={user?.id ?? ""} isBasic={false}
            />
          )}

          {section === "crm" && user && orgId && (
            <DashboardCRM userId={user.id} orgId={orgId} deptId={isRop ? (myDeptId ?? undefined) : undefined} />
          )}

          {section === "analytics" && canSee(myRole, "rop") && orgId && (
            <AgencyAnalyticsTab orgId={orgId} />
          )}

          {section === "network" && user && (
            <DashboardClub userId={user.id} onMessage={() => setSection("messages")} />
          )}

          {section === "messages" && user && (
            <DashboardMessages
              userId={user.id}
              openPartnerId={null}
              openPartnerName={null}
              openPartnerAvatar={null}
              openPartnerStatus={null}
              onClearOpen={() => {}}
              onUnreadChange={() => {}}
            />
          )}

          {section === "profile" && user && (
            <DashboardProfile
              user={user} initials={initials}
              form={profileForm} setForm={setProfileForm}
              saved={profileSaved} onSave={handleSaveProfile}
              onAvatarChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => updateProfile({ avatar: ev.target?.result as string }); r.readAsDataURL(f) }}
              onAvatarCropped={(d) => updateProfile({ avatar: d })}
              onStatusChange={(s) => updateProfile({ status: s })}
            />
          )}

          {section === "card" && orgFull && user && orgId && (
            <AgencyCardTab org={orgFull} userId={user.id} orgId={orgId} onSaved={setOrgFull} />
          )}

          {section === "employees" && canSee(myRole, "rop") && (
            <AgencyEmployeesTab employees={employees} departments={departments}
              deptFilter={deptFilter} setDeptFilter={setDeptFilter}
              isDirector={isDirector} isFounder={isFounder} currentUserId={user?.id}
              onChangeRole={changeRole} onChangeDepartment={changeDepartment} />
          )}

          {section === "departments" && canSee(myRole, "director") && (
            <AgencyDepartmentsTab departments={departments} isDirector={isDirector}
              onCreate={() => { setEditingDept(null); setDeptModalOpen(true) }}
              onEdit={(d) => { setEditingDept(d); setDeptModalOpen(true) }}
              onDelete={(d) => setDeletingDept(d)} />
          )}

          {section === "deals" && user && orgId && (
            <AgencyDealsTab userId={user.id} orgId={orgId} myRole={myRole}
              employees={isRop ? employees.filter(e => e.department_id === myDeptId) : employees} />
          )}

          {section === "invites" && canSee(myRole, "rop") && (
            <AgencyInvitesTab invites={invites} />
          )}

          {section === "reviews" && orgId && (
            <AgencyReviewsTab orgId={orgId} userId={user?.id ?? null} userName={user?.name ?? ""} />
          )}
        </div>
      </main>

      {orgId && (
        <>
          <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)}
            orgId={orgId} departments={departments} onInvited={reload} canInviteDirector={isFounder} />
          <DepartmentModal open={deptModalOpen} onClose={() => setDeptModalOpen(false)}
            orgId={orgId} employees={employees} department={editingDept} onSaved={reload} />
        </>
      )}

      <Dialog open={!!deletingDept} onOpenChange={(v) => !v && setDeletingDept(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить отдел?</DialogTitle>
            <DialogDescription>Отдел «{deletingDept?.name}» будет архивирован. Сотрудники останутся в агентстве.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDept(null)}>Отмена</Button>
            <Button onClick={confirmDeleteDept} className="bg-red-500 hover:bg-red-600 text-white">Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Мобильное нижнее меню */}
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
    </div>
  )
}