import func2url from "../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

const LEVELS_MAP = [
  { name: "Друг",      level: 1, color: "blue" },
  { name: "Партнёр",   level: 2, color: "emerald" },
  { name: "Бизнес",    level: 3, color: "violet" },
  { name: "Амбасадор", level: 4, color: "amber" },
  { name: "Лидер",     level: 5, color: "rose" },
]

function normalizeLevel(raw: unknown): ReferralLevel {
  if (raw && typeof raw === "object" && "name" in (raw as object)) return raw as ReferralLevel
  const name = typeof raw === "string" ? raw : "Друг"
  const found = LEVELS_MAP.find(l => l.name === name) || LEVELS_MAP[0]
  return found
}

export interface ReferralLevel {
  name: string
  level: number
  color: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  phone: string
  company: string
  plan: string
  status: string
  is_superadmin: boolean
  listings_used: number
  listings_extra: number
  created_at: string | null
  last_login_at: string | null
  referral_count: number
  referral_level: ReferralLevel
  email_verified: boolean
}

export interface AdminWithdrawal {
  id: number
  user_id: string
  user_name: string
  user_email: string
  entity_type: string
  entity_label: string
  full_name: string
  inn: string
  bank_name: string
  bik: string
  account: string
  amount: number | null
  comment: string
  status: string
  status_label: string
  created_at: string | null
  updated_at: string | null
}

export interface AdminWithdrawalsResponse {
  requests: AdminWithdrawal[]
  total: number
  stats: {
    pending: number
    approved: number
    paid: number
    total_paid: number
  }
}

export interface AdminUserPayload {
  user: {
    id: string
    email: string
    name: string
    phone: string
    company: string
    plan: string
    status: string
    avatar_url: string | null
    is_superadmin: boolean
    listings_used: number
    listings_extra: number
    listings_period_start: string | null
  }
}

export const superadminApi = {
  async updateLevel(actorId: string, userId: string, referralLevel: string): Promise<void> {
    const res = await fetch(`${AUTH_URL}?action=update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": actorId },
      body: JSON.stringify({ user_id: userId, referral_level: referralLevel }),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка обновления уровня")
  },

  async updateStatus(actorId: string, status: "basic" | "broker" | "agency", userId?: string): Promise<AdminUserPayload> {
    const res = await fetch(`${AUTH_URL}?action=update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": actorId },
      body: JSON.stringify({ user_id: userId || actorId, status }),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка обновления статуса")
    return data
  },

  async listUsers(actorId: string, search = ""): Promise<AdminUser[]> {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const res = await fetch(`${AUTH_URL}?action=users-list&${params.toString()}`, {
      headers: { "X-User-Id": actorId },
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка загрузки")
    const users: AdminUser[] = (data.users || []).map((u: AdminUser) => ({
      ...u,
      referral_level: normalizeLevel(u.referral_level),
    }))
    return users
  },

  async listWithdrawals(actorId: string, statusFilter = ""): Promise<AdminWithdrawalsResponse> {
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    const res = await fetch(`${AUTH_URL}?action=admin-withdrawals&${params.toString()}`, {
      headers: { "X-User-Id": actorId },
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка загрузки")
    return data
  },

  async updateWithdrawalStatus(actorId: string, requestId: number, status: string): Promise<void> {
    const res = await fetch(`${AUTH_URL}?action=admin-withdrawals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": actorId },
      body: JSON.stringify({ request_id: requestId, status }),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка обновления")
  },

  async deleteUser(actorId: string, userId: string): Promise<void> {
    const res = await fetch(`${AUTH_URL}?action=admin-delete-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": actorId },
      body: JSON.stringify({ user_id: userId }),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка удаления")
  },

  async verifyEmailManually(actorId: string, userId: string): Promise<void> {
    const res = await fetch(`${AUTH_URL}?action=admin-verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": actorId },
      body: JSON.stringify({ user_id: userId }),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Не удалось подтвердить email")
  },
}