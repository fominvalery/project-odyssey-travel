export interface Dialog {
  partner_id: string
  partner_name: string
  partner_avatar: string | null
  partner_status: string
  last_text: string
  last_at: string
  is_mine: boolean
  unread_count: number
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  text: string
  is_read: boolean
  created_at: string
}

export interface Proposal {
  id: string
  deal_id: string
  proposal_type: string
  proposed_by: string
  new_status: string
  response: string
  created_at: string
  initiator_name?: string
  partner_id?: string
}

export interface JointDealForm {
  deal_type: "Совместная работа" | "Передача контакта"
  transaction_type: "Продажа" | "Аренда" | "Подбор"
  object_description: string
  initiator_role: "Со стороны объекта" | "Со стороны клиента"
  commission_initiator: number
  commission_partner: number
  comment: string
}

export const DEFAULT_FORM: JointDealForm = {
  deal_type: "Совместная работа",
  transaction_type: "Продажа",
  object_description: "",
  initiator_role: "Со стороны объекта",
  commission_initiator: 50,
  commission_partner: 50,
  comment: "",
}

export function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export function formatTime(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
}

export function isAgency(status: string) {
  return status === "agency"
}
