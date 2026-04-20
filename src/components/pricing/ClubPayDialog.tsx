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
import { useAuthContext } from "@/context/AuthContext"
import { YOOKASSA_URL, getReturnUrl } from "./pricingPlansData"

interface ClubPayDialogProps {
  open: boolean
  onClose: () => void
}

export function ClubPayDialog({ open, onClose }: ClubPayDialogProps) {
  const { user } = useAuthContext()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const PLAN_PRICE = 990

  const effectiveEmail = user?.email || email
  const effectiveName = user?.name || name

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
      amount: PLAN_PRICE,
      userEmail: effectiveEmail,
      userName: effectiveName,
      description: "Тариф Клуб — 1 месяц",
      returnUrl: getReturnUrl(),
      cartItems: [{ id: "club", name: "Тариф Клуб", quantity: 1, price: PLAN_PRICE }],
      orderType: "subscription",
      userId: user?.id,
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
              <Icon name="Zap" className="h-4 w-4 text-blue-400" />
            </div>
            Тариф КЛУБ — 990 ₽/мес
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {user ? (
            <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-3 flex items-center gap-3">
              <Icon name="User" className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="text-sm">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">Укажите ваши данные — на email придёт чек.</p>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Имя</label>
                <Input
                  placeholder="Иван Иванов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email для чека</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4 flex items-center justify-between">
            <span className="font-semibold text-white">Итого</span>
            <span className="text-xl font-bold text-white">990 ₽</span>
          </div>

          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

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
              {isLoading ? "Загрузка..." : "Оплатить 990 ₽"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
