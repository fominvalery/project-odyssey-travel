import { useState } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { AdminFixation, STATUSES, daysLeft } from "./fixations-types"

export default function FixationModal({
  fix,
  onClose,
  onStatusChange,
  updating,
}: {
  fix: AdminFixation
  onClose: () => void
  onStatusChange: (id: string, status: string, notes?: string) => void
  updating: string | null
}) {
  const [notes, setNotes] = useState(fix.notes || "")
  const [saved, setSaved] = useState(false)
  const dl = daysLeft(fix.expires_at)

  const handleSaveNotes = async () => {
    onStatusChange(fix.id, fix.status, notes)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#1f1f1f]">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base leading-tight truncate">
              {fix.offer_title || "Объект"}
            </h3>
            {fix.city && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Icon name="MapPin" className="h-3 w-3" />
                {fix.city}
                {fix.category && <span className="ml-1 text-gray-600">· {fix.category}</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors shrink-0 mt-0.5">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Клиент */}
          <section>
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Клиент</div>
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3 space-y-1.5">
              <div className="text-white font-semibold">{fix.client_name || "—"}</div>
              {fix.client_phone && (
                <a href={`tel:${fix.client_phone}`} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  <Icon name="Phone" className="h-3.5 w-3.5" />
                  {fix.client_phone}
                </a>
              )}
              {fix.client_email && (
                <a href={`mailto:${fix.client_email}`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-300 transition-colors">
                  <Icon name="Mail" className="h-3.5 w-3.5" />
                  {fix.client_email}
                </a>
              )}
            </div>
          </section>

          {/* Брокер */}
          {fix.broker_name && (
            <section>
              <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Брокер</div>
              <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-violet-300 text-xs font-bold">{fix.broker_name.slice(0, 1)}</span>
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{fix.broker_name}</div>
                  {fix.dept_name && <div className="text-xs text-gray-500">{fix.dept_name}</div>}
                  {fix.broker_email && <div className="text-xs text-gray-600">{fix.broker_email}</div>}
                </div>
              </div>
            </section>
          )}

          {/* Статус воронки */}
          <section>
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Статус воронки</div>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.id}
                  disabled={updating === fix.id}
                  onClick={() => onStatusChange(fix.id, s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    fix.status === s.id
                      ? `${s.bg} ${s.border} ${s.color}`
                      : "bg-[#0d0d0d] border-[#1f1f1f] text-gray-500 hover:border-[#2a2a2a] hover:text-gray-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${fix.status === s.id ? s.dot : "bg-gray-700"}`} />
                  <span className="truncate">{s.label}</span>
                  {fix.status === s.id && <Icon name="Check" className="h-3 w-3 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </section>

          {/* Даты */}
          <section className="flex gap-3">
            <div className="flex-1 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3">
              <div className="text-xs text-gray-600 mb-1">Создана</div>
              <div className="text-sm text-gray-300">{new Date(fix.created_at).toLocaleDateString("ru-RU")}</div>
            </div>
            <div className={`flex-1 border rounded-xl p-3 ${dl.warn ? "bg-red-500/5 border-red-500/20" : "bg-[#0d0d0d] border-[#1f1f1f]"}`}>
              <div className="text-xs text-gray-600 mb-1">Срок фиксации</div>
              <div className={`text-sm ${dl.warn ? "text-red-400" : "text-gray-300"}`}>
                {fix.expires_at
                  ? `${new Date(fix.expires_at).toLocaleDateString("ru-RU")} (${dl.text})`
                  : "—"}
              </div>
            </div>
          </section>

          {/* Комментарий */}
          <section>
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Комментарий</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Заметки по сделке..."
              rows={3}
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-[#3a3a3a] transition-colors"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={saved || notes === (fix.notes || "")}
              size="sm"
              className="mt-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white border-0 text-xs"
            >
              {saved
                ? <><Icon name="Check" className="h-3 w-3 mr-1 text-emerald-400" />Сохранено</>
                : <><Icon name="Save" className="h-3 w-3 mr-1" />Сохранить</>
              }
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
