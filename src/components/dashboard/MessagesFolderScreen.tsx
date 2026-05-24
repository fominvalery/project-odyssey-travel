// Экран «Папки» — список папок + создание/редактирование/удаление (хранение в БД)

import { useState } from "react"
import Icon from "@/components/ui/icon"
import { Folder, EMOJIS } from "./messagesDialogMeta"
import func2url from "../../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

interface Props {
  folders: Folder[]
  userId: string
  onBack: () => void
  onSelectFolder: (folder: Folder) => void
  onFoldersChange: (folders: Folder[]) => void
  onReloadFolders: () => void
}

export default function MessagesFolderScreen({ folders, userId, onBack, onSelectFolder, onFoldersChange, onReloadFolders }: Props) {
  const [showForm, setShowForm]           = useState(false)
  const [editFolder, setEditFolder]       = useState<Folder | null>(null)
  const [name, setName]                   = useState("")
  const [emoji, setEmoji]                 = useState("📁")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)

  function openCreate() {
    setEditFolder(null); setName(""); setEmoji("📁"); setShowForm(true)
  }

  function openEdit(f: Folder) {
    setEditFolder(f); setName(f.name); setEmoji(f.emoji); setShowForm(true)
  }

  async function save() {
    const n = name.trim()
    if (!n || saving) return
    setSaving(true)
    try {
      await fetch(`${AUTH_URL}?action=chat&chat_action=folder-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, id: editFolder?.id || "", name: n, emoji }),
      })
      onReloadFolders()
      setShowForm(false)
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function deleteFolder(id: string) {
    try {
      await fetch(`${AUTH_URL}?action=chat&chat_action=folder-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, folder_id: id }),
      })
      onFoldersChange(folders.filter(f => f.id !== id))
      onReloadFolders()
    } catch { /* ignore */ }
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0d0d]">
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1f1f1f] shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" className="h-5 w-5" />
        </button>
        <h2 className="font-bold text-base flex-1">Папки</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors font-medium"
        >
          <Icon name="Plus" className="h-3.5 w-3.5" />
          Создать
        </button>
      </div>

      {/* Форма */}
      {showForm && (
        <div className="px-4 py-3 border-b border-[#1f1f1f] bg-[#111] shrink-0">
          <p className="text-xs text-gray-500 mb-2">{editFolder ? "Редактировать папку" : "Новая папка"}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-base px-1.5 py-0.5 rounded-lg transition-colors ${emoji === e ? "bg-violet-600" : "hover:bg-[#2a2a2a]"}`}
              >{e}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setShowForm(false) }}
              placeholder="Название папки..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={save}
              disabled={!name.trim() || saving}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              {saving ? "..." : editFolder ? "Сохранить" : "Создать"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-2 py-1.5 text-gray-500 hover:text-white transition-colors">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Список папок */}
      <div className="flex-1 overflow-y-auto">
        {folders.length === 0 ? (
          <div className="text-center py-16 px-6 text-gray-600">
            <Icon name="Folder" className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет папок</p>
            <p className="text-xs mt-1">Нажмите «Создать» чтобы добавить первую</p>
          </div>
        ) : (
          folders.map(f => (
            <div key={f.id} className="flex items-center border-b border-[#111] hover:bg-[#1a1a1a] transition-colors">
              <button
                onClick={() => onSelectFolder(f)}
                className="flex-1 flex items-center gap-3 px-4 py-4 text-left"
              >
                <span className="text-2xl leading-none shrink-0">{f.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{f.name}</p>
                  <p className="text-xs text-gray-600">{(f.partner_ids || []).length} диалогов</p>
                </div>
              </button>

              {/* Кнопки управления — всегда видны */}
              <div className="flex items-center gap-1 pr-3 shrink-0">
                {confirmDelete === f.id ? (
                  <>
                    <span className="text-xs text-red-400 mr-1">Удалить?</span>
                    <button onClick={() => deleteFolder(f.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Да</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 bg-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#333] transition-colors">Нет</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(f)} className="p-1.5 text-gray-600 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors">
                      <Icon name="Pencil" className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(f.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Icon name="Trash2" className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
