import { useState, useEffect } from "react"

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

  function login(email: string) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const u: UserProfile = JSON.parse(stored)
      if (u.email.toLowerCase() === email.toLowerCase()) {
        setUser(u)
        return true
      }
    }
    return false
  }

  function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return
    const updated = { ...user, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setUser(updated)
  }

  function logout() {
    setUser(null)
  }

  return { user, register, login, logout, updateProfile }
}
