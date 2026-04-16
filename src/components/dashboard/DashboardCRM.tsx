import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

// ── Типы ─────────────────────────────────────────────────────────────────────

type FunnelStage = "Лид" | "Подбор" | "Показ" | "Переговоры" | "Сделка" | "Отказ"

interface Lead {
  id: string
  owner_id: string | null
  object_id: string | null
  object_title: string
  name: string
  phone: string
  email: string
  message: string
  source: string
  stage: FunnelStage
  created_at: string
}

// ── Константы ─────────────────────────────────────────────────────────────────

const FUNNEL_STAGES: { stage: FunnelStage; color: string; bg: string; icon: string }[] = [
  { stage: "Лид",        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    icon: "UserPlus" },
  { stage: "Подбор",     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20", icon: "Search" },
  { stage: "Показ",      color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",  icon: "Eye" },
  { stage: "Переговоры", color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20", icon: "MessageSquare" },
  { stage: "Сделка",     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "Handshake" },
  { stage: "Отказ",      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",      icon: "XCircle" },
]

const ALL_STAGES: FunnelStage[] = FUNNEL_STAGES.map(s => s.stage)

function formatDate(iso: string) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("ru", { day: "numeric", month: "short" })
  } catch {
    return ""
  }
}

// ── Карточка лида ─────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead
  onStageChange: (id: string, stage: FunnelStage) => void
  onDelete: (id: string) => void
}

function LeadCard({ lead, onStageChange, onDelete }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false)
  const stageInfo = FUNNEL_STAGES.find(s => s.stage === lead.stage) ?? FUNNEL_STAGES[0]

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-[#2a2a2a] transition-colors">
      <div
        className="p-5 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 text-sm font-bold text-gray-400">
          {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{lead.name || "Без имени"}</p>
          <p className="text-xs text-gray-400">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {lead.object_title && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 truncate max-w-[180px]">
                {lead.object_title}
              </span>
            )}
            <span className="text-xs text-gray-500">· {lead.source}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">{formatDate(lead.created_at)}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stageInfo.bg} ${stageInfo.color}`}>
            {lead.stage}
          </span>
          <Icon name={expanded ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#1a1a1a] px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Телефон</p>
              <a href={`tel:${lead.phone}`} className="text-white font-medium hover:text-blue-400">{lead.phone}</a>
            </div>
            {lead.email && (
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <a href={`mailto:${lead.email}`} className="text-white font-medium truncate hover:text-blue-400">{lead.email}</a>
              </div>
            )}
            {lead.object_title && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500">Объект</p>
                <p className="text-white font-medium truncate">{lead.object_title}</p>
              </div>
            )}
          </div>

          {lead.message && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Сообщение от клиента</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-2">Этап воронки</p>
            <div className="flex flex-wrap gap-2">
              {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
                <button
                  key={stage}
                  onClick={() => onStageChange(lead.id, stage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    lead.stage === stage
                      ? `${bg} ${color} scale-105`
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:text-white"
                  }`}
                >
                  <Icon name={icon as "Eye"} className="h-3 w-3" />
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1a1a1a]">
            <button
              onClick={() => onDelete(lead.id)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <Icon name="Trash2" className="h-3.5 w-3.5" /> Удалить лид
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Основной компонент CRM ────────────────────────────────────────────────────

interface DashboardCRMProps {
  userId: string
}

export function DashboardCRM({ userId }: DashboardCRMProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStage, setFilterStage] = useState<FunnelStage | "Все">("Все")
  const [search, setSearch] = useState("")

  const loadLeads = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const r = await fetch(`${func2url.leads}?owner_id=${encodeURIComponent(userId)}`)
      const data = await r.json()
      setLeads(Array.isArray(data.leads) ? (data.leads as Lead[]) : [])
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  async function handleStageChange(id: string, stage: FunnelStage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
    const target = leads.find(l => l.id === id)
    if (!target) return
    try {
      await fetch(func2url.leads, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          owner_id: userId,
          stage,
          message: target.message,
        }),
      })
    } catch {
      /* noop */
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить лид? Это действие необратимо.")) return
    try {
      await fetch(`${func2url.leads}?id=${encodeURIComponent(id)}&owner_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      })
      setLeads(prev => prev.filter(l => l.id !== id))
    } catch {
      /* noop */
    }
  }

  const filtered = leads.filter(l => {
    const matchStage = filterStage === "Все" || l.stage === filterStage
    const matchSearch = !search
      || l.name.toLowerCase().includes(search.toLowerCase())
      || l.phone.includes(search)
      || (l.object_title || "").toLowerCase().includes(search.toLowerCase())
    return matchStage && matchSearch
  })

  const counts = ALL_STAGES.reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.stage === stage).length
    return acc
  }, {} as Record<FunnelStage, number>)

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CRM — Заявки</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} входящих контактов из маркетплейса</p>
        </div>
        <Button onClick={loadLeads} variant="outline" className="rounded-xl border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]">
          <Icon name="RotateCw" className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {/* Воронка — счётчики */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
          <button
            key={stage}
            onClick={() => setFilterStage(filterStage === stage ? "Все" : stage)}
            className={`rounded-xl p-3 text-center border transition-all ${
              filterStage === stage ? bg : "bg-[#111] border-[#1f1f1f] hover:border-[#2a2a2a]"
            }`}
          >
            <Icon name={icon as "Eye"} className={`h-4 w-4 mx-auto mb-1 ${filterStage === stage ? color : "text-gray-500"}`} />
            <p className={`text-lg font-bold ${filterStage === stage ? color : "text-white"}`}>{counts[stage]}</p>
            <p className={`text-[10px] font-medium ${filterStage === stage ? color : "text-gray-500"}`}>{stage}</p>
          </button>
        ))}
      </div>

      {/* Поиск */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Поиск по имени, телефону или объекту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
          <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
          <Icon name="Users" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">
            {leads.length === 0 ? "Заявок пока нет" : "Ничего не найдено"}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {leads.length === 0
              ? "Заявки от покупателей с маркетплейса появятся здесь автоматически"
              : "Попробуйте изменить фильтры или поисковый запрос"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStageChange={handleStageChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
