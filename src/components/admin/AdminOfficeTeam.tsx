import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import {
  OfficeMember, OfficeDepartment, OfficeInvite, Role, Tab,
} from "./AdminOfficeTypes"
import { DeptModal, MemberModal, InviteModal, TokenPanel } from "./AdminOfficeModals"
import { MembersView, DepartmentsView, InvitesView } from "./AdminOfficeViews"

const OFFICE_URL = (func2url as Record<string, string>)["office-team"]

export default function AdminOfficeTeam({
  allUsers,
  token = "k24admin",
  tab: initialTab = "members",
}: {
  allUsers?: { id: string; name: string; email: string }[]
  token?: string
  tab?: Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [members, setMembers] = useState<OfficeMember[]>([])
  const [departments, setDepartments] = useState<OfficeDepartment[]>([])
  const [invites, setInvites] = useState<OfficeInvite[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [deptFilter, setDeptFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [editDept, setEditDept] = useState<OfficeDepartment | null | "new">(null)
  const [editMember, setEditMember] = useState<OfficeMember | null | "new">(null)
  const [showInvite, setShowInvite] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(OFFICE_URL, { headers: { "X-Admin-Token": token } })
      const data = await res.json()
      setMembers(data.members || [])
      setDepartments(data.departments || [])
      setInvites(data.invites || [])
      setRoles(data.roles || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const api = async (body: Record<string, unknown>) => {
    const res = await fetch(OFFICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  // Dept actions
  const saveDept = async (data: Partial<OfficeDepartment>) => {
    const action = (data as { id?: string }).id ? "dept_update" : "dept_create"
    await api({ action, ...data })
    setEditDept(null)
    load()
  }
  const removeDept = async (id: string) => {
    if (!confirm("Удалить отдел? Сотрудники останутся без отдела.")) return
    await api({ action: "dept_remove", id })
    load()
  }

  // Member actions
  const saveMember = async (data: Record<string, string | null>) => {
    const action = data.id ? "member_update" : "member_add"
    await api({ action, ...data })
    setEditMember(null)
    load()
  }
  const fireMember = async (id: string) => {
    if (!confirm("Уволить сотрудника из офиса?")) return
    await api({ action: "member_update", id, status: "fired" })
    load()
  }

  // Invite actions
  const createInvite = async (data: Record<string, string | null>) => {
    const res = await api({ action: "invite_create", ...data })
    setShowInvite(false)
    if (res.token) setCreatedToken(res.token)
    load()
  }
  const revokeInvite = async (id: string) => {
    await api({ action: "invite_revoke", id })
    load()
  }

  // Derived data
  const activeMembers = members.filter(m => m.status === "active")
  const firedMembers = members.filter(m => m.status === "fired")

  const filteredMembers = activeMembers.filter(m => {
    const inDept = deptFilter === "all" || (deptFilter === "none" ? !m.department_id : m.department_id === deptFilter)
    const inSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    return inDept && inSearch
  })

  const pendingInvites = invites.filter(i => i.status === "pending")
  const archiveInvites = invites.filter(i => i.status !== "pending")

  const PAGE_TITLES: Record<Tab, { title: string; subtitle: string; icon: string }> = {
    members:     { title: "Команда",      subtitle: `${activeMembers.length} сотрудников`,    icon: "UsersRound" },
    departments: { title: "Отделы",       subtitle: `${departments.length} отделов`,           icon: "Network" },
    invites:     { title: "Приглашения",  subtitle: `${pendingInvites.length} активных`,       icon: "Mail" },
  }
  const pageInfo = PAGE_TITLES[tab]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="px-6 py-4 border-b border-[#1f1f1f] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{pageInfo.title}</h2>
            <p className="text-xs text-gray-500">Онлайн Офис · {pageInfo.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {(tab === "members" || tab === "invites") && (
              <Button onClick={() => setShowInvite(true)} size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                <Icon name="UserPlus" className="h-3.5 w-3.5 mr-1.5" />
                Пригласить
              </Button>
            )}
            {tab === "departments" && (
              <Button onClick={() => setEditDept("new")} size="sm"
                className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white text-xs">
                <Icon name="Plus" className="h-3.5 w-3.5 mr-1.5" />
                Новый отдел
              </Button>
            )}
            <Button onClick={load} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
              <Icon name={loading ? "Loader2" : "RefreshCw"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "members" && (
          <MembersView
            activeMembers={activeMembers}
            firedMembers={firedMembers}
            filteredMembers={filteredMembers}
            departments={departments}
            deptFilter={deptFilter}
            search={search}
            onDeptFilter={setDeptFilter}
            onSearch={setSearch}
            onEdit={m => setEditMember(m)}
            onFire={fireMember}
            onRestore={id => saveMember({ id, status: "active" })}
            onAdd={() => setShowInvite(true)}
          />
        )}
        {tab === "departments" && (
          <DepartmentsView
            departments={departments}
            activeMembers={activeMembers}
            onEdit={d => setEditDept(d)}
            onRemove={removeDept}
            onAdd={() => setEditDept("new")}
          />
        )}
        {tab === "invites" && (
          <InvitesView
            pendingInvites={pendingInvites}
            archiveInvites={archiveInvites}
            onRevoke={revokeInvite}
            onAdd={() => setShowInvite(true)}
          />
        )}
      </div>

      {/* Модалки */}
      {editDept !== null && (
        <DeptModal
          dept={editDept === "new" ? null : editDept}
          members={activeMembers}
          onClose={() => setEditDept(null)}
          onSave={saveDept}
        />
      )}
      {editMember !== null && editMember !== "new" && (
        <MemberModal
          member={editMember}
          departments={departments}
          roles={roles}
          allUsers={allUsers || []}
          onClose={() => setEditMember(null)}
          onSave={saveMember}
        />
      )}
      {showInvite && (
        <InviteModal
          departments={departments}
          roles={roles}
          onClose={() => setShowInvite(false)}
          onSave={createInvite}
        />
      )}

      {/* Показ токена после создания */}
      {createdToken && (
        <TokenPanel token={createdToken} onClose={() => setCreatedToken(null)} />
      )}
    </div>
  )
}