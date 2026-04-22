import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import Icon from "@/components/ui/icon"

interface LeadFormState {
  name: string
  phone: string
  email: string
  message: string
}

interface ObjectLeadFormProps {
  leadForm: LeadFormState
  setLeadForm: (f: LeadFormState) => void
  sending: boolean
  leadSent: boolean
  setLeadSent: (v: boolean) => void
  leadError: string
  onSubmit: (e: React.FormEvent) => void
}

export default function ObjectLeadForm({
  leadForm,
  setLeadForm,
  sending,
  leadSent,
  setLeadSent,
  leadError,
  onSubmit,
}: ObjectLeadFormProps) {
  return (
    <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="MessageSquare" className="h-4 w-4 text-blue-400" />
        <h3 className="font-semibold">Оставить заявку</h3>
      </div>

      {leadSent ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <Icon name="Check" className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="font-medium mb-1">Заявка отправлена</p>
          <p className="text-sm text-gray-400 mb-4">Владелец свяжется с вами в ближайшее время</p>
          <button
            onClick={() => setLeadSent(false)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Отправить ещё одну
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required
            placeholder="Ваше имя *"
            value={leadForm.name}
            onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
            className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            required
            type="tel"
            placeholder="Телефон *"
            value={leadForm.phone}
            onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
            className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="email"
            placeholder="Email (необязательно)"
            value={leadForm.email}
            onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
            className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Сообщение"
            rows={3}
            value={leadForm.message}
            onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
            className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />

          {leadError && (
            <p className="text-xs text-red-400">{leadError}</p>
          )}

          <GlowButton
            type="submit"
            disabled={sending}
            className="w-full rounded-xl py-2 text-sm disabled:opacity-60"
          >
            {sending ? (
              <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Отправка...</>
            ) : (
              <><Icon name="Send" className="h-4 w-4 mr-2" />Отправить заявку</>
            )}
          </GlowButton>
          <p className="text-[11px] text-gray-500 text-center">
            Нажимая «Отправить», вы соглашаетесь на обработку персональных данных
          </p>
        </form>
      )}
    </div>
  )
}