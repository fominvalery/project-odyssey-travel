import { useState, useRef, useEffect } from "react"
import Icon from "@/components/ui/icon"

export interface Notification {
  id: string
  type: "payment" | "lead" | "info" | "warning"
  title: string
  body: string
  read: boolean
  at: string // ISO date
}

const STORAGE_KEY = "k24_notifications"

function loadNotifications(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveNotifications(items: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
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
  userId?: string
}

export function addNotification(n: Omit<Notification, "id" | "read" | "at">) {
  const items = loadNotifications()
  items.unshift({ ...n, id: crypto.randomUUID(), read: false, at: new Date().toISOString() })
  saveNotifications(items.slice(0, 50))
  window.dispatchEvent(new Event("k24_notifications_updated"))
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>(loadNotifications)
  const ref = useRef<HTMLDivElement>(null)

  const unread = items.filter(n => !n.read).length

  useEffect(() => {
    const handler = () => setItems(loadNotifications())
    window.addEventListener("k24_notifications_updated", handler)
    return () => window.removeEventListener("k24_notifications_updated", handler)
  }, [])

  useEffect(() => {
    if (!userId) return
    // Проверяем напоминание об оплате тарифа
    const clubExpiry = localStorage.getItem("k24_club_expiry")
    if (!clubExpiry) return
    const daysLeft = Math.ceil((new Date(clubExpiry).getTime() - Date.now()) / 86400000)
    const reminderKey = `k24_payment_reminded_${clubExpiry}`
    if ([4, 2, 1, 0].includes(daysLeft) && !localStorage.getItem(reminderKey)) {
      localStorage.setItem(reminderKey, "1")
      const days = daysLeft === 0 ? "сегодня" : `через ${daysLeft} ${daysLeft === 1 ? "день" : "дня"}`
      addNotification({
        type: "payment",
        title: "Напоминание об оплате",
        body: `Тариф Клуб истекает ${days}. Продлите подписку, чтобы не потерять доступ.`,
      })
    }
  }, [userId])

  function markAllRead() {
    const updated = items.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
    setItems(updated)
  }

  function markRead(id: string) {
    const updated = items.map(n => n.id === id ? { ...n, read: true } : n)
    saveNotifications(updated)
    setItems(updated)
  }

  // Закрывать по клику вне
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
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
      >
        <Icon name="Bell" className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-2xl border border-[#262626] bg-[#111] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <span className="text-sm font-semibold text-white">Уведомления</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
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
                      <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(n.at)}</span>
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
