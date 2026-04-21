import { useCallback, useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

interface Message {
  id: string
  sender: "client" | "owner"
  name: string | null
  text: string
  created_at: string
}

interface Props {
  objectId: string
  objectTitle: string
  objectPrice?: string
  objectPhoto?: string
  ownerId: string | null
  onClose: () => void
}

function getOrCreateSessionId(): string {
  const key = "chat_session_id"
  let sid = localStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem(key, sid)
  }
  return sid
}

const CHAT_URL = (func2url as Record<string, string>)["object-chat"]

export default function ObjectChatModal({
  objectId,
  objectTitle,
  objectPrice,
  objectPhoto,
  ownerId,
  onClose,
}: Props) {
  const sessionId = getOrCreateSessionId()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [name, setName] = useState(() => localStorage.getItem("chat_client_name") || "")
  const [phone, setPhone] = useState(() => localStorage.getItem("chat_client_phone") || "")
  const [needContact, setNeedContact] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`${CHAT_URL}?object_id=${encodeURIComponent(objectId)}&session_id=${encodeURIComponent(sessionId)}`)
      const data = await res.json()
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (e) {
      console.error("chat load error", e)
    }
  }, [objectId, sessionId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return

    const isFirst = messages.length === 0
    if (isFirst && (!name.trim() || !phone.trim())) {
      setNeedContact(true)
      return
    }

    setSending(true)
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_id: objectId,
          session_id: sessionId,
          sender: "client",
          text: trimmed,
          name: name.trim(),
          phone: phone.trim(),
          owner_id: ownerId,
          object_title: objectTitle,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem("chat_client_name", name.trim())
        localStorage.setItem("chat_client_phone", phone.trim())
        setText("")
        setNeedContact(false)
        await loadMessages()
      }
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isFirst = messages.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#111] border border-[#2a2a2a] rounded-2xl flex flex-col overflow-hidden shadow-2xl" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Icon name="MessageCircle" className="h-5 w-5 text-blue-400" />
            Чат объекта
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        {/* Tab — только Общий */}
        <div className="px-5 py-3 border-b border-[#1f1f1f]">
          <div className="inline-flex rounded-xl bg-[#1a1a1a] p-1">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium">
              <Icon name="Globe" className="h-3.5 w-3.5" />
              Общий
            </button>
          </div>
        </div>

        {/* Object info */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1f1f1f]">
          {objectPhoto ? (
            <img src={objectPhoto} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center shrink-0">
              <Icon name="Building2" className="h-5 w-5 text-blue-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{objectTitle}</p>
            {objectPrice && <p className="text-xs text-gray-400">{objectPrice} ₽</p>}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ minHeight: 200 }}>
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">Сообщений пока нет. Напишите первым!</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "client" ? "bg-blue-600 text-white" : "bg-[#1a1a1a] text-gray-200"}`}>
                  {msg.sender === "owner" && (
                    <p className="text-xs text-gray-400 mb-1">Владелец</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Contact form (shown for first message) */}
        {(isFirst || needContact) && (
          <div className="px-5 pb-3 space-y-2 border-t border-[#1f1f1f] pt-3">
            <p className="text-xs text-gray-400">Укажите контакты для первого сообщения</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ваше имя *"
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Телефон *"
                type="tel"
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#1f1f1f]">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
          >
            <Icon name="Send" className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}