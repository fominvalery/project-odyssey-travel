import { useState, useRef, useEffect, useCallback } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

export interface Notification {
  id: string
  user_id: string
  type: "payment" | "lead" | "info" | "warning"
  title: string
  body: string
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<Notification["type"], string> = {
  payment: "CreditCard",
  lead: "UserPlus",
  info: "Info",
  warning: "AlertTriangle",
}
const TYPE_COLOR: Record<Notification["type"], string> = {
  payment: "text-blue-400 bg-blue-500/10",
  lead: "text-emerald-400 bg-emerald-500/10",
  info: "text-gray-400 bg-gray-500/10",
  warning: "text-amber-400 bg-amber-500/10",
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "только что"
  if (m < 60) return `${m} мин`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч`
  return `${Math.floor(h / 24)} д`
}

interface Props {
  userId: string
}

export async function addNotification(userId: string, n: { type: Notification["type"]; title: string; body: string }) {
  await fetch(func2url.notifications, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...n }),
  })
  window.dispatchEvent(new Event("k24_notifications_updated"))
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = items.filter(n => !n.read).length

  const loadNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const r = await fetch(`${func2url.notifications}?user_id=${encodeURIComponent(userId)}`)
      const data = await r.json()
      setItems(Array.isArray(data.notifications) ? data.notifications : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const handler = () => loadNotifications()
    window.addEventListener("k24_notifications_updated", handler)
    return () => window.removeEventListener("k24_notifications_updated", handler)
  }, [loadNotifications])

  // Polling каждые 60 секунд
  useEffect(() => {
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  async function markAllRead() {
    await fetch(func2url.notifications, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, all: true }),
    })
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await fetch(func2url.notifications, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, id }),
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open) loadNotifications() }}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
      >
        <Icon name="Bell" className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl border border-[#262626] bg-[#111] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <span className="text-sm font-semibold text-white">Уведомления</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Icon name="BellOff" className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Нет уведомлений</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0 ${
                    !n.read ? "bg-blue-500/5" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLOR[n.type]}`}>
                    <Icon name={TYPE_ICON[n.type] as "Bell"} className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs font-semibold leading-tight ${!n.read ? "text-white" : "text-gray-300"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
