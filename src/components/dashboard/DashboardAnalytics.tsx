import { useEffect, useMemo, useState } from "react"
import { type ObjectData } from "@/components/AddObjectWizard"
import func2url from "../../../backend/func2url.json"
import {
  type Period,
  type Metrics,
  type Lead,
  type AnalyticsProps,
  EMPTY_METRICS,
  DEAL_STAGES,
} from "./AnalyticsTypes"
import DashboardWelcome from "./DashboardWelcome"
import AnalyticsCharts from "./AnalyticsCharts"

export default function DashboardAnalytics({ objects, userId, orgId, departmentId, user, onNavigateSection }: AnalyticsProps) {
  const [period, setPeriod] = useState<Period>("30")
  const [data, setData] = useState<Metrics>(EMPTY_METRICS)
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    if (!userId && !orgId) return
    const p = new URLSearchParams()
    p.set("period", period)
    if (orgId) {
      p.set("org_id", orgId)
      if (departmentId) p.set("department_id", departmentId)
    } else if (userId) {
      p.set("user_id", userId)
    }
    setLoading(true)
    fetch(`${func2url.analytics}?${p.toString()}`, {
      headers: userId ? { "X-User-Id": userId } : undefined,
    })
      .then(r => r.json())
      .then(d => {
        if (d && typeof d === "object" && Array.isArray(d.activity)) {
          setData({
            views: d.views || 0,
            leads: d.leads || 0,
            requests: d.requests || 0,
            deals: d.deals || 0,
            objects: d.objects ?? objects.length,
            conversion: d.conversion || 0,
            activity: d.activity,
            by_source: Array.isArray(d.by_source) ? d.by_source : [],
          })
        }
      })
      .catch(() => setData({ ...EMPTY_METRICS, objects: objects.length }))
      .finally(() => setLoading(false))
  }, [period, userId, orgId, departmentId, objects.length])

  useEffect(() => {
    const uid = userId
    if (!uid) return
    const url = (func2url as Record<string, string>)["leads"]
    if (!url) return
    fetch(`${url}?owner_id=${uid}`, { headers: { "X-User-Id": uid } })
      .then(r => r.ok ? r.json() : { leads: [] })
      .then(d => setLeads(Array.isArray(d?.leads) ? d.leads : []))
      .catch(() => setLeads([]))
  }, [userId])

  const dealsCount = leads.filter(l => DEAL_STAGES.some(d => (l.stage || "").toLowerCase().includes(d.toLowerCase()))).length

  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of objects) {
      const key = o.category || "Без категории"
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [objects])

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {user && (
        <DashboardWelcome
          user={user}
          objects={objects}
          leads={leads}
          dealsCount={dealsCount}
          views={data.views}
          onNavigateSection={onNavigateSection}
        />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Детальная аналитика</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Последние {period} дней{loading ? " · обновление…" : ""}
          </p>
        </div>
        <div className="flex gap-1 bg-[#111] border border-[#1f1f1f] rounded-xl p-1">
          {(["7", "30", "90"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >{p} дн.</button>
          ))}
        </div>
      </div>

      <AnalyticsCharts
        data={{ ...data, objects: data.objects || objects.length }}
        period={period}
        categoryData={categoryData}
      />

    </div>
  )
}
