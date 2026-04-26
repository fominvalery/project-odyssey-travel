import { useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { STATUS_LABELS } from "@/hooks/useAuth"
import { Dialog, Message, Proposal, JointDealForm as JointDealFormType, DEFAULT_FORM, getInitials, formatTime, isAgency } from "./messagesTypes"
import JointDealForm from "./JointDealForm"

interface Props {
  userId: string
  activeDialog: Dialog
  messages: Message[]
  text: string
  sending: boolean
  mobileView: "list" | "chat"
  showJDForm: boolean
  jdForm: JointDealFormType
  jdSending: boolean
  pendingProposals: Proposal[]
  respondingId: string | null
  currentUserCanUseJD: boolean
  bottomRef: React.RefObject<HTMLDivElement>
  onSetText: (t: string) => void
  onSendMessage: () => void
  onSetMobileView: (v: "list" | "chat") => void
  onToggleJDForm: () => void
  onSetShowJDForm: (v: boolean) => void
  onSetJdForm: (f: JointDealFormType) => void
  onSubmitJointDeal: () => void
  onUpdateCommission: (field: "initiator" | "partner", val: number) => void
  onRespondToProposal: (proposalId: string, dealId: string, response: "accept" | "reject") => void
}

export default function MessagesChat({
  userId, activeDialog, messages, text, sending,
  mobileView, showJDForm, jdForm, jdSending,
  pendingProposals, respondingId, currentUserCanUseJD,
  bottomRef,
  onSetText, onSendMessage, onSetMobileView,
  onToggleJDForm, onSetShowJDForm, onSetJdForm,
  onSubmitJointDeal, onUpdateCommission, onRespondToProposal,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {/* Шапка диалога */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1f1f1f] bg-[#0d0d0d] shrink-0">
        <button
          onClick={() => onSetMobileView("list")}
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

        {currentUserCanUseJD && (
          <button
            onClick={onToggleJDForm}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors shrink-0 ${
              showJDForm
                ? "bg-violet-600 border-violet-600 text-white"
                : "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
            }`}
          >
            <Icon name="Handshake" className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Совместная сделка</span>
          </button>
        )}
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
              onClick={() => onRespondToProposal(p.id, p.deal_id, "accept")}
              disabled={respondingId === p.id}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
            >
              {respondingId === p.id ? <Icon name="Loader2" className="h-3 w-3 animate-spin" /> : "Подтвердить"}
            </button>
            <button
              onClick={() => onRespondToProposal(p.id, p.deal_id, "reject")}
              disabled={respondingId === p.id}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              Отклонить
            </button>
          </div>
        </div>
      ))}

      {/* Форма совместной сделки */}
      {showJDForm && (
        <JointDealForm
          form={jdForm}
          sending={jdSending}
          onChangeForm={onSetJdForm}
          onSubmit={onSubmitJointDeal}
          onCancel={() => onSetShowJDForm(false)}
          onUpdateCommission={onUpdateCommission}
        />
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
                      {isMine && <Icon name={msg.is_read ? "CheckCheck" : "Check"} className="inline ml-1 h-3 w-3" />}
                    </p>
                  </div>
                ) : (
                  <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMine ? "bg-violet-600 text-white rounded-br-sm" : "bg-[#1a1a1a] text-gray-100 rounded-bl-sm"
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMine ? "text-violet-200" : "text-gray-600"}`}>
                      {formatTime(msg.created_at)}
                      {isMine && <Icon name={msg.is_read ? "CheckCheck" : "Check"} className="inline ml-1 h-3 w-3" />}
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
            ref={inputRef}
            value={text}
            onChange={e => onSetText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendMessage() } }}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-[#111] border-[#262626] text-white focus-visible:ring-violet-500 rounded-xl"
            maxLength={2000}
          />
          <button
            onClick={onSendMessage}
            disabled={!text.trim() || sending}
            className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            <Icon name="Send" className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </>
  )
}
