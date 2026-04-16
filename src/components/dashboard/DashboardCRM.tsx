import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import { LeadCard, FUNNEL_STAGES, type FunnelStage, type Lead } from "./LeadCard"

const ALL_STAGES: FunnelStage[] = FUNNEL_STAGES.map(s => s.stage)

type ViewMode = "list" | "kanban"

interface DashboardCRMProps {
  userId: string
}

// ── Канбан-колонка ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  stage: FunnelStage
  color: string
  bg: string
  icon: string
  leads: Lead[]
  overdueIds: Set<string>
  userId: string
  onStageChange: (id: string, stage: FunnelStage) => void
  onDelete: (id: string) => void
  onOverdueRefresh: () => void
}

function KanbanColumn({ stage, color, bg, icon, leads, overdueIds, userId, onStageChange, onDelete, onOverdueRefresh }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 ${bg}`}>
        <Icon name={icon as "Eye"} className={`h-3.5 w-3.5 ${color}`} />
        <span className={`text-xs font-semibold ${color}`}>{stage}</span>
        <span className={`ml-auto text-xs font-bold ${color}`}>{leads.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1f1f1f] py-8 text-center">
            <p className="text-xs text-gray-600">Нет заявок</p>
          </div>
        ) : leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            ownerId={userId}
            hasOverdue={overdueIds.has(lead.id)}
            onStageChange={onStageChange}
            onDelete={onDelete}
            onOverdueRefresh={onOverdueRefresh}
          />
        ))}
      </div>
    </div>
  )
}

// ── Основной компонент ─────────────────────────────────────────────────────────

export function DashboardCRM({ userId }: DashboardCRMProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStage, setFilterStage] = useState<FunnelStage | "Все">("Все")
  const [search, setSearch] = useState("")
  const [overdueIds, setOverdueIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>("list")

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

  const loadOverdue = useCallback(async () => {
    if (!userId) return
    try {
      const r = await fetch(`${func2url["lead-extras"]}?kind=overdue&owner_id=${encodeURIComponent(userId)}`)
      const data = await r.json()
      setOverdueIds(new Set<string>(data.overdue_lead_ids || []))
    } catch {
      setOverdueIds(new Set())
    }
  }, [userId])

  useEffect(() => {
    loadLeads()
    loadOverdue()
    const t = setInterval(loadOverdue, 60000)
    return () => clearInterval(t)
  }, [loadLeads, loadOverdue])

  async function handleStageChange(id: string, stage: FunnelStage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
    const target = leads.find(l => l.id === id)
    if (!target) return
    try {
      await fetch(func2url.leads, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, owner_id: userId, stage, message: target.message }),
      })
    } catch { /* noop */ }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить лид? Это действие необратимо.")) return
    try {
      await fetch(`${func2url.leads}?id=${encodeURIComponent(id)}&owner_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      })
      setLeads(prev => prev.filter(l => l.id !== id))
    } catch { /* noop */ }
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

  const sharedCardProps = {
    userId,
    overdueIds,
    onStageChange: handleStageChange,
    onDelete: handleDelete,
    onOverdueRefresh: loadOverdue,
  }

  return (
    <div className="p-6 md:p-8 max-w-full">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-4 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">CRM — Заявки</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} входящих контактов из маркетплейса</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Переключатель вид */}
          <div className="flex items-center bg-[#111] border border-[#1f1f1f] rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              title="Список"
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Icon name="List" className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              title="Канбан"
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === "kanban" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Icon name="LayoutDashboard" className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => { loadLeads(); loadOverdue() }}
            variant="outline"
            className="rounded-xl border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
          >
            <Icon name="RotateCw" className="h-4 w-4 mr-2" /> Обновить
          </Button>
        </div>
      </div>

      {/* Поиск — над воронкой */}
      <div className="relative mb-4 max-w-4xl">
        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        <Input
          placeholder="Поиск по имени, телефону или объекту..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
        />
      </div>

      {/* Воронка — счётчики (только в режиме списка) */}
      {viewMode === "list" && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5 max-w-4xl">
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
      )}

      {/* Контент */}
      {loading ? (
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center max-w-4xl">
          <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
        </div>
      ) : viewMode === "list" ? (
        // ── СПИСОК ──────────────────────────────────────────────────────────────
        filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center max-w-4xl">
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
          <div className="flex flex-col gap-3 max-w-4xl">
            {filtered.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                ownerId={sharedCardProps.userId}
                hasOverdue={sharedCardProps.overdueIds.has(lead.id)}
                onStageChange={sharedCardProps.onStageChange}
                onDelete={sharedCardProps.onDelete}
                onOverdueRefresh={sharedCardProps.onOverdueRefresh}
              />
            ))}
          </div>
        )
      ) : (
        // ── КАНБАН ──────────────────────────────────────────────────────────────
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => {
              const colLeads = filtered.filter(l => l.stage === stage)
              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  color={color}
                  bg={bg}
                  icon={icon}
                  leads={colLeads}
                  overdueIds={overdueIds}
                  userId={userId}
                  onStageChange={handleStageChange}
                  onDelete={handleDelete}
                  onOverdueRefresh={loadOverdue}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardCRM
