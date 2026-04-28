import { useState } from "react"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"

interface Props {
  archivedObjects: ObjectData[]
  showWizard: boolean
  editingObject: ObjectData | null
  userId: string
  onWizardSaved: (obj: ObjectData) => void
  onWizardClose: () => void
  onRestore?: (id: string) => void
  onDelete: (id: string) => void
  onBack: () => void
}

export default function ObjectsArchive({
  archivedObjects, showWizard, editingObject, userId,
  onWizardSaved, onWizardClose, onRestore, onDelete, onBack,
}: Props) {
  const [archiveSearch, setArchiveSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredArchive = archivedObjects.filter(o => {
    if (!archiveSearch) return true
    return o.title.toLowerCase().includes(archiveSearch.toLowerCase())
      || o.city.toLowerCase().includes(archiveSearch.toLowerCase())
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
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
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
                <div className="relative h-44 overflow-hidden bg-[#0f0f0f]">
                  {obj.photos && obj.photos.length > 0 ? (
                    <img src={obj.photos[0]} alt={obj.title} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Building2" className="h-14 w-14 text-gray-700" />
                    </div>
                  )}
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

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-white text-sm mb-1 leading-snug line-clamp-2">{obj.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                    <Icon name="MapPin" className="h-3 w-3 text-violet-400" />
                    {obj.city || "Город не указан"}
                  </div>
                  <p className="text-base font-bold text-gray-300 mb-4">{obj.price ? `${obj.price} ₽` : "—"}</p>

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
                      className="shrink-0 w-10 h-9 flex items-center justify-center rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
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
