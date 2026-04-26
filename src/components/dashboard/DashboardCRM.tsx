import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import func2url from "../../../backend/func2url.json"
import { LeadCard, FUNNEL_STAGES, type FunnelStage, type Lead } from "./LeadCard"
import { KanbanCard } from "./KanbanCard"
import { LeadForm } from "./LeadForm"

const ALL_STAGES: FunnelStage[] = FUNNEL_STAGES.map(s => s.stage)

type ViewMode = "list" | "kanban"

interface DashboardCRMProps {
  userId: string
  orgId?: string
  deptId?: string
  onReassignLead?: (lead: Lead) => void
  employees?: Array<{ user_id: string; name: string }>
  departments?: Array<{ id: string; name: string }>
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
  onLeadUpdate: (lead: Lead) => void
  onReassign?: (lead: Lead) => void
}

function KanbanColumn({ stage, color, bg, icon, leads, overdueIds, userId, onStageChange, onDelete, onOverdueRefresh, onLeadUpdate, onReassign }: KanbanColumnProps) {
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
          <KanbanCard
            key={lead.id}
            lead={lead}
            ownerId={userId}
            hasOverdue={overdueIds.has(lead.id)}
            onStageChange={onStageChange}
            onDelete={onDelete}
            onOverdueRefresh={onOverdueRefresh}
            onLeadUpdate={onLeadUpdate}
            onReassign={onReassign}
          />
        ))}
      </div>
    </div>
  )
}

// ── Основной компонент ─────────────────────────────────────────────────────────

export function DashboardCRM({ userId, orgId, deptId, onReassignLead, employees, departments }: DashboardCRMProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStage, setFilterStage] = useState<FunnelStage | "Все">("Все")
  const [search, setSearch] = useState("")
  const [overdueIds, setOverdueIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [createOpen, setCreateOpen] = useState(false)
  const [filterDept, setFilterDept] = useState("")
  const [filterEmployee, setFilterEmployee] = useState("")

  const loadLeads = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // В режиме АН — загружаем лиды по owner_id каждого сотрудника
      if (orgId && employees && employees.length > 0) {
        // Определяем каких сотрудников показывать
        let targetEmployees = employees
        if (filterEmployee) {
          targetEmployees = employees.filter(e => e.user_id === filterEmployee)
        } else if (filterDept) {
          targetEmployees = employees.filter(e => e.department_id === filterDept)
        } else if (deptId) {
          targetEmployees = employees.filter(e => e.department_id === deptId)
        }

        // Загружаем лиды параллельно для каждого сотрудника
        const results = await Promise.all(
          targetEmployees.map(e =>
            fetch(`${func2url.leads}?owner_id=${encodeURIComponent(e.user_id)}`)
              .then(r => r.json())
              .then(d => Array.isArray(d.leads) ? (d.leads as Lead[]) : [])
              .catch(() => [] as Lead[])
          )
        )
        const allLeads = results.flat()
        // Убираем дубли по id
        const unique = Array.from(new Map(allLeads.map(l => [l.id, l])).values())
        setLeads(unique)
      } else if (orgId) {
        // Нет списка сотрудников — fallback на org_id
        let url = `${func2url.leads}?org_id=${encodeURIComponent(orgId)}`
        if (filterEmployee) url = `${func2url.leads}?owner_id=${encodeURIComponent(filterEmployee)}`
        else if (filterDept) url += `&department_id=${encodeURIComponent(filterDept)}`
        else if (deptId) url += `&department_id=${encodeURIComponent(deptId)}`
        const r = await fetch(url)
        const data = await r.json()
        setLeads(Array.isArray(data.leads) ? (data.leads as Lead[]) : [])
      } else {
        // Личная CRM
        const r = await fetch(`${func2url.leads}?owner_id=${encodeURIComponent(userId)}`)
        const data = await r.json()
        setLeads(Array.isArray(data.leads) ? (data.leads as Lead[]) : [])
      }
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [userId, orgId, deptId, filterDept, filterEmployee, employees])

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
          <h1 className="text-2xl font-bold">CRM</h1>
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
          <GlowButton
            onClick={() => setCreateOpen(true)}
            className="rounded-xl px-4 py-2 text-sm"
          >
            <Icon name="UserPlus" className="h-4 w-4 mr-2" /> Добавить клиента
          </GlowButton>
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

      {/* Фильтры по отделу и сотруднику (только в ЛК АН) */}
      {orgId && (employees?.length || departments?.length) ? (
        <div className="flex flex-wrap gap-2 mb-4 max-w-4xl">
          {departments && departments.length > 0 && (
            <select
              value={filterDept}
              onChange={e => { setFilterDept(e.target.value); setFilterEmployee("") }}
              className="rounded-xl bg-[#111] border border-[#1f1f1f] text-sm px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">Все отделы</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          {employees && employees.length > 0 && (
            <select
              value={filterEmployee}
              onChange={e => { setFilterEmployee(e.target.value); setFilterDept("") }}
              className="rounded-xl bg-[#111] border border-[#1f1f1f] text-sm px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="">Все сотрудники</option>
              {employees.map(e => (
                <option key={e.user_id} value={e.user_id}>{e.name}</option>
              ))}
            </select>
          )}
          {(filterDept || filterEmployee) && (
            <button
              onClick={() => { setFilterDept(""); setFilterEmployee("") }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-[#1a1a1a] transition-colors"
            >
              <Icon name="X" className="h-3.5 w-3.5" /> Сбросить
            </button>
          )}
        </div>
      ) : null}

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
                onLeadUpdate={(updated) => setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))}
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
                  onLeadUpdate={(updated) => setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))}
                  onReassign={onReassignLead}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Диалог создания нового лида */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0d0d0d] border-[#1f1f1f] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить клиента</DialogTitle>
          </DialogHeader>
          <LeadForm
            ownerId={userId}
            onSave={(lead) => {
              setLeads(prev => [lead, ...prev])
              setCreateOpen(false)
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DashboardCRM