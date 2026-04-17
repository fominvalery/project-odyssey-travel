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
import { Department, Employee, ROLE_TITLES, RoleCode } from "@/lib/agencyApi"

const EDITABLE_ROLES: RoleCode[] = [
  "director",
  "rop",
  "broker",
  "manager",
  "marketer",
  "accountant",
  "lawyer",
  "mortgage_broker",
]

interface Props {
  employees: Employee[]
  departments: Department[]
  deptFilter: string
  setDeptFilter: (v: string) => void
  isDirector: boolean
  currentUserId?: string
  onChangeRole: (userId: string, role: RoleCode) => void
  onChangeDepartment: (userId: string, deptId: string | null) => void
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
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
  employees,
  departments,
  deptFilter,
  setDeptFilter,
  isDirector,
  currentUserId,
  onChangeRole,
  onChangeDepartment,
}: Props) {
  const filteredEmployees = employees.filter((e) => {
    if (deptFilter === "all") return true
    if (deptFilter === "none") return !e.department_id
    return e.department_id === deptFilter
  })

  return (
    <div className="space-y-3">
      {departments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 mr-1">Отдел:</span>
          <FilterChip
            active={deptFilter === "all"}
            onClick={() => setDeptFilter("all")}
          >
            Все ({employees.length})
          </FilterChip>
          {departments.map((d) => {
            const count = employees.filter((e) => e.department_id === d.id).length
            return (
              <FilterChip
                key={d.id}
                active={deptFilter === d.id}
                onClick={() => setDeptFilter(d.id)}
              >
                {d.name} ({count})
              </FilterChip>
            )
          })}
          <FilterChip
            active={deptFilter === "none"}
            onClick={() => setDeptFilter("none")}
          >
            Без отдела ({employees.filter((e) => !e.department_id).length})
          </FilterChip>
        </div>
      )}

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Icon name="Users" size={36} className="mx-auto mb-3 opacity-50" />
            Нет сотрудников в выбранном отделе
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredEmployees.map((e) => {
              const deptName = departments.find(
                (d) => d.id === e.department_id,
              )?.name
              return (
                <div
                  key={e.user_id}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:bg-white/5"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                    <AvatarFallback className="bg-violet-500/30 text-violet-200">
                      {e.full_name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.full_name}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {e.email}
                      {e.phone ? ` · ${e.phone}` : ""}
                    </div>
                    {deptName && (
                      <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                        <Icon name="Network" size={11} />
                        {deptName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isDirector &&
                      e.user_id !== currentUserId &&
                      departments.length > 0 && (
                        <Select
                          value={e.department_id ?? "__none__"}
                          onValueChange={(v) =>
                            onChangeDepartment(
                              e.user_id,
                              v === "__none__" ? null : v,
                            )
                          }
                        >
                          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                            <SelectValue placeholder="Отдел" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Без отдела</SelectItem>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    {isDirector && e.user_id !== currentUserId ? (
                      <Select
                        value={e.role_code}
                        onValueChange={(v) => onChangeRole(e.user_id, v as RoleCode)}
                      >
                        <SelectTrigger className="w-[220px] bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDITABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_TITLES[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-violet-500/50 text-violet-200"
                      >
                        {ROLE_TITLES[e.role_code]}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
