import { useState, useEffect, useRef, useCallback } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import { Dialog, Message, Proposal, JointDealForm, DEFAULT_FORM } from "./messagesTypes"
import MessagesDialogList from "./MessagesDialogList"
import MessagesChat from "./MessagesChat"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]
const JOINT_DEALS_URL = (func2url as Record<string, string>)["joint-deals"]

interface Props {
  userId: string
  openPartnerId?: string | null
  openPartnerName?: string | null
  openPartnerAvatar?: string | null
  openPartnerStatus?: string | null
  onClearOpen?: () => void
  onUnreadChange?: (count: number) => void
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

  const [showJDForm, setShowJDForm] = useState(false)
  const [jdForm, setJdForm] = useState<JointDealForm>(DEFAULT_FORM)
  const [jdSending, setJdSending] = useState(false)

  const [currentUserCanUseJD, setCurrentUserCanUseJD] = useState(false)
  useEffect(() => {
    if (!userId) return
    fetch(`${AUTH_URL}?action=club-check&user_id=${userId}`)
      .then(r => r.json())
      .then(d => setCurrentUserCanUseJD(d.can_use_jd === true))
      .catch(() => {})
  }, [userId])

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

  const loadMessages = useCallback(async (partnerId: string, scrollToBottom = false) => {
    try {
      const res = await fetch(`${AUTH_URL}?action=chat&chat_action=messages&user_id=${userId}&partner_id=${partnerId}`)
      const data = await res.json()
      const newMessages = Array.isArray(data.messages) ? data.messages : []
      setMessages(prev => {
        const hasNew = newMessages.length > prev.length
        if (hasNew || scrollToBottom) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
        }
        return newMessages
      })
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

      const pending: Proposal[] = []
      for (const deal of deals) {
        if (deal.partner_id === userId && deal.status === "Ожидает подтверждения") {
          pending.push({
            id: deal.id,
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
    loadMessages(openPartnerId, true)
    markRead(openPartnerId)
    onClearOpen?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPartnerId])

  useEffect(() => {
    loadDialogs()
    loadPendingProposals()
  }, [loadDialogs, loadPendingProposals])

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
    loadMessages(dialog.partner_id, true)
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
      await fetch(JOINT_DEALS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId, user_id: userId, response }),
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

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      <MessagesDialogList
        dialogs={dialogs}
        activeDialog={activeDialog}
        mobileView={mobileView}
        onOpenDialog={openDialog}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {!activeDialog ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Выберите диалог</p>
            </div>
          </div>
        ) : (
          <MessagesChat
            userId={userId}
            activeDialog={activeDialog}
            messages={messages}
            text={text}
            sending={sending}
            mobileView={mobileView}
            showJDForm={showJDForm}
            jdForm={jdForm}
            jdSending={jdSending}
            pendingProposals={pendingProposals}
            respondingId={respondingId}
            currentUserCanUseJD={currentUserCanUseJD}
            bottomRef={bottomRef}
            onSetText={setText}
            onSendMessage={sendMessage}
            onSetMobileView={setMobileView}
            onToggleJDForm={() => setShowJDForm(v => !v)}
            onSetShowJDForm={setShowJDForm}
            onSetJdForm={setJdForm}
            onSubmitJointDeal={submitJointDeal}
            onUpdateCommission={updateCommission}
            onRespondToProposal={respondToProposal}
          />
        )}
      </div>
    </div>
  )
}