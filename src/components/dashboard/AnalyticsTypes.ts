import { type ObjectData } from "@/components/AddObjectWizard"

export type Period = "7" | "30" | "90"

export interface ActivityPoint {
  date: string
  просмотры: number
  заявки: number
  лиды: number
}

export interface SourceItem {
  source: string
  total: number
  deals: number
}

export interface Metrics {
  views: number
  leads: number
  requests: number
  deals: number
  objects: number
  conversion: number
  activity: ActivityPoint[]
  by_source: SourceItem[]
}

export interface Lead {
  id: string
  name: string
  last_name?: string
  object_title?: string
  stage?: string
  created_at?: string
}

export interface AnalyticsProps {
  objects: ObjectData[]
  userId?: string
  orgId?: string
  departmentId?: string
  user?: { id?: string; name: string; status: string }
  onNavigateSection?: (target: "objects" | "crm" | "analytics") => void
}

export const EMPTY_METRICS: Metrics = {
  views: 0, leads: 0, requests: 0, deals: 0, objects: 0, conversion: 0, activity: [], by_source: [],
}

export const SOURCE_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ec4899", "#06b6d4", "#f43f5e", "#a3a3a3",
]

export const DEAL_STAGES = ["Закрыт", "won", "closed", "deal", "Сделка", "Завершён", "Договор"]

export function stageColor(stage?: string) {
  const s = (stage || "").toLowerCase()
  if (s.includes("закр") || s.includes("закрыт") || s === "closed") return "bg-gray-500/10 text-gray-400"
  if (s.includes("сделк") || s.includes("won") || s.includes("договор")) return "bg-emerald-500/10 text-emerald-400"
  if (s.includes("нов") || s === "лид") return "bg-blue-500/10 text-blue-400"
  return "bg-violet-500/10 text-violet-400"
}

export function objectStatusColor(s: string) {
  if (s === "Активен") return "bg-emerald-500/10 text-emerald-400"
  if (s === "На проверке") return "bg-amber-500/10 text-amber-400"
  return "bg-gray-500/10 text-gray-400"
}

export function priceLabel(p: string) {
  if (!p) return "—"
  const n = Number(String(p).replace(/[^\d]/g, ""))
  if (!n) return p
  return `${n.toLocaleString("ru-RU")} ₽`
}
