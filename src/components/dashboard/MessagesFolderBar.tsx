// Строка вкладок: Все / Объекты / Клуб / пользовательские папки + форма создания папки

import { useRef } from "react"
import Icon from "@/components/ui/icon"
import { FilterType, Folder, EMOJIS } from "./messagesDialogMeta"

interface Props {
  filter: FilterType
  folders: Folder[]
  hasObject: boolean
  hasClub: boolean
  showFolderForm: boolean
  editFolder: Folder | null
  folderName: string
  folderEmoji: string
  folderTabMenu: string | null
  formRef: React.RefObject<HTMLDivElement>
  onSetFilter: (f: FilterType) => void
  onSetFolderTabMenu: (id: string | null) => void
  onSetFolderName: (v: string) => void
  onSetFolderEmoji: (v: string) => void
  onOpenCreateFolder: () => void
  onOpenEditFolder: (f: Folder, e: React.MouseEvent) => void
  onSaveFolder: () => void
  onDeleteFolder: (id: string) => void
  onCloseFolderForm: () => void
}

export default function MessagesFolderBar({
  filter, folders, hasObject, hasClub,
  showFolderForm, editFolder, folderName, folderEmoji, folderTabMenu,
  formRef,
  onSetFilter, onSetFolderTabMenu, onSetFolderName, onSetFolderEmoji,
  onOpenCreateFolder, onOpenEditFolder, onSaveFolder, onDeleteFolder, onCloseFolderForm,
}: Props) {
  const folderTabRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* Вкладки фильтров + папки */}
      <div className="px-3 py-2.5 border-b border-[#1f1f1f] shrink-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <Tab active={filter === "all"} onClick={() => onSetFilter("all")}>Все</Tab>
          {hasObject && (
            <Tab active={filter === "object"} color="blue" onClick={() => onSetFilter("object")}>
              <Icon name="Home" className="h-3 w-3" />Объекты
            </Tab>
          )}
          {hasClub && (
            <Tab active={filter === "club"} color="violet" onClick={() => onSetFilter("club")}>
              <Icon name="Users" className="h-3 w-3" />Клуб
            </Tab>
          )}

          {folders.map(f => (
            <div key={f.id} className="relative shrink-0" ref={folderTabMenu === f.id ? folderTabRef : undefined}>
              <Tab
                active={filter === f.id}
                color="amber"
                onClick={() => onSetFilter(f.id)}
                onContextMenu={e => { e.preventDefault(); onSetFolderTabMenu(folderTabMenu === f.id ? null : f.id) }}
              >
                <span>{f.emoji}</span>{f.name}
              </Tab>
              {folderTabMenu === f.id && (
                <div className="absolute top-full left-0 mt-1 z-50 w-36 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                  <button
                    onClick={e => onOpenEditFolder(f, e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#2a2a2a] text-left"
                  >
                    <Icon name="Pencil" className="h-3.5 w-3.5" />Переименовать
                  </button>
                  <button
                    onClick={() => onDeleteFolder(f.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left"
                  >
                    <Icon name="Trash2" className="h-3.5 w-3.5" />Удалить
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={onOpenCreateFolder}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors whitespace-nowrap shrink-0"
          >
            <Icon name="FolderPlus" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Папка</span>
          </button>
        </div>
      </div>

      {/* Форма создания/редактирования папки */}
      {showFolderForm && (
        <div ref={formRef} className="px-4 py-3 border-b border-[#1f1f1f] bg-[#111] shrink-0">
          <p className="text-xs text-gray-500 mb-2">{editFolder ? "Редактировать папку" : "Новая папка"}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => onSetFolderEmoji(e)}
                className={`text-base px-1.5 py-0.5 rounded-lg transition-colors ${folderEmoji === e ? "bg-violet-600" : "hover:bg-[#2a2a2a]"}`}
              >{e}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              value={folderName}
              onChange={e => onSetFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onSaveFolder(); if (e.key === "Escape") onCloseFolderForm() }}
              placeholder="Название папки..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={onSaveFolder}
              disabled={!folderName.trim()}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              {editFolder ? "Сохранить" : "Создать"}
            </button>
            <button onClick={onCloseFolderForm} className="px-2 py-1.5 text-gray-500 hover:text-white transition-colors">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

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
