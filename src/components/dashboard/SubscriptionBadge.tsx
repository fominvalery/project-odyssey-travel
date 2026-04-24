import { useState } from "react"
import Icon from "@/components/ui/icon"
import { type UserProfile } from "@/hooks/useAuth"

interface Props {
  user: UserProfile
  onRenew: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

function formatShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
}

function getDaysLeft(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function SubscriptionBadge({ user, onRenew }: Props) {
  const [open, setOpen] = useState(false)

  if (user.status !== "broker" || !user.subscriptionEndAt) return null

  const daysLeft = getDaysLeft(user.subscriptionEndAt)
  const isUrgent = daysLeft <= 4
  const isExpired = daysLeft <= 0

  const badgeColor = isExpired
    ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
    : isUrgent
    ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
    : "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25"

  const dotColor = isExpired ? "bg-red-400" : isUrgent ? "bg-amber-400" : "bg-blue-400"

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${badgeColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        Клуб · до {formatShort(user.subscriptionEndAt)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <Icon name="Zap" className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Клуб</p>
                    <p className="text-gray-500 text-xs">Активная подписка</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400">
                  <Icon name="X" className="h-4 w-4" />
                </button>
              </div>

              <div className={`rounded-xl p-3 mb-4 ${
                isExpired ? "bg-red-500/10 border border-red-500/20" :
                isUrgent ? "bg-amber-500/10 border border-amber-500/20" :
                "bg-[#1a1a1a] border border-[#262626]"
              }`}>
                <p className={`text-xs mb-1 ${isExpired ? "text-red-400" : isUrgent ? "text-amber-400" : "text-gray-400"}`}>
                  {isExpired ? "Подписка истекла" : "Действует до"}
                </p>
                <p className="text-white font-semibold text-sm">
                  {formatDate(user.subscriptionEndAt)}
                </p>
                {!isExpired && (
                  <p className={`text-xs mt-1 ${isUrgent ? "text-amber-400" : "text-gray-500"}`}>
                    {daysLeft === 1 ? "Остался 1 день" : `Осталось ${daysLeft} дн.`}
                  </p>
                )}
              </div>

              {isExpired && (
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  После истечения льготного периода аккаунт будет переведён на тариф Basic и все настройки Клуба станут недоступны.
                </p>
              )}

              <button
                onClick={() => { setOpen(false); onRenew() }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {isExpired ? "Восстановить подписку" : "Продлить подписку"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
