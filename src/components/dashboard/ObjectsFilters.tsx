import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface Props {
  catFilter: string
  setCatFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  objSearch: string
  setObjSearch: (v: string) => void
  viewMode: "grid" | "list"
  setViewMode: (v: "grid" | "list") => void
  archivedCount: number
  onShowArchive: () => void
  employees?: Array<{ user_id: string; name: string; department_id?: string }>
  departments?: Array<{ id: string; name: string }>
  employeeFilter: string
  setEmployeeFilter: (v: string) => void
  deptFilter: string
  setDeptFilter: (v: string) => void
}

const CATEGORIES = [
  { label: "Все",         icon: "",             color: "" },
  { label: "Коммерция",   icon: "Building2",    color: "" },
  { label: "Новостройки", icon: "Construction", color: "" },
  { label: "Инвестиции",  icon: "TrendingUp",   color: "" },
  { label: "Курортная",   icon: "Sun",          color: "cyan" },
  { label: "Торги",       icon: "Gavel",        color: "" },
  { label: "Жилая",       icon: "Home",         color: "" },
]

const STATUSES = ["Все", "Активен", "Черновик", "Ожидает аукциона"]

export default function ObjectsFilters({
  catFilter, setCatFilter,
  statusFilter, setStatusFilter,
  objSearch, setObjSearch,
  viewMode, setViewMode,
  archivedCount, onShowArchive,
  employees, departments,
  employeeFilter, setEmployeeFilter,
  deptFilter, setDeptFilter,
}: Props) {
  return (
    <>
      {/* Строка 1: Категории + Архив */}
      <div className="flex flex-wrap gap-2 mb-2">
        {CATEGORIES.map(({ label, icon, color }) => (
          <button
            key={label}
            onClick={() => setCatFilter(label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              catFilter === label
                ? color === "cyan" ? "bg-cyan-600 text-white" : "bg-blue-600 text-white"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            {icon && <Icon name={icon as "Home"} className="h-3 w-3" />}
            {label}
          </button>
        ))}
        <button
          onClick={onShowArchive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
        >
          <Icon name="Archive" className="h-3 w-3" />
          Архив
          {archivedCount > 0 && (
            <span className="bg-amber-500/30 text-amber-300 rounded-full text-[10px] px-1.5 leading-4">
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Строка 2: Статусы */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STATUSES.map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === st ? "bg-[#1f1f1f] text-white border border-[#333]" : "text-gray-500 hover:text-white"
            }`}
          >
            {st === "Активен" ? "✓ " : ""}{st}
          </button>
        ))}
      </div>

      {/* Строка 3: Отделы + Сотрудники + Поиск + Вид */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {departments && departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setEmployeeFilter("") }}
            className="rounded-xl bg-[#111] border border-[#1f1f1f] text-sm px-3 py-1.5 text-white focus:outline-none"
          >
            <option value="">Все отделы</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        )}
        {employees && employees.length > 0 && (
          <select
            value={employeeFilter}
            onChange={e => { setEmployeeFilter(e.target.value); setDeptFilter("") }}
            className="rounded-xl bg-[#111] border border-[#1f1f1f] text-sm px-3 py-1.5 text-white focus:outline-none"
          >
            <option value="">Все сотрудники</option>
            {employees.map(emp => (
              <option key={emp.user_id} value={emp.user_id}>{emp.name}</option>
            ))}
          </select>
        )}
        {(deptFilter || employeeFilter) && (
          <button
            onClick={() => { setDeptFilter(""); setEmployeeFilter("") }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <Icon name="X" className="h-3 w-3" /> Сбросить
          </button>
        )}
        <div className="flex-1" />
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Поиск по названию / городу..."
            value={objSearch}
            onChange={e => setObjSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600 w-52"
          />
        </div>
        <div className="flex items-center rounded-xl border border-[#1f1f1f] bg-[#111] p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-white"}`}
            title="Сетка"
          >
            <Icon name="LayoutGrid" className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-white"}`}
            title="Список"
          >
            <Icon name="List" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
