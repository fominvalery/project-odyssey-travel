import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

interface OwnerFields {
  owner_name: string
  owner_phone: string
  owner_fee: string
  owner_comment: string
}

interface Step7Props {
  ownerFields: OwnerFields
  setOwnerFields: (f: OwnerFields) => void
}

export function Step7Owner({ ownerFields, setOwnerFields }: Step7Props) {
  function set(key: keyof OwnerFields, value: string) {
    setOwnerFields({ ...ownerFields, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Блок конфиденциальности */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#111] border border-amber-500/20 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Icon name="Lock" className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-300 mb-1.5">Конфиденциальная информация</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Данные этого раздела <span className="text-white font-medium">видны только вам</span> — они
              не публикуются в маркетплейсе, не передаются третьим лицам и не отображаются
              на странице объекта. Информация хранится исключительно в вашем личном кабинете
              как рабочие заметки брокера.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { icon: "EyeOff", text: "Скрыто от покупателей" },
                { icon: "Globe", text: "Не публикуется" },
                { icon: "ShieldCheck", text: "Только для вас" },
              ].map(item => (
                <span key={item.text} className="flex items-center gap-1.5 text-[11px] text-amber-400/70 bg-amber-500/5 border border-amber-500/15 px-2.5 py-1 rounded-full">
                  <Icon name={item.icon as "Lock"} className="h-3 w-3" />
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Поля */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">ФИО собственника</Label>
            <Input
              placeholder="Иванов Иван Иванович"
              value={ownerFields.owner_name}
              onChange={e => set("owner_name", e.target.value)}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Телефон собственника</Label>
            <Input
              placeholder="+7 900 000 00 00"
              value={ownerFields.owner_phone}
              onChange={e => set("owner_phone", e.target.value)}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-gray-400 mb-1.5 block">Вознаграждение</Label>
          <Input
            placeholder="3% от сделки / 50 000 ₽ фикс / договорная"
            value={ownerFields.owner_fee}
            onChange={e => set("owner_fee", e.target.value)}
            className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
          />
        </div>

        <div>
          <Label className="text-xs text-gray-400 mb-1.5 block">Комментарий / условия</Label>
          <textarea
            placeholder="Собственник готов к торгу. Документы готовы. Срочная продажа..."
            value={ownerFields.owner_comment}
            onChange={e => set("owner_comment", e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40"
          />
        </div>
      </div>

      <p className="text-[11px] text-gray-600 text-center">
        Этот шаг необязателен — вы можете пропустить его и заполнить позже
      </p>
    </div>
  )
}
