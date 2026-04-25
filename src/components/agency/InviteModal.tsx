import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { agencyApi, Department, RoleCode, ROLE_TITLES } from "@/lib/agencyApi"
import { useAuthContext } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

const BASE_ROLE_OPTIONS: RoleCode[] = [
  "rop",
  "broker",
  "manager",
  "marketer",
  "accountant",
  "lawyer",
  "mortgage_broker",
]

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  departments?: Department[]
  onInvited?: () => void
  canInviteDirector?: boolean
  /** Если задан — РОП приглашает только в свой отдел */
  ropDeptId?: string | null
  isRop?: boolean
}

const NONE_DEPT = "__none__"

export default function InviteModal({
  open,
  onClose,
  orgId,
  departments = [],
  onInvited,
  canInviteDirector = false,
  ropDeptId,
  isRop = false,
}: Props) {
  // РОП не может приглашать РОПов и выше
  const roleOptions: RoleCode[] = canInviteDirector
    ? ["director", ...BASE_ROLE_OPTIONS]
    : isRop
      ? BASE_ROLE_OPTIONS.filter(r => r !== "rop")
      : BASE_ROLE_OPTIONS
  const { user } = useAuthContext()
  const [form, setForm] = useState<{
    full_name: string
    email: string
    phone: string
    role_code: RoleCode
    department_id: string
  }>({
    full_name: "",
    email: "",
    phone: "",
    role_code: "broker",
    department_id: ropDeptId ?? NONE_DEPT,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url: string; autoJoined: boolean } | null>(null)

  const submit = async () => {
    if (!user) return
    if (!form.full_name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast({ title: "Проверь ФИО и email", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await agencyApi.createInvite(user.id, orgId, {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        role_code: form.role_code,
        department_id:
          form.department_id === NONE_DEPT ? undefined : form.department_id,
      })
      const fullUrl = `${window.location.origin}${res.invite_url}`
      setResult({ url: fullUrl, autoJoined: res.auto_joined })
      onInvited?.()
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось пригласить",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({
      full_name: "",
      email: "",
      phone: "",
      role_code: "broker",
      department_id: NONE_DEPT,
    })
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Пригласить сотрудника</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">ФИО *</label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Иванов Иван"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ivanov@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Телефон</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 999 000-00-00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Роль</label>
              <Select
                value={form.role_code}
                onValueChange={(v) => setForm({ ...form, role_code: v as RoleCode })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_TITLES[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {departments.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">Отдел</label>
                {isRop && ropDeptId ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
                    <Icon name="Network" size={14} className="text-emerald-400" />
                    {departments.find(d => d.id === ropDeptId)?.name ?? "Ваш отдел"}
                    <span className="text-xs text-slate-500 ml-1">(фиксировано)</span>
                  </div>
                ) : (
                  <Select
                    value={form.department_id}
                    onValueChange={(v) => setForm({ ...form, department_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_DEPT}>Без отдела</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <Button onClick={submit} disabled={loading} className="w-full mt-2">
              {loading ? "Отправка..." : "Создать приглашение"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {result.autoJoined ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                <div className="flex items-center gap-2 font-medium text-green-600">
                  <Icon name="CheckCircle2" size={18} />
                  Сотрудник уже был на платформе — добавлен в агентство автоматически
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Отправь эту ссылку сотруднику. Он попадёт в агентство после регистрации
                  или входа:
                </div>
                <div className="p-3 bg-muted rounded-lg text-xs break-all font-mono">
                  {result.url}
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(result.url)
                    toast({ title: "Скопировано" })
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Icon name="Copy" size={16} className="mr-2" />
                  Скопировать ссылку
                </Button>
              </>
            )}
            <Button onClick={handleClose} className="w-full">
              Готово
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}