import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import { AdminFixation, Department, Broker, STATUSES } from "./fixations-types"
import FixCard from "./FixCard"
import FixationModal from "./FixationModal"

const AGG_FIX_URL = (func2url as Record<string, string>)["agg-fixations"]

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
