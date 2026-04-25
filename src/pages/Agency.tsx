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
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useMyOrgs } from "@/hooks/useMyOrgs"
import { useAgencyObjects } from "@/hooks/useAgencyData"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"
import type { ProfileForm } from "@/components/dashboard/DashboardProfile"
import type { Lead } from "@/components/dashboard/LeadCard"
import { toast } from "@/hooks/use-toast"
import func2url from "../../backend/func2url.json"

import AgencySidebar from "./agency/AgencySidebar"
import AgencyContent from "./agency/AgencyContent"
import AgencyModals from "./agency/AgencyModals"

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
  { id: "objects",     label: "Объекты",     icon: "Building2",     minRole: "broker",   group: "work" },
  { id: "crm",         label: "CRM",         icon: "Users",         minRole: "broker",   group: "work" },
  { id: "analytics",   label: "Аналитика",   icon: "BarChart2",     minRole: "rop",      group: "work" },
  { id: "network",     label: "Сеть",        icon: "Zap",           minRole: "broker",   group: "work" },
  { id: "messages",    label: "Сообщения",   icon: "MessageSquare", minRole: "broker",   group: "work" },
  { id: "profile",     label: "Профиль",     icon: "User",          minRole: "broker",   group: "work" },
  { id: "card",        label: "Карточка АН", icon: "Building2",     minRole: "broker",   group: "agency" },
  { id: "employees",   label: "Команда",     icon: "Users",         minRole: "rop",      group: "agency" },
  { id: "departments", label: "Отделы",      icon: "Layers",        minRole: "director", group: "agency" },
  { id: "deals",       label: "Сделки",      icon: "TrendingUp",    minRole: "broker",   group: "agency" },
  { id: "invites",     label: "Приглашения", icon: "UserPlus",      minRole: "rop",      group: "agency" },
]

const roleName: Record<RoleCode, string> = {
  founder: "Учредитель", director: "Директор", rop: "Руководитель отдела",
  broker: "Брокер", manager: "Менеджер", marketer: "Маркетолог",
  accountant: "Бухгалтер", lawyer: "Юрист", mortgage_broker: "Ипотечный брокер",
}

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
  const [reassigningObject, setReassigningObject] = useState<ObjectData | null>(null)
  const [reassigningLead, setReassigningLead] = useState<Lead | null>(null)
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

  async function handleReassignLead(leadId: string, toUserId: string) {
    if (!user || !orgId) return
    await fetch(func2url.leads, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, requester_id: user.id, to_owner_id: toUserId, org_id: orgId }),
    })
    toast({ title: "Клиент переназначен" })
  }

  async function handleReassignObject(objId: string, toUserId: string) {
    if (!user || !orgId) return
    await fetch(func2url.objects, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: objId, requester_id: user.id, to_user_id: toUserId, org_id: orgId }),
    })
    toast({ title: "Объект переназначен" })
    reloadObjects()
  }

  async function fireEmployee(targetUserId: string) {
    if (!user || !orgId) return
    try {
      const res = await agencyApi.fireEmployee(user.id, orgId, targetUserId)
      toast({
        title: "Сотрудник уволен",
        description: `Передано объектов: ${res.objects_transferred}, лидов: ${res.leads_transferred}`,
      })
      reload()
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
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

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    updateProfile({ firstName: profileForm.firstName, lastName: profileForm.lastName, middleName: profileForm.middleName, name: `${profileForm.firstName} ${profileForm.lastName}`.trim(), phone: profileForm.phone, company: profileForm.company, city: profileForm.city, specializations: profileForm.specializations, bio: profileForm.bio, experience: profileForm.experience, telegram: profileForm.telegram, vk: profileForm.vk, max: profileForm.max, website: profileForm.website })
    setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000)
  }

  const initials = user ? (user.name || user.email).slice(0, 2).toUpperCase() : "?"
  const isDirector = isAdmin(myRole)
  const isFounder = myRole === "founder"
  const visibleItems = MENU_ITEMS.filter(item => canSee(myRole, item.minRole))

  // ── Loading / Error states ─────────────────────────────────────────────────
  const sidebar = (
    <AgencySidebar
      org={org}
      orgId={orgId}
      orgs={orgs}
      user={user}
      initials={initials}
      myRole={myRole}
      roleName={roleName}
      section={section}
      setSection={(s) => setSection(s as AgencySection)}
      visibleItems={visibleItems}
      onLogout={() => { logout(); navigate("/") }}
    />
  )

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {sidebar}
      <main className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Icon name="Loader2" className="h-6 w-6 animate-spin" />
          <span>Загружаем кабинет...</span>
        </div>
      </main>
    </div>
  )

  if (error || !org) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {sidebar}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="font-semibold mb-1">{error || "Кабинет не найден"}</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-3">В личный кабинет</Button>
        </div>
      </main>
    </div>
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {sidebar}

      {showWizard && (
        <AddObjectWizard
          onClose={() => { setShowWizard(false); setEditingObject(null) }}
          onSave={(obj) => { void obj; reloadObjects(); setShowWizard(false) }}
          userId={user.id}
          initial={editingObject ?? undefined}
        />
      )}

      <AgencyContent
        section={section}
        setSection={setSection}
        user={user}
        orgId={orgId ?? ""}
        org={org}
        orgFull={orgFull}
        setOrgFull={setOrgFull}
        myRole={myRole}
        myDeptId={myDeptId}
        isRop={isRop}
        isDirector={isDirector}
        isFounder={isFounder}
        employees={employees}
        departments={departments}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        objects={objects}
        loadingObjects={loadingObjects}
        editingObject={editingObject}
        setEditingObject={setEditingObject}
        setShowWizard={setShowWizard}
        reloadObjects={reloadObjects}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        objSearch={objSearch}
        setObjSearch={setObjSearch}
        handleDeleteObject={handleDeleteObject}
        initials={initials}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        profileSaved={profileSaved}
        handleSaveProfile={handleSaveProfile}
        updateProfile={updateProfile as (patch: Record<string, unknown>) => void}
        invites={invites}
        setInviteOpen={setInviteOpen}
        setEditingDept={setEditingDept}
        setDeptModalOpen={setDeptModalOpen}
        setDeletingDept={setDeletingDept}
        changeRole={changeRole}
        changeDepartment={changeDepartment}
        fireEmployee={fireEmployee}
        setReassigningObject={setReassigningObject}
        setReassigningLead={setReassigningLead}
        roleLevelFn={roleLevel}
      />

      {orgId && (
        <AgencyModals
          orgId={orgId}
          userId={user.id}
          isFounder={isFounder}
          isRop={isRop}
          myDeptId={myDeptId}
          departments={departments}
          employees={employees}
          invites={invites}
          inviteOpen={inviteOpen}
          setInviteOpen={setInviteOpen}
          onInvited={reload}
          deptModalOpen={deptModalOpen}
          setDeptModalOpen={setDeptModalOpen}
          editingDept={editingDept}
          onDeptSaved={reload}
          deletingDept={deletingDept}
          setDeletingDept={setDeletingDept}
          onConfirmDeleteDept={confirmDeleteDept}
          reassigningObject={reassigningObject}
          setReassigningObject={setReassigningObject}
          onReassignObject={handleReassignObject}
          reassigningLead={reassigningLead}
          setReassigningLead={setReassigningLead}
          onReassignLead={handleReassignLead}
        />
      )}
    </div>
  )
}
