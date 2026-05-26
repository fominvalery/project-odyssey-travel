import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Icon from "@/components/ui/icon"

// ── Диалог фиксации клиента ───────────────────────────────────────────────────

interface FixationDialogProps {
  open: boolean
  offerTitle: string
  offerCity?: string
  fixSuccess: boolean
  fixLoading: boolean
  clientName: string
  clientPhone: string
  clientEmail: string
  fixNotes: string
  onOpenChange: (v: boolean) => void
  onClientName: (v: string) => void
  onClientPhone: (v: string) => void
  onClientEmail: (v: string) => void
  onFixNotes: (v: string) => void
  onSubmit: () => void
  onNavigateFixations: () => void
}

export function FixationDialog({
  open,
  offerTitle,
  offerCity,
  fixSuccess,
  fixLoading,
  clientName,
  clientPhone,
  clientEmail,
  fixNotes,
  onOpenChange,
  onClientName,
  onClientPhone,
  onClientEmail,
  onFixNotes,
  onSubmit,
  onNavigateFixations,
}: FixationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Зафиксировать клиента</DialogTitle>
        </DialogHeader>
        {fixSuccess ? (
          <div className="py-8 text-center">
            <Icon name="CheckCircle2" className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Фиксация отправлена!</p>
            <p className="text-gray-400 text-sm mt-1">Заявка передана в CRM. Ожидайте подтверждения от менеджера.</p>
            <Button
              className="mt-4 w-full bg-violet-600 hover:bg-violet-700"
              onClick={onNavigateFixations}
            >
              Мои фиксации
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-xs text-gray-400">
              <span className="font-medium text-white">{offerTitle}</span>
              {offerCity && ` · ${offerCity}`}
            </div>
            <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-xs text-violet-300">
              После фиксации клиент будет зарегистрирован в CRM на 30 дней. Менеджер проекта получит уведомление.
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ФИО клиента *</label>
              <Input
                placeholder="Иванов Иван Иванович"
                value={clientName}
                onChange={e => onClientName(e.target.value)}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Телефон</label>
              <Input
                placeholder="+7 900 000 00 00"
                value={clientPhone}
                onChange={e => onClientPhone(e.target.value)}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <Input
                placeholder="client@mail.ru"
                value={clientEmail}
                onChange={e => onClientEmail(e.target.value)}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Комментарий</label>
              <Textarea
                placeholder="Источник клиента, пожелания, бюджет..."
                value={fixNotes}
                onChange={e => onFixNotes(e.target.value)}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
                rows={3}
              />
            </div>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              disabled={!clientName.trim() || fixLoading}
              onClick={onSubmit}
            >
              {fixLoading ? (
                <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Отправка...</>
              ) : (
                <><Icon name="BookmarkPlus" className="h-4 w-4 mr-2" />Зафиксировать</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Диалог связи с менеджером ─────────────────────────────────────────────────

interface ContactDialogProps {
  open: boolean
  offerTitle: string
  managerName: string
  managerPhone: string
  managerEmail: string
  onOpenChange: (v: boolean) => void
}

export function ContactDialog({
  open,
  offerTitle,
  managerName,
  managerPhone,
  managerEmail,
  onOpenChange,
}: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Менеджер проекта</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Icon name="UserCheck" className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{managerName || "Менеджер"}</p>
              <p className="text-xs text-gray-500">{offerTitle}</p>
            </div>
          </div>

          <div className="space-y-2">
            {managerPhone && (
              <a
                href={`tel:${managerPhone}`}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
              >
                <Icon name="Phone" className="h-4 w-4 shrink-0" />
                {managerPhone}
              </a>
            )}
            {managerEmail && (
              <a
                href={`mailto:${managerEmail}?subject=Запрос по объекту: ${encodeURIComponent(offerTitle)}`}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-blue-500/40 text-gray-300 hover:text-white font-medium text-sm transition-colors"
              >
                <Icon name="Mail" className="h-4 w-4 shrink-0" />
                {managerEmail}
              </a>
            )}
          </div>

          <p className="text-xs text-gray-600 text-center">
            Свяжитесь с менеджером для получения дополнительной информации, организации показа или согласования условий сотрудничества.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
