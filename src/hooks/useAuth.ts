import { useState, useEffect } from "react"
import func2url from "../../backend/func2url.json"

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  company: string
  plan: string
  status: "resident" | "broker" | "agency"
  avatar: string | null
  createdAt: string
}

const STORAGE_KEY = "estatepro_user"

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  function register(data: { name: string; email: string; phone: string; company: string; plan: string }) {
    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      plan: data.plan,
      status: "resident",
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
      const profile: UserProfile = {
        id: String(userData.id || userData.user_id || ""),
        name: userData.name || "",
        email: userData.email || email,
        phone: userData.phone || "",
        company: userData.company || "",
        plan: userData.plan || "green",
        status: userData.status || "resident",
        avatar: userData.avatar_url || userData.avatar || null,
        createdAt: userData.created_at || new Date().toISOString(),
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
    const updated = { ...user, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setUser(updated)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return { user, register, login, logout, updateProfile }
}