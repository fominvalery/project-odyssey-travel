// Одна строка диалога в списке + выпадающее меню ⋯

import { useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Dialog, getInitials, formatTime, isAgency } from "./messagesTypes"
import { DialogMeta, Folder } from "./messagesDialogMeta"

interface Props {
  dialog: Dialog
  meta: DialogMeta
  unread: number
  isActive: boolean
  isMenuOpen: boolean
  isFolderMenuOpen: boolean
  copied: boolean
  folders: Folder[]
  menuRef: React.RefObject<HTMLDivElement>
  folderRef: React.RefObject<HTMLDivElement>
  onOpen: () => void
  onToggleMenu: () => void
  onAction: (action: string) => void
  onToggleFolderMenu: () => void
}

export default function MessagesDialogItem({
  dialog: d, meta: m, unread, isActive, isMenuOpen, isFolderMenuOpen,
  copied, folders, menuRef, folderRef,
  onOpen, onToggleMenu, onAction, onToggleFolderMenu,
}: Props) {
  return (
    <div className="relative group">
      {/* Строка диалога */}
      <button
        onClick={onOpen}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#111] ${
          isActive ? "bg-[#1a1a1a]" : ""
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
        onClick={e => { e.stopPropagation(); onToggleMenu() }}
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
          <MenuItem icon={m.pinned ? "PinOff" : "Pin"} label={m.pinned ? "Открепить" : "Закрепить"} onClick={() => onAction("pin")} />

          {unread > 0 || m.forceUnread
            ? <MenuItem icon="CheckCheck" label="Отметить прочитанным"  onClick={() => onAction("read")} />
            : <MenuItem icon="Circle"    label="Отметить непрочитанным" onClick={() => onAction("unread")} />
          }

          <MenuItem
            icon={m.muted ? "Bell" : "BellOff"}
            label={m.muted ? "Включить уведомления" : "Отключить уведомления"}
            onClick={() => onAction("mute")}
          />

          {/* В папку — подменю */}
          {folders.length > 0 && (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); onToggleFolderMenu() }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a2a] text-left"
              >
                <span className="flex items-center gap-3">
                  <Icon name="FolderInput" className="h-4 w-4 shrink-0" />
                  В папку
                </span>
                <Icon name="ChevronLeft" className="h-3.5 w-3.5 text-gray-600" />
              </button>
              {isFolderMenuOpen && (
                <div ref={folderRef} className="absolute right-full top-0 mr-1 z-50 w-44 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                  {folders.map(f => {
                    const inFolder = (f.partner_ids || []).includes(d.partner_id)
                    return (
                      <button
                        key={f.id}
                        onClick={() => onAction(`folder:${f.id}`)}
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
            <MenuItem
              icon={copied ? "Check" : "Copy"}
              label={copied ? "Скопировано!" : "Скопировать контакт"}
              onClick={() => onAction("copy")}
            />
          )}
          {d.kind === "object" && d.object_id && (
            <MenuItem icon="ExternalLink" label="Открыть объект"     onClick={() => onAction("object")} />
          )}
          {d.kind !== "object" && (
            <MenuItem icon="User" label="Перейти в профиль"          onClick={() => onAction("profile")} />
          )}

          <div className="border-t border-[#2a2a2a] my-1" />
          <MenuItem icon="Trash2" label="Очистить чат"    onClick={() => onAction("clear")}  danger />
          <MenuItem icon="X"      label="Удалить диалог"  onClick={() => onAction("delete")} danger />
        </div>
      )}
    </div>
  )
}

// ─── MenuItem ────────────────────────────────────────────────────────────────

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