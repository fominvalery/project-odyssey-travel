import { useState, useEffect } from "react"
import func2url from "../../backend/func2url.json"

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  company: string
  plan: string
  status: "resident" | "broker" | "investor" | "buyer" | "owner"
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
      const res = await fetch((func2url as Record<string, string>).login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const raw = await res.text()
      const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
      if (!res.ok) {
        return { ok: false, error: data?.error || "Неверный email или пароль" }
      }
      const profile: UserProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        company: data.company || "",
        plan: data.plan || "green",
        status: data.status || "resident",
        avatar: data.avatar || null,
        createdAt: new Date().toISOString(),
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
