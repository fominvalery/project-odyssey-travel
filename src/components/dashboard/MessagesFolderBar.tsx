// Строка вкладок: Все / Объекты / Клуб / Папки (одна вкладка)

import Icon from "@/components/ui/icon"
import { FilterType, Folder } from "./messagesDialogMeta"

interface Props {
  filter: FilterType
  folders: Folder[]
  hasObject: boolean
  hasClub: boolean
  activeFolderId: string | null   // если открыта конкретная папка
  onSetFilter: (f: FilterType) => void
  onOpenFolders: () => void       // открыть экран списка папок
}

export default function MessagesFolderBar({
  filter, folders, hasObject, hasClub, activeFolderId,
  onSetFilter, onOpenFolders,
}: Props) {
  const hasFolders = folders.length > 0
  const foldersActive = activeFolderId !== null || filter === "folders"

  return (
    <div className="px-3 py-2.5 border-b border-[#1f1f1f] shrink-0">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        <Tab active={filter === "all" && !foldersActive} onClick={() => onSetFilter("all")}>Все</Tab>

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

        {/* Одна вкладка «Папки» — всегда видна */}
        <Tab active={foldersActive} color="amber" onClick={onOpenFolders}>
          <Icon name="Folder" className="h-3 w-3" />
          Папки
          {hasFolders && (
            <span className={`text-[10px] font-bold px-1 rounded ${foldersActive ? "bg-amber-500/30" : "bg-[#2a2a2a]"}`}>
              {folders.length}
            </span>
          )}
        </Tab>
      </div>
    </div>
  )
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

function Tab({ active, color = "gray", onClick, children }: {
  active: boolean
  color?: "gray" | "blue" | "violet" | "amber"
  onClick: () => void
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
        active ? activeColors[color] : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]"
      }`}
    >
      {children}
    </button>
  )
}
