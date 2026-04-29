import { useState, useEffect, useCallback, useRef } from "react"
import func2url from "../../backend/func2url.json"
import type { ObjectData } from "@/components/AddObjectWizard"

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
  deptId?: string | null
  role?: string | null
  employees?: Array<{ user_id: string }>
}

export function useAgencyObjects({ userId, orgId, deptId, role, employees }: UseAgencyDataOptions) {
  const [objects, setObjects] = useState<ObjectData[]>([])
  const [loading, setLoading] = useState(true)
  const isFirstLoad = useRef(true)

  // Стабилизируем employees через ключ — новый массив с теми же id не вызовет перезапуск
  const employeesKey = employees ? employees.map(e => e.user_id).sort().join(",") : ""
  const employeesRef = useRef(employees)
  employeesRef.current = employees

  const load = useCallback(async (silent = false) => {
    if (!userId || !orgId) return
    if (!silent) setLoading(true)
    try {
      const emps = employeesRef.current
      const headers = { "X-User-Id": userId }
      if (role === "broker") {
        const r = await fetch(`${func2url.objects}?user_id=${encodeURIComponent(userId)}`, { headers })
        const data = await r.json()
        setObjects(Array.isArray(data.objects) ? data.objects.map(mapFromServer) : [])
      } else if (emps && emps.length > 0) {
        const results = await Promise.all(
          emps.map(e =>
            fetch(`${func2url.objects}?user_id=${encodeURIComponent(e.user_id)}`, { headers })
              .then(r => r.json())
              .then(d => Array.isArray(d.objects) ? d.objects.map(mapFromServer) : [])
              .catch(() => [] as ObjectData[])
          )
        )
        const allObjects = results.flat()
        const unique = Array.from(new Map(allObjects.map(o => [o.id, o])).values())
        setObjects(unique)
      } else {
        const r = await fetch(`${func2url.objects}?user_id=${encodeURIComponent(userId)}`, { headers })
        const data = await r.json()
        setObjects(Array.isArray(data.objects) ? data.objects.map(mapFromServer) : [])
      }
    } catch {
      setObjects([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orgId, deptId, role, employeesKey])

  useEffect(() => {
    // Первая загрузка — показываем loading, повторные (при смене роли/отдела) — тихо
    const silent = !isFirstLoad.current
    isFirstLoad.current = false
    load(silent)
  }, [load])

  return { objects, loading, reload: (s?: boolean) => load(s) }
}