import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const AGG_FIX_URL = (func2url as Record<string, string>)["agg-fixations"]

const STATUSES = [
  { id: "pending",     label: "Ожидает ответа",       color: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20",  dot: "bg-yellow-400" },
  { id: "fixed",       label: "Зафиксирован",          color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  { id: "invalid",     label: "Неактуален",            color: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400" },
  { id: "showing",     label: "Показ",                 color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    dot: "bg-blue-400" },
  { id: "negotiation", label: "Переговоры",            color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  dot: "bg-violet-400" },
  { id: "deal",        label: "Сделка",                color: "text-emerald-200", bg: "bg-emerald-600/10", border: "border-emerald-600/20", dot: "bg-emerald-300" },
  { id: "docs",        label: "Подготовка документов", color: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  dot: "bg-orange-400" },
  { id: "payment",     label: "Оплата",                color: "text-pink-300",    bg: "bg-pink-500/10",    border: "border-pink-500/20",    dot: "bg-pink-400" },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]))

interface AdminFixation {
  id: string
  offer_id: string
  user_id: string
  agency_id?: string
  status: string
  expires_at: string | null
  notes: string | null
  created_at: string
  offer_title?: string
  city?: string
  category?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  broker_name?: string
  broker_email?: string
}

function daysLeft(dateStr: string | null): { text: string; warn: boolean } {
  if (!dateStr) return { text: "", warn: false }
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return { text: "Истекла", warn: true }
  if (diff <= 3) return { text: `${diff} дн.`, warn: true }
  return { text: `${diff} дн.`, warn: false }
}

function FixCard({
  fix,
  onStatusChange,
  updating,
}: {
  fix: AdminFixation
  onStatusChange: (id: string, status: string) => void
  updating: string | null
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dl = daysLeft(fix.expires_at)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 space-y-2 hover:border-[#2a2a2a] transition-colors cursor-default">
      {/* Объект */}
      <div className="text-white text-sm font-medium line-clamp-2 leading-tight">
        {fix.offer_title || "Объект"}
      </div>
      {fix.city && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Icon name="MapPin" className="h-3 w-3" />
          {fix.city}
        </div>
      )}

      {/* Клиент */}
      <div className="pt-1 border-t border-[#1a1a1a]">
        <div className="text-xs text-gray-300 font-medium">{fix.client_name || "—"}</div>
        {fix.client_phone && <div className="text-xs text-gray-500">{fix.client_phone}</div>}
      </div>

      {/* Брокер */}
      {fix.broker_name && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Icon name="User" className="h-3 w-3 shrink-0" />
          <span className="truncate">{fix.broker_name}</span>
        </div>
      )}

      {/* Срок + дата */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">
          {new Date(fix.created_at).toLocaleDateString("ru-RU")}
        </span>
        {dl.text && (
          <span className={`text-xs ${dl.warn ? "text-red-400" : "text-gray-500"}`}>
            {dl.text}
          </span>
        )}
      </div>

      {/* Смена статуса */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          disabled={updating === fix.id}
          className="w-full flex items-center justify-between gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors bg-[#0d0d0d] border-[#2a2a2a] hover:border-[#3a3a3a]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {updating === fix.id
              ? <Icon name="Loader2" className="h-3 w-3 animate-spin text-gray-400" />
              : <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_MAP[fix.status]?.dot || "bg-gray-500"}`} />
            }
            <span className={`truncate ${STATUS_MAP[fix.status]?.color || "text-gray-400"}`}>
              {STATUS_MAP[fix.status]?.label || fix.status}
            </span>
          </div>
          <Icon name="ChevronDown" className="h-3 w-3 text-gray-600 shrink-0" />
        </button>
        {open && (
          <div className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => { onStatusChange(fix.id, s.id); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#1f1f1f] transition-colors ${fix.status === s.id ? "bg-[#1a1a1a]" : ""}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                <span className={s.color}>{s.label}</span>
                {fix.status === s.id && <Icon name="Check" className="h-3 w-3 text-gray-500 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AggFixationsAdmin({ token }: { token: string }) {
  const [fixations, setFixations] = useState<AdminFixation[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(AGG_FIX_URL, {
        headers: { "X-Admin-Token": token },
      })
      const data = await res.json()
      setFixations(data.fixations || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (fixId: string, newStatus: string) => {
    setUpdating(fixId)
    setFixations(prev => prev.map(f => f.id === fixId ? { ...f, status: newStatus } : f))
    await fetch(AGG_FIX_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": token,
      },
      body: JSON.stringify({ id: fixId, status: newStatus }),
    })
    setUpdating(null)
  }

  const filtered = fixations.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (f.client_name || "").toLowerCase().includes(q) ||
      (f.offer_title || "").toLowerCase().includes(q) ||
      (f.broker_name || "").toLowerCase().includes(q) ||
      (f.city || "").toLowerCase().includes(q)
    )
  })

  const byStatus = (statusId: string) => filtered.filter(f => f.status === statusId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center gap-3 shrink-0">
        <div className="flex-1">
          <h2 className="font-bold text-base text-white">CRM фиксаций</h2>
          <p className="text-xs text-gray-500 mt-0.5">{fixations.length} фиксаций</p>
        </div>
        <div className="relative w-64">
          <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600 h-8"
          />
        </div>
        <Button onClick={load} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white shrink-0">
          <Icon name={loading ? "Loader2" : "RefreshCw"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Канбан */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-4 min-w-max">
          {STATUSES.map(st => {
            const cards = byStatus(st.id)
            return (
              <div key={st.id} className="flex flex-col w-56 shrink-0">
                {/* Заголовок колонки */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${st.bg} border ${st.border}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                  <span className={`text-xs font-semibold truncate ${st.color}`}>{st.label}</span>
                  <span className={`ml-auto text-xs font-bold tabular-nums ${st.color} opacity-70`}>{cards.length}</span>
                </div>

                {/* Карточки */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {cards.length === 0 ? (
                    <div className="flex items-center justify-center h-16 border border-dashed border-[#1f1f1f] rounded-xl">
                      <span className="text-xs text-gray-700">Пусто</span>
                    </div>
                  ) : (
                    cards.map(fix => (
                      <FixCard
                        key={fix.id}
                        fix={fix}
                        onStatusChange={updateStatus}
                        updating={updating}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
