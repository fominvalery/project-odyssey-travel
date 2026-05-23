import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Dialog, getInitials, formatTime, isAgency } from "./messagesTypes"

type FilterType = "all" | "object" | "club"

interface DialogMeta {
  pinned: boolean
  muted: boolean
  deleted: boolean
  cleared: boolean        // скрывает историю визуально
  forceUnread: boolean    // принудительно непрочитан
}

const STORAGE_KEY = "dialog_meta_v1"

function loadMeta(): Record<string, DialogMeta> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

function saveMeta(meta: Record<string, DialogMeta>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
}

function defaultMeta(): DialogMeta {
  return { pinned: false, muted: false, deleted: false, cleared: false, forceUnread: false }
}

interface Props {
  dialogs: Dialog[]
  activeDialog: Dialog | null
  mobileView: "list" | "chat"
  onOpenDialog: (dialog: Dialog) => void
  onMarkRead?: (partnerId: string, dialog: Dialog) => void
}

export default function MessagesDialogList({ dialogs, activeDialog, onOpenDialog, onMarkRead }: Props) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [meta, setMeta] = useState<Record<string, DialogMeta>>(loadMeta)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрываем меню при клике вне
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const updateMeta = useCallback((partnerId: string, patch: Partial<DialogMeta>) => {
    setMeta(prev => {
      const next = { ...prev, [partnerId]: { ...(prev[partnerId] || defaultMeta()), ...patch } }
      saveMeta(next)
      return next
    })
  }, [])

  const getMeta = (partnerId: string): DialogMeta => meta[partnerId] || defaultMeta()

  // Фильтрация + сортировка (закреплённые наверху)
  const visible = dialogs
    .filter(d => {
      const m = getMeta(d.partner_id)
      if (m.deleted) return false
      const matchesFilter =
        filter === "all" ||
        (filter === "object" && d.kind === "object") ||
        (filter === "club" && d.kind !== "object")
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || d.partner_name.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      const pa = getMeta(a.partner_id).pinned ? 1 : 0
      const pb = getMeta(b.partner_id).pinned ? 1 : 0
      if (pb !== pa) return pb - pa
      return (b.last_at || "").localeCompare(a.last_at || "")
    })

  const hasObject = dialogs.some(d => d.kind === "object")
  const hasClub = dialogs.some(d => d.kind !== "object")

  function handleMenuAction(action: string, d: Dialog) {
    setMenuOpen(null)
    const m = getMeta(d.partner_id)
    switch (action) {
      case "pin":      updateMeta(d.partner_id, { pinned: !m.pinned }); break
      case "mute":     updateMeta(d.partner_id, { muted: !m.muted }); break
      case "read":     updateMeta(d.partner_id, { forceUnread: false }); onMarkRead?.(d.partner_id, d); break
      case "unread":   updateMeta(d.partner_id, { forceUnread: true }); break
      case "clear":    updateMeta(d.partner_id, { cleared: true }); break
      case "delete":   updateMeta(d.partner_id, { deleted: true }); break
      case "copy":
        navigator.clipboard.writeText(d.client_phone || "").then(() => {
          setCopied(true); setTimeout(() => setCopied(false), 1500)
        })
        break
      case "profile":
        window.location.hash = `#/profile/${d.partner_id}`
        break
      case "object":
        if (d.object_id) window.open(`/marketplace/${d.object_id}`, "_blank")
        break
    }
  }

  function getUnreadCount(d: Dialog): number {
    const m = getMeta(d.partner_id)
    if (m.forceUnread) return Math.max(d.unread_count, 1)
    return d.unread_count
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0d0d]">
      {/* Заголовок */}
      <div className="px-5 py-4 border-b border-[#1f1f1f] shrink-0">
        <h2 className="font-bold text-base">Сообщения</h2>
      </div>

      {/* Поиск */}
      <div className="px-4 py-3 border-b border-[#1f1f1f] shrink-0">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Фильтр */}
      {hasObject && hasClub && (
        <div className="px-4 py-2.5 border-b border-[#1f1f1f] shrink-0">
          <div className="flex gap-1.5">
            {(["all", "object", "club"] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? f === "object" ? "bg-blue-600 text-white"
                      : f === "club" ? "bg-violet-600 text-white"
                      : "bg-[#2a2a2a] text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]"
                }`}
              >
                {f === "all" && "Все"}
                {f === "object" && <><Icon name="Home" className="h-3 w-3" />Объекты</>}
                {f === "club" && <><Icon name="Users" className="h-3 w-3" />Клуб</>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="text-center py-16 px-6 text-gray-600">
            <Icon name="MessageSquare" className="h-8 w-8 mx-auto mb-3 opacity-30" />
            {search ? (
              <><p className="text-sm">Ничего не найдено</p><p className="text-xs mt-1">Попробуйте другое имя</p></>
            ) : (
              <><p className="text-sm">Нет диалогов</p><p className="text-xs mt-1">Здесь появятся сообщения по объектам и от участников Клуба</p></>
            )}
          </div>
        ) : (
          visible.map(d => {
            const m = getMeta(d.partner_id)
            const unread = getUnreadCount(d)
            const isMenuOpen = menuOpen === d.partner_id

            return (
              <div key={d.partner_id} className="relative group">
                <button
                  onClick={() => onOpenDialog(d)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#111] ${
                    activeDialog?.partner_id === d.partner_id ? "bg-[#1a1a1a]" : ""
                  }`}
                >
                  {/* Аватар */}
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      {d.partner_avatar ? <AvatarImage src={d.partner_avatar} /> : null}
                      <AvatarFallback className={`text-white text-xs font-bold ${
                        d.kind === "object"
                          ? "bg-gradient-to-br from-blue-600 to-cyan-600"
                          : isAgency(d.partner_status)
                            ? "bg-gradient-to-br from-violet-600 to-pink-600"
                            : "bg-violet-600"
                      }`}>
                        {d.kind === "object" ? <Icon name="Home" className="h-4 w-4" /> : getInitials(d.partner_name)}
                      </AvatarFallback>
                    </Avatar>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {m.pinned && <Icon name="Pin" className="h-3 w-3 text-violet-400 shrink-0" />}
                      {m.muted && <Icon name="BellOff" className="h-3 w-3 text-gray-600 shrink-0" />}
                      <p className="text-sm font-medium truncate text-white flex-1">{d.partner_name}</p>
                      {/* Время — скрывается при наведении, точки занимают его место */}
                      <span className={`text-[10px] text-gray-600 shrink-0 transition-opacity ${isMenuOpen ? "opacity-0" : "group-hover:opacity-0"}`}>
                        {formatTime(d.last_at)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                      {d.is_mine ? "Вы: " : ""}{d.last_text || "Начните переписку"}
                    </p>
                  </div>
                </button>

                {/* Кнопка три точки — горизонтальные, синие, на месте времени */}
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : d.partner_id) }}
                  className={`absolute right-3 top-3 p-1 rounded-md transition-all ${
                    isMenuOpen
                      ? "opacity-100 text-blue-400 bg-blue-500/15"
                      : "opacity-0 group-hover:opacity-100 text-blue-400 hover:bg-blue-500/15"
                  }`}
                >
                  <Icon name="MoreHorizontal" className="h-4 w-4" />
                </button>

                {/* Выпадающее меню */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-3 top-full mt-1 z-50 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Закрепить / Открепить */}
                    <MenuItem
                      icon={m.pinned ? "PinOff" : "Pin"}
                      label={m.pinned ? "Открепить" : "Закрепить"}
                      onClick={() => handleMenuAction("pin", d)}
                    />
                    {/* Прочитанное / Непрочитанное */}
                    {unread > 0 || m.forceUnread ? (
                      <MenuItem icon="CheckCheck" label="Отметить прочитанным" onClick={() => handleMenuAction("read", d)} />
                    ) : (
                      <MenuItem icon="Circle" label="Отметить непрочитанным" onClick={() => handleMenuAction("unread", d)} />
                    )}
                    {/* Уведомления */}
                    <MenuItem
                      icon={m.muted ? "Bell" : "BellOff"}
                      label={m.muted ? "Включить уведомления" : "Отключить уведомления"}
                      onClick={() => handleMenuAction("mute", d)}
                    />

                    {/* Только object-чат */}
                    {d.kind === "object" && d.client_phone && (
                      <MenuItem
                        icon={copied ? "Check" : "Copy"}
                        label={copied ? "Скопировано!" : "Скопировать контакт"}
                        onClick={() => handleMenuAction("copy", d)}
                      />
                    )}
                    {d.kind === "object" && d.object_id && (
                      <MenuItem icon="ExternalLink" label="Открыть объект" onClick={() => handleMenuAction("object", d)} />
                    )}

                    {/* Только Клуб */}
                    {d.kind !== "object" && (
                      <MenuItem icon="User" label="Перейти в профиль" onClick={() => handleMenuAction("profile", d)} />
                    )}

                    <div className="border-t border-[#2a2a2a] my-1" />

                    {/* Очистить */}
                    <MenuItem icon="Trash2" label="Очистить чат" onClick={() => handleMenuAction("clear", d)} danger />
                    {/* Удалить */}
                    <MenuItem icon="X" label="Удалить диалог" onClick={() => handleMenuAction("delete", d)} danger />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function MenuItem({
  icon, label, onClick, danger = false
}: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-300 hover:bg-[#2a2a2a]"
      }`}
    >
      <Icon name={icon} className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}