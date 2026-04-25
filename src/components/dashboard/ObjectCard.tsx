import { useState, useRef, useEffect } from "react"
import Icon from "@/components/ui/icon"
import type { ObjectData } from "@/components/AddObjectWizard"

function OwnerBlock({
  extraFields,
  objId,
  onSave,
}: {
  extraFields: Record<string, string>
  objId: string
  onSave?: (id: string, fields: Record<string, string>) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({
    owner_name: extraFields.owner_name ?? "",
    owner_phone: extraFields.owner_phone ?? "",
    owner_fee: extraFields.owner_fee ?? "",
    owner_comment: extraFields.owner_comment ?? "",
  })

  function handleEdit() {
    setDraft({
      owner_name: extraFields.owner_name ?? "",
      owner_phone: extraFields.owner_phone ?? "",
      owner_fee: extraFields.owner_fee ?? "",
      owner_comment: extraFields.owner_comment ?? "",
    })
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    await onSave?.(objId, draft)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="border border-amber-500/20 rounded-xl bg-amber-500/5 overflow-hidden mb-1">
      <button
        onClick={() => { setOpen(v => !v); setEditing(false) }}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Icon name="Lock" className="h-3 w-3" />
          Данные собственника
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} className="h-3 w-3" />
      </button>

      {open && !editing && (
        <div className="px-3 pb-3 border-t border-amber-500/10">
          {!extraFields.owner_name && !extraFields.owner_phone && !extraFields.owner_fee && !extraFields.owner_comment ? (
            <p className="text-[11px] text-gray-600 pt-2 pb-1">Данные не заполнены</p>
          ) : (
            <div className="space-y-1.5 pt-2">
              {extraFields.owner_name && (
                <div className="flex items-center gap-2">
                  <Icon name="User" className="h-3 w-3 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-300">{extraFields.owner_name}</span>
                </div>
              )}
              {extraFields.owner_phone && (
                <div className="flex items-center gap-2">
                  <Icon name="Phone" className="h-3 w-3 text-gray-500 shrink-0" />
                  <a href={`tel:${extraFields.owner_phone}`} className="text-xs text-blue-400 hover:underline">
                    {extraFields.owner_phone}
                  </a>
                </div>
              )}
              {extraFields.owner_fee && (
                <div className="flex items-center gap-2">
                  <Icon name="Percent" className="h-3 w-3 text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-300">{extraFields.owner_fee}</span>
                </div>
              )}
              {extraFields.owner_comment && (
                <div className="flex items-start gap-2">
                  <Icon name="MessageSquare" className="h-3 w-3 text-gray-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-400 leading-relaxed">{extraFields.owner_comment}</span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            <Icon name="Pencil" className="h-3 w-3" /> {extraFields.owner_name || extraFields.owner_phone ? "Редактировать" : "Добавить данные"}
          </button>
        </div>
      )}

      {open && editing && (
        <div className="px-3 pb-3 space-y-2 border-t border-amber-500/10 pt-3">
          {[
            { key: "owner_name", label: "ФИО", placeholder: "Иванов Иван Иванович", icon: "User" },
            { key: "owner_phone", label: "Телефон", placeholder: "+7 900 000 00 00", icon: "Phone" },
            { key: "owner_fee", label: "Вознаграждение", placeholder: "3% / 50 000 ₽", icon: "Percent" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] text-gray-500 block mb-0.5">{f.label}</label>
              <div className="relative">
                <Icon name={f.icon as "User"} className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-600" />
                <input
                  value={draft[f.key as keyof typeof draft]}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>
          ))}
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Комментарий</label>
            <textarea
              value={draft.owner_comment}
              onChange={e => setDraft(d => ({ ...d, owner_comment: e.target.value }))}
              placeholder="Условия, договорённости..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-amber-500/40 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              {saving ? <Icon name="Loader2" className="h-3 w-3 animate-spin" /> : <Icon name="Check" className="h-3 w-3" />}
              Сохранить
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-white bg-[#1a1a1a] transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ObjectCardProps {
  obj: ObjectData
  onEdit: (obj: ObjectData) => void
  onDelete: (id: string) => void
  onArchive?: (id: string, status: "Продан" | "Сдан") => void
  onSaveOwner?: (id: string, fields: Record<string, string>) => void
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

export default function ObjectCard({ obj, onEdit, onDelete, onArchive, onSaveOwner }: ObjectCardProps) {
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

        {/* Данные собственника */}
        <OwnerBlock
          extraFields={obj.extra_fields ?? {}}
          objId={String(obj.id)}
          onSave={onSaveOwner}
        />

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