import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

interface RegulationsFields {
  commission: string
  commission_notes: string
  ad_rules: string
  work_rules: string
  manager_name: string
  manager_phone: string
  manager_email: string
}

interface Step7RegulationsProps {
  regulationsFields: RegulationsFields
  setRegulationsFields: (f: RegulationsFields) => void
}

export function Step7Regulations({ regulationsFields, setRegulationsFields }: Step7RegulationsProps) {
  function set(key: keyof RegulationsFields, value: string) {
    setRegulationsFields({ ...regulationsFields, [key]: value })
  }

  return (
    <div className="space-y-6">

      {/* Менеджер проекта */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#111] border border-violet-500/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Icon name="UserCheck" className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-violet-300 mb-0.5">Менеджер проекта</p>
            <p className="text-xs text-gray-400">Контакт для связи партнёров-брокеров. Будет показан при размещении в Базе/Проектах.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-400 mb-1.5 block">ФИО менеджера</Label>
            <Input
              placeholder="Иванов Иван Иванович"
              value={regulationsFields.manager_name}
              onChange={e => set("manager_name", e.target.value)}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Телефон</Label>
            <Input
              placeholder="+7 (999) 000-00-00"
              value={regulationsFields.manager_phone}
              onChange={e => set("manager_phone", e.target.value)}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Email</Label>
            <Input
              placeholder="manager@company.ru"
              value={regulationsFields.manager_email}
              onChange={e => set("manager_email", e.target.value)}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Комиссия */}
      <div className="rounded-2xl bg-[#0d0d0d] border border-amber-500/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="Percent" className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-300 mb-0.5">Комиссионное вознаграждение</p>
            <p className="text-xs text-gray-400">Условия для брокеров-партнёров, которые приводят покупателей.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Размер комиссии</Label>
            <Input
              placeholder="3% от суммы сделки"
              value={regulationsFields.commission}
              onChange={e => set("commission", e.target.value)}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Условия выплаты</Label>
            <textarea
              rows={2}
              placeholder="Например: выплата по факту подписания договора купли-продажи, без порога"
              value={regulationsFields.commission_notes}
              onChange={e => set("commission_notes", e.target.value)}
              className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Регламент рекламы */}
      <div className="rounded-2xl bg-[#0d0d0d] border border-blue-500/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Icon name="Megaphone" className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-blue-300 mb-0.5">Регламент рекламы</p>
            <p className="text-xs text-gray-400">Что разрешено, а что запрещено при продвижении объекта брокерами.</p>
          </div>
        </div>
        <textarea
          rows={4}
          placeholder={"Например:\n— Разрешено размещение в соцсетях\n— Запрещено раскрывать адрес без согласования\n— Обязательно согласование рекламных материалов"}
          value={regulationsFields.ad_rules}
          onChange={e => set("ad_rules", e.target.value)}
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
        />
      </div>

      {/* Регламент работы */}
      <div className="rounded-2xl bg-[#0d0d0d] border border-emerald-500/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Icon name="ClipboardList" className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-emerald-300 mb-0.5">Регламент работы</p>
            <p className="text-xs text-gray-400">Порядок фиксации клиентов, показов, документооборота.</p>
          </div>
        </div>
        <textarea
          rows={4}
          placeholder={"Например:\n— Фиксация клиента через систему до показа\n— Показы строго по записи через менеджера\n— Все запросы направлять на manager@company.ru"}
          value={regulationsFields.work_rules}
          onChange={e => set("work_rules", e.target.value)}
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
        />
      </div>

    </div>
  )
}
