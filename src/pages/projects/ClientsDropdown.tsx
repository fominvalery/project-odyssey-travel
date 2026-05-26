import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

type ClientEntry = { client_name: string; offer_title: string; client_phone?: string; status: string }
type ClientsTabId = "fixations" | "showing" | "booking" | "deal"

const CLIENT_TABS = [
  { id: "fixations" as ClientsTabId, label: "Фиксации", statuses: ["pending", "fixed"], color: "text-emerald-400" },
  { id: "showing"   as ClientsTabId, label: "Показы",   statuses: ["showing"],          color: "text-blue-400" },
  { id: "booking"   as ClientsTabId, label: "Брони",    statuses: ["booking"],          color: "text-cyan-400" },
  { id: "deal"      as ClientsTabId, label: "Сделки",   statuses: ["deal", "docs", "payment"], color: "text-violet-400" },
]

const STATUS_LABEL_SHORT: Record<string, string> = {
  pending: "Ожидает", fixed: "Зафиксирован", showing: "Показ",
  booking: "Бронь", negotiation: "Переговоры", deal: "Сделка",
  docs: "Документы", payment: "Оплата", invalid: "Срыв",
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400", fixed: "bg-emerald-400", showing: "bg-blue-400",
  booking: "bg-cyan-400", negotiation: "bg-violet-400", deal: "bg-emerald-300",
  docs: "bg-orange-400", payment: "bg-pink-400", invalid: "bg-red-400",
}

interface Props {
  onOpenFixModal: () => void
}

export default function ClientsDropdown({ onOpenFixModal }: Props) {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [open, setOpen] = useState(false)
  const [clientsTab, setClientsTab] = useState<ClientsTabId>("fixations")
  const [clientsData, setClientsData] = useState<Record<string, ClientEntry[]>>({})
  const [clientsLoading, setClientsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function loadClients() {
    if (!user?.id || clientsLoading) return
    setClientsLoading(true)
    try {
      const res = await fetch((func2url as Record<string, string>)["agg-fixations"], {
        headers: { "X-User-Id": user.id },
      })
      const data = await res.json()
      const all: ClientEntry[] = data.fixations || []
      const grouped: Record<string, ClientEntry[]> = { fixations: [], showing: [], booking: [], deal: [] }
      for (const f of all) {
        if (["pending", "fixed"].includes(f.status)) grouped.fixations.push(f)
        else if (f.status === "showing") grouped.showing.push(f)
        else if (f.status === "booking") grouped.booking.push(f)
        else if (["deal", "docs", "payment"].includes(f.status)) grouped.deal.push(f)
      }
      setClientsData(grouped)
    } catch {
      // ignore
    } finally {
      setClientsLoading(false)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setOpen(v => !v); if (!open) loadClients() }}
        className={`border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a] gap-1.5 ${open ? "bg-[#1a1a1a] text-white" : ""}`}
      >
        <Icon name="Users" className="h-4 w-4" />
        <span>Клиенты</span>
        <Icon name="ChevronDown" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[95vw] bg-[#111] border border-[#2a2a2a] rounded-2xl shadow-2xl z-50">
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#1f1f1f]">
            <span className="text-sm font-semibold text-white">Мои клиенты</span>
            <button
              onClick={() => { setOpen(false); onOpenFixModal() }}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1"
            >
              <Icon name="Plus" className="h-3.5 w-3.5" />
              Зафиксировать
            </button>
          </div>

          {/* Вкладки */}
          <div className="flex px-3 pt-3 gap-1">
            {CLIENT_TABS.map(t => {
              const count = (clientsData[t.id] || []).length
              const isActive = clientsTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setClientsTab(t.id)
                    if (t.id === "fixations") { navigate(`/projects/fixations?tab=fixations`); setOpen(false) }
                    else if (t.id === "showing") { navigate(`/projects/fixations?tab=showing`); setOpen(false) }
                    else if (t.id === "booking") { navigate(`/projects/fixations?tab=booking`); setOpen(false) }
                    else if (t.id === "deal") { navigate(`/projects/fixations?tab=deal`); setOpen(false) }
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                    isActive ? "bg-[#222] text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[10px] font-bold ${isActive ? t.color : "text-gray-600"}`}>
                    {clientsLoading ? "..." : count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Список клиентов */}
          <div className="px-3 pb-3 pt-2 max-h-[260px] overflow-y-auto">
            {clientsLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#1a1a1a] rounded-xl animate-pulse" />)}
              </div>
            ) : (clientsData[clientsTab] || []).length === 0 ? (
              <div className="py-8 text-center">
                <Icon name="Users" className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Нет клиентов в этом статусе</p>
              </div>
            ) : (
              <div className="space-y-1.5 mt-1">
                {(clientsData[clientsTab] || []).map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#1a1a1a] transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status] || "bg-gray-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{c.client_name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{c.offer_title}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{STATUS_LABEL_SHORT[c.status] || c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Футер */}
          <div className="border-t border-[#1f1f1f] px-4 py-2.5">
            <button
              onClick={() => { navigate("/projects/fixations"); setOpen(false) }}
              className="w-full text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              Все клиенты
              <Icon name="ChevronRight" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}