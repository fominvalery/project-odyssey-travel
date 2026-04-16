import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"
import ObjectCard from "./ObjectCard"

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
}

export default function DashboardObjects({
  objects, loading, showWizard, setShowWizard,
  editingObject, onEdit, onDelete, onWizardSaved, onWizardClose,
  catFilter, setCatFilter, statusFilter, setStatusFilter,
  objSearch, setObjSearch, userId,
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filtered = objects.filter(o => {
    const matchCat = catFilter === "Все" || o.type === catFilter
    const matchSt = statusFilter === "Все" || o.status === statusFilter
    const matchSearch = !objSearch
      || o.title.toLowerCase().includes(objSearch.toLowerCase())
      || o.city.toLowerCase().includes(objSearch.toLowerCase())
    return matchCat && matchSt && matchSearch
  })

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Объекты</h1>
          <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
            <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить объект
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "Briefcase", label: "Объектов в работе", sub: "Активные лоты", value: objects.filter(o => o.status === "Активен").length, color: "text-blue-400" },
            { icon: "TrendingUp", label: "Инвест-портфель", sub: "Суммарная стоимость", value: "0 ₽", color: "text-emerald-400" },
            { icon: "Gavel", label: "Активные торги", sub: "Предстоящие аукционы", value: objects.filter(o => o.category === "auction").length, color: "text-amber-400" },
            { icon: "ClipboardList", label: "Заявки / Лиды", sub: "Входящие запросы", value: "0", color: "text-violet-400" },
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

        {/* Фильтры по категории */}
        <div className="flex flex-wrap gap-2 mb-3">
          {["Все", "Инвестиции", "Коммерция", "Торги", "Новостройки"].map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                catFilter === cat ? "bg-blue-600 text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-white"
              }`}
            >
              {cat !== "Все" && <Icon name={
                cat === "Инвестиции" ? "TrendingUp" :
                cat === "Коммерция" ? "Building2" :
                cat === "Торги" ? "Gavel" : "Construction"
              } className="h-3 w-3" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Фильтры по статусу + поиск + переключатель вида */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex flex-wrap gap-2 flex-1">
            {["Все", "Активен", "Черновик", "Продан", "Ожидает аукциона"].map(st => (
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
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input
              placeholder="Поиск по названию / городу..."
              value={objSearch}
              onChange={e => setObjSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600 w-52"
            />
          </div>
          {/* Переключатель сетка / список */}
          <div className="flex items-center rounded-xl border border-[#1f1f1f] bg-[#111] p-0.5 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-white"
              }`}
              title="Сетка"
            >
              <Icon name="LayoutGrid" className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-white"
              }`}
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
