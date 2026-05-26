import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import {
  OfficeMember, OfficeDepartment, OfficeInvite, Role,
  DEPT_COLOR_MAP, DEPT_COLORS, ROLE_COLOR, initials,
} from "./AdminOfficeTypes"

// ── Модалка Отдел ─────────────────────────────────────────────────────────────
export function DeptModal({
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
export function MemberModal({
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
export function InviteModal({
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

// ── Показ токена после создания ───────────────────────────────────────────────
export function TokenPanel({
  token, onClose,
}: {
  token: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="CheckCircle" className="h-5 w-5 text-emerald-400" />
          <h3 className="font-bold text-white">Приглашение создано</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Скопируйте токен и передайте сотруднику. Он действителен 7 дней.</p>
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3 font-mono text-xs text-emerald-300 break-all mb-4">
          {token}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigator.clipboard.writeText(token)} variant="outline"
            className="flex-1 border-[#2a2a2a] text-gray-300 hover:text-white bg-transparent text-xs">
            <Icon name="Copy" className="h-3.5 w-3.5 mr-1.5" />
            Скопировать
          </Button>
          <Button onClick={onClose} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            Готово
          </Button>
        </div>
      </div>
    </div>
  )
}
