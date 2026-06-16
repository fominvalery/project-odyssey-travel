import Icon from "@/components/ui/icon"
import { ReferralStats } from "./referralTypes"

interface Props {
  stats: ReferralStats | null
  loading: boolean
}

export default function DashboardReferralTabs({ stats, loading }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-1 mb-4">
        <Icon name="Users" className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">
          Рефералы ({loading ? "…" : stats?.referral_count ?? 0})
        </span>
      </div>

      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden">
        {!loading && (stats?.referred_users?.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <Icon name="Users" className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Пока нет рефералов
          </div>
        ) : (
          <div className="divide-y divide-[#1f1f1f]">
            {stats?.referred_users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                  {u.name && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    u.status === "broker" ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                    : u.status === "agency" ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {u.status === "broker" ? "Клуб" : u.status === "agency" ? "Агентство" : "Базовый"}
                  </span>
                  {u.joined_at && (
                    <span className="text-xs text-gray-600">
                      {new Date(u.joined_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
