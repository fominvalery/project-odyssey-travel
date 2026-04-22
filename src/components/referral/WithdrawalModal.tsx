import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { toast } from "@/hooks/use-toast"
import func2url from "../../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

type EntityType = "ip" | "selfemployed" | "ooo"

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  earnedTotal: number
}

const ENTITY_OPTIONS: { value: EntityType; label: string; icon: string; hint: string }[] = [
  { value: "selfemployed", label: "Самозанятый", icon: "User",      hint: "Физлицо, зарегистрированное как самозанятый" },
  { value: "ip",           label: "ИП",          icon: "Briefcase", hint: "Индивидуальный предприниматель" },
  { value: "ooo",          label: "ООО",          icon: "Building2", hint: "Общество с ограниченной ответственностью" },
]

export default function WithdrawalModal({ open, onClose, userId, earnedTotal }: Props) {
  const [entityType, setEntityType] = useState<EntityType>("selfemployed")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    full_name: "",
    inn: "",
    bank_name: "",
    bik: "",
    account: "",
    amount: earnedTotal > 0 ? String(earnedTotal) : "",
    comment: "",
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.inn.trim() || !form.account.trim()) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${AUTH_URL}?action=withdrawal-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, entity_type: entityType, ...form }),
      })
      const raw = await res.text()
      const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
      if (!res.ok) throw new Error(data?.error || "Ошибка отправки")
      setSuccess(true)
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Попробуйте позже",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setForm({ full_name: "", inn: "", bank_name: "", bik: "", account: "", amount: earnedTotal > 0 ? String(earnedTotal) : "", comment: "" })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg bg-[#111] border-[#1f1f1f] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="ArrowDownToLine" size={18} className="text-orange-400" />
            Вывод средств
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Заявка отправлена!</h3>
            <p className="text-sm text-gray-400 mb-6">
              Мы получили ваши реквизиты и обработаем заявку в течение 1–3 рабочих дней.
              Подтверждение отправлено на вашу почту.
            </p>
            <Button onClick={handleClose} className="w-full">Закрыть</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Тип организации */}
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Тип организации</Label>
              <div className="grid grid-cols-3 gap-2">
                {ENTITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEntityType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      entityType === opt.value
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-[#2a2a2a] bg-[#0d0d0d] text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <Icon name={opt.icon as "User"} size={16} />
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5">
                {ENTITY_OPTIONS.find(o => o.value === entityType)?.hint}
              </p>
            </div>

            {/* Реквизиты */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">
                  {entityType === "ooo" ? "Название организации" : "ФИО"} <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.full_name}
                  onChange={set("full_name")}
                  placeholder={entityType === "ooo" ? 'ООО "Ромашка"' : "Иванов Иван Иванович"}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">
                  ИНН <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.inn}
                  onChange={set("inn")}
                  placeholder={entityType === "ooo" ? "10 цифр" : "12 цифр"}
                  maxLength={12}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">Банк</Label>
                  <Input
                    value={form.bank_name}
                    onChange={set("bank_name")}
                    placeholder="Сбербанк"
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">БИК</Label>
                  <Input
                    value={form.bik}
                    onChange={set("bik")}
                    placeholder="9 цифр"
                    maxLength={9}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">
                  Расчётный счёт <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.account}
                  onChange={set("account")}
                  placeholder="20 цифр"
                  maxLength={20}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">Сумма к выводу (₽)</Label>
                <Input
                  value={form.amount}
                  onChange={set("amount")}
                  placeholder="Введите сумму"
                  type="number"
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 border-[#2a2a2a]">
                Отмена
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Отправка…</>
                ) : (
                  "Отправить заявку"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
