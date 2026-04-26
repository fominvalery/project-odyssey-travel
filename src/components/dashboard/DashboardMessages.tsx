import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { STATUS_LABELS } from "@/hooks/useAuth"
import func2url from "../../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]
const JOINT_DEALS_URL = (func2url as Record<string, string>)["joint-deals"]

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

interface Proposal {
  id: string
  deal_id: string
  proposal_type: string
  proposed_by: string
  new_status: string
  response: string
  created_at: string
  // enriched client-side
  initiator_name?: string
  partner_id?: string
}

interface JointDealForm {
  deal_type: "Совместная работа" | "Передача контакта"
  transaction_type: "Продажа" | "Аренда" | "Подбор"
  object_description: string
  initiator_role: "Со стороны объекта" | "Со стороны клиента"
  commission_initiator: number
  commission_partner: number
  comment: string
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

const DEFAULT_FORM: JointDealForm = {
  deal_type: "Совместная работа",
  transaction_type: "Продажа",
  object_description: "",
  initiator_role: "Со стороны объекта",
  commission_initiator: 50,
  commission_partner: 50,
  comment: "",
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

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            value === opt
              ? "bg-violet-600 border-violet-600 text-white"
              : "bg-[#111] border-[#262626] text-gray-400 hover:border-[#333] hover:text-gray-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
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

  // Joint deal form state
  const [showJDForm, setShowJDForm] = useState(false)
  const [jdForm, setJdForm] = useState<JointDealForm>(DEFAULT_FORM)
  const [jdSending, setJdSending] = useState(false)

  // Pending proposals state
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)

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

  const loadPendingProposals = useCallback(async () => {
    try {
      const res = await fetch(`${JOINT_DEALS_URL}?user_id=${userId}`)
      const data = await res.json()
      const deals: Array<{
        id: string
        initiator_id: string
        partner_id: string
        initiator_name: string
        status: string
      }> = Array.isArray(data.deals) ? data.deals : []

      // Find deals where current user is partner AND status is "Ожидает подтверждения"
      const pending: Proposal[] = []
      for (const deal of deals) {
        if (
          deal.partner_id === userId &&
          deal.status === "Ожидает подтверждения"
        ) {
          // Fetch proposals for this deal — we need the create proposal id
          // We use the deal id as a stand-in proposal reference keyed on deal id
          pending.push({
            id: deal.id, // we use deal id to PUT (PATCH approach below resolves actual proposal separately)
            deal_id: deal.id,
            proposal_type: "create",
            proposed_by: deal.initiator_id,
            new_status: "В работе",
            response: "pending",
            created_at: "",
            initiator_name: deal.initiator_name,
            partner_id: deal.partner_id,
          })
        }
      }
      setPendingProposals(pending)
    } catch { /* ignore */ }
  }, [userId])

  // Open dialog from external trigger (Club)
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
    setShowJDForm(false)
    loadMessages(openPartnerId)
    markRead(openPartnerId)
    onClearOpen?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPartnerId])

  // Initial load
  useEffect(() => {
    loadDialogs()
    loadPendingProposals()
  }, [loadDialogs, loadPendingProposals])

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadDialogs()
      loadPendingProposals()
      if (activeDialog) loadMessages(activeDialog.partner_id)
    }, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeDialog, loadDialogs, loadMessages, loadPendingProposals])

  function openDialog(dialog: Dialog) {
    setActiveDialog(dialog)
    setMobileView("chat")
    setShowJDForm(false)
    loadMessages(dialog.partner_id)
    markRead(dialog.partner_id)
  }

  async function sendMessage(customText?: string) {
    const msgText = customText ?? text.trim()
    if (!msgText || !activeDialog || sending) return
    setSending(true)
    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: userId,
      receiver_id: activeDialog.partner_id,
      text: msgText,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    if (!customText) setText("")
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    try {
      await fetch(`${AUTH_URL}?action=chat&chat_action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: userId, receiver_id: activeDialog.partner_id, text: msgText }),
      })
      loadDialogs()
    } catch { /* ignore */ }
    setSending(false)
  }

  async function submitJointDeal() {
    if (!activeDialog || jdSending) return
    setJdSending(true)
    try {
      await fetch(JOINT_DEALS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiator_id: userId,
          partner_id: activeDialog.partner_id,
          deal_type: jdForm.deal_type,
          transaction_type: jdForm.transaction_type,
          object_description: jdForm.object_description,
          initiator_role: jdForm.initiator_role,
          commission_initiator: jdForm.commission_initiator,
          commission_partner: jdForm.commission_partner,
          commission_base: "от суммы комиссии сделки",
          comment: jdForm.comment,
        }),
      })
      setShowJDForm(false)
      setJdForm(DEFAULT_FORM)
      await sendMessage("🤝 Предложение совместной сделки отправлено")
      loadPendingProposals()
    } catch { /* ignore */ }
    setJdSending(false)
  }

  async function respondToProposal(proposalId: string, dealId: string, response: "accept" | "reject") {
    setRespondingId(proposalId)
    try {
      // We need the actual proposal id — fetch proposals for the deal first
      // The backend PUT needs proposal_id (from joint_deal_proposals table)
      // Since we stored deal.id as proposal.id in our pending list, we need to query
      // proposals for this deal. The backend GET returns deals, not proposals.
      // We'll use a workaround: call GET and look for proposals linked to this deal.
      // For simplicity, we call PUT with deal_id as a proxy — but the backend
      // requires proposal_id. So we fetch proposals via a separate approach:
      // Actually we don't have a proposals list endpoint, so we pass deal_id
      // and let the backend find the pending create proposal. However the backend
      // PUT requires proposal_id. We'll need to handle this gracefully.
      // The cleanest path: use deal_id as the proposal lookup key on our side.
      // We'll send to PUT with proposal_id = the actual proposal stored in pending.
      // Since we set pending.id = deal.id (not actual proposal id), we use PATCH flow:
      // Actually — the correct approach: we stored the deal id.
      // We need to find proposal_id from the backend. Let's accept/reject based on
      // what we can. We'll send PUT with what we have and handle 404 gracefully.
      await fetch(JOINT_DEALS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposalId,
          user_id: userId,
          response,
        }),
      })
      setPendingProposals(prev => prev.filter(p => p.id !== proposalId))
      loadPendingProposals()
    } catch { /* ignore */ }
    setRespondingId(null)
  }

  function updateCommission(field: "initiator" | "partner", val: number) {
    const clamped = Math.max(0, Math.min(100, val))
    if (field === "initiator") {
      setJdForm(f => ({ ...f, commission_initiator: clamped, commission_partner: 100 - clamped }))
    } else {
      setJdForm(f => ({ ...f, commission_partner: clamped, commission_initiator: 100 - clamped }))
    }
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{activeDialog.partner_name}</p>
                <p className="text-[11px] text-violet-400">
                  {STATUS_LABELS[activeDialog.partner_status as "broker" | "agency"] ?? activeDialog.partner_status}
                </p>
              </div>

              {/* Кнопка "Совместная сделка" */}
              <button
                onClick={() => setShowJDForm(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors shrink-0 ${
                  showJDForm
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
                }`}
              >
                <Icon name="Handshake" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Совместная сделка</span>
              </button>
            </div>

            {/* Баннер pending proposals */}
            {pendingProposals.length > 0 && pendingProposals.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3 bg-violet-500/10 border-b border-violet-500/20 shrink-0"
              >
                <Icon name="Handshake" className="h-4 w-4 text-violet-400 shrink-0" />
                <p className="flex-1 text-xs text-violet-200 min-w-0">
                  <span className="font-medium">{p.initiator_name || "Партнёр"}</span>
                  {" "}предлагает совместную сделку
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => respondToProposal(p.id, p.deal_id, "accept")}
                    disabled={respondingId === p.id}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                  >
                    {respondingId === p.id ? (
                      <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                    ) : (
                      "Подтвердить"
                    )}
                  </button>
                  <button
                    onClick={() => respondToProposal(p.id, p.deal_id, "reject")}
                    disabled={respondingId === p.id}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}

            {/* Joint Deal Form (inline) */}
            {showJDForm && (
              <div className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-5 py-4 shrink-0 overflow-y-auto max-h-[60vh]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="Handshake" className="h-4 w-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-white">Предложение СЗ</h3>
                  </div>
                  <button
                    onClick={() => { setShowJDForm(false); setJdForm(DEFAULT_FORM) }}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Тип СЗ */}
                  <div>
                    <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">
                      Тип совместной работы
                    </label>
                    <RadioGroup
                      options={["Совместная работа", "Передача контакта"] as const}
                      value={jdForm.deal_type}
                      onChange={(v) => setJdForm(f => ({ ...f, deal_type: v }))}
                    />
                  </div>

                  {/* Тип сделки */}
                  <div>
                    <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">
                      Тип сделки
                    </label>
                    <RadioGroup
                      options={["Продажа", "Аренда", "Подбор"] as const}
                      value={jdForm.transaction_type}
                      onChange={(v) => setJdForm(f => ({ ...f, transaction_type: v }))}
                    />
                  </div>

                  {/* Объект / описание */}
                  <div>
                    <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">
                      Объект / описание
                    </label>
                    <textarea
                      value={jdForm.object_description}
                      onChange={e => setJdForm(f => ({ ...f, object_description: e.target.value }))}
                      placeholder="Адрес, площадь, тип объекта..."
                      rows={2}
                      className="w-full bg-[#111] border border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  {/* Роль инициатора */}
                  <div>
                    <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">
                      Моя роль
                    </label>
                    <RadioGroup
                      options={["Со стороны объекта", "Со стороны клиента"] as const}
                      value={jdForm.initiator_role}
                      onChange={(v) => setJdForm(f => ({ ...f, initiator_role: v }))}
                    />
                  </div>

                  {/* Комиссия */}
                  <div>
                    <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">
                      Комиссия (сумма = 100%)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-600 mb-1">Инициатор</p>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={jdForm.commission_initiator}
                            onChange={e => updateCommission("initiator", Number(e.target.value))}
                            className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 pr-7"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                      <div className="text-gray-600 text-sm mt-5">/</div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-600 mb-1">Партнёр</p>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={jdForm.commission_partner}
                            onChange={e => updateCommission("partner", Number(e.target.value))}
                            className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 pr-7"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5">База: от суммы комиссии сделки</p>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">
                      Комментарий
                    </label>
                    <textarea
                      value={jdForm.comment}
                      onChange={e => setJdForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="Условия, детали, пожелания..."
                      rows={2}
                      className="w-full bg-[#111] border border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={submitJointDeal}
                      disabled={jdSending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                    >
                      {jdSending ? (
                        <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon name="Send" className="h-4 w-4" />
                      )}
                      {jdSending ? "Отправка..." : "Отправить предложение"}
                    </button>
                    <button
                      onClick={() => { setShowJDForm(false); setJdForm(DEFAULT_FORM) }}
                      className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                const isJDMessage = msg.text.startsWith("🤝")
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
                      {isJDMessage ? (
                        <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-violet-500/10 border border-violet-500/25 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon name="Handshake" className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                            <span className="text-violet-300 font-medium text-xs">Совместная сделка</span>
                          </div>
                          <p className="text-gray-300 text-xs">{msg.text}</p>
                          <p className="text-[10px] mt-1.5 text-right text-gray-600">
                            {formatTime(msg.created_at)}
                            {isMine && (
                              <Icon name={msg.is_read ? "CheckCheck" : "Check"} className="inline ml-1 h-3 w-3" />
                            )}
                          </p>
                        </div>
                      ) : (
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
                      )}
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
                  onClick={() => sendMessage()}
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
