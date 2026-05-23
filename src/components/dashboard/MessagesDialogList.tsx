import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Dialog, getInitials, formatTime, isAgency } from "./messagesTypes"

// ─── Типы ────────────────────────────────────────────────────────────────────

type FilterType = "all" | "object" | "club" | string  // string = folder id

interface DialogMeta {
  pinned: boolean
  muted: boolean
  deleted: boolean
  cleared: boolean
  forceUnread: boolean
  folderIds: string[]   // папки в которых находится диалог
}

interface Folder {
  id: string
  name: string
  emoji: string
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const META_KEY    = "dialog_meta_v1"
const FOLDER_KEY  = "dialog_folders_v1"

function loadMeta(): Record<string, DialogMeta> {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") } catch { return {} }
}
function saveMeta(m: Record<string, DialogMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(m))
}
function loadFolders(): Folder[] {
  try { return JSON.parse(localStorage.getItem(FOLDER_KEY) || "[]") } catch { return [] }
}
function saveFolders(f: Folder[]) {
  localStorage.setItem(FOLDER_KEY, JSON.stringify(f))
}
function defaultMeta(): DialogMeta {
  return { pinned: false, muted: false, deleted: false, cleared: false, forceUnread: false, folderIds: [] }
}

const EMOJIS = ["📁","⭐","🔥","💼","🏠","👤","🤝","💡","📌","🎯","💬","🔔"]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  dialogs: Dialog[]
  activeDialog: Dialog | null
  mobileView: "list" | "chat"
  onOpenDialog: (dialog: Dialog) => void
  onMarkRead?: (partnerId: string, dialog: Dialog) => void
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function MessagesDialogList({ dialogs, activeDialog, onOpenDialog, onMarkRead }: Props) {
  const [search, setSearch]         = useState("")
  const [filter, setFilter]         = useState<FilterType>("all")
  const [meta, setMeta]             = useState<Record<string, DialogMeta>>(loadMeta)
  const [folders, setFolders]       = useState<Folder[]>(loadFolders)
  const [menuOpen, setMenuOpen]     = useState<string | null>(null)
  const [folderMenu, setFolderMenu] = useState<string | null>(null)   // partner_id с открытым подменю папок
  const [copied, setCopied]         = useState(false)

  // Форма создания/редактирования папки
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [editFolder, setEditFolder]         = useState<Folder | null>(null)
  const [folderName, setFolderName]         = useState("")
  const [folderEmoji, setFolderEmoji]       = useState("📁")

  // Редактирование вкладки папки (долгий клик)
  const [folderTabMenu, setFolderTabMenu] = useState<string | null>(null)

  const menuRef     = useRef<HTMLDivElement>(null)
  const folderRef   = useRef<HTMLDivElement>(null)
  const formRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(null)
      if (folderRef.current && !folderRef.current.contains(t)) { setFolderMenu(null); setFolderTabMenu(null) }
      if (formRef.current && !formRef.current.contains(t)) setShowFolderForm(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ─── Мета ─────────────────────────────────────────────────────────────────

  const updateMeta = useCallback((partnerId: string, patch: Partial<DialogMeta>) => {
    setMeta(prev => {
      const next = { ...prev, [partnerId]: { ...(prev[partnerId] || defaultMeta()), ...patch } }
      saveMeta(next)
      return next
    })
  }, [])

  const getMeta = (partnerId: string): DialogMeta => meta[partnerId] || defaultMeta()

  // ─── Папки ────────────────────────────────────────────────────────────────

  function openCreateFolder() {
    setEditFolder(null)
    setFolderName("")
    setFolderEmoji("📁")
    setShowFolderForm(true)
  }

  function openEditFolder(f: Folder, e: React.MouseEvent) {
    e.stopPropagation()
    setFolderTabMenu(null)
    setEditFolder(f)
    setFolderName(f.name)
    setFolderEmoji(f.emoji)
    setShowFolderForm(true)
  }

  function saveFolder() {
    const name = folderName.trim()
    if (!name) return
    if (editFolder) {
      const updated = folders.map(f => f.id === editFolder.id ? { ...f, name, emoji: folderEmoji } : f)
      setFolders(updated); saveFolders(updated)
    } else {
      const newFolder: Folder = { id: crypto.randomUUID(), name, emoji: folderEmoji }
      const updated = [...folders, newFolder]
      setFolders(updated); saveFolders(updated)
    }
    setShowFolderForm(false)
  }

  function deleteFolder(folderId: string) {
    const updated = folders.filter(f => f.id !== folderId)
    setFolders(updated); saveFolders(updated)
    // убираем папку из всех диалогов
    setMeta(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(pid => {
        next[pid] = { ...next[pid], folderIds: (next[pid].folderIds || []).filter(id => id !== folderId) }
      })
      saveMeta(next)
      return next
    })
    if (filter === folderId) setFilter("all")
    setFolderTabMenu(null)
  }

  function toggleDialogFolder(partnerId: string, folderId: string) {
    const m = getMeta(partnerId)
    const ids = m.folderIds || []
    const next = ids.includes(folderId) ? ids.filter(i => i !== folderId) : [...ids, folderId]
    updateMeta(partnerId, { folderIds: next })
  }

  // ─── Фильтрация + сортировка ──────────────────────────────────────────────

  const visible = dialogs
    .filter(d => {
      const m = getMeta(d.partner_id)
      if (m.deleted) return false
      if (filter === "object")  return d.kind === "object"
      if (filter === "club")    return d.kind !== "object"
      if (filter !== "all") {
        // папка
        return (m.folderIds || []).includes(filter)
      }
      const q = search.toLowerCase().trim()
      return !q || d.partner_name.toLowerCase().includes(q)
    })
    .filter(d => {
      if (filter === "all" || filter === "object" || filter === "club") {
        const q = search.toLowerCase().trim()
        return !q || d.partner_name.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      const pa = getMeta(a.partner_id).pinned ? 1 : 0
      const pb = getMeta(b.partner_id).pinned ? 1 : 0
      if (pb !== pa) return pb - pa
      return (b.last_at || "").localeCompare(a.last_at || "")
    })

  const hasObject = dialogs.some(d => d.kind === "object")
  const hasClub   = dialogs.some(d => d.kind !== "object")

  // ─── Действия меню ────────────────────────────────────────────────────────

  function handleMenuAction(action: string, d: Dialog) {
    if (action.startsWith("folder:")) {
      const folderId = action.replace("folder:", "")
      toggleDialogFolder(d.partner_id, folderId)
      return
    }
    setMenuOpen(null)
    setFolderMenu(null)
    const m = getMeta(d.partner_id)
    switch (action) {
      case "pin":     updateMeta(d.partner_id, { pinned: !m.pinned }); break
      case "mute":    updateMeta(d.partner_id, { muted: !m.muted }); break
      case "read":    updateMeta(d.partner_id, { forceUnread: false }); onMarkRead?.(d.partner_id, d); break
      case "unread":  updateMeta(d.partner_id, { forceUnread: true }); break
      case "clear":   updateMeta(d.partner_id, { cleared: true }); break
      case "delete":  updateMeta(d.partner_id, { deleted: true }); break
      case "copy":
        navigator.clipboard.writeText(d.client_phone || "").then(() => {
          setCopied(true); setTimeout(() => setCopied(false), 1500)
        })
        break
      case "profile":
        window.location.hash = `#/profile/${d.partner_id}`; break
      case "object":
        if (d.object_id) window.open(`/marketplace/${d.object_id}`, "_blank"); break
    }
  }

  function getUnreadCount(d: Dialog): number {
    const m = getMeta(d.partner_id)
    if (m.forceUnread) return Math.max(d.unread_count, 1)
    return d.unread_count
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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

      {/* Вкладки: системные + папки + кнопка создать */}
      <div className="px-3 py-2.5 border-b border-[#1f1f1f] shrink-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">

          {/* Системные */}
          <Tab active={filter === "all"} onClick={() => setFilter("all")}>Все</Tab>
          {hasObject && <Tab active={filter === "object"} color="blue" onClick={() => setFilter("object")}><Icon name="Home" className="h-3 w-3" />Объекты</Tab>}
          {hasClub && <Tab active={filter === "club"} color="violet" onClick={() => setFilter("club")}><Icon name="Users" className="h-3 w-3" />Клуб</Tab>}

          {/* Пользовательские папки */}
          {folders.map(f => (
            <div key={f.id} className="relative shrink-0" ref={folderTabMenu === f.id ? folderRef : undefined}>
              <Tab
                active={filter === f.id}
                color="amber"
                onClick={() => setFilter(f.id)}
                onContextMenu={e => { e.preventDefault(); setFolderTabMenu(folderTabMenu === f.id ? null : f.id) }}
              >
                <span>{f.emoji}</span>{f.name}
              </Tab>
              {/* Контекстное меню папки */}
              {folderTabMenu === f.id && (
                <div className="absolute top-full left-0 mt-1 z-50 w-36 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                  <button onClick={e => openEditFolder(f, e)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#2a2a2a] text-left">
                    <Icon name="Pencil" className="h-3.5 w-3.5" />Переименовать
                  </button>
                  <button onClick={() => deleteFolder(f.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left">
                    <Icon name="Trash2" className="h-3.5 w-3.5" />Удалить
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Кнопка создать папку */}
          <div className="relative shrink-0" ref={showFolderForm && !editFolder ? formRef : undefined}>
            <button
              onClick={openCreateFolder}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors whitespace-nowrap"
            >
              <Icon name="FolderPlus" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Папка</span>
            </button>
          </div>
        </div>
      </div>

      {/* Форма создания/редактирования папки */}
      {showFolderForm && (
        <div ref={formRef} className="px-4 py-3 border-b border-[#1f1f1f] bg-[#111] shrink-0">
          <p className="text-xs text-gray-500 mb-2">{editFolder ? "Редактировать папку" : "Новая папка"}</p>
          {/* Выбор эмодзи */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setFolderEmoji(e)}
                className={`text-base px-1.5 py-0.5 rounded-lg transition-colors ${folderEmoji === e ? "bg-violet-600" : "hover:bg-[#2a2a2a]"}`}
              >{e}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveFolder(); if (e.key === "Escape") setShowFolderForm(false) }}
              placeholder="Название папки..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <button onClick={saveFolder} disabled={!folderName.trim()} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
              {editFolder ? "Сохранить" : "Создать"}
            </button>
            <button onClick={() => setShowFolderForm(false)} className="px-2 py-1.5 text-gray-500 hover:text-white transition-colors">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Список диалогов */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="text-center py-16 px-6 text-gray-600">
            <Icon name="MessageSquare" className="h-8 w-8 mx-auto mb-3 opacity-30" />
            {search ? (
              <><p className="text-sm">Ничего не найдено</p><p className="text-xs mt-1">Попробуйте другое имя</p></>
            ) : filter !== "all" && filter !== "object" && filter !== "club" ? (
              <><p className="text-sm">Папка пуста</p><p className="text-xs mt-1">Добавьте диалоги через ⋯ → В папку</p></>
            ) : (
              <><p className="text-sm">Нет диалогов</p><p className="text-xs mt-1">Здесь появятся сообщения по объектам и от участников Клуба</p></>
            )}
          </div>
        ) : (
          visible.map(d => {
            const m        = getMeta(d.partner_id)
            const unread   = getUnreadCount(d)
            const isMenuOpen = menuOpen === d.partner_id

            return (
              <div key={d.partner_id} className="relative group">
                <button
                  onClick={() => onOpenDialog(d)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#111] ${
                    activeDialog?.partner_id === d.partner_id ? "bg-[#1a1a1a]" : ""
                  }`}
                >
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {m.pinned && <Icon name="Pin" className="h-3 w-3 text-violet-400 shrink-0" />}
                      {m.muted  && <Icon name="BellOff" className="h-3 w-3 text-gray-600 shrink-0" />}
                      <p className="text-sm font-medium truncate text-white flex-1">{d.partner_name}</p>
                      <span className={`text-[10px] text-gray-600 shrink-0 transition-opacity ${isMenuOpen ? "opacity-0" : "group-hover:opacity-0"}`}>
                        {formatTime(d.last_at)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                      {d.is_mine ? "Вы: " : ""}{d.last_text || "Начните переписку"}
                    </p>
                  </div>
                </button>

                {/* Три точки */}
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : d.partner_id); setFolderMenu(null) }}
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
                    <MenuItem icon={m.pinned ? "PinOff" : "Pin"} label={m.pinned ? "Открепить" : "Закрепить"} onClick={() => handleMenuAction("pin", d)} />

                    {unread > 0 || m.forceUnread
                      ? <MenuItem icon="CheckCheck" label="Отметить прочитанным" onClick={() => handleMenuAction("read", d)} />
                      : <MenuItem icon="Circle" label="Отметить непрочитанным" onClick={() => handleMenuAction("unread", d)} />
                    }

                    <MenuItem icon={m.muted ? "Bell" : "BellOff"} label={m.muted ? "Включить уведомления" : "Отключить уведомления"} onClick={() => handleMenuAction("mute", d)} />

                    {/* В папку — подменю */}
                    {folders.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setFolderMenu(folderMenu === d.partner_id ? null : d.partner_id) }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a2a] text-left"
                        >
                          <span className="flex items-center gap-3">
                            <Icon name="FolderInput" className="h-4 w-4 shrink-0" />
                            В папку
                          </span>
                          <Icon name="ChevronRight" className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        {folderMenu === d.partner_id && (
                          <div ref={folderRef} className="absolute left-full top-0 ml-1 z-50 w-44 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                            {folders.map(f => {
                              const inFolder = (m.folderIds || []).includes(f.id)
                              return (
                                <button
                                  key={f.id}
                                  onClick={() => handleMenuAction(`folder:${f.id}`, d)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a2a] text-left"
                                >
                                  <span className="text-base leading-none">{f.emoji}</span>
                                  <span className="flex-1 truncate">{f.name}</span>
                                  {inFolder && <Icon name="Check" className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {d.kind === "object" && d.client_phone && (
                      <MenuItem icon={copied ? "Check" : "Copy"} label={copied ? "Скопировано!" : "Скопировать контакт"} onClick={() => handleMenuAction("copy", d)} />
                    )}
                    {d.kind === "object" && d.object_id && (
                      <MenuItem icon="ExternalLink" label="Открыть объект" onClick={() => handleMenuAction("object", d)} />
                    )}
                    {d.kind !== "object" && (
                      <MenuItem icon="User" label="Перейти в профиль" onClick={() => handleMenuAction("profile", d)} />
                    )}

                    <div className="border-t border-[#2a2a2a] my-1" />
                    <MenuItem icon="Trash2" label="Очистить чат"   onClick={() => handleMenuAction("clear", d)}  danger />
                    <MenuItem icon="X"      label="Удалить диалог" onClick={() => handleMenuAction("delete", d)} danger />
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

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function Tab({ active, color = "gray", onClick, onContextMenu, children }: {
  active: boolean
  color?: "gray" | "blue" | "violet" | "amber"
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  const activeColors = {
    gray:   "bg-[#2a2a2a] text-white",
    blue:   "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
    amber:  "bg-amber-600 text-white",
  }
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
        active ? activeColors[color] : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]"
      }`}
    >
      {children}
    </button>
  )
}

function MenuItem({ icon, label, onClick, danger = false }: {
  icon: string; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
        danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-[#2a2a2a]"
      }`}
    >
      <Icon name={icon} className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}
