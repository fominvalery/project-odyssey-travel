import { createContext, useContext, ReactNode } from "react"
import { useAuth, UserProfile } from "@/hooks/useAuth"

interface AuthContextType {
  user: UserProfile | null
  register: (data: { name: string; email: string; phone: string; company: string; plan: string }) => UserProfile
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
  return ctx
}
