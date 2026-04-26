import { useCallback, useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import { useAuthContext } from "@/context/AuthContext"

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

interface JointDealForm {
  dealType: string
  transactionType: string
  objectDescription: string
  initiatorRole: string
  commissionInitiator: number
  commissionPartner: number
  comment: string
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
const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]
const JOINT_DEALS_URL = (func2url as Record<string, string>)["joint-deals"]

export default function ObjectChatModal({
  objectId,
  objectTitle,
  objectPrice,
  objectPhoto,
  ownerId,
  onClose,
}: Props) {
  const { user } = useAuthContext()
  const sessionId = getOrCreateSessionId()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [name, setName] = useState(() => localStorage.getItem("chat_client_name") || "")
  const [phone, setPhone] = useState(() => localStorage.getItem("chat_client_phone") || "")
  const [needContact, setNeedContact] = useState(false)
  const [sending, setSending] = useState(false)
  const [ownerCanUseJD, setOwnerCanUseJD] = useState(false)
  const [currentUserCanUseJD, setCurrentUserCanUseJD] = useState(false)
  const [showJointDealForm, setShowJointDealForm] = useState(false)
  const [jointSending, setJointSending] = useState(false)
  const [jointSuccess, setJointSuccess] = useState(false)
  const [jointForm, setJointForm] = useState<JointDealForm>({
    dealType: "Совместная работа",
    transactionType: "Продажа",
    objectDescription: objectTitle,
    initiatorRole: "Со стороны объекта",
    commissionInitiator: 50,
    commissionPartner: 50,
    comment: "",
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  // Автозаполнение имени и телефона из профиля авторизованного пользователя
  useEffect(() => {
    if (user?.name && !name) setName(user.name)
    if (user?.phone && !phone) setPhone(user.phone)
  }, [user])

  // Проверка can_use_jd для владельца объекта
  useEffect(() => {
    if (!ownerId) return
    fetch(`${AUTH_URL}?action=club-check&user_id=${ownerId}`)
      .then(r => r.json())
      .then(d => setOwnerCanUseJD(d.can_use_jd === true))
      .catch(() => {})
  }, [ownerId])

  // Проверяем can_use_jd для текущего пользователя
  useEffect(() => {
    if (!user?.id) return
    fetch(`${AUTH_URL}?action=club-check&user_id=${user.id}`)
      .then(r => r.json())
      .then(d => setCurrentUserCanUseJD(d.can_use_jd === true))
      .catch(() => {})
  }, [user?.id])

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
          sender_id: user?.id || null,
          lead_type: currentUserCanUseJD ? "Партнёр Клуба" : "Клиент",
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

  function handleCommissionChange(side: "initiator" | "partner", raw: string) {
    const val = Math.min(100, Math.max(0, parseInt(raw) || 0))
    if (side === "initiator") {
      setJointForm(f => ({ ...f, commissionInitiator: val, commissionPartner: 100 - val }))
    } else {
      setJointForm(f => ({ ...f, commissionPartner: val, commissionInitiator: 100 - val }))
    }
  }

  async function handleJointDealSubmit() {
    if (!user || !ownerId) return
    setJointSending(true)
    try {
      await fetch(JOINT_DEALS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiator_id: user.id,
          partner_id: ownerId,
          deal_type: jointForm.dealType,
          transaction_type: jointForm.transactionType,
          object_description: jointForm.objectDescription,
          initiator_role: jointForm.initiatorRole,
          commission_initiator: jointForm.commissionInitiator,
          commission_partner: jointForm.commissionPartner,
          commission_base: "от суммы комиссии сделки",
          comment: jointForm.comment,
        }),
      })
      setShowJointDealForm(false)
      setJointSuccess(true)
      setTimeout(() => setJointSuccess(false), 4000)
    } finally {
      setJointSending(false)
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
          <div className="flex items-center gap-2">
            {currentUserCanUseJD && ownerCanUseJD && user?.id !== ownerId && (
              <button
                onClick={() => setShowJointDealForm(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 text-violet-400 border border-violet-500/20 transition-colors font-medium"
              >
                <Icon name="Handshake" className="h-3.5 w-3.5" />
                Совместная сделка
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <Icon name="X" className="h-5 w-5" />
            </button>
          </div>
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
          {jointSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-300 text-sm">
              <Icon name="CheckCircle" className="h-4 w-4 shrink-0" />
              Предложение о совместной сделке отправлено!
            </div>
          )}
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

        {/* Joint Deal Form */}
        {showJointDealForm && (
          <div className="border-t border-[#2a2a2a] bg-[#111] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-violet-300 flex items-center gap-1.5">
                <Icon name="Handshake" className="h-4 w-4" />
                Совместная сделка
              </p>
              <button
                onClick={() => setShowJointDealForm(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>

            {/* Тип СЗ */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Тип СЗ</label>
              <div className="flex gap-2">
                {["Совместная работа", "Передача контакта"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setJointForm(f => ({ ...f, dealType: opt }))}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                      jointForm.dealType === opt
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-violet-500/30"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Тип сделки */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Тип сделки</label>
              <div className="flex gap-2">
                {["Продажа", "Аренда", "Подбор"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setJointForm(f => ({ ...f, transactionType: opt }))}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                      jointForm.transactionType === opt
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-violet-500/30"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Объект/описание */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Объект / описание</label>
              <input
                value={jointForm.objectDescription}
                onChange={e => setJointForm(f => ({ ...f, objectDescription: e.target.value }))}
                placeholder="Название или описание объекта"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Роль */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Моя роль</label>
              <div className="flex gap-2">
                {["Со стороны объекта", "Со стороны клиента"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setJointForm(f => ({ ...f, initiatorRole: opt }))}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                      jointForm.initiatorRole === opt
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-violet-500/30"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Комиссия */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Раздел комиссии</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 shrink-0">Я</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={jointForm.commissionInitiator}
                    onChange={e => handleCommissionChange("initiator", e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-violet-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                <span className="text-gray-600 text-sm">/</span>
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 shrink-0">Партнёр</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={jointForm.commissionPartner}
                    onChange={e => handleCommissionChange("partner", e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-violet-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              {jointForm.commissionInitiator + jointForm.commissionPartner !== 100 && (
                <p className="text-xs text-red-400">Сумма должна быть 100%</p>
              )}
            </div>

            {/* Комментарий */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Комментарий</label>
              <textarea
                value={jointForm.comment}
                onChange={e => setJointForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Дополнительная информация..."
                rows={2}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleJointDealSubmit}
                disabled={jointSending || jointForm.commissionInitiator + jointForm.commissionPartner !== 100}
                className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                {jointSending ? "Отправка..." : "Отправить предложение"}
              </button>
              <button
                onClick={() => setShowJointDealForm(false)}
                className="px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-400 text-sm transition-colors"
              >
                Отмена
              </button>
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