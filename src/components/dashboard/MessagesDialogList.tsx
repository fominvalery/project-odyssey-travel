// Оркестратор: состояние, логика фильтрации, сборка списка диалогов

import { useState, useEffect, useRef, useCallback } from "react"
import Icon from "@/components/ui/icon"
import { Dialog } from "./messagesTypes"
import {
  FilterType, DialogMeta, Folder,
  loadMeta, saveMeta, loadFolders, saveFolders, defaultMeta,
} from "./messagesDialogMeta"
import MessagesFolderBar from "./MessagesFolderBar"
import MessagesDialogItem from "./MessagesDialogItem"

interface Props {
  dialogs: Dialog[]
  activeDialog: Dialog | null
  mobileView: "list" | "chat"
  onOpenDialog: (dialog: Dialog) => void
  onMarkRead?: (partnerId: string, dialog: Dialog) => void
}

export default function MessagesDialogList({ dialogs, activeDialog, onOpenDialog, onMarkRead }: Props) {
  const [search, setSearch]         = useState("")
  const [filter, setFilter]         = useState<FilterType>("all")
  const [meta, setMeta]             = useState<Record<string, DialogMeta>>(loadMeta)
  const [folders, setFolders]       = useState<Folder[]>(loadFolders)
  const [menuOpen, setMenuOpen]     = useState<string | null>(null)
  const [folderMenu, setFolderMenu] = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  const [showFolderForm, setShowFolderForm] = useState(false)
  const [editFolder, setEditFolder]         = useState<Folder | null>(null)
  const [folderName, setFolderName]         = useState("")
  const [folderEmoji, setFolderEmoji]       = useState("📁")
  const [folderTabMenu, setFolderTabMenu]   = useState<string | null>(null)

  const menuRef   = useRef<HTMLDivElement>(null)
  const folderRef = useRef<HTMLDivElement>(null)
  const formRef   = useRef<HTMLDivElement>(null)

  // Закрываем все меню при клике вне
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (menuRef.current   && !menuRef.current.contains(t))   setMenuOpen(null)
      if (folderRef.current && !folderRef.current.contains(t)) { setFolderMenu(null); setFolderTabMenu(null) }
      if (formRef.current   && !formRef.current.contains(t))   setShowFolderForm(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ─── Мета ──────────────────────────────────────────────────────────────────

  const updateMeta = useCallback((partnerId: string, patch: Partial<DialogMeta>) => {
    setMeta(prev => {
      const next = { ...prev, [partnerId]: { ...(prev[partnerId] || defaultMeta()), ...patch } }
      saveMeta(next)
      return next
    })
  }, [])

  const getMeta = (partnerId: string): DialogMeta => meta[partnerId] || defaultMeta()

  // ─── Папки ─────────────────────────────────────────────────────────────────

  function openCreateFolder() {
    setEditFolder(null); setFolderName(""); setFolderEmoji("📁"); setShowFolderForm(true)
  }

  function openEditFolder(f: Folder, e: React.MouseEvent) {
    e.stopPropagation()
    setFolderTabMenu(null); setEditFolder(f); setFolderName(f.name); setFolderEmoji(f.emoji); setShowFolderForm(true)
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

  // ─── Фильтрация + сортировка ───────────────────────────────────────────────

  const visible = dialogs
    .filter(d => {
      const m = getMeta(d.partner_id)
      if (m.deleted) return false
      if (filter === "object") return d.kind === "object"
      if (filter === "club")   return d.kind !== "object"
      if (filter !== "all")    return (m.folderIds || []).includes(filter)
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

  // ─── Действия меню ─────────────────────────────────────────────────────────

  function handleMenuAction(action: string, d: Dialog) {
    if (action.startsWith("folder:")) {
      toggleDialogFolder(d.partner_id, action.replace("folder:", ""))
      return
    }
    setMenuOpen(null); setFolderMenu(null)
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
      case "profile": window.location.hash = `#/profile/${d.partner_id}`; break
      case "object":  if (d.object_id) window.open(`/marketplace/${d.object_id}`, "_blank"); break
    }
  }

  function getUnreadCount(d: Dialog): number {
    const m = getMeta(d.partner_id)
    return m.forceUnread ? Math.max(d.unread_count, 1) : d.unread_count
  }

  // ─── Render ────────────────────────────────────────────────────────────────

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

      {/* Вкладки папок */}
      <MessagesFolderBar
        filter={filter}
        folders={folders}
        hasObject={hasObject}
        hasClub={hasClub}
        showFolderForm={showFolderForm}
        editFolder={editFolder}
        folderName={folderName}
        folderEmoji={folderEmoji}
        folderTabMenu={folderTabMenu}
        formRef={formRef}
        onSetFilter={setFilter}
        onSetFolderTabMenu={setFolderTabMenu}
        onSetFolderName={setFolderName}
        onSetFolderEmoji={setFolderEmoji}
        onOpenCreateFolder={openCreateFolder}
        onOpenEditFolder={openEditFolder}
        onSaveFolder={saveFolder}
        onDeleteFolder={deleteFolder}
        onCloseFolderForm={() => setShowFolderForm(false)}
      />

      {/* Список */}
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
          visible.map(d => (
            <MessagesDialogItem
              key={d.partner_id}
              dialog={d}
              meta={getMeta(d.partner_id)}
              unread={getUnreadCount(d)}
              isActive={activeDialog?.partner_id === d.partner_id}
              isMenuOpen={menuOpen === d.partner_id}
              isFolderMenuOpen={folderMenu === d.partner_id}
              copied={copied}
              folders={folders}
              menuRef={menuRef}
              folderRef={folderRef}
              onOpen={() => onOpenDialog(d)}
              onToggleMenu={() => { setMenuOpen(menuOpen === d.partner_id ? null : d.partner_id); setFolderMenu(null) }}
              onAction={action => handleMenuAction(action, d)}
              onToggleFolderMenu={() => setFolderMenu(folderMenu === d.partner_id ? null : d.partner_id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
