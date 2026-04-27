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
  // Карточка Клуба
  firstName?: string
  lastName?: string
  middleName?: string
  city?: string
  specializations?: string[]
  bio?: string
  experience?: string
  telegram?: string
  vk?: string
  max?: string
  website?: string
  subscriptionEndAt?: string | null
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
const COOKIE_KEY = "estatepro_session"
const COOKIE_DAYS = 365

function saveCookie(value: string) {
  const expires = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString()
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function readCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function clearCookie() {
  document.cookie = `${COOKIE_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || readCookie()
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        parsed.plan = planFromStatus(parsed.status || "basic")
        setUser(parsed)
        // Если восстановили из cookie — дублируем в localStorage
        if (!localStorage.getItem(STORAGE_KEY)) {
          localStorage.setItem(STORAGE_KEY, stored)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
        clearCookie()
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
        firstName: userData.first_name ?? "",
        lastName: userData.last_name ?? "",
        middleName: userData.middle_name ?? "",
        city: userData.city ?? "",
        specializations: userData.specializations ?? [],
        bio: userData.bio ?? "",
        experience: userData.experience ?? "",
        telegram: userData.telegram_username ?? userData.telegram ?? "",
        vk: userData.vk_username ?? userData.vk ?? "",
        max: userData.max_username ?? userData.max ?? "",
        website: userData.website ?? "",
        subscriptionEndAt: userData.subscription_end_at ?? null,
      }
      if (data.access_token) {
        localStorage.setItem("estatepro_access_token", data.access_token)
      }
      if (data.refresh_token) {
        localStorage.setItem("estatepro_refresh_token", data.refresh_token)
      }
      const profileJson = JSON.stringify(profile)
      localStorage.setItem(STORAGE_KEY, profileJson)
      saveCookie(profileJson)
      setUser(profile)
      return { ok: true }
    } catch {
      return { ok: false, error: "Ошибка сети, попробуйте снова" }
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return
    const merged = { ...user, ...updates }
    if (updates.status !== undefined) {
      merged.plan = planFromStatus(updates.status)
    }
    const mergedJson = JSON.stringify(merged)
    localStorage.setItem(STORAGE_KEY, mergedJson)
    saveCookie(mergedJson)
    setUser(merged)

    // Сохраняем в БД если есть поля профиля
    const profileFields = ['name','phone','company','firstName','lastName','middleName',
      'city','specializations','bio','experience','telegram','vk','max','website','avatar']
    const hasProfileUpdate = profileFields.some(f => f in updates)
    if (!hasProfileUpdate || !user.id) return

    try {
      const authUrl = (func2url as Record<string, string>)["auth-email-auth"]
      const body: Record<string, unknown> = {
        user_id: user.id,
        name: merged.name,
        phone: merged.phone,
        company: merged.company,
        first_name: merged.firstName ?? '',
        last_name: merged.lastName ?? '',
        middle_name: merged.middleName ?? '',
        city: merged.city ?? '',
        specializations: merged.specializations ?? [],
        bio: merged.bio ?? '',
        experience: merged.experience ?? '',
        telegram_username: merged.telegram ?? '',
        vk_username: merged.vk ?? '',
        max_username: merged.max ?? '',
        website: merged.website ?? '',
      }
      if ('avatar' in updates && merged.avatar) {
        body.avatar_url = merged.avatar
      }
      await fetch(`${authUrl}?action=update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch {
      // ignore — данные уже сохранены локально
    }
  }

  async function refreshProfile(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    const local = JSON.parse(stored)
    if (!local?.id) return
    try {
      const authUrl = (func2url as Record<string, string>)["auth-email-auth"]
      const res = await fetch(`${authUrl}?action=me&user_id=${encodeURIComponent(local.id)}`)
      if (!res.ok) return
      const raw = await res.text()
      const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
      const userData = data.user || data
      const status = resolveStatus(userData.status || local.status, userData.plan || local.plan)
      const updated: UserProfile = {
        ...local,
        status,
        plan: planFromStatus(status),
        listingsUsed: userData.listings_used ?? local.listingsUsed ?? 0,
        listingsExtra: userData.listings_extra ?? local.listingsExtra ?? 0,
        listingsPeriodStart: userData.listings_period_start || local.listingsPeriodStart,
        avatar: userData.avatar_url || userData.avatar || local.avatar,
        firstName: userData.first_name ?? local.firstName ?? '',
        lastName: userData.last_name ?? local.lastName ?? '',
        middleName: userData.middle_name ?? local.middleName ?? '',
        city: userData.city ?? local.city ?? '',
        specializations: userData.specializations ?? local.specializations ?? [],
        bio: userData.bio ?? local.bio ?? '',
        experience: userData.experience ?? local.experience ?? '',
        telegram: userData.telegram ?? local.telegram ?? '',
        vk: userData.vk ?? local.vk ?? '',
        max: userData.max ?? local.max ?? '',
        website: userData.website ?? local.website ?? '',
        subscriptionEndAt: userData.subscription_end_at ?? local.subscriptionEndAt ?? null,
      }
      const updatedJson = JSON.stringify(updated)
      localStorage.setItem(STORAGE_KEY, updatedJson)
      saveCookie(updatedJson)
      setUser(updated)
    } catch {
      // ignore — оставляем локальные данные
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem("estatepro_access_token")
    localStorage.removeItem("estatepro_refresh_token")
    clearCookie()
    setUser(null)
  }

  return { user, register, login, logout, updateProfile, refreshProfile }
}