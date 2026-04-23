import { useState, useEffect, useCallback } from "react"
import func2url from "../../backend/func2url.json"
import type { ObjectData } from "@/components/AddObjectWizard"

// Маппинг объекта с сервера — такой же как в Dashboard.tsx
function mapFromServer(o: Record<string, unknown>): ObjectData {
  const ef = (o.extra_fields as Record<string, string>) ?? {}
  return {
    id: String(o.id),
    type: (o.type as string) ?? "",
    subtype: (o.subtype as string) || ef.subtype || "",
    title: (o.title as string) ?? "",
    city: (o.city as string) ?? "",
    address: (o.address as string) ?? "",
    price: (o.price as string) ?? "",
    area: (o.area as string) ?? "",
    yield: (o.yield_percent as string) ?? "",
    yield_percent: (o.yield_percent as string) ?? "",
    description: (o.description as string) ?? "",
    status: (o.status as string) ?? "Активен",
    category: (o.category as string) ?? "",
    published: Boolean(o.published),
    photos: Array.isArray(o.photos) ? (o.photos as string[]) : [],
    user_id: (o.user_id as string) ?? null,
    extra_fields: ef,
    presentation_url: (o.presentation_url as string) ?? null,
  }
}

interface UseAgencyDataOptions {
  userId: string
  orgId: string
  /** Для РОП — фильтровать по отделу */
  deptId?: string | null
}

export function useAgencyObjects({ userId, orgId, deptId }: UseAgencyDataOptions) {
  const [objects, setObjects] = useState<ObjectData[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId || !orgId) return
    setLoading(true)
    try {
      let url = `${func2url.objects}?org_id=${encodeURIComponent(orgId)}`
      if (deptId) url += `&department_id=${encodeURIComponent(deptId)}`
      const r = await fetch(url)
      const data = await r.json()
      const arr = Array.isArray(data.objects) ? data.objects.map(mapFromServer) : []
      setObjects(arr)
    } catch {
      setObjects([])
    } finally {
      setLoading(false)
    }
  }, [userId, orgId, deptId])

  useEffect(() => { load() }, [load])

  return { objects, loading, reload: load }
}
