import { useState } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useYookassa } from "@/components/extensions/yookassa/useYookassa"
import func2url from "../../../backend/func2url.json"

const YOOKASSA_URL = (func2url as Record<string, string>)["yookassa-yookassa"]
const FREE_LIMIT = 3
const PRICE_PER_AD = 199

function getReturnUrl(): string {
  const origin = window.location.origin
  const base = origin.startsWith("http://") ? origin.replace("http://", "https://") : origin
  return `${base}/dashboard`
}

const DISCOUNT_TIERS = [
  { from: 1,  to: 9,   discount: 0 },
  { from: 10, to: 24,  discount: 10 },
  { from: 25, to: 49,  discount: 20 },
  { from: 50, to: 100, discount: 30 },
]

function getDiscount(qty: number): number {
  const tier = DISCOUNT_TIERS.find((t) => qty >= t.from && qty <= t.to)
  return tier ? tier.discount : 30
}

function calcPrice(qty: number): number {
  return Math.round(qty * PRICE_PER_AD * (1 - getDiscount(qty) / 100))
}

interface Props {
  listingsUsed: number
  listingsExtra: number
  userEmail: string
  userName?: string
  userId?: string
  onAddListingClick: () => void
}

export default function ListingsBanner({ listingsUsed, listingsExtra, userEmail, userName, userId, onAddListingClick }: Props) {
  const [buyOpen, setBuyOpen] = useState(false)
  const [qty, setQty] = useState(5)
  const [payError, setPayError] = useState("")

  const { createPayment, isLoading } = useYookassa({
    apiUrl: YOOKASSA_URL,
    onError: (e) => setPayError(e.message),
  })

  async function handlePay() {
    setPayError("")
    const discount = getDiscount(qty)
    const totalPrice = calcPrice(qty)
    const response = await createPayment({
      amount: totalPrice,
      userEmail,
      userName,
      userId,
      orderType: "listings",
      description: `Объявления ×${qty} — тариф Базовый`,
      returnUrl: getReturnUrl(),
      cartItems: [{ id: "ads", name: `Объявления ×${qty}`, quantity: qty, price: Math.round(PRICE_PER_AD * (1 - discount / 100)) }],
    })
    if (response?.payment_url) {
      window.location.href = response.payment_url
    }
  }

  const total = listingsUsed
  const freeLeft = Math.max(0, FREE_LIMIT - Math.min(total, FREE_LIMIT))
  const extraLeft = listingsExtra
  const totalLeft = freeLeft + extraLeft
  const isLimitReached = totalLeft === 0
  const usedPercent = Math.min(100, (total / (FREE_LIMIT + extraLeft || FREE_LIMIT)) * 100)

  const totalPrice = calcPrice(qty)
  const discount = getDiscount(qty)

  return (
    <>
      <div className={`rounded-2xl border p-4 mb-5 ${
        isLimitReached
          ? "bg-red-500/5 border-red-500/20"
          : freeLeft <= 1
          ? "bg-amber-500/5 border-amber-500/20"
          : "bg-[#111] border-[#1f1f1f]"
      }`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isLimitReached ? "bg-red-500/15" : "bg-blue-500/10"
            }`}>
              <Icon name="FileText" className={`h-5 w-5 ${isLimitReached ? "text-red-400" : "text-blue-400"}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {isLimitReached
                  ? "Объявления исчерпаны"
                  : `Осталось объявлений: ${totalLeft}`}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Бесплатных: {freeLeft} / {FREE_LIMIT}
                {extraLeft > 0 && ` · Докуплено: ${extraLeft}`}
                {" · "}Обновляется каждый месяц
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLimitReached ? (
              <Button
                onClick={() => setBuyOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
              >
                <Icon name="Plus" className="h-3.5 w-3.5 mr-1.5" />
                Докупить объявления
              </Button>
            ) : (
              <>
                <Button
                  onClick={onAddListingClick}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
                >
                  <Icon name="Plus" className="h-3.5 w-3.5 mr-1.5" />
                  Добавить объект
                </Button>
                <Button
                  onClick={() => setBuyOpen(true)}
                  size="sm"
                  variant="outline"
                  className="border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white text-xs rounded-lg"
                >
                  Докупить
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#1f1f1f] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isLimitReached ? "bg-red-500" : freeLeft <= 1 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Диалог докупки */}
      <Dialog open={buyOpen} onOpenChange={(v) => !v && setBuyOpen(false)}>
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

            {/* Скидки */}
            <div className="grid grid-cols-2 gap-2">
              {DISCOUNT_TIERS.map((tier) => {
                const active = qty >= tier.from && qty <= tier.to
                return (
                  <div
                    key={tier.from}
                    className={`rounded-lg p-2.5 border text-xs transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-500/10 text-blue-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500"
                    }`}
                  >
                    <div className="font-semibold">{tier.from}–{tier.to} объявл.</div>
                    <div>{tier.discount > 0 ? `скидка ${tier.discount}%` : "от 199 ₽/шт"}</div>
                  </div>
                )
              })}
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
                <span className="text-xl font-bold text-white">{totalPrice.toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>

            {payError && <p className="text-xs text-red-400">{payError}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setBuyOpen(false)}
                className="flex-1 border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                Отмена
              </Button>
              <Button
                onClick={handlePay}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Загрузка..." : `Оплатить ${totalPrice.toLocaleString("ru-RU")} ₽`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}