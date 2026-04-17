import { useCallback, useEffect, useState } from "react"
import { agencyApi, OrgSummary } from "@/lib/agencyApi"
import { useAuthContext } from "@/context/AuthContext"

const ACTIVE_KEY = "k24_active_org"

export function useMyOrgs() {
  const { user } = useAuthContext()
  const [orgs, setOrgs] = useState<OrgSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null,
  )

  const reload = useCallback(async () => {
    if (!user) {
      setOrgs([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await agencyApi.listMyOrgs(user.id)
      setOrgs(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  const setActiveOrgId = useCallback((id: string | null) => {
    setActiveOrgIdState(id)
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  }, [])

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null

  return { orgs, loading, error, reload, activeOrg, activeOrgId, setActiveOrgId }
}
