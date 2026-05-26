import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const OFFICE_URL = (func2url as Record<string, string>)["office-team"]

// ── Типы ──────────────────────────────────────────────────────────────────────
interface OfficeMember {
  id: string
  user_id: string
  department_id: string | null
  role_code: string
  role_label: string
  job_title: string | null
  status: string
  joined_at: string
  name: string
  email: string
  phone: string
  avatar: string
  dept_name: string | null
}

interface OfficeDepartment {
  id: string
  name: string
  description: string | null
  head_id: string | null
  head_name: string | null
  color: string
  members_count: number
  created_at: string
}

interface OfficeInvite {
  id: string
  email: string
  role_code: string
  role_label: string
  department_id: string | null
  dept_name: string | null
  job_title: string | null
  token: string
  status: string
  expires_at: string | null
  created_at: string
}

interface Role { id: string; label: string }

// ── Цвета ─────────────────────────────────────────────────────────────────────
const DEPT_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-300",    dot: "bg-blue-400" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-300",  dot: "bg-violet-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-300",   dot: "bg-amber-400" },
  red:     { bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-300",     dot: "bg-red-400" },
  pink:    { bg: "bg-pink-500/10",    border: "border-pink-500/20",    text: "text-pink-300",    dot: "bg-pink-400" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-300",    dot: "bg-cyan-400" },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-300",  dot: "bg-orange-400" },
}

const ROLE_COLOR: Record<string, string> = {
  owner:     "text-red-300 bg-red-500/10",
  director:  "text-orange-300 bg-orange-500/10",
  head:      "text-amber-300 bg-amber-500/10",
  analyst:   "text-blue-300 bg-blue-500/10",
  support:   "text-emerald-300 bg-emerald-500/10",
  developer: "text-violet-300 bg-violet-500/10",
  marketer:  "text-pink-300 bg-pink-500/10",
  staff:     "text-gray-400 bg-gray-500/10",
}

const DEPT_COLORS = ["blue", "violet", "emerald", "amber", "red", "pink", "cyan", "orange"]

// ── Утилиты ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

// ── Модалка Отдел ─────────────────────────────────────────────────────────────
function DeptModal({
  dept, members, onClose, onSave,
}: {
  dept: OfficeDepartment | null
  members: OfficeMember[]
  onClose: () => void
  onSave: (data: Partial<OfficeDepartment>) => void
}) {
  const [name, setName] = useState(dept?.name || "")
  const [description, setDescription] = useState(dept?.description || "")
  const [color, setColor] = useState(dept?.color || "blue")
  const [headId, setHeadId] = useState(dept?.head_id || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ ...(dept ? { id: dept.id } : {}), name: name.trim(), description, color, head_id: headId || null })
    setSaving(false)
  }

  const c = DEPT_COLOR_MAP[color] || DEPT_COLOR_MAP.blue

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <h3 className="font-bold text-white">{dept ? "Редактировать отдел" : "Новый отдел"}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><Icon name="X" className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Название *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Отдел продаж"
              className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Описание</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Чем занимается отдел..."
              className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Цвет</label>
            <div className="flex gap-2 flex-wrap">
              {DEPT_COLORS.map(col => {
                const cc = DEPT_COLOR_MAP[col]
                return (
                  <button key={col} onClick={() => setColor(col)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${cc.dot} ${color === col ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                  />
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Руководитель отдела</label>
            <select value={headId} onChange={e => setHeadId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
              <option value="">— не назначен —</option>
              {members.filter(m => m.status === "active").map(m => (
                <option key={m.user_id} value={m.user_id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <Button onClick={onClose} variant="outline" className="flex-1 border-[#2a2a2a] text-gray-400 hover:text-white bg-transparent">Отмена</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}
            className={`flex-1 ${c.bg} ${c.text} border ${c.border} hover:opacity-90`}>
            {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-1" /> : <Icon name="Check" className="h-4 w-4 mr-1" />}
            {dept ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Модалка Сотрудник ─────────────────────────────────────────────────────────
function MemberModal({
  member, departments, roles, allUsers, onClose, onSave,
}: {
  member: OfficeMember | null
  departments: OfficeDepartment[]
  roles: Role[]
  allUsers: { id: string; name: string; email: string }[]
  onClose: () => void
  onSave: (data: Record<string, string | null>) => void
}) {
  const [userId, setUserId] = useState(member?.user_id || "")
  const [roleCode, setRoleCode] = useState(member?.role_code || "staff")
  const [deptId, setDeptId] = useState(member?.department_id || "")
  const [jobTitle, setJobTitle] = useState(member?.job_title || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!userId && !member) return
    setSaving(true)
    await onSave({
      ...(member ? { id: member.id } : { user_id: userId }),
      role_code: roleCode,
      department_id: deptId || null,
      job_title: jobTitle,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <h3 className="font-bold text-white">{member ? "Редактировать сотрудника" : "Добавить сотрудника"}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><Icon name="X" className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!member && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Аккаунт *</label>
              <select value={userId} onChange={e => setUserId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
                <option value="">— выбрать аккаунт —</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          )}
          {member && (
            <div className="flex items-center gap-3 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-xs font-bold">
                {initials(member.name)}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{member.name}</div>
                <div className="text-gray-500 text-xs">{member.email}</div>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Роль</label>
            <select value={roleCode} onChange={e => setRoleCode(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Отдел</label>
            <select value={deptId} onChange={e => setDeptId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
              <option value="">— без отдела —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Должность</label>
            <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Например: Старший менеджер"
              className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <Button onClick={onClose} variant="outline" className="flex-1 border-[#2a2a2a] text-gray-400 hover:text-white bg-transparent">Отмена</Button>
          <Button onClick={handleSave} disabled={saving || (!userId && !member)}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-1" /> : <Icon name="Check" className="h-4 w-4 mr-1" />}
            {member ? "Сохранить" : "Добавить"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Модалка Приглашение ───────────────────────────────────────────────────────
function InviteModal({
  departments, roles, onClose, onSave,
}: {
  departments: OfficeDepartment[]
  roles: Role[]
  onClose: () => void
  onSave: (data: Record<string, string | null>) => void
}) {
  const [email, setEmail] = useState("")
  const [roleCode, setRoleCode] = useState("staff")
  const [deptId, setDeptId] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!email.trim()) return
    setSaving(true)
    await onSave({ email: email.trim(), role_code: roleCode, department_id: deptId || null, job_title: jobTitle })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <h3 className="font-bold text-white">Пригласить сотрудника</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><Icon name="X" className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            Приглашение создаёт токен-ссылку. Передайте её сотруднику вручную — без привязки к тарифам.
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Email *</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@company.com"
              className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Роль</label>
            <select value={roleCode} onChange={e => setRoleCode(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Отдел</label>
            <select value={deptId} onChange={e => setDeptId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
              <option value="">— без отдела —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Должность</label>
            <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Например: Специалист поддержки"
              className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <Button onClick={onClose} variant="outline" className="flex-1 border-[#2a2a2a] text-gray-400 hover:text-white bg-transparent">Отмена</Button>
          <Button onClick={handleSave} disabled={saving || !email.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-1" /> : <Icon name="Send" className="h-4 w-4 mr-1" />}
            Создать приглашение
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Главный компонент ─────────────────────────────────────────────────────────
type Tab = "members" | "departments" | "invites"

export default function AdminOfficeTeam({
  allUsers,
  token = "k24admin",
}: {
  allUsers?: { id: string; name: string; email: string }[]
  token?: string
}) {
  const [tab, setTab] = useState<Tab>("members")
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

  // Фильтрация сотрудников
  const activeMembers = members.filter(m => m.status === "active")
  const firedMembers = members.filter(m => m.status === "fired")

  const filteredMembers = activeMembers.filter(m => {
    const inDept = deptFilter === "all" || (deptFilter === "none" ? !m.department_id : m.department_id === deptFilter)
    const inSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    return inDept && inSearch
  })

  const pendingInvites = invites.filter(i => i.status === "pending")
  const archiveInvites = invites.filter(i => i.status !== "pending")

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="px-6 py-4 border-b border-[#1f1f1f] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Онлайн Офис</h2>
            <p className="text-xs text-gray-500">Команда Кабинет-24 · {activeMembers.length} сотрудников</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowInvite(true)} size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              <Icon name="UserPlus" className="h-3.5 w-3.5 mr-1.5" />
              Пригласить
            </Button>
            <Button onClick={() => setEditMember("new")} size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
              <Icon name="Plus" className="h-3.5 w-3.5 mr-1.5" />
              Добавить
            </Button>
            <Button onClick={load} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
              <Icon name={loading ? "Loader2" : "RefreshCw"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1">
          {[
            { id: "members" as Tab,     label: "Команда",       icon: "Users",      count: activeMembers.length },
            { id: "departments" as Tab, label: "Отделы",        icon: "Network",    count: departments.length },
            { id: "invites" as Tab,     label: "Приглашения",   icon: "Mail",       count: pendingInvites.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon name={t.icon as "Users"} className="h-3.5 w-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${tab === t.id ? "bg-white/20 text-white" : "bg-white/5 text-gray-500"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Вкладка Команда ────────────────────────────────────────────── */}
        {tab === "members" && (
          <div className="space-y-4">
            {/* Фильтры */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <Input placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-[#111] border-[#1f1f1f] text-white text-xs placeholder:text-gray-600 h-8" />
              </div>
              {departments.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all",  label: `Все (${activeMembers.length})` },
                    ...departments.map(d => ({ id: d.id, label: `${d.name} (${activeMembers.filter(m => m.department_id === d.id).length})` })),
                    { id: "none", label: `Без отдела (${activeMembers.filter(m => !m.department_id).length})` },
                  ].map(f => (
                    <button key={f.id} onClick={() => setDeptFilter(f.id)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        deptFilter === f.id
                          ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Список */}
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
              {filteredMembers.length === 0 ? (
                <div className="py-14 text-center">
                  <Icon name="Users" className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Нет сотрудников</p>
                  <Button onClick={() => setEditMember("new")} size="sm" className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-xs">
                    Добавить первого
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {filteredMembers.map(m => {
                    const dc = m.department_id ? (DEPT_COLOR_MAP[departments.find(d => d.id === m.department_id)?.color || "blue"] || DEPT_COLOR_MAP.blue) : null
                    return (
                      <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#111] transition-colors">
                        <Avatar className="h-9 w-9 shrink-0">
                          {m.avatar && <AvatarImage src={m.avatar} />}
                          <AvatarFallback className="bg-violet-500/20 text-violet-300 text-xs font-bold">
                            {initials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white truncate">{m.name}</span>
                            {m.job_title && <span className="text-xs text-gray-500 truncate">· {m.job_title}</span>}
                          </div>
                          <div className="text-xs text-gray-500">{m.email}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.dept_name && dc && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${dc.bg} ${dc.border} ${dc.text}`}>
                              {m.dept_name}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLOR[m.role_code] || ROLE_COLOR.staff}`}>
                            {m.role_label}
                          </span>
                          <button onClick={() => setEditMember(m)} className="text-gray-600 hover:text-white transition-colors p-1">
                            <Icon name="Pencil" className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => fireMember(m.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1">
                            <Icon name="UserMinus" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Уволенные */}
            {firedMembers.length > 0 && (
              <details className="group">
                <summary className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer flex items-center gap-1.5 select-none">
                  <Icon name="ChevronRight" className="h-3 w-3 group-open:rotate-90 transition-transform" />
                  Уволенные ({firedMembers.length})
                </summary>
                <div className="mt-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl divide-y divide-[#1a1a1a]">
                  {firedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-gray-500/20 text-gray-500 text-xs">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500 flex-1 truncate">{m.name}</span>
                      <span className="text-xs text-gray-600">{m.email}</span>
                      <button onClick={() => saveMember({ id: m.id, status: "active" })}
                        className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                        Восстановить
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* ── Вкладка Отделы ─────────────────────────────────────────────── */}
        {tab === "departments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{departments.length} отделов</p>
              <Button onClick={() => setEditDept("new")} size="sm"
                className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white text-xs">
                <Icon name="Plus" className="h-3.5 w-3.5 mr-1" />
                Новый отдел
              </Button>
            </div>

            {departments.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-[#2a2a2a] rounded-2xl">
                <Icon name="Network" className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Нет отделов</p>
                <Button onClick={() => setEditDept("new")} size="sm" className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  Создать первый
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map(d => {
                  const c = DEPT_COLOR_MAP[d.color] || DEPT_COLOR_MAP.blue
                  const deptMembers = activeMembers.filter(m => m.department_id === d.id)
                  return (
                    <div key={d.id} className={`p-4 rounded-xl border bg-[#0d0d0d] hover:border-[#3a3a3a] transition-colors ${c.border}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                            <span className="font-semibold text-white truncate">{d.name}</span>
                          </div>
                          {d.description && <p className="text-xs text-gray-500 mt-1 truncate">{d.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditDept(d)} className="text-gray-600 hover:text-white p-1 transition-colors">
                            <Icon name="Pencil" className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => removeDept(d.id)} className="text-gray-700 hover:text-red-400 p-1 transition-colors">
                            <Icon name="Trash2" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Сотрудники отдела */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex -space-x-1.5">
                          {deptMembers.slice(0, 5).map(m => (
                            <Avatar key={m.id} className="h-6 w-6 border border-[#0d0d0d] shrink-0">
                              {m.avatar && <AvatarImage src={m.avatar} />}
                              <AvatarFallback className="bg-violet-500/30 text-violet-300 text-[10px]">{m.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {deptMembers.length > 5 && (
                            <div className="h-6 w-6 rounded-full bg-[#2a2a2a] border border-[#0d0d0d] flex items-center justify-center">
                              <span className="text-[9px] text-gray-400">+{deptMembers.length - 5}</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs ${c.text}`}>{d.members_count} сотрудников</span>
                      </div>

                      {/* Руководитель */}
                      <div className={`flex items-center gap-2 pt-2.5 border-t ${c.border}`}>
                        <Icon name="Crown" className={`h-3.5 w-3.5 ${c.text}`} />
                        <span className="text-xs text-gray-400">
                          {d.head_name ? <span className="text-white">{d.head_name}</span> : "Руководитель не назначен"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Вкладка Приглашения ─────────────────────────────────────────── */}
        {tab === "invites" && (
          <div className="space-y-4">
            {/* Активные */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Активные ({pendingInvites.length})</h3>
                <Button onClick={() => setShowInvite(true)} size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  <Icon name="Plus" className="h-3.5 w-3.5 mr-1" />
                  Новое
                </Button>
              </div>

              {pendingInvites.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-[#2a2a2a] rounded-xl">
                  <Icon name="Mail" className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Нет активных приглашений</p>
                </div>
              ) : (
                <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl divide-y divide-[#1a1a1a]">
                  {pendingInvites.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Icon name="Mail" className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{inv.email}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLOR[inv.role_code] || ROLE_COLOR.staff}`}>
                            {inv.role_label}
                          </span>
                          {inv.dept_name && <span className="text-xs text-gray-500">· {inv.dept_name}</span>}
                          {inv.expires_at && (
                            <span className="text-xs text-gray-600">
                              до {new Date(inv.expires_at).toLocaleDateString("ru-RU")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { navigator.clipboard.writeText(inv.token); alert(`Токен скопирован:\n${inv.token}`) }}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <Icon name="Copy" className="h-3.5 w-3.5" />
                          Токен
                        </button>
                        <button onClick={() => revokeInvite(inv.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                          <Icon name="X" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Архив */}
            {archiveInvites.length > 0 && (
              <details className="group">
                <summary className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer flex items-center gap-1.5 select-none">
                  <Icon name="ChevronRight" className="h-3 w-3 group-open:rotate-90 transition-transform" />
                  Архив ({archiveInvites.length})
                </summary>
                <div className="mt-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl divide-y divide-[#1a1a1a]">
                  {archiveInvites.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5 opacity-50">
                      <span className="text-sm text-gray-400 flex-1 truncate">{inv.email}</span>
                      <span className="text-xs text-gray-600">{inv.status === "accepted" ? "Принято" : "Истёк"}</span>
                      <span className="text-xs text-gray-600">{new Date(inv.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
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
      {editMember !== null && (
        <MemberModal
          member={editMember === "new" ? null : editMember}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="CheckCircle" className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-white">Приглашение создано</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Скопируйте токен и передайте сотруднику. Он действителен 7 дней.</p>
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3 font-mono text-xs text-emerald-300 break-all mb-4">
              {createdToken}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigator.clipboard.writeText(createdToken)} variant="outline"
                className="flex-1 border-[#2a2a2a] text-gray-300 hover:text-white bg-transparent text-xs">
                <Icon name="Copy" className="h-3.5 w-3.5 mr-1.5" />
                Скопировать
              </Button>
              <Button onClick={() => setCreatedToken(null)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Готово
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
