import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import { agencyApi } from "@/lib/agencyApi"
import { toast } from "@/hooks/use-toast"

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

type Mode = "choice" | "broker" | "agency"

export default function AddStatusModal({ open, onClose, onCreated }: Props) {
  const { user, updateProfile } = useAuthContext()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("choice")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", inn: "", description: "" })

  const reset = () => {
    setMode("choice")
    setForm({ name: "", inn: "", description: "" })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const upgradeBroker = () => {
    if (!user) return
    updateProfile({ status: "broker" })
    toast({ title: "Готово", description: "Статус брокера/собственника активирован" })
    handleClose()
    onCreated?.()
  }

  const createAgency = async () => {
    if (!user) return
    if (!form.name.trim()) {
      toast({ title: "Укажите название агентства", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const org = await agencyApi.createOrg(user.id, {
        name: form.name.trim(),
        inn: form.inn.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      updateProfile({ status: "agency" })
      localStorage.setItem("k24_active_org", org.id)
      toast({ title: "Агентство создано", description: org.name })
      handleClose()
      onCreated?.()
      navigate(`/agency/${org.id}`)
    } catch (e) {
      toast({
        title: "Не удалось создать",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "choice" && "Добавить статус"}
            {mode === "broker" && "Брокер / Собственник"}
            {mode === "agency" && "Агентство / Компания"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choice" && "Выбери профессиональный профиль в Кабинете 24"}
            {mode === "broker" && "Расширенный личный кабинет для частного специалиста"}
            {mode === "agency" && "Создай организацию с командой и ролями"}
          </DialogDescription>
        </DialogHeader>

        {mode === "choice" && (
          <div className="grid gap-3">
            <button
              onClick={() => setMode("broker")}
              className="text-left p-4 rounded-xl border-2 border-transparent hover:border-primary bg-muted/50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                  <Icon name="UserCheck" size={20} />
                </div>
                <div>
                  <div className="font-semibold mb-1">Брокер / Собственник</div>
                  <div className="text-sm text-muted-foreground">
                    Апгрейд личного кабинета без команды: больше объектов, CRM, аналитика
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("agency")}
              className="text-left p-4 rounded-xl border-2 border-transparent hover:border-primary bg-muted/50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white">
                  <Icon name="Building2" size={20} />
                </div>
                <div>
                  <div className="font-semibold mb-1">Агентство / Компания</div>
                  <div className="text-sm text-muted-foreground">
                    Отдельный кабинет организации, команда, отделы, роли, приглашения
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === "broker" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-green-500" />
                Размещение объектов без ограничений
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-green-500" />
                CRM и воронка продаж
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-green-500" />
                Генерация презентаций
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("choice")} className="flex-1">
                Назад
              </Button>
              <Button onClick={upgradeBroker} className="flex-1">
                Активировать
              </Button>
            </div>
          </div>
        )}

        {mode === "agency" && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Название *</label>
              <Input
                placeholder="ООО Недвижимость+"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ИНН</label>
              <Input
                placeholder="7712345678"
                value={form.inn}
                onChange={(e) => setForm({ ...form, inn: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Описание</label>
              <Textarea
                rows={3}
                placeholder="Кратко об агентстве"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setMode("choice")} className="flex-1">
                Назад
              </Button>
              <Button onClick={createAgency} disabled={loading} className="flex-1">
                {loading ? "Создаём..." : "Создать агентство"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
