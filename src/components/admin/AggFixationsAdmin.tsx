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

interface Department { id: string; name: string; head_name?: string | null; members_count?: number }
interface Broker { id: string; name: string; department_id?: string | null; department_name?: string | null }

interface AdminFixation {
  id: string
  offer_id: string
  user_id: string
  agency_id?: string
  status: string
  expires_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  offer_title?: string
  city?: string
  category?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  broker_name?: string
  broker_email?: string
  department_id?: string | null
  dept_name?: string | null
}

function daysLeft(dateStr: string | null): { text: string; warn: boolean } {
  if (!dateStr) return { text: "", warn: false }
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return { text: "Истекла", warn: true }
  if (diff <= 3) return { text: `${diff} дн.`, warn: true }
  return { text: `${diff} дн.`, warn: false }
}

// ── Модальная карточка фиксации ──────────────────────────────────────────────

function FixationModal({
  fix,
  onClose,
  onStatusChange,
  updating,
}: {
  fix: AdminFixation
  onClose: () => void
  onStatusChange: (id: string, status: string, notes?: string) => void
  updating: string | null
}) {
  const [notes, setNotes] = useState(fix.notes || "")
  const [saved, setSaved] = useState(false)
  const dl = daysLeft(fix.expires_at)

  const handleSaveNotes = async () => {
    onStatusChange(fix.id, fix.status, notes)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#1f1f1f]">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base leading-tight truncate">
              {fix.offer_title || "Объект"}
            </h3>
            {fix.city && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Icon name="MapPin" className="h-3 w-3" />
                {fix.city}
                {fix.category && <span className="ml-1 text-gray-600">· {fix.category}</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors shrink-0 mt-0.5">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Клиент */}
          <section>
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Клиент</div>
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3 space-y-1.5">
              <div className="text-white font-semibold">{fix.client_name || "—"}</div>
              {fix.client_phone && (
                <a href={`tel:${fix.client_phone}`} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  <Icon name="Phone" className="h-3.5 w-3.5" />
                  {fix.client_phone}
                </a>
              )}
              {fix.client_email && (
                <a href={`mailto:${fix.client_email}`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-300 transition-colors">
                  <Icon name="Mail" className="h-3.5 w-3.5" />
                  {fix.client_email}
                </a>
              )}
            </div>
          </section>

          {/* Брокер */}
          {fix.broker_name && (
            <section>
              <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Брокер</div>
              <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-violet-300 text-xs font-bold">{fix.broker_name.slice(0, 1)}</span>
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{fix.broker_name}</div>
                  {fix.dept_name && <div className="text-xs text-gray-500">{fix.dept_name}</div>}
                  {fix.broker_email && <div className="text-xs text-gray-600">{fix.broker_email}</div>}
                </div>
              </div>
            </section>
          )}

          {/* Статус воронки */}
          <section>
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Статус воронки</div>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.id}
                  disabled={updating === fix.id}
                  onClick={() => onStatusChange(fix.id, s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    fix.status === s.id
                      ? `${s.bg} ${s.border} ${s.color}`
                      : "bg-[#0d0d0d] border-[#1f1f1f] text-gray-500 hover:border-[#2a2a2a] hover:text-gray-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${fix.status === s.id ? s.dot : "bg-gray-700"}`} />
                  <span className="truncate">{s.label}</span>
                  {fix.status === s.id && <Icon name="Check" className="h-3 w-3 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </section>

          {/* Даты */}
          <section className="flex gap-3">
            <div className="flex-1 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3">
              <div className="text-xs text-gray-600 mb-1">Создана</div>
              <div className="text-sm text-gray-300">{new Date(fix.created_at).toLocaleDateString("ru-RU")}</div>
            </div>
            <div className={`flex-1 border rounded-xl p-3 ${dl.warn ? "bg-red-500/5 border-red-500/20" : "bg-[#0d0d0d] border-[#1f1f1f]"}`}>
              <div className="text-xs text-gray-600 mb-1">Срок фиксации</div>
              <div className={`text-sm ${dl.warn ? "text-red-400" : "text-gray-300"}`}>
                {fix.expires_at
                  ? `${new Date(fix.expires_at).toLocaleDateString("ru-RU")} (${dl.text})`
                  : "—"}
              </div>
            </div>
          </section>

          {/* Комментарий */}
          <section>
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Комментарий</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Заметки по сделке..."
              rows={3}
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-[#3a3a3a] transition-colors"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={saved || notes === (fix.notes || "")}
              size="sm"
              className="mt-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white border-0 text-xs"
            >
              {saved
                ? <><Icon name="Check" className="h-3 w-3 mr-1 text-emerald-400" />Сохранено</>
                : <><Icon name="Save" className="h-3 w-3 mr-1" />Сохранить</>
              }
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Карточка в канбане ────────────────────────────────────────────────────────

function FixCard({
  fix,
  onStatusChange,
  updating,
  onClick,
}: {
  fix: AdminFixation
  onStatusChange: (id: string, status: string) => void
  updating: string | null
  onClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dl = daysLeft(fix.expires_at)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  return (
    <div
      className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 space-y-2 hover:border-[#2a2a2a] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="text-white text-sm font-medium line-clamp-2 leading-tight">
        {fix.offer_title || "Объект"}
      </div>
      {fix.city && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Icon name="MapPin" className="h-3 w-3" />
          {fix.city}
        </div>
      )}

      <div className="pt-1.5 border-t border-[#1a1a1a]">
        <div className="text-xs text-gray-300 font-medium">{fix.client_name || "—"}</div>
        {fix.client_phone && <div className="text-xs text-gray-500">{fix.client_phone}</div>}
      </div>

      {(fix.broker_name || fix.dept_name) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Icon name="User" className="h-3 w-3 shrink-0" />
          <span className="truncate">{fix.broker_name || "—"}</span>
          {fix.dept_name && <span className="text-gray-700 shrink-0 text-[10px]">· {fix.dept_name}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{new Date(fix.created_at).toLocaleDateString("ru-RU")}</span>
        {dl.text && <span className={`text-xs ${dl.warn ? "text-red-400" : "text-gray-500"}`}>{dl.text}</span>}
      </div>

      <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(v => !v)}
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
        {menuOpen && (
          <div className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => { onStatusChange(fix.id, s.id); setMenuOpen(false) }}
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

// ── Главный компонент ─────────────────────────────────────────────────────────

export default function AggFixationsAdmin({ token }: { token: string }) {
  const [fixations, setFixations] = useState<AdminFixation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [brokerFilter, setBrokerFilter] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminFixation | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (deptFilter) params.set("department_id", deptFilter)
      if (brokerFilter) params.set("broker_id", brokerFilter)
      const url = AGG_FIX_URL + (params.toString() ? "?" + params.toString() : "")
      const res = await fetch(url, { headers: { "X-Admin-Token": token } })
      const data = await res.json()
      setFixations(data.fixations || [])
      if (data.departments?.length) setDepartments(data.departments)
      if (data.brokers?.length) setBrokers(data.brokers)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [deptFilter, brokerFilter])

  const updateStatus = async (fixId: string, newStatus: string, notes?: string) => {
    setUpdating(fixId)
    setFixations(prev => prev.map(f =>
      f.id === fixId ? { ...f, status: newStatus, ...(notes !== undefined ? { notes } : {}) } : f
    ))
    setSelected(prev => prev?.id === fixId
      ? { ...prev, status: newStatus, ...(notes !== undefined ? { notes } : {}) }
      : prev
    )
    await fetch(AGG_FIX_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id: fixId, status: newStatus, ...(notes !== undefined ? { notes } : {}) }),
    })
    setUpdating(null)
  }

  const filteredBrokers = deptFilter
    ? brokers.filter(b => b.department_id === deptFilter)
    : brokers

  const filtered = fixations.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (f.client_name || "").toLowerCase().includes(q) ||
      (f.offer_title || "").toLowerCase().includes(q) ||
      (f.broker_name || "").toLowerCase().includes(q) ||
      (f.city || "").toLowerCase().includes(q) ||
      (f.client_phone || "").includes(q)
    )
  })

  const byStatus = (statusId: string) => filtered.filter(f => f.status === statusId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="px-5 py-3 border-b border-[#1f1f1f] space-y-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="font-bold text-base text-white">CRM фиксаций</h2>
            <p className="text-xs text-gray-500">{fixations.length} фиксаций</p>
          </div>
          <Button onClick={load} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white shrink-0">
            <Icon name={loading ? "Loader2" : "RefreshCw"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input
              placeholder="Поиск по клиенту, объекту, телефону..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-xs placeholder:text-gray-600 h-8"
            />
          </div>

          {departments.length > 0 && (
            <select
              value={deptFilter}
              onChange={e => { setDeptFilter(e.target.value); setBrokerFilter("") }}
              className="h-8 px-2.5 rounded-lg bg-[#111] border border-[#1f1f1f] text-xs text-gray-300 focus:outline-none focus:border-[#2a2a2a] cursor-pointer"
            >
              <option value="">Все отделы</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {brokers.length > 0 && (
            <select
              value={brokerFilter}
              onChange={e => setBrokerFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-[#111] border border-[#1f1f1f] text-xs text-gray-300 focus:outline-none focus:border-[#2a2a2a] cursor-pointer"
            >
              <option value="">Все сотрудники</option>
              {filteredBrokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {(deptFilter || brokerFilter) && (
          <div className="flex items-center gap-2 flex-wrap">
            {deptFilter && (
              <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {departments.find(d => d.id === deptFilter)?.name}
                <button onClick={() => { setDeptFilter(""); setBrokerFilter("") }} className="hover:text-white ml-0.5">
                  <Icon name="X" className="h-3 w-3" />
                </button>
              </span>
            )}
            {brokerFilter && (
              <span className="flex items-center gap-1 text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
                {brokers.find(b => b.id === brokerFilter)?.name}
                <button onClick={() => setBrokerFilter("")} className="hover:text-white ml-0.5">
                  <Icon name="X" className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Канбан */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-4 min-w-max">
          {STATUSES.map(st => {
            const cards = byStatus(st.id)
            return (
              <div key={st.id} className="flex flex-col w-56 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${st.bg} border ${st.border}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                  <span className={`text-xs font-semibold truncate ${st.color}`}>{st.label}</span>
                  <span className={`ml-auto text-xs font-bold tabular-nums ${st.color} opacity-70`}>{cards.length}</span>
                </div>
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
                        onClick={() => setSelected(fix)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <FixationModal
          fix={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
          updating={updating}
        />
      )}
    </div>
  )
}
