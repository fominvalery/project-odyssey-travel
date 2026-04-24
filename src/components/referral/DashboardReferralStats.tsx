import { useState } from "react"
import Icon from "@/components/ui/icon"
import { ReferralStats } from "./referralTypes"
import PayWithBalanceModal from "./PayWithBalanceModal"

interface Props {
  stats: ReferralStats | null
  loading: boolean
  onWithdrawClick: () => void
  userId: string
  onBalanceUpdate?: (newBalance: number) => void
}

export default function DashboardReferralStats({ stats, loading, onWithdrawClick, userId, onBalanceUpdate }: Props) {
  const level = stats?.level
  const [showPayModal, setShowPayModal] = useState(false)
  const balance = stats?.balance ?? 0

  return (
    <>
      {/* Статистика — 6 карточек */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {[
          { icon: "MousePointerClick", label: "Переходов",    value: loading ? "…" : String(stats?.clicks_total ?? 0) },
          { icon: "Eye",               label: "За 7 дней",    value: loading ? "…" : String(stats?.clicks_week ?? 0) },
          { icon: "UserPlus",          label: "Регистраций",  value: loading ? "…" : String(stats?.referral_count ?? 0) },
          { icon: "UserCheck",         label: "Активировано", value: loading ? "…" : String(stats?.activated_count ?? 0) },
          { icon: "ShoppingCart",      label: "Оплатили",     value: loading ? "…" : String(stats?.paid_count ?? 0) },
          { icon: "TrendingUp",        label: "Конверсия",    value: loading ? "…" : `${stats?.conversion ?? 0}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-3 md:p-4 flex flex-col items-center justify-center text-center gap-1">
            <Icon name={s.icon as "Eye"} className="h-5 w-5 text-orange-400 mb-1" />
            <p className="text-xl md:text-2xl font-bold leading-none">{s.value}</p>
            <p className="text-[10px] md:text-xs text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Баланс и начисления */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-blue-950/60 to-[#0d0d0d] border border-blue-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="DollarSign" className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Баланс</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {loading ? "…" : `${(stats?.balance ?? stats?.earned_total ?? 0).toLocaleString("ru-RU")} ₽`}
          </p>
          {!loading && (stats?.bonus_total ?? 0) > 0 && (
            <p className="text-xs text-emerald-400/80 mb-0.5">
              +{(stats!.bonus_total).toLocaleString("ru-RU")} ₽ бонусами за активацию рефералов
            </p>
          )}
          {!loading && (stats?.paid_out ?? 0) > 0 && (
            <p className="text-xs text-gray-500 mb-1">
              Заработано: <span className="text-white">{(stats!.earned_total).toLocaleString("ru-RU")} ₽</span>
              {" · "}Выплачено: <span className="text-emerald-400">{(stats!.paid_out).toLocaleString("ru-RU")} ₽</span>
            </p>
          )}
          <p className="text-xs mt-1">
            {level?.withdrawal
              ? <span className="text-emerald-400">✓ Вывод доступен</span>
              : <span className="text-gray-500">Вывод открывается с уровня <span className="text-amber-400">Бизнес</span></span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="Layers" className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Линия 1 ({loading ? "…" : `${level?.commission1 ?? 0}%`})</span>
            </div>
            <p className="text-xl font-bold">
              {loading ? "…" : `${(stats?.earned_line1 ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              с оборота {loading ? "…" : `${(stats?.line1_payments ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
          </div>
          <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="Layers" className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-gray-400">Линия 2 ({loading ? "…" : `${level?.commission2 ?? 0}%`})</span>
            </div>
            <p className="text-xl font-bold">
              {loading ? "…" : `${(stats?.earned_line2 ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              с оборота {loading ? "…" : `${(stats?.line2_payments ?? 0).toLocaleString("ru-RU")} ₽`}
            </p>
          </div>
        </div>
      </div>

      {/* Оплатить тариф + Конвертация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Zap" className="h-5 w-5 text-blue-400" />
            <span className="font-semibold">Оплатить тариф баллами</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Используйте реферальный баланс для оплаты подписки Клуб. Курс 1:1.
          </p>
          <button
            onClick={() => setShowPayModal(true)}
            disabled={balance < 990}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <Icon name="Zap" className="h-4 w-4" />
            {balance < 990 ? `Нужно ещё ${(990 - balance).toLocaleString("ru-RU")} ₽` : "Выбрать период"}
          </button>
        </div>
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ArrowLeftRight" className="h-5 w-5 text-orange-400" />
            <span className="font-semibold">Конвертация в AI-кредиты</span>
          </div>
          <p className="text-sm text-gray-400">
            Конвертируйте денежный баланс в AI-кредиты.
          </p>
        </div>
      </div>

      {/* Вывод средств — во всю ширину */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="ArrowDownToLine" className="h-5 w-5 text-orange-400" />
            <div>
              <span className="font-semibold">Вывод средств</span>
              <p className="text-sm text-gray-400 mt-0.5">Для вывода необходимо заполнить реквизиты ИП, самозанятого или ООО.</p>
            </div>
          </div>
          <button
            onClick={onWithdrawClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-sm font-medium hover:bg-[#222] transition-colors shrink-0 ml-4"
          >
            <Icon name="FileText" className="h-4 w-4 text-gray-400" />
            Заполнить реквизиты
          </button>
        </div>
      </div>

      {showPayModal && (
        <PayWithBalanceModal
          userId={userId}
          balance={balance}
          onClose={() => setShowPayModal(false)}
          onSuccess={(newBalance, subscriptionEndAt) => {
            setShowPayModal(false)
            onBalanceUpdate?.(newBalance)
            window.dispatchEvent(new CustomEvent("k24_subscription_updated", { detail: { subscriptionEndAt } }))
          }}
        />
      )}
    </>
  )
}