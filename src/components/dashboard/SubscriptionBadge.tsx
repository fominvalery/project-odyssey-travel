import { useState } from "react"
import Icon from "@/components/ui/icon"
import { type UserProfile } from "@/hooks/useAuth"

interface Props {
  user: UserProfile
}

export default function SubscriptionBadge({ user }: Props) {
  const [open, setOpen] = useState(false)

  if (user.status !== "broker" || !user.subscriptionEndAt) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Клуб · до 15 дек 2026
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

              <div className="rounded-xl p-3 bg-[#1a1a1a] border border-[#262626]">
                <p className="text-xs text-gray-400 mb-1">Доступ активен до</p>
                <p className="text-white font-semibold text-sm">15 декабря 2026 года</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
