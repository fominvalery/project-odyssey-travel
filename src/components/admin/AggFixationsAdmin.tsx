import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const AGG_FIX_URL = (func2url as Record<string, string>)["agg-fixations"]

const STATUSES = [
  { id: "pending",     label: "Ожидает ответа",       color: "text-yellow-300 bg-yellow-500/10" },
  { id: "fixed",       label: "Зафиксирован",          color: "text-emerald-300 bg-emerald-500/10" },
  { id: "invalid",     label: "Неактуален",            color: "text-red-300 bg-red-500/10" },
  { id: "showing",     label: "Показ",                 color: "text-blue-300 bg-blue-500/10" },
  { id: "negotiation", label: "Переговоры",            color: "text-violet-300 bg-violet-500/10" },
  { id: "deal",        label: "Сделка",                color: "text-emerald-200 bg-emerald-600/10" },
  { id: "docs",        label: "Подготовка документов", color: "text-orange-300 bg-orange-500/10" },
  { id: "payment",     label: "Оплата",                color: "text-pink-300 bg-pink-500/10" },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]))

interface AdminFixation {
  id: string
  offer_id: string
  user_id: string
  status: string
  expires_at: string | null
  created_at: string
  offer_title?: string
  city?: string
  client_name?: string
  client_phone?: string
  client_email?: string
}

export default function AggFixationsAdmin({ token }: { token: string }) {
  const [fixations, setFixations] = useState<AdminFixation[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      // Загружаем как обычный пользователь — пока без суперадмин ID
      // В будущем можно передавать X-Admin-Token и получать все фиксации
      const res = await fetch(AGG_FIX_URL, {
        headers: { "X-User-Id": "admin-view" },
      })
      const data = await res.json()
      setFixations(data.fixations || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (fixId: string, newStatus: string) => {
    setUpdating(fixId)
    await fetch(AGG_FIX_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "admin-view",
      },
      body: JSON.stringify({ id: fixId, status: newStatus }),
    })
    setUpdating(null)
    load()
  }

  const filtered = fixations.filter(f => {
    const matchSearch = !search ||
      (f.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.offer_title || "").toLowerCase().includes(search.toLowerCase()) ||
      f.user_id.includes(search)
    const matchStatus = !statusFilter || f.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = STATUSES.map(s => ({
    ...s,
    count: fixations.filter(f => f.status === s.id).length,
  })).filter(s => s.count > 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="p-5 border-b border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg text-white">Журнал фиксаций</h2>
            <p className="text-xs text-gray-500 mt-0.5">Всего: {fixations.length} фиксаций</p>
          </div>
          <Button onClick={load} variant="ghost" size="icon" className="text-gray-500 hover:text-white">
            <Icon name="RefreshCw" className="h-4 w-4" />
          </Button>
        </div>

        {/* Статистика по статусам */}
        {stats.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {stats.map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(prev => prev === s.id ? "" : s.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  statusFilter === s.id
                    ? s.color + " border-current"
                    : "text-gray-500 border-[#2a2a2a] hover:text-gray-300"
                }`}
              >
                {s.label} ({s.count})
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input
              placeholder="Поиск по клиенту, объекту..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-[#2a2a2a]">
              <SelectItem value="all">Все статусы</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Список фиксаций */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-600">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icon name="BookmarkX" className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-500">Фиксаций нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">Объект</th>
                <th className="text-left px-3 py-3 font-medium">Клиент</th>
                <th className="text-left px-3 py-3 font-medium">Брокер (ID)</th>
                <th className="text-left px-3 py-3 font-medium">Дата</th>
                <th className="text-left px-3 py-3 font-medium">Истекает</th>
                <th className="text-left px-3 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(fix => {
                const st = STATUS_MAP[fix.status]
                return (
                  <tr key={fix.id} className="border-b border-[#141414] hover:bg-[#111] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-white font-medium line-clamp-1">{fix.offer_title || fix.offer_id.slice(0, 8) + "..."}</div>
                      {fix.city && <div className="text-xs text-gray-600">{fix.city}</div>}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="text-white">{fix.client_name || "—"}</div>
                      {fix.client_phone && <div className="text-xs text-gray-500">{fix.client_phone}</div>}
                      {fix.client_email && <div className="text-xs text-gray-600">{fix.client_email}</div>}
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 text-xs font-mono">
                      {fix.user_id.slice(0, 12)}...
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 text-xs">
                      {new Date(fix.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-3 py-3.5 text-xs">
                      {fix.expires_at ? (
                        (() => {
                          const diff = Math.ceil((new Date(fix.expires_at).getTime() - Date.now()) / 86400000)
                          return diff <= 0
                            ? <span className="text-red-400">Истекла</span>
                            : <span className="text-gray-400">{diff} дн.</span>
                        })()
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <Select
                        value={fix.status}
                        onValueChange={v => updateStatus(fix.id, v)}
                        disabled={updating === fix.id}
                      >
                        <SelectTrigger className={`h-7 text-xs border-0 rounded-full px-2.5 w-44 ${st?.color || "text-gray-400 bg-gray-500/10"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#2a2a2a]">
                          {STATUSES.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              <span className={s.color}>{s.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
