import { useState, useRef, useEffect } from "react"
import Icon from "@/components/ui/icon"
import type { ObjectData } from "@/components/AddObjectWizard"

interface ObjectCardProps {
  obj: ObjectData
  onEdit: (obj: ObjectData) => void
  onDelete: (id: string) => void
  onArchive?: (id: string, status: "Продан" | "Сдан") => void
}

const BADGE_BY_TYPE: Record<string, { label: string; color: string; icon: string }> = {
  "Инвестиции":   { label: "Инвестиции",   color: "bg-amber-600",   icon: "TrendingUp" },
  "Коммерция":    { label: "Коммерция",    color: "bg-violet-600",  icon: "Building2" },
  "Торги":        { label: "Торги",        color: "bg-green-600",   icon: "Gavel" },
  "Новостройки":  { label: "Новостройки",  color: "bg-blue-600",    icon: "Construction" },
  "Жилая":        { label: "Жилая",        color: "bg-sky-600",     icon: "Home" },
  "Курортная":    { label: "Курортная",    color: "bg-cyan-600",    icon: "Sun" },
}

const STATUS_STYLE: Record<string, string> = {
  "Активен":          "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Черновик":         "bg-gray-500/15 text-gray-400 border-gray-500/30",
  "Продан":           "bg-red-500/15 text-red-400 border-red-500/30",
  "Сдан":             "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Ожидает аукциона": "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

const ARCHIVE_STATUSES = ["Продан", "Сдан"]

export default function ObjectCard({ obj, onEdit, onDelete, onArchive }: ObjectCardProps) {
  const [showArchiveMenu, setShowArchiveMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const photo = obj.photos && obj.photos.length > 0 ? obj.photos[0] : null
  const badge = BADGE_BY_TYPE[obj.type] ?? { label: obj.type, color: "bg-[#1f1f1f]", icon: "Tag" }
  const statusCls = STATUS_STYLE[obj.status] ?? "bg-[#1f1f1f] text-gray-400 border-[#2a2a2a]"
  const isArchived = ARCHIVE_STATUSES.includes(obj.status)
  const dealType = obj.extra_fields?.deal_type
  const isRent = dealType === "rent"
  const priceLabel = isRent ? `${obj.price} ₽/мес` : obj.price ? `${obj.price} ₽` : "—"

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowArchiveMenu(false)
      }
    }
    if (showArchiveMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showArchiveMenu])

  return (
    <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] overflow-hidden hover:border-blue-500/40 transition-colors group flex flex-col">
      {/* Фото */}
      <div className="relative h-48 overflow-hidden bg-[#0f0f0f]">
        {photo ? (
          <img
            src={photo}
            alt={obj.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="Building2" className="h-16 w-16 text-gray-700" />
          </div>
        )}

        {/* Бейдж категории */}
        <span className={`absolute top-3 left-3 ${badge.color} text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg`}>
          <Icon name={badge.icon as "Building2"} className="h-3 w-3" />
          {badge.label}
        </span>

        {/* Статус */}
        <span className={`absolute bottom-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full border backdrop-blur-sm ${statusCls}`}>
          {obj.status}
        </span>

        {/* В маркетплейсе */}
        {obj.published && (
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-medium px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <Icon name="Globe" className="h-3 w-3" />
            В маркетплейсе
          </span>
        )}
      </div>

      {/* Контент */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-white text-sm mb-1 leading-snug line-clamp-2">{obj.title}</h3>
        {obj.subtype && (
          <span className="inline-block text-[10px] text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-2 py-0.5 mb-2 w-fit">
            {obj.subtype}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
          <Icon name="MapPin" className="h-3.5 w-3.5 text-violet-400" />
          {obj.city || "Город не указан"}
        </div>

        <div className="flex items-end justify-between mb-4 mt-auto">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {dealType && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isRent
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}>
                  {isRent ? "Аренда" : "Продажа"}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-white">{priceLabel}</p>
            {obj.area && <p className="text-xs text-gray-500">{obj.area} м²</p>}
          </div>
          {obj.yield_percent && (
            <div className="text-right">
              <p className="text-emerald-400 font-semibold text-sm">{obj.yield_percent}%</p>
              <p className="text-xs text-gray-500">доходность</p>
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="flex gap-2 pt-3 border-t border-[#1a1a1a]">
          {!isArchived && (
            <button
              onClick={() => onEdit(obj)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-gray-300 bg-[#1a1a1a] hover:bg-[#222] hover:text-white transition-colors"
            >
              <Icon name="Pencil" className="h-3.5 w-3.5" />
              Изменить
            </button>
          )}

          {/* Кнопка "В архив" — только для активных/черновиков */}
          {!isArchived && onArchive && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowArchiveMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                title="Перенести в архив"
              >
                <Icon name="Archive" className="h-3.5 w-3.5" />
                В архив
              </button>
              {showArchiveMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-20 overflow-hidden min-w-[130px]">
                  <button
                    onClick={() => { onArchive(String(obj.id), "Продан"); setShowArchiveMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Icon name="Tag" className="h-3.5 w-3.5" />
                    Продан
                  </button>
                  <button
                    onClick={() => { onArchive(String(obj.id), "Сдан"); setShowArchiveMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-orange-400 hover:bg-orange-500/10 transition-colors border-t border-[#2a2a2a]"
                  >
                    <Icon name="KeyRound" className="h-3.5 w-3.5" />
                    Сдан
                  </button>
                </div>
              )}
            </div>
          )}

          {obj.presentation_url && (
            <a
              href={obj.presentation_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Скачать PDF-презентацию"
              className="shrink-0 w-10 flex items-center justify-center rounded-xl text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors border border-violet-500/20"
            >
              <Icon name="FileDown" className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onDelete(String(obj.id))}
            className="shrink-0 w-10 flex items-center justify-center rounded-xl text-gray-400 bg-[#1a1a1a] hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Удалить"
          >
            <Icon name="Trash2" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}