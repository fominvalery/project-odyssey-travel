import { useState, useEffect, useRef, useCallback } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const JOINT_DEALS_URL = (func2url as Record<string, string>)["joint-deals"]

interface Deal {
  id: string
  initiator_id: string
  partner_id: string
  deal_type: string
  transaction_type: string
  object_description: string
  initiator_role: string
  commission_initiator: number | null
  commission_partner: number | null
  commission_base: string
  comment: string
  status: string
  created_at: string
  updated_at: string
  initiator_name: string
  partner_name: string
}

interface Props {
  userId: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "Ожидает подтверждения": {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Ожидает подтверждения",
  },
  "В работе": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    label: "В работе",
  },
  "Успешна": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    label: "Успешна",
  },
  "Отменена": {
    bg: "bg-red-500/10",
    text: "text-red-400",
    label: "Отменена",
  },
}

const STATUS_OPTIONS = ["В работе", "Успешна", "Отменена"]

function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status] ?? {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      label: status,
    }
  )
}

export default function DashboardJointDeals({ userId }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [patchingId, setPatchingId] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const loadDeals = useCallback(async () => {
    try {
      const res = await fetch(`${JOINT_DEALS_URL}?user_id=${userId}`)
      const data = await res.json()
      setDeals(Array.isArray(data.deals) ? data.deals : [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadDeals()
  }, [loadDeals])

  // Закрывать dropdown при клике снаружи
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClick)
    }
    return () => document.removeEventListener("mousedown", handleClick)
  }, [openDropdown])

  async function proposeStatusChange(dealId: string, newStatus: string) {
    setPatchingId(dealId)
    setOpenDropdown(null)
    try {
      await fetch(JOINT_DEALS_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, user_id: userId, new_status: newStatus }),
      })
      setSentMessage(dealId)
      setTimeout(() => setSentMessage(null), 4000)
    } catch {
      /* ignore */
    } finally {
      setPatchingId(null)
    }
  }

  function getPartnerName(deal: Deal) {
    return deal.initiator_id === userId ? deal.partner_name : deal.initiator_name
  }

  function formatDate(iso: string) {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-600">
        <Icon name="Loader2" className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Загрузка...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Icon name="Handshake" className="h-4.5 w-4.5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Совместные сделки</h1>
          <p className="text-xs text-gray-500">Управление партнёрскими сделками</p>
        </div>
      </div>

      {/* Подсказка */}
      <div className="rounded-xl bg-violet-500/5 border border-violet-500/15 px-4 py-3 mb-6 space-y-1.5">
        <p className="text-xs text-violet-300 font-medium flex items-center gap-1.5">
          <Icon name="Info" className="h-3.5 w-3.5 shrink-0" />
          Как работает
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Инструмент для партнёрства между участниками Клуба. Заполните условия сотрудничества — они фиксируются и становятся видны обоим участникам. Партнёр получит предложение и подтвердит или отклонит его прямо в чате.
        </p>
        <div className="flex flex-col gap-1 pt-0.5">
          <p className="text-xs text-gray-500">
            <span className="text-gray-300 font-medium">Совместная работа</span> — оба активно ведут сделку и делят комиссию по договорённости.
          </p>
          <p className="text-xs text-gray-500">
            <span className="text-gray-300 font-medium">Передача контакта</span> — вы передаёте клиента или объект партнёру, условия фиксируются.
          </p>
        </div>
        <p className="text-[11px] text-gray-600 pt-0.5">Чтобы создать СЗ — откройте чат с партнёром в разделе Сообщения и нажмите «Совместная сделка».</p>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center mb-4">
            <Icon name="Handshake" className="h-7 w-7 opacity-30" />
          </div>
          <p className="text-sm font-medium text-gray-500">Совместных сделок пока нет</p>
          <p className="text-xs text-gray-600 mt-1">Отправьте предложение партнёру через чат</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const style = getStatusStyle(deal.status)
            const isDropOpen = openDropdown === deal.id
            const isPatching = patchingId === deal.id
            const isInitiator = deal.initiator_id === userId
            const partnerName = getPartnerName(deal)
            const showSent = sentMessage === deal.id

            return (
              <div
                key={deal.id}
                className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors"
              >
                {/* Заголовок + статус */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Icon name="Handshake" className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {deal.object_description || "Совместная сделка"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isInitiator ? "Партнёр: " : "От: "}
                        <span className="text-gray-400">{partnerName || "—"}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                {/* Теги */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {deal.deal_type && (
                    <span className="text-[11px] bg-[#1a1a1a] border border-[#262626] text-gray-400 px-2 py-0.5 rounded-full">
                      {deal.deal_type}
                    </span>
                  )}
                  {deal.transaction_type && (
                    <span className="text-[11px] bg-[#1a1a1a] border border-[#262626] text-gray-400 px-2 py-0.5 rounded-full">
                      {deal.transaction_type}
                    </span>
                  )}
                  {deal.initiator_role && (
                    <span className="text-[11px] bg-[#1a1a1a] border border-[#262626] text-gray-400 px-2 py-0.5 rounded-full">
                      Роль: {deal.initiator_role}
                    </span>
                  )}
                </div>

                {/* Комиссия */}
                {(deal.commission_initiator !== null || deal.commission_partner !== null) && (
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Percent" className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                    <span className="text-xs text-gray-400">
                      Комиссия:{" "}
                      <span className="text-white font-medium">
                        {deal.commission_initiator ?? "?"}% / {deal.commission_partner ?? "?"}%
                      </span>
                      {deal.commission_base && (
                        <span className="text-gray-600"> {deal.commission_base}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Комментарий */}
                {deal.comment && (
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-3.5 py-2.5 mb-3">
                    <p className="text-xs text-gray-500 leading-relaxed">{deal.comment}</p>
                  </div>
                )}

                {/* Футер: дата + кнопка */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-gray-600">
                    {formatDate(deal.created_at)}
                  </span>

                  <div className="flex items-center gap-2">
                    {showSent && (
                      <span className="text-[11px] text-emerald-400 animate-fade-in">
                        Предложение отправлено партнёру
                      </span>
                    )}

                    {/* Dropdown смены статуса */}
                    <div className="relative" ref={isDropOpen ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdown(isDropOpen ? null : deal.id)}
                        disabled={isPatching}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-300 hover:text-white hover:border-[#333] transition-colors disabled:opacity-50"
                      >
                        {isPatching ? (
                          <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Icon name="RefreshCw" className="h-3.5 w-3.5" />
                        )}
                        Изменить статус
                        <Icon name="ChevronDown" className={`h-3 w-3 transition-transform ${isDropOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isDropOpen && (
                        <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#161616] border border-[#262626] rounded-xl shadow-xl z-20 overflow-hidden">
                          {STATUS_OPTIONS.map((s) => {
                            const st = getStatusStyle(s)
                            return (
                              <button
                                key={s}
                                onClick={() => proposeStatusChange(deal.id, s)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-[#1f1f1f] transition-colors"
                              >
                                <span className={`w-2 h-2 rounded-full ${st.text.replace("text-", "bg-").replace("-400", "-500")}`} />
                                <span className={st.text}>{s}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}