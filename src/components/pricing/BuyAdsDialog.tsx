import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useYookassa } from "@/components/extensions/yookassa/useYookassa"
import {
  YOOKASSA_URL,
  PRICE_PER_AD,
  DISCOUNT_TIERS,
  getDiscount,
  calcPrice,
  getReturnUrl,
} from "./pricingPlansData"

interface BuyAdsDialogProps {
  open: boolean
  onClose: () => void
  userEmail?: string
  userName?: string
}

export function BuyAdsDialog({ open, onClose, userEmail = "", userName = "" }: BuyAdsDialogProps) {
  const [qty, setQty] = useState(5)
  const [email, setEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const total = calcPrice(qty)
  const discount = getDiscount(qty)
  const currentTier = DISCOUNT_TIERS.find((t) => qty >= t.from && qty <= t.to) ?? DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]
  const effectiveEmail = userEmail || email

  const { createPayment, isLoading } = useYookassa({
    apiUrl: YOOKASSA_URL,
    onError: (e) => setErrorMsg(e.message),
  })

  async function handlePay() {
    setErrorMsg("")
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setErrorMsg("Введите корректный email")
      return
    }
    const response = await createPayment({
      amount: total,
      userEmail: effectiveEmail,
      userName,
      description: `Объявления ×${qty} — тариф Базовый`,
      returnUrl: getReturnUrl(),
      cartItems: [{ id: "ads", name: `Объявления ×${qty}`, quantity: qty, price: Math.round(PRICE_PER_AD * (1 - discount / 100)) }],
      orderType: "listings",
    })
    if (response?.payment_url) {
      window.location.href = response.payment_url
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-[#111] border-[#262626] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <Icon name="ShoppingCart" className="h-4 w-4 text-blue-400" />
            </div>
            Докупить объявления
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Слайдер количества */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Количество объявлений</span>
              <span className="text-lg font-bold text-white">{qty} шт.</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#2a2a2a] accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1</span>
              <span>100</span>
            </div>
          </div>

          {/* Ступенчатые скидки */}
          <div className="grid grid-cols-2 gap-2">
            {DISCOUNT_TIERS.map((tier) => (
              <div
                key={tier.from}
                className={`rounded-lg p-2.5 border text-xs transition-colors ${
                  currentTier.from === tier.from
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500"
                }`}
              >
                <div className="font-semibold">{tier.label}</div>
                <div>{tier.discount > 0 ? `скидка ${tier.discount}%` : "базовая цена"}</div>
              </div>
            ))}
          </div>

          {/* Итог */}
          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Цена за объявление</span>
              <span className="text-sm text-white">
                {Math.round(PRICE_PER_AD * (1 - discount / 100))} ₽
                {discount > 0 && (
                  <span className="ml-1.5 text-xs text-gray-500 line-through">{PRICE_PER_AD} ₽</span>
                )}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Скидка</span>
                <span className="text-sm text-green-400">−{discount}%</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a] mt-2">
              <span className="font-semibold text-white">Итого</span>
              <span className="text-xl font-bold text-white">{total.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email для чека</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={userEmail || email}
              readOnly={!!userEmail}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              Отмена
            </Button>
            <Button
              onClick={handlePay}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Загрузка..." : `Оплатить ${total.toLocaleString("ru-RU")} ₽`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
