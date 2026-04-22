import func2url from "../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

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
  async updateStatus(actorId: string, status: "basic" | "broker" | "agency", userId?: string): Promise<AdminUserPayload> {
    const res = await fetch(`${AUTH_URL}?action=update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor_id: actorId, user_id: userId || actorId, status }),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка обновления статуса")
    return data
  },

  async listUsers(actorId: string, search = ""): Promise<AdminUser[]> {
    const params = new URLSearchParams({ actor_id: actorId })
    if (search) params.set("search", search)
    const res = await fetch(`${AUTH_URL}?action=users-list&${params.toString()}`)
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    if (!res.ok) throw new Error(data?.error || "Ошибка загрузки")
    return data.users || []
  },
}