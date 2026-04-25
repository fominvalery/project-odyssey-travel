import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { Department, Employee, ROLE_TITLES, RoleCode, ADMIN_ROLES } from "@/lib/agencyApi"

const BASE_EDITABLE_ROLES: RoleCode[] = [
  "rop", "broker", "manager", "marketer", "accountant", "lawyer", "mortgage_broker",
]
const FOUNDER_ONLY_ROLES: RoleCode[] = ["director"]

interface Props {
  employees: Employee[]
  departments: Department[]
  deptFilter: string
  setDeptFilter: (v: string) => void
  isDirector: boolean
  isFounder?: boolean
  isRop?: boolean
  currentUserId?: string
  myDeptId?: string | null
  onChangeRole: (userId: string, role: RoleCode) => void
  onChangeDepartment: (userId: string, deptId: string | null) => void
  onFireEmployee?: (userId: string) => Promise<void>
  onInvite?: () => void
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-gradient-to-r from-violet-500 to-pink-500 border-transparent text-white"
          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  )
}

export default function AgencyEmployeesTab({
  employees, departments, deptFilter, setDeptFilter,
  isDirector, isFounder = false, isRop = false,
  currentUserId, myDeptId,
  onChangeRole, onChangeDepartment, onFireEmployee, onInvite,
}: Props) {
  const [firingEmployee, setFiringEmployee] = useState<Employee | null>(null)
  const [firing, setFiring] = useState(false)

  const editableRoles: RoleCode[] = isFounder
    ? [...FOUNDER_ONLY_ROLES, ...BASE_EDITABLE_ROLES]
    : BASE_EDITABLE_ROLES

  const filteredEmployees = employees.filter((e) => {
    if (deptFilter === "all") return true
    if (deptFilter === "none") return !e.department_id
    return e.department_id === deptFilter
  })

  async function handleFire() {
    if (!firingEmployee || !onFireEmployee) return
    setFiring(true)
    try {
      await onFireEmployee(firingEmployee.user_id)
      setFiringEmployee(null)
    } finally {
      setFiring(false)
    }
  }

  // РОП видит только свой отдел и может приглашать
  const canInvite = isDirector || isRop

  return (
    <div className="space-y-3">
      {/* Заголовок + кнопка приглашения */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {departments.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Отдел:</span>
            <FilterChip active={deptFilter === "all"} onClick={() => setDeptFilter("all")}>
              Все ({employees.length})
            </FilterChip>
            {departments.map((d) => {
              const count = employees.filter((e) => e.department_id === d.id).length
              return (
                <FilterChip key={d.id} active={deptFilter === d.id} onClick={() => setDeptFilter(d.id)}>
                  {d.name} ({count})
                </FilterChip>
              )
            })}
            <FilterChip active={deptFilter === "none"} onClick={() => setDeptFilter("none")}>
              Без отдела ({employees.filter((e) => !e.department_id).length})
            </FilterChip>
          </div>
        )}
        {canInvite && onInvite && (
          <button
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            <Icon name="UserPlus" size={15} />
            Пригласить сотрудника
          </button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Icon name="Users" size={36} className="mx-auto mb-3 opacity-50" />
            Нет сотрудников в выбранном отделе
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredEmployees.map((e) => {
              const deptName = departments.find((d) => d.id === e.department_id)?.name
              const targetIsAdmin = ADMIN_ROLES.includes(e.role_code)
              const canEditThisUser = isDirector && e.user_id !== currentUserId && (isFounder || !targetIsAdmin)
              const canFireThisUser = isDirector && e.user_id !== currentUserId && (isFounder || !targetIsAdmin)

              return (
                <div key={e.user_id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:bg-white/5">
                  <Avatar className="h-10 w-10 shrink-0">
                    {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                    <AvatarFallback className="bg-violet-500/30 text-violet-200">
                      {e.full_name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.full_name}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {e.email}{e.phone ? ` · ${e.phone}` : ""}
                    </div>
                    {deptName && (
                      <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                        <Icon name="Network" size={11} />
                        {deptName}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {canEditThisUser && departments.length > 0 && (
                      <Select
                        value={e.department_id ?? "__none__"}
                        onValueChange={(v) => onChangeDepartment(e.user_id, v === "__none__" ? null : v)}
                      >
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                          <SelectValue placeholder="Отдел" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Без отдела</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {canEditThisUser ? (
                      <Select
                        value={e.role_code}
                        onValueChange={(v) => onChangeRole(e.user_id, v as RoleCode)}
                      >
                        <SelectTrigger className="w-[220px] bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {editableRoles.map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_TITLES[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          e.role_code === "founder"
                            ? "border-amber-400/60 text-amber-300 bg-amber-400/10"
                            : e.role_code === "director"
                            ? "border-sky-400/60 text-sky-300 bg-sky-400/10"
                            : "border-violet-500/50 text-violet-200"
                        }
                      >
                        {e.role_code === "founder" && <Icon name="Crown" size={11} className="mr-1" />}
                        {ROLE_TITLES[e.role_code]}
                      </Badge>
                    )}

                    {/* Кнопка уволить — только директор/учредитель */}
                    {canFireThisUser && (
                      <button
                        onClick={() => setFiringEmployee(e)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Уволить сотрудника"
                      >
                        <Icon name="UserMinus" size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Диалог подтверждения увольнения */}
      {firingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Icon name="UserMinus" size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Уволить сотрудника?</p>
                <p className="text-sm text-gray-400 mt-0.5">{firingEmployee.full_name}</p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 mb-5 space-y-2">
              <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Icon name="AlertTriangle" size={13} />
                Что произойдёт с данными
              </p>
              <ul className="text-xs text-gray-400 space-y-1.5">
                <li className="flex items-start gap-2">
                  <Icon name="Building2" size={12} className="text-gray-500 mt-0.5 shrink-0" />
                  Все объекты перейдут РОПу отдела (если назначен), иначе — директору или учредителю
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Users" size={12} className="text-gray-500 mt-0.5 shrink-0" />
                  Все клиенты (лиды) будут переданы по той же схеме
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="RefreshCw" size={12} className="text-gray-500 mt-0.5 shrink-0" />
                  Объекты получат статус <span className="text-amber-400 font-medium">"Актуализировать"</span> для проверки актуальности
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="LayoutGrid" size={12} className="text-gray-500 mt-0.5 shrink-0" />
                  Получатель сможет распределить объекты по другим сотрудникам
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setFiringEmployee(null)}
                disabled={firing}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-[#1a1a1a] hover:bg-[#222] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleFire}
                disabled={firing}
                className="flex-1 py-2.5 rounded-xl text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {firing
                  ? <><Icon name="Loader2" size={14} className="animate-spin" />Увольнение...</>
                  : <><Icon name="UserMinus" size={14} />Уволить и передать данные</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
