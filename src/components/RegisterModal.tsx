import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"

const planLabels: Record<string, { label: string; color: string; price: string }> = {
  green: { label: "Грин", color: "text-green-400 bg-green-500/10 border-green-500/20", price: "Бесплатно" },
  pro: { label: "Про", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", price: "9 900 ₽/мес" },
  proplus: { label: "Про+", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", price: "24 900 ₽/мес" },
  constructor: { label: "Конструктор", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", price: "от 4 900 ₽/мес" },
}

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId?: string
}

export function RegisterModal({ open, onOpenChange, planId = "green" }: RegisterModalProps) {
  const { register } = useAuthContext()
  const navigate = useNavigate()
  const [step, setStep] = useState<"form" | "success">("form")
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "" })

  const plan = planLabels[planId] ?? planLabels.green

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    register({ ...form, plan: planId })
    setStep("success")
  }

  function handleClose(v: boolean) {
    onOpenChange(v)
    if (!v) setTimeout(() => setStep("form"), 300)
  }

  function goToProfile() {
    handleClose(false)
    navigate("/profile")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#141414] border border-[#262626] text-white max-w-md p-0 overflow-hidden">
        {step === "form" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                  <Icon name="UserPlus" className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Регистрация</DialogTitle>
                  <p className="text-xs text-gray-500">Создайте аккаунт EstatePro</p>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium w-fit mb-2 ${plan.color}`}>
                <Icon name="CheckCircle" className="h-3.5 w-3.5" />
                Тариф: {plan.label} — {plan.price}
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Ваше имя</Label>
                <Input
                  required
                  placeholder="Иван Иванов"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Компания <span className="text-gray-600">(необязательно)</span></Label>
                <Input
                  placeholder="ООО «Ваша Компания»"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Телефон</Label>
                <Input
                  required
                  type="tel"
                  placeholder="+7 (000) 000-00-00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input
                  required
                  type="email"
                  placeholder="ivan@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500"
                />
              </div>

              <Button type="submit" className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white mt-2">
                Зарегистрироваться
              </Button>

              <p className="text-center text-xs text-gray-600">
                Нажимая кнопку, вы соглашаетесь с условиями использования платформы
              </p>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
              <Icon name="CheckCircle" className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Добро пожаловать!</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Аккаунт создан на тарифе <span className="font-semibold text-white">{plan.label}</span>. Перейдите в профиль, чтобы заполнить данные.
            </p>
            <Button
              onClick={goToProfile}
              className="rounded-full bg-violet-600 hover:bg-violet-700 text-white mt-2 px-8"
            >
              Перейти в профиль
            </Button>
            <button
              onClick={() => handleClose(false)}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Позже
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
