import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"
import ObjectCard from "./ObjectCard"

interface Props {
  loading?: boolean
  viewMode: "grid" | "list"
  filtered: ObjectData[]
  visibleFiltered: ObjectData[]
  hasMore: boolean
  visibleCount: number
  onShowMore: () => void
  onEdit: (obj: ObjectData) => void
  onDelete: (id: string) => void
  onArchive?: (id: string, status: "Продан" | "Сдан") => void
  onSaveOwner?: (id: string, fields: Record<string, string>) => void
  onReassign?: (obj: ObjectData) => void
  onAddObject: () => void
  employees?: Array<{ user_id: string; name: string; department_id?: string }>
}

export default function ObjectsGrid({
  loading, viewMode,
  filtered, visibleFiltered, hasMore, visibleCount,
  onShowMore, onEdit, onDelete, onArchive, onSaveOwner, onReassign,
  onAddObject, employees,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
        <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
        <Icon name="Building2" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Объектов пока нет</p>
        <p className="text-gray-600 text-sm mt-1">Добавьте первый объект, чтобы начать работу</p>
        <Button onClick={onAddObject} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
          <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить объект
        </Button>
      </div>
    )
  }

  const showMoreBtn = hasMore && (
    <button
      onClick={onShowMore}
      className="w-full py-3 rounded-2xl border border-[#1f1f1f] bg-[#111] text-gray-400 hover:text-white hover:border-blue-500/40 hover:bg-[#141414] transition-all text-sm font-medium"
    >
      Показать ещё {Math.min(6, filtered.length - visibleCount)} объектов
      <span className="ml-2 text-gray-600">из {filtered.length - visibleCount} оставшихся</span>
    </button>
  )

  if (viewMode === "grid") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleFiltered.map(obj => (
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
        {showMoreBtn}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleFiltered.map(obj => (
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
      {showMoreBtn}
    </div>
  )
}
