import Icon from "@/components/ui/icon"
import { JointDealForm as JointDealFormType, DEFAULT_FORM } from "./messagesTypes"

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            value === opt
              ? "bg-violet-600 border-violet-600 text-white"
              : "bg-[#111] border-[#262626] text-gray-400 hover:border-[#333] hover:text-gray-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

interface Props {
  form: JointDealFormType
  sending: boolean
  onChangeForm: (f: JointDealFormType) => void
  onSubmit: () => void
  onCancel: () => void
  onUpdateCommission: (field: "initiator" | "partner", val: number) => void
}

export default function JointDealForm({ form, sending, onChangeForm, onSubmit, onCancel, onUpdateCommission }: Props) {
  return (
    <div className="border-b border-[#1f1f1f] bg-[#0d0d0d] px-5 py-4 shrink-0 overflow-y-auto max-h-[60vh]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Handshake" className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Предложение СЗ</h3>
        </div>
        <button
          onClick={() => { onCancel(); onChangeForm(DEFAULT_FORM) }}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Icon name="X" className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">Тип совместной работы</label>
          <RadioGroup
            options={["Совместная работа", "Передача контакта"] as const}
            value={form.deal_type}
            onChange={(v) => onChangeForm({ ...form, deal_type: v })}
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">Тип сделки</label>
          <RadioGroup
            options={["Продажа", "Аренда", "Подбор"] as const}
            value={form.transaction_type}
            onChange={(v) => onChangeForm({ ...form, transaction_type: v })}
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">Объект / описание</label>
          <textarea
            value={form.object_description}
            onChange={e => onChangeForm({ ...form, object_description: e.target.value })}
            placeholder="Адрес, площадь, тип объекта..."
            rows={2}
            className="w-full bg-[#111] border border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">Моя роль</label>
          <RadioGroup
            options={["Со стороны объекта", "Со стороны клиента"] as const}
            value={form.initiator_role}
            onChange={(v) => onChangeForm({ ...form, initiator_role: v })}
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">Комиссия (сумма = 100%)</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-600 mb-1">Инициатор</p>
              <div className="relative">
                <input
                  type="number" min={0} max={100}
                  value={form.commission_initiator}
                  onChange={e => onUpdateCommission("initiator", Number(e.target.value))}
                  className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
              </div>
            </div>
            <div className="text-gray-600 text-sm mt-5">/</div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-600 mb-1">Партнёр</p>
              <div className="relative">
                <input
                  type="number" min={0} max={100}
                  value={form.commission_partner}
                  onChange={e => onUpdateCommission("partner", Number(e.target.value))}
                  className="w-full bg-[#111] border border-[#262626] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">База: от суммы комиссии сделки</p>
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-2 block">Комментарий</label>
          <textarea
            value={form.comment}
            onChange={e => onChangeForm({ ...form, comment: e.target.value })}
            placeholder="Условия, детали, пожелания..."
            rows={2}
            className="w-full bg-[#111] border border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onSubmit}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {sending ? <Icon name="Loader2" className="h-4 w-4 animate-spin" /> : <Icon name="Send" className="h-4 w-4" />}
            {sending ? "Отправка..." : "Отправить предложение"}
          </button>
          <button
            onClick={() => { onCancel(); onChangeForm(DEFAULT_FORM) }}
            className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-white text-sm transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
