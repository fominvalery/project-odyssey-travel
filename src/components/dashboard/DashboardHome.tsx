import { useEffect, useState } from "react"
import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"
import { STATUS_LABELS } from "@/hooks/useAuth"
import func2url from "../../../backend/func2url.json"

interface Lead {
  id: string
  name: string
  last_name?: string
  object_title?: string
  stage?: string
  created_at?: string
}

interface Props {
  user: { id?: string; name: string; status: string }
  objects: ObjectData[]
}

const DEAL_STAGES = ["Закрыт", "won", "closed", "deal", "Сделка", "Завершён", "Договор"]

function priceLabel(p: string) {
  if (!p) return "—"
  const n = Number(String(p).replace(/[^\d]/g, ""))
  if (!n) return p
  return `${n.toLocaleString("ru-RU")} ₽`
}

function stageColor(stage?: string) {
  const s = (stage || "").toLowerCase()
  if (s.includes("закр") || s.includes("закрыт") || s === "closed") return "bg-gray-500/10 text-gray-400"
  if (s.includes("сделк") || s.includes("won") || s.includes("договор")) return "bg-emerald-500/10 text-emerald-400"
  if (s.includes("нов") || s === "лид") return "bg-blue-500/10 text-blue-400"
  return "bg-violet-500/10 text-violet-400"
}

function objectStatusColor(s: string) {
  if (s === "Активен") return "bg-emerald-500/10 text-emerald-400"
  if (s === "На проверке") return "bg-amber-500/10 text-amber-400"
  return "bg-gray-500/10 text-gray-400"
}

export default function DashboardHome({ user, objects }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [viewsTotal, setViewsTotal] = useState<number>(0)

  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    const url = (func2url as Record<string, string>)["leads"]
    if (!url) return
    fetch(`${url}?owner_id=${uid}`, { headers: { "X-User-Id": uid } })
      .then((r) => (r.ok ? r.json() : { leads: [] }))
      .then((d) => setLeads(Array.isArray(d?.leads) ? d.leads : []))
      .catch(() => setLeads([]))
  }, [user?.id])

  useEffect(() => {
    const ids = objects.map((o) => o.id).filter(Boolean)
    if (ids.length === 0) {
      setViewsTotal(0)
      return
    }
    const url = (func2url as Record<string, string>)["analytics"]
    if (!url) return
    fetch(`${url}?action=views&ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((d) => {
        const counts = (d?.counts ?? {}) as Record<string, number>
        const total = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0)
        setViewsTotal(total)
      })
      .catch(() => setViewsTotal(0))
  }, [objects])

  const dealsCount = leads.filter((l) => DEAL_STAGES.some((d) => (l.stage || "").toLowerCase().includes(d.toLowerCase()))).length
  const lastObjects = [...objects].slice(0, 3)
  const lastLeads = [...leads]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 3)

  const stats = [
    { label: "Объектов", value: String(objects.length), icon: "Building2", color: "text-blue-400" },
    { label: "Лидов", value: String(leads.length), icon: "Users", color: "text-emerald-400" },
    { label: "Просмотров", value: viewsTotal.toLocaleString("ru-RU"), icon: "Eye", color: "text-violet-400" },
    { label: "Сделок", value: String(dealsCount), icon: "Handshake", color: "text-amber-400" },
  ]

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Добро пожаловать, {user.name.split(" ")[0]}!</h1>
      <p className="text-gray-400 text-sm mb-8">
        Тариф: <span className="text-blue-400 font-medium">{STATUS_LABELS[user.status as keyof typeof STATUS_LABELS] ?? user.status}</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
            <Icon name={stat.icon as "Building2"} className={`h-5 w-5 mb-3 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Building2" className="h-4 w-4 text-blue-400" /> Последние объекты
          </h2>
          {lastObjects.length === 0 ? (
            <p className="text-sm text-gray-500">Объектов пока нет</p>
          ) : (
            <div className="flex flex-col gap-3">
              {lastObjects.map((obj) => (
                <div key={obj.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[220px]">{obj.title || "Без названия"}</p>
                    <p className="text-xs text-gray-500">{priceLabel(obj.price)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${objectStatusColor(obj.status || "Активен")}`}>
                    {obj.status || "Активен"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Users" className="h-4 w-4 text-emerald-400" /> Последние лиды
          </h2>
          {lastLeads.length === 0 ? (
            <p className="text-sm text-gray-500">Лидов пока нет</p>
          ) : (
            <div className="flex flex-col gap-3">
              {lastLeads.map((lead) => {
                const fullName = [lead.name, lead.last_name].filter(Boolean).join(" ") || "Без имени"
                return (
                  <div key={lead.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[220px]">{fullName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[220px]">{lead.object_title || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${stageColor(lead.stage)}`}>
                      {lead.stage || "Лид"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}