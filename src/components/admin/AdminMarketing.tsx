import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Icon from "@/components/ui/icon"

type MktTab = "campaigns" | "analytics" | "audience"

const CHANNEL_OPTS = [
  { id: "email", label: "Email",    icon: "Mail",      color: "text-blue-400 bg-blue-500/10" },
  { id: "tg",    label: "Telegram", icon: "Send",      color: "text-sky-400 bg-sky-500/10" },
  { id: "both",  label: "Email + TG", icon: "Zap",    color: "text-purple-400 bg-purple-500/10" },
]

const AUDIENCE_OPTS = [
  { id: "all",     label: "Все пользователи" },
  { id: "broker",  label: "Только брокеры" },
  { id: "agency",  label: "Только агентства" },
  { id: "basic",   label: "Базовый тариф" },
  { id: "new",     label: "Новые (< 7 дней)" },
  { id: "inactive",label: "Неактивные (> 30 дней)" },
]

const DEMO_CAMPAIGNS = [
  {
    id: "1",
    title: "Новые объекты в базе — Апрель 2026",
    channel: "email",
    audience: "broker",
    status: "sent",
    sent_at: "15.04.2026",
    opens: 234,
    clicks: 67,
    recipients: 312,
  },
  {
    id: "2",
    title: "Обновление тарифов Кабинет-24",
    channel: "both",
    audience: "all",
    status: "draft",
    sent_at: null,
    opens: 0,
    clicks: 0,
    recipients: 580,
  },
  {
    id: "3",
    title: "Курортная недвижимость: топ объектов",
    channel: "tg",
    audience: "agency",
    status: "sent",
    sent_at: "02.05.2026",
    opens: 412,
    clicks: 89,
    recipients: 450,
  },
]

const STATUS_COLOR: Record<string, string> = {
  draft:    "text-gray-400 bg-gray-500/10",
  scheduled:"text-amber-400 bg-amber-500/10",
  sending:  "text-blue-400 bg-blue-500/10",
  sent:     "text-emerald-400 bg-emerald-500/10",
  failed:   "text-red-400 bg-red-500/10",
}
const STATUS_LABEL: Record<string, string> = {
  draft:    "Черновик",
  scheduled:"Запланирована",
  sending:  "Отправляется",
  sent:     "Отправлена",
  failed:   "Ошибка",
}

const EMPTY_FORM = {
  title: "",
  channel: "email",
  audience: "all",
  subject: "",
  body: "",
  scheduled_at: "",
}

export default function AdminMarketing({ totalUsers }: { totalUsers: number }) {
  const [tab, setTab] = useState<MktTab>("campaigns")
  const [campaigns, setCampaigns] = useState(DEMO_CAMPAIGNS)
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [sending, setSending] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  const openNew = () => {
    setForm(EMPTY_FORM)
    setDialog(true)
  }

  const save = (asDraft = true) => {
    if (!form.title.trim() || !form.body.trim()) return
    setCampaigns(prev => [{
      id: Date.now().toString(),
      ...form,
      status: asDraft ? "draft" : "scheduled",
      sent_at: null,
      opens: 0,
      clicks: 0,
      recipients: totalUsers,
    }, ...prev])
    setDialog(false)
  }

  const sendNow = async (id: string) => {
    if (!confirm("Отправить кампанию прямо сейчас?")) return
    setSending(id)
    await new Promise(r => setTimeout(r, 2000))
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "sent", sent_at: new Date().toLocaleDateString("ru-RU") } : c))
    setSending(null)
  }

  const deleteCampaign = (id: string) => {
    if (!confirm("Удалить кампанию?")) return
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  const totalSent = campaigns.filter(c => c.status === "sent").length
  const totalOpens = campaigns.reduce((s, c) => s + c.opens, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const avgOR = totalSent > 0 ? Math.round(campaigns.filter(c => c.status === "sent").reduce((s, c) => s + (c.opens / (c.recipients || 1)), 0) / totalSent * 100) : 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="p-5 border-b border-[#1f1f1f]">
        <h2 className="font-bold text-lg text-white mb-4">Маркетинг</h2>
        <div className="flex gap-1 bg-[#0d0d0d] p-1 rounded-xl border border-[#1f1f1f] w-fit">
          {([
            { id: "campaigns",  icon: "Send",       label: "Рассылки" },
            { id: "analytics",  icon: "BarChart2",  label: "Аналитика" },
            { id: "audience",   icon: "Users",      label: "Аудитория" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon name={t.icon as "Send"} className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* === РАССЫЛКИ === */}
        {tab === "campaigns" && (
          <div>
            <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
              <p className="text-sm text-gray-500">{campaigns.length} кампаний · {totalSent} отправлено</p>
              <Button onClick={openNew} className="bg-pink-600 hover:bg-pink-700 text-white text-sm">
                <Icon name="Plus" className="h-4 w-4 mr-1.5" />
                Новая рассылка
              </Button>
            </div>

            <div className="p-5 space-y-3">
              {campaigns.map(c => {
                const ch = CHANNEL_OPTS.find(ch => ch.id === c.channel)
                const aud = AUDIENCE_OPTS.find(a => a.id === c.audience)
                return (
                  <div key={c.id} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ch?.color || "text-gray-400 bg-gray-500/10"}`}>
                          <Icon name={(ch?.icon || "Send") as "Send"} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{c.title}</div>
                          <div className="text-xs text-gray-500">{aud?.label} · {c.recipients} получателей</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </div>

                    {c.status === "sent" && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: "Открытий",     value: c.opens,  pct: Math.round(c.opens / c.recipients * 100) + "%", color: "text-blue-400" },
                          { label: "Кликов",       value: c.clicks, pct: Math.round(c.clicks / c.recipients * 100) + "%", color: "text-emerald-400" },
                          { label: "Отправлено",   value: c.sent_at || "—", pct: "", color: "text-gray-400" },
                        ].map(s => (
                          <div key={s.label} className="bg-[#0d0d0d] rounded-xl p-3 text-center">
                            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                            {s.pct && <div className="text-xs text-gray-600">{s.pct}</div>}
                            <div className="text-xs text-gray-600">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(c.status === "draft" || c.status === "scheduled") && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => sendNow(c.id)}
                          disabled={sending === c.id}
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700 text-white text-xs h-8"
                        >
                          {sending === c.id ? (
                            <><Icon name="Loader2" className="h-3.5 w-3.5 mr-1.5 animate-spin" />Отправка...</>
                          ) : (
                            <><Icon name="Send" className="h-3.5 w-3.5 mr-1.5" />Отправить сейчас</>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white text-xs h-8">
                          <Icon name="Pencil" className="h-3.5 w-3.5 mr-1" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCampaign(c.id)}
                          className="border-[#2a2a2a] text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 ml-auto"
                        >
                          <Icon name="Trash2" className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* === АНАЛИТИКА === */}
        {tab === "analytics" && (
          <div className="p-5">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Отправлено кампаний", value: totalSent,            icon: "Send",        color: "text-pink-400",    bg: "bg-pink-500/10" },
                { label: "Всего открытий",      value: totalOpens,           icon: "MailOpen",    color: "text-blue-400",    bg: "bg-blue-500/10" },
                { label: "Всего кликов",        value: totalClicks,          icon: "MousePointer",color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Средний Open Rate",   value: `${avgOR}%`,          icon: "Percent",     color: "text-amber-400",   bg: "bg-amber-500/10" },
              ].map(m => (
                <div key={m.label} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-4`}>
                    <Icon name={m.icon as "Send"} className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <div className={`text-3xl font-bold ${m.color} mb-1`}>{m.value}</div>
                  <div className="text-xs text-gray-500">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Эффективность каналов</h3>
              <div className="space-y-3">
                {CHANNEL_OPTS.map(ch => {
                  const chCampaigns = campaigns.filter(c => c.channel === ch.id || c.channel === "both")
                  const chSent = chCampaigns.filter(c => c.status === "sent")
                  const or = chSent.length > 0 ? Math.round(chSent.reduce((s, c) => s + (c.opens / (c.recipients || 1)), 0) / chSent.length * 100) : 0
                  return (
                    <div key={ch.id} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ch.color}`}>
                        <Icon name={ch.icon as "Send"} className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">{ch.label}</span>
                          <span className="text-gray-400">{or}% открытий</span>
                        </div>
                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all"
                            style={{ width: `${or}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* === АУДИТОРИЯ === */}
        {tab === "audience" && (
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">Сегменты аудитории для таргетированных рассылок</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AUDIENCE_OPTS.map(a => (
                <div key={a.id} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="Users" className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-semibold text-white">{a.label}</span>
                    </div>
                    <span className="text-sm font-bold text-pink-400">{totalUsers}</span>
                  </div>
                  <Button
                    onClick={() => {
                      setForm(f => ({ ...f, audience: a.id }))
                      setTab("campaigns")
                      openNew()
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full border-[#2a2a2a] text-gray-400 hover:text-white text-xs h-8"
                  >
                    <Icon name="Send" className="h-3.5 w-3.5 mr-1.5" />
                    Создать рассылку для этого сегмента
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Диалог создания рассылки */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая рассылка</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Название кампании *</label>
              <Input
                placeholder="Новые объекты в базе — Май 2026"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Канал</label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {CHANNEL_OPTS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Аудитория</label>
                <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {AUDIENCE_OPTS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(form.channel === "email" || form.channel === "both") && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Тема письма</label>
                <Input
                  placeholder="Тема email-сообщения..."
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Текст сообщения *</label>
              <Textarea
                placeholder="Содержание рассылки..."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={6}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Дата отправки (опционально)</label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-[#1f1f1f]">
            <Button
              onClick={() => save(false)}
              disabled={!form.title.trim() || !form.body.trim()}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold"
            >
              <Icon name="Send" className="h-4 w-4 mr-1.5" />
              Отправить
            </Button>
            <Button
              onClick={() => save(true)}
              variant="outline"
              className="border-[#2a2a2a] text-gray-400 hover:text-white"
            >
              Сохранить черновик
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
