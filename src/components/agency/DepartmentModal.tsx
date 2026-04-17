import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { agencyApi, Department, Employee } from "@/lib/agencyApi"
import { useAuthContext } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  employees: Employee[]
  department?: Department | null
  onSaved?: () => void
}

const NONE = "__none__"

export default function DepartmentModal({
  open,
  onClose,
  orgId,
  employees,
  department,
  onSaved,
}: Props) {
  const { user } = useAuthContext()
  const [name, setName] = useState("")
  const [headId, setHeadId] = useState<string>(NONE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(department?.name ?? "")
      setHeadId(department?.head_id ?? NONE)
    }
  }, [open, department])

  const submit = async () => {
    if (!user) return
    if (!name.trim()) {
      toast({ title: "Укажите название отдела", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const head = headId === NONE ? null : headId
      if (department) {
        await agencyApi.updateDepartment(user.id, orgId, {
          department_id: department.id,
          name: name.trim(),
          head_id: head,
        })
        toast({ title: "Отдел обновлён" })
      } else {
        await agencyApi.createDepartment(user.id, orgId, {
          name: name.trim(),
          head_id: head,
        })
        toast({ title: "Отдел создан" })
      }
      onSaved?.()
      onClose()
    } catch (e) {
      toast({
        title: "Не удалось сохранить",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? "Редактировать отдел" : "Новый отдел"}
          </DialogTitle>
          <DialogDescription>
            Отдел группирует сотрудников под руководством РОПа
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Название *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Отдел продаж"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Руководитель отдела (РОП)
            </label>
            <Select value={headId} onValueChange={setHeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Выбрать из сотрудников" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Без руководителя</SelectItem>
                {employees
                  .filter((e) => e.role_code !== "director")
                  .map((e) => (
                    <SelectItem key={e.user_id} value={e.user_id}>
                      {e.full_name} · {e.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="text-[11px] text-muted-foreground mt-1">
              Выбранному сотруднику будет назначена роль «Руководитель отдела продаж»
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={submit} disabled={loading} className="flex-1">
            {loading ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
