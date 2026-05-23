import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Dialog, getInitials, formatTime, isAgency } from "./messagesTypes"

type FilterType = "all" | "object" | "club"

interface Props {
  dialogs: Dialog[]
  activeDialog: Dialog | null
  mobileView: "list" | "chat"
  onOpenDialog: (dialog: Dialog) => void
}

export default function MessagesDialogList({ dialogs, activeDialog, onOpenDialog }: Props) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  const filtered = dialogs.filter(d => {
    const matchesFilter =
      filter === "all" ||
      (filter === "object" && d.kind === "object") ||
      (filter === "club" && d.kind !== "object")

    const q = search.toLowerCase().trim()
    const matchesSearch = !q || d.partner_name.toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  const hasObject = dialogs.some(d => d.kind === "object")
  const hasClub = dialogs.some(d => d.kind !== "object")

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
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <Icon name="X" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Фильтр — только если есть оба типа */}
      {hasObject && hasClub && (
        <div className="px-4 py-2.5 border-b border-[#1f1f1f] shrink-0">
          <div className="flex gap-1.5">
            {(["all", "object", "club"] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? f === "object"
                      ? "bg-blue-600 text-white"
                      : f === "club"
                        ? "bg-violet-600 text-white"
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
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6 text-gray-600">
            <Icon name="MessageSquare" className="h-8 w-8 mx-auto mb-3 opacity-30" />
            {search ? (
              <>
                <p className="text-sm">Ничего не найдено</p>
                <p className="text-xs mt-1">Попробуйте другое имя</p>
              </>
            ) : (
              <>
                <p className="text-sm">Нет диалогов</p>
                <p className="text-xs mt-1">Здесь появятся сообщения по объектам и от участников Клуба</p>
              </>
            )}
          </div>
        ) : (
          filtered.map(d => (
            <button
              key={d.partner_id}
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
                    {d.kind === "object"
                      ? <Icon name="Home" className="h-4 w-4" />
                      : getInitials(d.partner_name)}
                  </AvatarFallback>
                </Avatar>
                {d.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {d.unread_count > 9 ? "9+" : d.unread_count}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate text-white">{d.partner_name}</p>
                  <span className="text-[10px] text-gray-600 shrink-0">{formatTime(d.last_at)}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${d.unread_count > 0 ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                  {d.is_mine ? "Вы: " : ""}{d.last_text || "Начните переписку"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
