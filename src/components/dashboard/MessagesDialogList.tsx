import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Dialog, getInitials, formatTime, isAgency } from "./messagesTypes"

interface Props {
  dialogs: Dialog[]
  activeDialog: Dialog | null
  mobileView: "list" | "chat"
  onOpenDialog: (dialog: Dialog) => void
}

export default function MessagesDialogList({ dialogs, activeDialog, mobileView, onOpenDialog }: Props) {
  return (
    <div className={`w-full md:w-72 shrink-0 border-r border-[#1f1f1f] flex flex-col bg-[#0d0d0d] ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
      <div className="px-5 py-4 border-b border-[#1f1f1f]">
        <h2 className="font-bold text-base">Сообщения</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {dialogs.length === 0 ? (
          <div className="text-center py-16 px-6 text-gray-600">
            <Icon name="MessageSquare" className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет диалогов</p>
            <p className="text-xs mt-1">Перейдите в Клуб и напишите участнику</p>
          </div>
        ) : (
          dialogs.map(d => (
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
                  <AvatarFallback className={`text-white text-xs font-bold ${isAgency(d.partner_status) ? "bg-gradient-to-br from-violet-600 to-pink-600" : "bg-violet-600"}`}>
                    {getInitials(d.partner_name)}
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
