import Icon from "@/components/ui/icon"
import type { ObjectData } from "@/components/AddObjectWizard"

interface ObjectCardProps {
  obj: ObjectData
  onEdit: (obj: ObjectData) => void
  onDelete: (id: string) => void
}

const BADGE_BY_TYPE: Record<string, { label: string; color: string; icon: string }> = {
  "Инвестиции":   { label: "Инвестиции",   color: "bg-amber-600",   icon: "TrendingUp" },
  "Коммерция":    { label: "Коммерция",    color: "bg-violet-600",  icon: "Building2" },
  "Торги":        { label: "Торги",        color: "bg-green-600",   icon: "Gavel" },
  "Новостройки":  { label: "Новостройки",  color: "bg-blue-600",    icon: "Construction" },
  "Жилая":        { label: "Жилая",        color: "bg-sky-600",     icon: "Home" },
}

const STATUS_STYLE: Record<string, string> = {
  "Активен":          "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Черновик":         "bg-gray-500/15 text-gray-400 border-gray-500/30",
  "Продан":           "bg-red-500/15 text-red-400 border-red-500/30",
  "Ожидает аукциона": "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

export default function ObjectCard({ obj, onEdit, onDelete }: ObjectCardProps) {
  const photo = obj.photos && obj.photos.length > 0 ? obj.photos[0] : null
  const badge = BADGE_BY_TYPE[obj.type] ?? { label: obj.type, color: "bg-[#1f1f1f]", icon: "Tag" }
  const statusCls = STATUS_STYLE[obj.status] ?? "bg-[#1f1f1f] text-gray-400 border-[#2a2a2a]"

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
            <p className="text-lg font-bold text-white">{obj.price ? `${obj.price} ₽` : "—"}</p>
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
          <button
            onClick={() => onEdit(obj)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-gray-300 bg-[#1a1a1a] hover:bg-[#222] hover:text-white transition-colors"
          >
            <Icon name="Pencil" className="h-3.5 w-3.5" />
            Изменить
          </button>
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