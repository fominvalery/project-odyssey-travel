import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { STATUS_LABELS } from "@/hooks/useAuth"
import func2url from "../../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

interface Dialog {
  partner_id: string
  partner_name: string
  partner_avatar: string | null
  partner_status: string
  last_text: string
  last_at: string
  is_mine: boolean
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  text: string
  is_read: boolean
  created_at: string
}

interface Props {
  userId: string
  openPartnerId?: string | null
  openPartnerName?: string | null
  openPartnerAvatar?: string | null
  openPartnerStatus?: string | null
  onClearOpen?: () => void
  onUnreadChange?: (count: number) => void
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

function formatTime(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
}

export default function DashboardMessages({
  userId,
  openPartnerId,
  openPartnerName,
  openPartnerAvatar,
  openPartnerStatus,
  onClearOpen,
  onUnreadChange,
}: Props) {
  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [activeDialog, setActiveDialog] = useState<Dialog | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadDialogs = useCallback(async () => {
    try {
      const res = await fetch(`${AUTH_URL}?action=chat&chat_action=dialogs&user_id=${userId}`)
      const data = await res.json()
      const list: Dialog[] = Array.isArray(data.dialogs) ? data.dialogs : []
      setDialogs(list)
      const total = list.reduce((s, d) => s + d.unread_count, 0)
      onUnreadChange?.(total)
    } catch { /* ignore */ }
  }, [userId, onUnreadChange])

  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      const res = await fetch(`${AUTH_URL}?action=chat&chat_action=messages&user_id=${userId}&partner_id=${partnerId}`)
      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    } catch { /* ignore */ }
  }, [userId])

  const markRead = useCallback(async (partnerId: string) => {
    try {
      await fetch(`${AUTH_URL}?action=chat&chat_action=read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, partner_id: partnerId }),
      })
      loadDialogs()
    } catch { /* ignore */ }
  }, [userId, loadDialogs])

  // Открыть диалог с конкретным партнёром (из Клуба)
  useEffect(() => {
    if (!openPartnerId) return
    const synthetic: Dialog = {
      partner_id: openPartnerId,
      partner_name: openPartnerName || "Участник",
      partner_avatar: openPartnerAvatar || null,
      partner_status: openPartnerStatus || "broker",
      last_text: "",
      last_at: "",
      is_mine: false,
      unread_count: 0,
    }
    setActiveDialog(synthetic)
    setMobileView("chat")
    loadMessages(openPartnerId)
    markRead(openPartnerId)
    onClearOpen?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPartnerId])

  // Начальная загрузка диалогов
  useEffect(() => {
    loadDialogs()
  }, [loadDialogs])

  // Поллинг сообщений и диалогов каждые 3 секунды
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadDialogs()
      if (activeDialog) loadMessages(activeDialog.partner_id)
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeDialog, loadDialogs, loadMessages])

  function openDialog(dialog: Dialog) {
    setActiveDialog(dialog)
    setMobileView("chat")
    loadMessages(dialog.partner_id)
    markRead(dialog.partner_id)
  }

  async function sendMessage() {
    if (!text.trim() || !activeDialog || sending) return
    setSending(true)
    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: userId,
      receiver_id: activeDialog.partner_id,
      text: text.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText("")
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    try {
      await fetch(`${AUTH_URL}?action=chat&chat_action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: userId, receiver_id: activeDialog.partner_id, text: optimistic.text }),
      })
      loadDialogs()
    } catch { /* ignore */ }
    setSending(false)
  }

  const isAgency = (status: string) => status === "agency"

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Список диалогов */}
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
                onClick={() => openDialog(d)}
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

      {/* Область переписки */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {!activeDialog ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Выберите диалог</p>
            </div>
          </div>
        ) : (
          <>
            {/* Шапка диалога */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1f1f1f] bg-[#0d0d0d] shrink-0">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden text-gray-400 hover:text-white mr-1"
              >
                <Icon name="ArrowLeft" className="h-5 w-5" />
              </button>
              <Avatar className="h-9 w-9 shrink-0">
                {activeDialog.partner_avatar ? <AvatarImage src={activeDialog.partner_avatar} /> : null}
                <AvatarFallback className={`text-white text-xs font-bold ${isAgency(activeDialog.partner_status) ? "bg-gradient-to-br from-violet-600 to-pink-600" : "bg-violet-600"}`}>
                  {getInitials(activeDialog.partner_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white">{activeDialog.partner_name}</p>
                <p className="text-[11px] text-violet-400">
                  {STATUS_LABELS[activeDialog.partner_status as "broker" | "agency"] ?? activeDialog.partner_status}
                </p>
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-sm py-10">
                  Начните переписку — напишите первое сообщение
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === userId
                const prev = messages[i - 1]
                const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-[10px] text-gray-600 bg-[#111] px-3 py-1 rounded-full">
                          {new Date(msg.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "bg-violet-600 text-white rounded-br-sm"
                          : "bg-[#1a1a1a] text-gray-100 rounded-bl-sm"
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMine ? "text-violet-200" : "text-gray-600"}`}>
                          {formatTime(msg.created_at)}
                          {isMine && (
                            <Icon name={msg.is_read ? "CheckCheck" : "Check"} className="inline ml-1 h-3 w-3" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Поле ввода */}
            <div className="px-4 py-3 border-t border-[#1f1f1f] bg-[#0d0d0d] shrink-0">
              <div className="flex gap-2 items-end">
                <Input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-[#111] border-[#262626] text-white focus-visible:ring-violet-500 rounded-xl"
                  maxLength={2000}
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                >
                  <Icon name="Send" className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
