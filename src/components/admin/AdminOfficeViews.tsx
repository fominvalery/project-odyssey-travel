import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import {
  OfficeMember, OfficeDepartment, OfficeInvite,
  DEPT_COLOR_MAP, ROLE_COLOR, initials,
} from "./AdminOfficeTypes"

// ── Вкладка Команда ───────────────────────────────────────────────────────────
export function MembersView({
  activeMembers,
  firedMembers,
  filteredMembers,
  departments,
  deptFilter,
  search,
  onDeptFilter,
  onSearch,
  onEdit,
  onFire,
  onRestore,
  onAdd,
}: {
  activeMembers: OfficeMember[]
  firedMembers: OfficeMember[]
  filteredMembers: OfficeMember[]
  departments: OfficeDepartment[]
  deptFilter: string
  search: string
  onDeptFilter: (v: string) => void
  onSearch: (v: string) => void
  onEdit: (m: OfficeMember) => void
  onFire: (id: string) => void
  onRestore: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input placeholder="Поиск по имени или email..." value={search} onChange={e => onSearch(e.target.value)}
            className="pl-9 bg-[#111] border-[#1f1f1f] text-white text-xs placeholder:text-gray-600 h-8" />
        </div>
        {departments.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all",  label: `Все (${activeMembers.length})` },
              ...departments.map(d => ({ id: d.id, label: `${d.name} (${activeMembers.filter(m => m.department_id === d.id).length})` })),
              { id: "none", label: `Без отдела (${activeMembers.filter(m => !m.department_id).length})` },
            ].map(f => (
              <button key={f.id} onClick={() => onDeptFilter(f.id)}
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
            <Button onClick={onAdd} size="sm" className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-xs">
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
                    <button onClick={() => onEdit(m)} className="text-gray-600 hover:text-white transition-colors p-1">
                      <Icon name="Pencil" className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onFire(m.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1">
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
                <button onClick={() => onRestore(m.id)}
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                  Восстановить
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ── Вкладка Отделы ────────────────────────────────────────────────────────────
export function DepartmentsView({
  departments,
  activeMembers,
  onEdit,
  onRemove,
  onAdd,
}: {
  departments: OfficeDepartment[]
  activeMembers: OfficeMember[]
  onEdit: (d: OfficeDepartment) => void
  onRemove: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{departments.length} отделов</p>
        <Button onClick={onAdd} size="sm"
          className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white text-xs md:hidden">
          <Icon name="Plus" className="h-3.5 w-3.5 mr-1" />
          Новый отдел
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-[#2a2a2a] rounded-2xl">
          <Icon name="Network" className="h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Нет отделов</p>
          <Button onClick={onAdd} size="sm" className="mt-3 bg-violet-600 hover:bg-violet-700 text-white text-xs">
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
                    <button onClick={() => onEdit(d)} className="text-gray-600 hover:text-white p-1 transition-colors">
                      <Icon name="Pencil" className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onRemove(d.id)} className="text-gray-700 hover:text-red-400 p-1 transition-colors">
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
  )
}

// ── Вкладка Приглашения ───────────────────────────────────────────────────────
export function InvitesView({
  pendingInvites,
  archiveInvites,
  onRevoke,
  onAdd,
}: {
  pendingInvites: OfficeInvite[]
  archiveInvites: OfficeInvite[]
  onRevoke: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Активные */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Активные ({pendingInvites.length})</h3>
          <Button onClick={onAdd} size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:hidden">
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
                    <span className={`text-xs px-1.5 py-0.5 rounded ${"text-gray-400 bg-gray-500/10"}`}>
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
                  <button onClick={() => onRevoke(inv.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
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
  )
}
