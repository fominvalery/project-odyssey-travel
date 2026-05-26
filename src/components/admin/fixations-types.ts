export const STATUSES = [
  { id: "pending",     label: "Ожидает ответа",       color: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20",  dot: "bg-yellow-400" },
  { id: "fixed",       label: "Зафиксирован",          color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  { id: "invalid",     label: "Неактуален",            color: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400" },
  { id: "showing",     label: "Показ",                 color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    dot: "bg-blue-400" },
  { id: "booking",     label: "Бронь",                 color: "text-cyan-300",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    dot: "bg-cyan-400" },
  { id: "negotiation", label: "Переговоры",            color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  dot: "bg-violet-400" },
  { id: "deal",        label: "Сделка",                color: "text-emerald-200", bg: "bg-emerald-600/10", border: "border-emerald-600/20", dot: "bg-emerald-300" },
  { id: "docs",        label: "Подготовка документов", color: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  dot: "bg-orange-400" },
  { id: "payment",     label: "Оплата",                color: "text-pink-300",    bg: "bg-pink-500/10",    border: "border-pink-500/20",    dot: "bg-pink-400" },
]

export const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]))

export interface Department {
  id: string
  name: string
  head_name?: string | null
  members_count?: number
}

export interface Broker {
  id: string
  name: string
  department_id?: string | null
  department_name?: string | null
}

export interface AdminFixation {
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

export function daysLeft(dateStr: string | null): { text: string; warn: boolean } {
  if (!dateStr) return { text: "", warn: false }
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff <= 0) return { text: "Истекла", warn: true }
  if (diff <= 3) return { text: `${diff} дн.`, warn: true }
  return { text: `${diff} дн.`, warn: false }
}
