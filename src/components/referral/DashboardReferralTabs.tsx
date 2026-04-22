import Icon from "@/components/ui/icon"
import { ReferralStats, WithdrawalRequest } from "./referralTypes"

type TabId = "referrals" | "commissions" | "bonuses" | "withdrawals"

interface Props {
  stats: ReferralStats | null
  loading: boolean
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  withdrawals: WithdrawalRequest[]
  withdrawalsLoading: boolean
  onNewWithdrawal: () => void
}

export default function DashboardReferralTabs({
  stats, loading, activeTab, setActiveTab, withdrawals, withdrawalsLoading, onNewWithdrawal,
}: Props) {
  const tabs = [
    { id: "referrals" as const,   icon: "Users",      label: "Рефералы",  count: stats?.referral_count ?? 0, highlight: false },
    { id: "commissions" as const, icon: "TrendingUp", label: "Комиссии",  count: 0,                               highlight: false },
    { id: "bonuses" as const,     icon: "Gift",       label: "Бонусы",    count: stats?.bonus_count ?? 0,         highlight: (stats?.bonus_count ?? 0) > 0 },
    { id: "withdrawals" as const, icon: "Wallet",     label: "Выводы",    count: withdrawals.length,              highlight: false },
  ]

  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-[#111111] border border-[#1f1f1f] p-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activeTab === t.id ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon name={t.icon as "Users"} className="h-3.5 w-3.5" />
            {t.label}
            {" "}
            <span className={`${t.highlight && !loading && t.count > 0 ? "text-emerald-400 font-bold" : ""}`}>
              ({loading ? "…" : t.count})
            </span>
          </button>
        ))}
      </div>

      {activeTab === "referrals" && (
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
      )}

      {activeTab === "commissions" && (
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-8 text-center text-gray-500 text-sm">
          <Icon name="TrendingUp" className="h-8 w-8 mx-auto mb-2 opacity-30" />
          История комиссий появится после первой оплаты реферала
        </div>
      )}

      {activeTab === "bonuses" && (
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Icon name="Loader2" className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
              Загрузка…
            </div>
          ) : !stats?.bonuses?.length ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Icon name="Gift" className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-400 mb-1">Бонусов пока нет</p>
              <p className="text-xs">Вы получите 20 ₽ когда реферал создаст первый объект</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
                <span className="text-xs text-gray-500">Начислено бонусов</span>
                <span className="text-sm font-semibold text-emerald-400">
                  +{(stats.bonus_total).toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <div className="divide-y divide-[#1f1f1f]">
                {stats.bonuses.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          b.bonus_type === "first_object" ? "bg-blue-500/20" : "bg-emerald-500/20"
                        }`}>
                          <Icon
                            name={b.bonus_type === "first_object" ? "Building2" : "TrendingUp"}
                            size={12}
                            className={b.bonus_type === "first_object" ? "text-blue-400" : "text-emerald-400"}
                          />
                        </div>
                        <span className="text-sm font-medium truncate">
                          {b.referred_name || b.referred_email}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 pl-8">{b.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {b.created_at && (
                        <span className="text-xs text-gray-600">
                          {new Date(b.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      <span className="text-sm font-bold text-emerald-400">+{b.amount} ₽</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden">
          {withdrawalsLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Icon name="Loader2" className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
              Загрузка…
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Icon name="Wallet" className="h-8 w-8 mx-auto mb-2 opacity-30" />
              История выводов пока пуста
              <div className="mt-3">
                <button
                  onClick={onNewWithdrawal}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Подать первую заявку
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
                <span className="text-xs text-gray-500">Всего заявок: {withdrawals.length}</span>
                <button
                  onClick={onNewWithdrawal}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Icon name="Plus" size={12} />
                  Новая заявка
                </button>
              </div>
              <div className="divide-y divide-[#1f1f1f]">
                {withdrawals.map((w) => {
                  const statusColors: Record<string, string> = {
                    pending:  "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    approved: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                    paid:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
                  }
                  return (
                    <div key={w.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">{w.entity_label} · {w.full_name}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Счёт: {w.account}
                          {w.created_at && ` · ${new Date(w.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {w.amount != null && (
                          <span className="text-sm font-semibold text-white">
                            {w.amount.toLocaleString("ru-RU")} ₽
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[w.status] || statusColors.pending}`}>
                          {w.status_label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}