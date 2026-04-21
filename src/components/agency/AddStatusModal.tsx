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
import { ClubPayDialog } from "@/components/pricing/ClubPayDialog"

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

type Mode = "choice" | "basic" | "broker" | "agency"

export default function AddStatusModal({ open, onClose, onCreated }: Props) {
  const { user, updateProfile } = useAuthContext()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("choice")
  const [loading, setLoading] = useState(false)
  const [clubPayOpen, setClubPayOpen] = useState(false)
  const [form, setForm] = useState({ name: "", inn: "", description: "" })

  const isBroker = user?.status === "broker" || user?.status === "agency"

  const reset = () => {
    setMode("choice")
    setForm({ name: "", inn: "", description: "" })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const activateBasic = () => {
    if (!user) return
    updateProfile({ status: "basic" })
    toast({ title: "Готово", description: "Базовый статус активирован" })
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
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "choice" && "Добавить статус"}
              {mode === "basic" && "Базовый"}
              {mode === "broker" && "Клуб"}
              {mode === "agency" && "Агентство / Компания"}
            </DialogTitle>
            <DialogDescription>
              {mode === "choice" && "Выбери профессиональный профиль в Кабинете 24"}
              {mode === "basic" && "Базовый профиль участника платформы"}
              {mode === "broker" && "Участник клуба — расширенный личный кабинет"}
              {mode === "agency" && "Создай организацию с командой и ролями"}
            </DialogDescription>
          </DialogHeader>

          {mode === "choice" && (
            <div className="grid gap-3">
              <button
                onClick={() => setMode("basic")}
                className="text-left p-4 rounded-xl border-2 border-transparent hover:border-primary bg-muted/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                    <Icon name="Star" size={20} />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Базовый</div>
                    <div className="text-sm text-muted-foreground">
                      3 бесплатных объявления, рефералы, профиль, маркетплейс
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("broker")}
                className="text-left p-4 rounded-xl border-2 border-blue-500/40 hover:border-blue-500 bg-blue-500/5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                    <Icon name="Zap" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Клуб</span>
                      {isBroker && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">Активен</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Апгрейд личного кабинета: CRM, аналитика, безлимит объектов
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("agency")}
                className="text-left p-4 rounded-xl border-2 border-transparent bg-muted/30 opacity-70 cursor-default transition-all w-full"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white">
                    <Icon name="Building2" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Агентство / Компания</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Скоро</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Отдельный кабинет организации, команда, отделы, роли, приглашения
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === "basic" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-500" />
                  3 бесплатных объявления в месяц
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-500" />
                  Реферальная программа и приглашения
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-500" />
                  Личный профиль участника платформы
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-500" />
                  Просмотр объектов на Маркетплейсе
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-500" />
                  Доступ к поддержке и обновлениям
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choice")} className="flex-1">
                  Назад
                </Button>
                <Button onClick={activateBasic} className="flex-1">
                  Активировать
                </Button>
              </div>
            </div>
          )}

          {mode === "broker" && (
            <div className="space-y-4">
              {isBroker ? (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Icon name="CheckCircle" size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-300">Тариф Клуб активен</p>
                    <p className="text-xs text-blue-400/70 mt-0.5">Все возможности уже доступны в вашем кабинете</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-white">Тариф Клуб</span>
                      <span className="text-lg font-bold text-blue-400">990 ₽/мес</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Icon name="Check" size={15} className="text-blue-400 shrink-0" />
                      Размещение объектов без ограничений
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Icon name="Check" size={15} className="text-blue-400 shrink-0" />
                      CRM и воронка продаж
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Icon name="Check" size={15} className="text-blue-400 shrink-0" />
                      Аналитика и дашборд
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Icon name="Check" size={15} className="text-blue-400 shrink-0" />
                      Чат Клуба и партнёрские сделки
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setMode("choice")} className="flex-1">
                      Назад
                    </Button>
                    <Button
                      onClick={() => { handleClose(); setClubPayOpen(true) }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Icon name="Zap" size={15} className="mr-1.5" />
                      Активировать — 990 ₽
                    </Button>
                  </div>
                </>
              )}
              {isBroker && (
                <Button variant="outline" onClick={() => setMode("choice")} className="w-full">
                  Закрыть
                </Button>
              )}
            </div>
          )}

          {mode === "agency" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Название агентства</label>
                  <Input
                    placeholder="ООО «Ваше Агентство»"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">ИНН (необязательно)</label>
                  <Input
                    placeholder="7700000000"
                    value={form.inn}
                    onChange={(e) => setForm({ ...form, inn: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">О компании</label>
                  <Textarea
                    placeholder="Кратко о деятельности..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choice")} className="flex-1">
                  Назад
                </Button>
                <Button onClick={createAgency} disabled={loading} className="flex-1">
                  {loading ? "Создание..." : "Создать агентство"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ClubPayDialog open={clubPayOpen} onClose={() => setClubPayOpen(false)} activateOnSuccess />
    </>
  )
}
