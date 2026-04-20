import { useState, useEffect } from "react"
import func2url from "../../backend/func2url.json"

export type UserStatus = "basic" | "broker" | "agency"

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  company: string
  plan: string        // вычисляется из status, хранится для совместимости с бэкендом
  status: UserStatus
  listingsUsed?: number
  listingsExtra?: number
  listingsPeriodStart?: string
  avatar: string | null
  createdAt: string
  isSuperadmin?: boolean
}

/** Карта: status → plan (единственный источник маппинга) */
export const STATUS_TO_PLAN: Record<UserStatus, string> = {
  basic:  "basic",
  broker: "pro",
  agency: "proplus",
}

/** Карта: status → читаемое название для UI */
export const STATUS_LABELS: Record<UserStatus, string> = {
  basic:  "Базовый",
  broker: "Клуб",
  agency: "Агентство",
}

/** Иконка для статуса */
export const STATUS_ICONS: Record<UserStatus, string> = {
  basic:  "User",
  broker: "Zap",
  agency: "Building2",
}

/** Вычислить plan из status */
export function planFromStatus(status: UserStatus | string): string {
  return STATUS_TO_PLAN[status as UserStatus] ?? "basic"
}

/** Нормализовать status: если бэкенд прислал plan=pro, broker — разбираемся */
function resolveStatus(rawStatus: string, rawPlan: string): UserStatus {
  if (rawStatus === "broker" || rawStatus === "agency") return rawStatus as UserStatus
  if (rawPlan === "pro" || rawPlan === "proplus") {
    return rawPlan === "proplus" ? "agency" : "broker"
  }
  return "basic"
}

const STORAGE_KEY = "estatepro_user"

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Миграция старых профилей: пересчитываем plan из status
        parsed.plan = planFromStatus(parsed.status || "basic")
        setUser(parsed)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  function register(data: { name: string; email: string; phone: string; company: string; plan: string }) {
    const status: UserStatus = "basic"
    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      status,
      plan: planFromStatus(status),
      avatar: null,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }

  async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const authUrl = (func2url as Record<string, string>)["auth-email-auth"]
      const res = await fetch(`${authUrl}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const raw = await res.text()
      const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
      if (!res.ok) {
        return { ok: false, error: data?.error || "Неверный email или пароль" }
      }
      const userData = data.user || data
      const status = resolveStatus(userData.status || "basic", userData.plan || "basic")
      const profile: UserProfile = {
        id: String(userData.id || userData.user_id || ""),
        name: userData.name || "",
        email: userData.email || email,
        phone: userData.phone || "",
        company: userData.company || "",
        status,
        plan: planFromStatus(status),
        listingsUsed: userData.listings_used ?? 0,
        listingsExtra: userData.listings_extra ?? 0,
        listingsPeriodStart: userData.listings_period_start || new Date().toISOString(),
        avatar: userData.avatar_url || userData.avatar || null,
        createdAt: userData.created_at || new Date().toISOString(),
        isSuperadmin: userData.is_superadmin || false,
      }
      if (data.access_token) {
        localStorage.setItem("estatepro_access_token", data.access_token)
      }
      if (data.refresh_token) {
        localStorage.setItem("estatepro_refresh_token", data.refresh_token)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      setUser(profile)
      return { ok: true }
    } catch {
      return { ok: false, error: "Ошибка сети, попробуйте снова" }
    }
  }

  function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return
    const merged = { ...user, ...updates }
    // Если меняется status — автоматически пересчитываем plan
    if (updates.status !== undefined) {
      merged.plan = planFromStatus(updates.status)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    setUser(merged)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return { user, register, login, logout, updateProfile }
}
