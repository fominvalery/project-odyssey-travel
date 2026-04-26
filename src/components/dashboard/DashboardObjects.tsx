import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"
import ObjectCard from "./ObjectCard"
import ListingsBanner from "./ListingsBanner"

const FREE_LIMIT = 3
const ARCHIVE_STATUSES = ["Продан", "Сдан"]

interface Props {
  objects: ObjectData[]
  loading?: boolean
  showWizard: boolean
  setShowWizard: (v: boolean) => void
  editingObject: ObjectData | null
  onEdit: (obj: ObjectData) => void
  onDelete: (id: string) => void
  onWizardSaved: (obj: ObjectData) => void
  onWizardClose: () => void
  catFilter: string
  setCatFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  objSearch: string
  setObjSearch: (v: string) => void
  userId: string
  isBasic?: boolean
  listingsUsed?: number
  listingsExtra?: number
  userEmail?: string
  userName?: string
  onArchive?: (id: string, status: "Продан" | "Сдан") => void
  onRestore?: (id: string) => void
  onSaveOwner?: (id: string, fields: Record<string, string>) => void
  onReassign?: (obj: import("@/components/AddObjectWizard").ObjectData) => void
  employees?: Array<{ user_id: string; name: string; department_id?: string }>
  departments?: Array<{ id: string; name: string }>
}

export default function DashboardObjects({
  objects, loading, showWizard, setShowWizard,
  editingObject, onEdit, onDelete, onWizardSaved, onWizardClose,
  catFilter, setCatFilter, statusFilter, setStatusFilter,
  objSearch, setObjSearch, userId,
  isBasic = false, listingsUsed = 0, listingsExtra = 0,
  userEmail = "", userName = "",
  onArchive, onRestore, onSaveOwner, onReassign,
  employees,
  departments,
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showArchive, setShowArchive] = useState(false)
  const [archiveSearch, setArchiveSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")

  const canAddListing = !isBasic || (listingsUsed < FREE_LIMIT + listingsExtra)

  function handleAddObject() {
    if (!canAddListing) return
    setShowWizard(true)
  }

  const activeObjects = objects.filter(o => !ARCHIVE_STATUSES.includes(o.status))
  const archivedObjects = objects.filter(o => ARCHIVE_STATUSES.includes(o.status))

  const deptEmployeeIds = deptFilter && employees
    ? new Set(employees.filter(e => e.department_id === deptFilter).map(e => e.user_id))
    : null

  const filtered = activeObjects.filter(o => {
    const matchCat = catFilter === "Все" || o.type === catFilter
    const matchSt = statusFilter === "Все" || o.status === statusFilter
    const matchSearch = !objSearch
      || o.title.toLowerCase().includes(objSearch.toLowerCase())
      || o.city.toLowerCase().includes(objSearch.toLowerCase())
    const matchEmployee = !employeeFilter || o.user_id === employeeFilter
    const matchDept = !deptEmployeeIds || deptEmployeeIds.has(o.user_id)
    return matchCat && matchSt && matchSearch && matchEmployee && matchDept
  })

  const filteredArchive = archivedObjects.filter(o => {
    if (!archiveSearch) return true
    return o.title.toLowerCase().includes(archiveSearch.toLowerCase())
      || o.city.toLowerCase().includes(archiveSearch.toLowerCase())
  })

  if (showArchive) {
    return (
      <>
        {showWizard && (
          <AddObjectWizard
            onClose={onWizardClose}
            onSave={(obj) => { onWizardSaved(obj); onWizardClose() }}
            userId={userId}
            initial={editingObject ?? undefined}
          />
        )}
        <div className="p-6 md:p-8 max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setShowArchive(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Icon name="Archive" className="h-6 w-6 text-amber-400" />
                Архив объектов
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Проданные и сданные объекты — {archivedObjects.length} шт.</p>
            </div>
          </div>

          {/* Поиск по архиву */}
          <div className="relative mb-6 max-w-sm">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input
              placeholder="Поиск по названию / городу..."
              value={archiveSearch}
              onChange={e => setArchiveSearch(e.target.value)}
              className="pl-8 h-9 text-xs bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>

          {filteredArchive.length === 0 ? (
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
              <Icon name="Archive" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Архив пуст</p>
              <p className="text-gray-600 text-sm mt-1">Здесь будут отображаться проданные и сданные объекты</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArchive.map(obj => (
                <div key={obj.id} className="rounded-2xl bg-[#111] border border-[#1f1f1f] overflow-hidden flex flex-col">
                  {/* Фото */}
                  <div className="relative h-44 overflow-hidden bg-[#0f0f0f]">
                    {obj.photos && obj.photos.length > 0 ? (
                      <img src={obj.photos[0]} alt={obj.title} className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="Building2" className="h-14 w-14 text-gray-700" />
                      </div>
                    )}
                    {/* Печать */}
                    <div className={`absolute inset-0 flex items-center justify-center`}>
                      <div className={`border-4 rounded-sm px-4 py-2 rotate-[-15deg] ${
                        obj.status === "Продан"
                          ? "border-red-500 text-red-500"
                          : "border-orange-500 text-orange-500"
                      }`}>
                        <span className="text-xl font-black tracking-widest uppercase opacity-90">
                          {obj.status === "Продан" ? "ПРОДАН" : "СДАН"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Контент */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-white text-sm mb-1 leading-snug line-clamp-2">{obj.title}</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                      <Icon name="MapPin" className="h-3 w-3 text-violet-400" />
                      {obj.city || "Город не указан"}
                    </div>
                    <p className="text-base font-bold text-gray-300 mb-4">{obj.price ? `${obj.price} ₽` : "—"}</p>

                    {/* Действия */}
                    <div className="flex gap-2 pt-3 border-t border-[#1a1a1a] mt-auto">
                      <button
                        onClick={() => onRestore && onRestore(String(obj.id))}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                      >
                        <Icon name="RotateCcw" className="h-3.5 w-3.5" />
                        Восстановить
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(String(obj.id))}
                        className="shrink-0 w-10 flex items-center justify-center rounded-xl text-gray-400 bg-[#1a1a1a] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        title="Удалить навсегда"
                      >
                        <Icon name="Trash2" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Диалог подтверждения удаления */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Icon name="Trash2" className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Удалить навсегда?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Это действие нельзя отменить</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-[#1a1a1a] hover:bg-[#222] transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {showWizard && (
        <AddObjectWizard
          onClose={onWizardClose}
          onSave={(obj) => { onWizardSaved(obj); onWizardClose() }}
          userId={userId}
          initial={editingObject ?? undefined}
        />
      )}
      <div className="p-6 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Объекты</h1>
          {!isBasic && (
            <GlowButton onClick={() => setShowWizard(true)} className="rounded-xl text-sm px-4 py-2">
              <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить объект
            </GlowButton>
          )}
        </div>

        {isBasic && (
          <ListingsBanner
            listingsUsed={listingsUsed}
            listingsExtra={listingsExtra}
            userEmail={userEmail}
            userName={userName}
            userId={userId}
            onAddListingClick={handleAddObject}
          />
        )}

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "Briefcase", label: "Объектов в работе", sub: "Активные лоты", value: activeObjects.filter(o => o.status === "Активен").length, color: "text-blue-400" },
            { icon: "TrendingUp", label: "Инвест-портфель", sub: "Суммарная стоимость", value: "0 ₽", color: "text-emerald-400" },
            { icon: "Gavel", label: "Активные торги", sub: "Предстоящие аукционы", value: activeObjects.filter(o => o.category === "auction").length, color: "text-amber-400" },
            { icon: "Archive", label: "В архиве", sub: "Продано / Сдано", value: archivedObjects.length, color: "text-orange-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4 flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold mb-1">{s.value}</p>
                <p className="text-xs font-medium text-white">{s.label}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
              <Icon name={s.icon as "Briefcase"} className={`h-6 w-6 ${s.color} mt-1`} />
            </div>
          ))}
        </div>

        {/* Строка 1: Категории + Архив */}
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { label: "Все",         icon: "",             color: "" },
            { label: "Коммерция",   icon: "Building2",    color: "" },
            { label: "Новостройки", icon: "Construction", color: "" },
            { label: "Инвестиции",  icon: "TrendingUp",   color: "" },
            { label: "Курортная",   icon: "Sun",          color: "cyan" },
            { label: "Торги",       icon: "Gavel",        color: "" },
            { label: "Жилая",       icon: "Home",         color: "" },
          ].map(({ label, icon, color }) => (
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
            onClick={() => setShowArchive(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
          >
            <Icon name="Archive" className="h-3 w-3" />
            Архив
            {archivedObjects.length > 0 && (
              <span className="bg-amber-500/30 text-amber-300 rounded-full text-[10px] px-1.5 leading-4">
                {archivedObjects.length}
              </span>
            )}
          </button>
        </div>

        {/* Строка 2: Статусы */}
        <div className="flex flex-wrap gap-2 mb-3">
          {["Все", "Активен", "Черновик", "Ожидает аукциона"].map(st => (
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

        {/* Список объектов */}
        {loading ? (
          <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
            <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
            <Icon name="Building2" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Объектов пока нет</p>
            <p className="text-gray-600 text-sm mt-1">Добавьте первый объект, чтобы начать работу</p>
            <Button onClick={() => setShowWizard(true)} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
              <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить объект
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(obj => (
              <ObjectCard
                key={obj.id}
                obj={obj}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                onSaveOwner={onSaveOwner}
                onReassign={onReassign}
                employeeName={employees?.find(e => e.user_id === obj.user_id)?.name}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(obj => (
              <div key={obj.id} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 flex items-center justify-between gap-4 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-blue-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {obj.photos && obj.photos.length > 0
                      ? <img src={obj.photos[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                      : <Icon name="Building2" className="h-5 w-5 text-blue-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{obj.title}</p>
                    <p className="text-xs text-gray-400 truncate">{obj.city}{obj.area ? ` · ${obj.area} м²` : ""}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-blue-400">{obj.type}</span>
                      {obj.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">В маркетплейсе</span>}
                      {employees && obj.user_id && (() => {
                        const eName = employees.find(e => e.user_id === obj.user_id)?.name
                        return eName ? (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Icon name="User" className="h-2.5 w-2.5" />
                            {eName}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-bold">{obj.price ? `${obj.price} ₽` : "—"}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      obj.status === "Активен" ? "bg-emerald-500/10 text-emerald-400" :
                      obj.status === "Черновик" ? "bg-gray-500/10 text-gray-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>{obj.status}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onEdit(obj)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      title="Редактировать"
                    >
                      <Icon name="Pencil" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(String(obj.id))}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Удалить"
                    >
                      <Icon name="Trash2" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}