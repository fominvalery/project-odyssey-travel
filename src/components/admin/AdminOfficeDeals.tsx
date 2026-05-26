import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface Deal {
  id: string
  title: string
  client: string
  amount: string
  stage: string
  date: string
  notes: string
}

const STAGES = [
  { id: "lead",       label: "Лид",              color: "text-gray-300",    bg: "bg-gray-500/10",    border: "border-gray-500/20",    dot: "bg-gray-400" },
  { id: "negotiation",label: "Переговоры",       color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    dot: "bg-blue-400" },
  { id: "contract",   label: "Договор",          color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  dot: "bg-violet-400" },
  { id: "payment",    label: "Оплата",           color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   dot: "bg-amber-400" },
  { id: "done",       label: "Завершена",        color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  { id: "cancelled",  label: "Отменена",         color: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400" },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]))

const STORAGE_KEY = "office_deals_data"
function loadDeals(): Deal[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}
function saveDeals(deals: Deal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals))
}

function DealModal({
  deal, onClose, onSave,
}: {
  deal: Deal | null
  onClose: () => void
  onSave: (d: Omit<Deal, "id">) => void
}) {
  const [title, setTitle] = useState(deal?.title || "")
  const [client, setClient] = useState(deal?.client || "")
  const [amount, setAmount] = useState(deal?.amount || "")
  const [stage, setStage] = useState(deal?.stage || "lead")
  const [date, setDate] = useState(deal?.date || new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState(deal?.notes || "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <h3 className="font-bold text-white">{deal ? "Редактировать сделку" : "Новая сделка"}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><Icon name="X" className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Название *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Разработка сайта..." className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Клиент</label>
            <Input value={client} onChange={e => setClient(e.target.value)} placeholder="Название компании / ФИО" className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Сумма</label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0 ₽" className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Дата</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-[#0d0d0d] border-[#1f1f1f] text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Этап</label>
            <select value={stage} onChange={e => setStage(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] text-sm text-white focus:outline-none">
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Заметки</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Детали сделки..."
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-[#3a3a3a]" />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <Button onClick={onClose} variant="outline" className="flex-1 border-[#2a2a2a] text-gray-400 hover:text-white bg-transparent">Отмена</Button>
          <Button
            onClick={() => { if (title.trim()) onSave({ title, client, amount, stage, date, notes }) }}
            disabled={!title.trim()}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Icon name="Check" className="h-4 w-4 mr-1" />
            {deal ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOfficeDeals() {
  const [deals, setDeals] = useState<Deal[]>(loadDeals)
  const [stageFilter, setStageFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [editDeal, setEditDeal] = useState<Deal | null | "new">(null)

  const save = (d: Omit<Deal, "id">, existingId?: string) => {
    setDeals(prev => {
      const updated = existingId
        ? prev.map(x => x.id === existingId ? { ...d, id: existingId } : x)
        : [...prev, { ...d, id: crypto.randomUUID() }]
      saveDeals(updated)
      return updated
    })
    setEditDeal(null)
  }

  const remove = (id: string) => {
    if (!confirm("Удалить сделку?")) return
    setDeals(prev => { const u = prev.filter(x => x.id !== id); saveDeals(u); return u })
  }

  const changeStage = (id: string, newStage: string) => {
    setDeals(prev => {
      const u = prev.map(x => x.id === id ? { ...x, stage: newStage } : x)
      saveDeals(u)
      return u
    })
  }

  const filtered = deals.filter(d => {
    const inStage = stageFilter === "all" || d.stage === stageFilter
    const inSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.client.toLowerCase().includes(search.toLowerCase())
    return inStage && inSearch
  })

  const totalAmount = deals
    .filter(d => d.stage !== "cancelled")
    .reduce((sum, d) => sum + (parseFloat(d.amount.replace(/[^\d.]/g, "")) || 0), 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f1f1f] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Сделки офиса</h2>
            <p className="text-xs text-gray-500">{deals.length} сделок · {totalAmount > 0 ? `≈ ${totalAmount.toLocaleString("ru-RU")} ₽` : "—"}</p>
          </div>
          <Button onClick={() => setEditDeal("new")} className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
            <Icon name="Plus" className="h-3.5 w-3.5 mr-1.5" />
            Новая сделка
          </Button>
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-xs placeholder:text-gray-600 h-8" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setStageFilter("all")}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${stageFilter === "all" ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"}`}>
              Все ({deals.length})
            </button>
            {STAGES.map(s => {
              const cnt = deals.filter(d => d.stage === s.id).length
              return (
                <button key={s.id} onClick={() => setStageFilter(s.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${stageFilter === s.id ? `${s.bg} ${s.border} ${s.color}` : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"}`}>
                  {s.label} ({cnt})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#2a2a2a] rounded-2xl">
            <Icon name="Handshake" className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">Нет сделок</p>
            <Button onClick={() => setEditDeal("new")} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
              Создать первую
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => {
              const st = STAGE_MAP[d.stage] || STAGE_MAP.lead
              return (
                <div key={d.id} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-4 hover:border-[#2a2a2a] transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{d.title}</div>
                    {d.client && <div className="text-xs text-gray-500">{d.client}</div>}
                  </div>
                  {d.amount && (
                    <div className="text-sm font-semibold text-amber-300 shrink-0">{d.amount}</div>
                  )}
                  <div className="shrink-0">
                    <select value={d.stage} onChange={e => changeStage(d.id, e.target.value)}
                      className={`h-7 px-2 rounded-lg text-xs border focus:outline-none cursor-pointer ${st.bg} ${st.border} ${st.color}`}>
                      {STAGES.map(s => <option key={s.id} value={s.id} className="bg-[#111] text-white">{s.label}</option>)}
                    </select>
                  </div>
                  {d.date && <div className="text-xs text-gray-600 shrink-0 hidden md:block">{new Date(d.date).toLocaleDateString("ru-RU")}</div>}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditDeal(d)} className="text-gray-600 hover:text-white p-1 transition-colors">
                      <Icon name="Pencil" className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(d.id)} className="text-gray-700 hover:text-red-400 p-1 transition-colors">
                      <Icon name="Trash2" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editDeal !== null && (
        <DealModal
          deal={editDeal === "new" ? null : editDeal}
          onClose={() => setEditDeal(null)}
          onSave={(d) => save(d, editDeal !== "new" ? editDeal?.id : undefined)}
        />
      )}
    </div>
  )
}
