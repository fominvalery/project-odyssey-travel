import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { agencyApi, Deal, Employee, isAdmin } from "@/lib/agencyApi"
import { toast } from "@/hooks/use-toast"

const DEAL_TYPES: Record<string, string> = {
  sale: "Продажа",
  rent: "Аренда",
  investment: "Инвестиция",
  exchange: "Обмен",
}

const DEAL_STATUSES: Record<string, { label: string; color: string }> = {
  active:   { label: "В работе",  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  closed:   { label: "Закрыта",   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  failed:   { label: "Сорвалась", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  paused:   { label: "Заморожена",color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
}

function fmt(n: number | null) {
  if (!n) return "—"
  return n.toLocaleString("ru-RU") + " ₽"
}

interface Props {
  userId: string
  orgId: string
  myRole: string
  employees: Employee[]
}

export default function AgencyDealsTab({ userId, orgId, myRole, employees }: Props) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", deal_type: "sale", amount: "", commission_total: "",
    commission_agent_pct: "50", client_name: "", client_phone: "",
    notes: "", agent_id: userId, status: "active",
  })

  async function load() {
    setLoading(true)
    try {
      const data = await agencyApi.listDeals(userId, orgId, statusFilter === "all" ? undefined : statusFilter)
      setDeals(data)
    } catch { setDeals([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  async function handleCreate() {
    if (!form.title.trim()) { toast({ title: "Укажите название сделки", variant: "destructive" }); return }
    setSaving(true)
    try {
      await agencyApi.createDeal(userId, orgId, {
        ...form,
        amount: form.amount ? Number(form.amount.replace(/\s/g, "")) : undefined,
        commission_total: form.commission_total ? Number(form.commission_total.replace(/\s/g, "")) : undefined,
        commission_agent_pct: Number(form.commission_agent_pct),
      } as Partial<Deal>)
      toast({ title: "Сделка добавлена" })
      setCreating(false)
      setForm({ title: "", deal_type: "sale", amount: "", commission_total: "", commission_agent_pct: "50", client_name: "", client_phone: "", notes: "", agent_id: userId, status: "active" })
      await load()
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  async function handleClose(deal: Deal) {
    try {
      await agencyApi.updateDeal(userId, orgId, { deal_id: deal.id, status: "closed" })
      toast({ title: "Сделка закрыта" })
      await load()
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    }
  }

  const canCreate = isAdmin(myRole as never) || myRole === "broker" || myRole === "rop"

  const totalAmount = deals.filter(d => d.status === "closed").reduce((s, d) => s + (d.amount || 0), 0)
  const totalComm = deals.filter(d => d.status === "closed").reduce((s, d) => s + (d.commission_agency || 0), 0)

  const inputCls = "bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600 text-sm"

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Сводка */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Всего сделок", value: deals.length, icon: "FileText", color: "text-blue-400" },
          { label: "В работе", value: deals.filter(d => d.status === "active").length, icon: "Clock", color: "text-amber-400" },
          { label: "Закрыто", value: deals.filter(d => d.status === "closed").length, icon: "CheckCircle", color: "text-emerald-400" },
          { label: "Комиссия АН", value: fmt(totalComm), icon: "TrendingUp", color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <Icon name={s.icon as "Clock"} className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Фильтры + кнопка */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {[["all", "Все"], ["active", "В работе"], ["closed", "Закрыты"], ["failed", "Сорвались"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === v ? "bg-blue-600 text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-white"
              }`}>{l}</button>
          ))}
        </div>
        {canCreate && (
          <button onClick={() => setCreating(v => !v)}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
            <Icon name="Plus" className="h-3.5 w-3.5" />
            Добавить сделку
          </button>
        )}
      </div>

      {/* Форма создания */}
      {creating && (
        <div className="rounded-2xl bg-[#111] border border-emerald-500/20 p-5 space-y-4">
          <p className="text-sm font-semibold text-white mb-3">Новая сделка</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs text-gray-400 mb-1 block">Название *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Продажа офиса в БЦ Арбат" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Тип сделки</Label>
              <select value={form.deal_type} onChange={e => setForm(f => ({ ...f, deal_type: e.target.value }))}
                className={`${inputCls} w-full rounded-xl px-3 py-2 bg-[#0f0f0f] border border-[#262626]`}>
                {Object.entries(DEAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Агент</Label>
              <select value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                className={`${inputCls} w-full rounded-xl px-3 py-2 bg-[#0f0f0f] border border-[#262626]`}>
                {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Сумма сделки (₽)</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="10 000 000" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Комиссия итого (₽)</Label>
              <Input value={form.commission_total} onChange={e => setForm(f => ({ ...f, commission_total: e.target.value }))}
                placeholder="300 000" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">% агенту</Label>
              <Input value={form.commission_agent_pct} onChange={e => setForm(f => ({ ...f, commission_agent_pct: e.target.value }))}
                placeholder="50" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Клиент</Label>
              <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Иван Петров" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Телефон клиента</Label>
              <Input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                placeholder="+7 999 000 00 00" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? "Сохраняю..." : "Создать сделку"}
            </button>
            <button onClick={() => setCreating(false)}
              className="px-5 py-2.5 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список сделок */}
      {loading ? (
        <div className="text-center py-12"><Icon name="Loader2" className="h-6 w-6 text-blue-400 animate-spin mx-auto" /></div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Icon name="FileText" className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Сделок пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => {
            const st = DEAL_STATUSES[deal.status] ?? DEAL_STATUSES.active
            return (
              <div key={deal.id} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4 hover:border-[#2a2a2a] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{deal.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{DEAL_TYPES[deal.deal_type] ?? deal.deal_type} · {deal.agent_name}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${st.color}`}>{st.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#1a1a1a]">
                  <div>
                    <p className="text-[10px] text-gray-600 mb-0.5">Сумма</p>
                    <p className="text-sm font-semibold text-white">{fmt(deal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-0.5">Комиссия АН</p>
                    <p className="text-sm font-semibold text-violet-400">{fmt(deal.commission_agency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-0.5">Комиссия агента</p>
                    <p className="text-sm font-semibold text-emerald-400">{fmt(deal.commission_agent)}</p>
                  </div>
                </div>
                {deal.status === "active" && canCreate && (
                  <button onClick={() => handleClose(deal)}
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <Icon name="CheckCircle" className="h-3.5 w-3.5" />
                    Закрыть сделку
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}