import { useState } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

const PLANS = [
  { months: 1,  price: 990,   perMonth: 990,  discount: null,  label: "1 месяц" },
  { months: 3,  price: 2673,  perMonth: 891,  discount: 10,    label: "3 месяца" },
  { months: 6,  price: 5167,  perMonth: 861,  discount: 13,    label: "6 месяцев" },
  { months: 12, price: 10000, perMonth: 833,  discount: 16,    label: "12 месяцев" },
]

interface Props {
  userId: string
  balance: number
  onClose: () => void
  onSuccess: (newBalance: number, subscriptionEndAt: string) => void
}

export default function PayWithBalanceModal({ userId, balance, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState(PLANS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handlePay() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${AUTH_URL}?action=pay-with-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, months: selected.months }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ошибка списания баллов")
        return
      }
      onSuccess(data.new_balance, data.subscription_end_at)
    } catch {
      setError("Ошибка сети, попробуйте снова")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Icon name="Zap" className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Оплатить тариф баллами</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Баланс */}
          <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Ваш баланс</span>
            <span className="text-white font-bold text-lg">{balance.toLocaleString("ru-RU")} ₽</span>
          </div>

          {/* Выбор периода */}
          <div className="grid grid-cols-2 gap-2">
            {PLANS.map(plan => {
              const canAfford = balance >= plan.price
              return (
                <button
                  key={plan.months}
                  onClick={() => canAfford && setSelected(plan)}
                  disabled={!canAfford}
                  className={`relative rounded-xl border p-3 text-left transition-colors ${
                    !canAfford
                      ? "border-[#1f1f1f] bg-[#111] opacity-40 cursor-not-allowed"
                      : selected.months === plan.months
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                  }`}
                >
                  {plan.discount && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 rounded-full px-1.5 py-0.5">
                      −{plan.discount}%
                    </span>
                  )}
                  <p className="text-white font-semibold text-sm">{plan.label}</p>
                  <p className="text-white font-bold text-base mt-0.5">{plan.price.toLocaleString("ru-RU")} ₽</p>
                  <p className="text-gray-500 text-xs mt-0.5">{plan.perMonth} ₽/мес</p>
                </button>
              )
            })}
          </div>

          {/* Итого */}
          <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">Спишется</span>
              {selected.discount && (
                <p className="text-xs text-emerald-400 mt-0.5">
                  Экономия {(990 * selected.months - selected.price).toLocaleString("ru-RU")} ₽
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">{selected.price.toLocaleString("ru-RU")} ₽</p>
              <p className="text-xs text-gray-500">
                Остаток: {(balance - selected.price).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a] py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handlePay}
              disabled={loading || balance < selected.price}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {loading ? "Оплата…" : `Оплатить ${selected.price.toLocaleString("ru-RU")} ₽`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
