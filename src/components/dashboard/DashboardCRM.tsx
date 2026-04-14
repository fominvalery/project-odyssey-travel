import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

// ── Типы ─────────────────────────────────────────────────────────────────────

type FunnelStage = "Лид" | "Подбор" | "Показ" | "Переговоры" | "Сделка" | "Отказ"
type DealType = "Покупка" | "Аренда"
type PropertyCategory = "Инвестиции" | "Коммерция" | "Торги" | "Новостройки"

interface Lead {
  id: number
  name: string
  phone: string
  email: string
  dealType: DealType
  category: PropertyCategory
  budget: string
  area: string
  city: string
  notes: string
  source: string
  stage: FunnelStage
  date: string
}

// ── Константы ─────────────────────────────────────────────────────────────────

const FUNNEL_STAGES: { stage: FunnelStage; color: string; bg: string; icon: string }[] = [
  { stage: "Лид",        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    icon: "UserPlus" },
  { stage: "Подбор",     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20", icon: "Search" },
  { stage: "Показ",      color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",  icon: "Eye" },
  { stage: "Переговоры", color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20", icon: "MessageSquare" },
  { stage: "Сделка",     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "Handshake" },
  { stage: "Отказ",      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",      icon: "XCircle" },
]

const DEAL_TYPES: DealType[] = ["Покупка", "Аренда"]
const PROPERTY_CATEGORIES: PropertyCategory[] = ["Коммерция", "Инвестиции", "Новостройки", "Торги"]
const SOURCES = ["Входящий звонок", "Сайт", "Маркетплейс", "AI-чат", "Реклама", "Рекомендация", "Другое"]

const INITIAL_LEADS: Lead[] = [
  { id: 1, name: "Алексей Петров", phone: "+7 900 123-45-67", email: "", dealType: "Покупка", category: "Коммерция", budget: "5 000 000", area: "120", city: "Москва", notes: "", source: "AI-чат", stage: "Подбор", date: "10 апр" },
  { id: 2, name: "Ирина Смирнова", phone: "+7 911 987-65-43", email: "", dealType: "Аренда", category: "Коммерция", budget: "150 000", area: "80", city: "Москва", notes: "", source: "Маркетплейс", stage: "Показ", date: "12 апр" },
  { id: 3, name: "Дмитрий Козлов", phone: "+7 925 555-00-11", email: "", dealType: "Покупка", category: "Инвестиции", budget: "12 000 000", area: "200", city: "СПб", notes: "", source: "Рекомендация", stage: "Сделка", date: "14 апр" },
]

// ── Форма добавления лида ─────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", phone: "", email: "", dealType: "Покупка" as DealType,
  category: "Коммерция" as PropertyCategory, budget: "", area: "",
  city: "", notes: "", source: "Входящий звонок",
}

interface AddLeadFormProps {
  onAdd: (lead: Lead) => void
  onClose: () => void
}

function AddLeadForm({ onAdd, onClose }: AddLeadFormProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({
      id: Date.now(),
      ...form,
      stage: "Лид",
      date: new Date().toLocaleDateString("ru", { day: "numeric", month: "short" }),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Icon name="UserPlus" className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="font-bold text-lg">Новый лид</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Контакт */}
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">Контакт</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">ФИО клиента *</Label>
                <Input required placeholder="Иван Иванович Иванов" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">Телефон *</Label>
                  <Input required type="tel" placeholder="+7 (___) ___-__-__" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">Email</Label>
                  <Input type="email" placeholder="email@mail.ru" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Запрос */}
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">Запрос</p>
            <div className="space-y-3">
              {/* Тип сделки */}
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Тип сделки</Label>
                <div className="flex gap-2">
                  {DEAL_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, dealType: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        form.dealType === t ? "bg-blue-600 border-blue-600 text-white" : "bg-[#0f0f0f] border-[#262626] text-gray-400 hover:text-white"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Категория недвижимости */}
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Категория недвижимости</Label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.category === c ? "bg-blue-600 border-blue-600 text-white" : "bg-[#0f0f0f] border-[#262626] text-gray-400 hover:text-white"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">
                    {form.dealType === "Аренда" ? "Бюджет (₽/мес)" : "Бюджет (₽)"}
                  </Label>
                  <Input placeholder="5 000 000" value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">Площадь (м²)</Label>
                  <Input placeholder="100" value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600" />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">Город / район</Label>
                <Input placeholder="Москва, ЦАО" value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600" />
              </div>
            </div>
          </div>

          {/* Источник */}
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">Источник</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, source: s })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.source === s ? "bg-blue-600 border-blue-600 text-white" : "bg-[#0f0f0f] border-[#262626] text-gray-400 hover:text-white"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Заметки */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Заметки</Label>
            <textarea rows={3} placeholder="Пожелания клиента, дополнительная информация..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 rounded-xl border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]">
              Отмена
            </Button>
            <Button type="submit" className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              Добавить лид
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Карточка лида ─────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead
  onStageChange: (id: number, stage: FunnelStage) => void
}

function LeadCard({ lead, onStageChange }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false)
  const stageInfo = FUNNEL_STAGES.find(s => s.stage === lead.stage)!

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-[#2a2a2a] transition-colors">
      {/* Основная строка */}
      <div
        className="p-5 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 text-sm font-bold text-gray-400">
          {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{lead.name}</p>
          <p className="text-xs text-gray-400">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a1a1a] text-gray-400">{lead.dealType}</span>
            <span className="text-xs text-gray-500">{lead.category}</span>
            {lead.budget && <span className="text-xs text-gray-500">· {lead.budget} ₽</span>}
            {lead.city && <span className="text-xs text-gray-500">· {lead.city}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stageInfo.bg} ${stageInfo.color}`}>
            {lead.stage}
          </span>
          <Icon name={expanded ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* Раскрытая часть */}
      {expanded && (
        <div className="border-t border-[#1a1a1a] px-5 py-4 space-y-4">
          {/* Детали */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {lead.area && (
              <div>
                <p className="text-xs text-gray-500">Площадь</p>
                <p className="text-white font-medium">{lead.area} м²</p>
              </div>
            )}
            {lead.email && (
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-white font-medium truncate">{lead.email}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Источник</p>
              <p className="text-white font-medium">{lead.source}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Дата</p>
              <p className="text-white font-medium">{lead.date}</p>
            </div>
          </div>

          {lead.notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Заметки</p>
              <p className="text-sm text-gray-300">{lead.notes}</p>
            </div>
          )}

          {/* Воронка */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Этап воронки</p>
            <div className="flex flex-wrap gap-2">
              {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
                <button
                  key={stage}
                  onClick={() => onStageChange(lead.id, stage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    lead.stage === stage
                      ? `${bg} ${color} scale-105`
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:text-white"
                  }`}
                >
                  <Icon name={icon as "Eye"} className="h-3 w-3" />
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Основной компонент CRM ────────────────────────────────────────────────────

export function DashboardCRM() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
  const [showForm, setShowForm] = useState(false)
  const [filterStage, setFilterStage] = useState<FunnelStage | "Все">("Все")
  const [filterDeal, setFilterDeal] = useState<DealType | "Все">("Все")
  const [search, setSearch] = useState("")

  function handleAdd(lead: Lead) {
    setLeads(prev => [lead, ...prev])
  }

  function handleStageChange(id: number, stage: FunnelStage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
  }

  const filtered = leads.filter(l => {
    const matchStage = filterStage === "Все" || l.stage === filterStage
    const matchDeal = filterDeal === "Все" || l.dealType === filterDeal
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
    return matchStage && matchDeal && matchSearch
  })

  // Счётчики по воронке
  const counts = FUNNEL_STAGES.reduce((acc, { stage }) => {
    acc[stage] = leads.filter(l => l.stage === stage).length
    return acc
  }, {} as Record<FunnelStage, number>)

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {showForm && <AddLeadForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CRM — Лиды</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} контактов</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
          <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить лид
        </Button>
      </div>

      {/* Воронка — счётчики */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
          <button
            key={stage}
            onClick={() => setFilterStage(filterStage === stage ? "Все" : stage)}
            className={`rounded-xl p-3 text-center border transition-all ${
              filterStage === stage ? bg : "bg-[#111] border-[#1f1f1f] hover:border-[#2a2a2a]"
            }`}
          >
            <Icon name={icon as "Eye"} className={`h-4 w-4 mx-auto mb-1 ${filterStage === stage ? color : "text-gray-500"}`} />
            <p className={`text-lg font-bold ${filterStage === stage ? color : "text-white"}`}>{counts[stage]}</p>
            <p className={`text-[10px] font-medium ${filterStage === stage ? color : "text-gray-500"}`}>{stage}</p>
          </button>
        ))}
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-1">
          {(["Все", "Покупка", "Аренда"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterDeal(t === "Все" ? "Все" : t as DealType)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterDeal === t ? "bg-[#1f1f1f] text-white border border-[#333]" : "text-gray-500 hover:text-white"
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Список */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
          <Icon name="Users" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Лидов не найдено</p>
          <p className="text-gray-600 text-sm mt-1">Добавьте первый контакт вручную</p>
          <Button onClick={() => setShowForm(true)} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm">
            <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить лид
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(lead => (
            <LeadCard key={lead.id} lead={lead} onStageChange={handleStageChange} />
          ))}
        </div>
      )}
    </div>
  )
}