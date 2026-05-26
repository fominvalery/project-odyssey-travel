import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Icon from "@/components/ui/icon"

type ContentTab = "articles" | "templates" | "reports"

const ARTICLE_CATS = [
  { id: "news",      label: "Новости",       icon: "Newspaper",  color: "text-blue-400 bg-blue-500/10" },
  { id: "analytics", label: "Аналитика",     icon: "BarChart2",  color: "text-emerald-400 bg-emerald-500/10" },
  { id: "guide",     label: "Инструкции",    icon: "BookOpen",   color: "text-amber-400 bg-amber-500/10" },
  { id: "case",      label: "Кейсы",         icon: "Trophy",     color: "text-purple-400 bg-purple-500/10" },
  { id: "promo",     label: "Промо",         icon: "Megaphone",  color: "text-pink-400 bg-pink-500/10" },
]

const ARTICLE_STATUS = [
  { id: "draft",     label: "Черновик",    color: "text-gray-400 bg-gray-500/10" },
  { id: "published", label: "Опубликован", color: "text-emerald-400 bg-emerald-500/10" },
  { id: "archived",  label: "Архив",       color: "text-red-400 bg-red-500/10" },
]

const DOC_TEMPLATES = [
  { id: "fixation",    title: "Заявка на фиксацию",       category: "Фиксации",    fields: 6 },
  { id: "agreement",   title: "Агентский договор",        category: "Договоры",    fields: 12 },
  { id: "offer",       title: "Коммерческое предложение", category: "Продажи",     fields: 8 },
  { id: "report_deal", title: "Акт выполненных работ",    category: "Закрытие",    fields: 7 },
  { id: "nda",         title: "Соглашение о неразглашении", category: "Юридические", fields: 5 },
]

const REPORTS = [
  { id: "users_activity",   title: "Активность пользователей", icon: "Users",        period: "Месяц" },
  { id: "offers_stats",     title: "Статистика объектов",      icon: "FolderOpen",   period: "Квартал" },
  { id: "fixations_funnel", title: "Воронка фиксаций",         icon: "Filter",       period: "Месяц" },
  { id: "revenue",          title: "Выручка по тарифам",       icon: "TrendingUp",   period: "Квартал" },
  { id: "top_brokers",      title: "Топ брокеров",             icon: "Award",        period: "Месяц" },
]

interface Article {
  id: string
  title: string
  category: string
  status: string
  preview: string
  body: string
  tags: string
  created_at: string
}

const DEMO_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Как правильно зафиксировать клиента в базе Кабинет-24",
    category: "guide",
    status: "published",
    preview: "Пошаговая инструкция для брокеров по работе с системой фиксаций",
    body: "",
    tags: "фиксация, брокер, инструкция",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Рынок коммерческой недвижимости: тренды 2026",
    category: "analytics",
    status: "draft",
    preview: "Обзор ключевых тенденций на рынке коммерческой недвижимости",
    body: "",
    tags: "аналитика, 2026, коммерческая",
    created_at: new Date().toISOString(),
  },
]

const EMPTY_ARTICLE = {
  title: "",
  category: "news",
  status: "draft",
  preview: "",
  body: "",
  tags: "",
}

export default function AdminContent() {
  const [tab, setTab] = useState<ContentTab>("articles")
  const [articles, setArticles] = useState<Article[]>(DEMO_ARTICLES)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState(EMPTY_ARTICLE)
  const [generating, setGenerating] = useState<string | null>(null)

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_ARTICLE)
    setDialog(true)
  }
  const openEdit = (a: Article) => {
    setEditing(a)
    setForm({ title: a.title, category: a.category, status: a.status, preview: a.preview, body: a.body, tags: a.tags })
    setDialog(true)
  }
  const save = () => {
    if (!form.title.trim()) return
    if (editing) {
      setArticles(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a))
    } else {
      setArticles(prev => [...prev, { ...form, id: Date.now().toString(), created_at: new Date().toISOString() }])
    }
    setDialog(false)
  }
  const deleteArticle = (id: string) => {
    if (!confirm("Удалить статью?")) return
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const generateReport = async (id: string) => {
    setGenerating(id)
    await new Promise(r => setTimeout(r, 1500))
    setGenerating(null)
    alert("Отчёт сформирован и готов к скачиванию")
  }

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || a.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка с табами */}
      <div className="p-5 border-b border-[#1f1f1f]">
        <h2 className="font-bold text-lg text-white mb-4">Контент-менеджмент</h2>
        <div className="flex gap-1 bg-[#0d0d0d] p-1 rounded-xl border border-[#1f1f1f] w-fit">
          {([
            { id: "articles",  icon: "FileText",  label: "Статьи и новости" },
            { id: "templates", icon: "ClipboardList", label: "Шаблоны документов" },
            { id: "reports",   icon: "BarChart2", label: "Отчёты" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon name={t.icon as "FileText"} className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* === СТАТЬИ === */}
        {tab === "articles" && (
          <div>
            <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center gap-3">
              <div className="relative flex-1">
                <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <Input
                  placeholder="Поиск статей..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600"
                />
              </div>
              <Select value={catFilter || "all"} onValueChange={v => setCatFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-36 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#2a2a2a]">
                  <SelectItem value="all">Все</SelectItem>
                  {ARTICLE_CATS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-700 text-white text-sm">
                <Icon name="Plus" className="h-4 w-4 mr-1.5" />
                Создать статью
              </Button>
            </div>

            <div className="p-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-600">
                  <Icon name="FileText" className="h-10 w-10 mx-auto mb-3 text-gray-700" />
                  <p>Статей нет. Создайте первую!</p>
                </div>
              ) : (
                filtered.map(a => {
                  const cat = ARTICLE_CATS.find(c => c.id === a.category)
                  const st = ARTICLE_STATUS.find(s => s.id === a.status)
                  return (
                    <div key={a.id} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 flex items-start gap-4 hover:border-[#2a2a2a] transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat?.color || "text-gray-400 bg-gray-500/10"}`}>
                        <Icon name={(cat?.icon || "FileText") as "Newspaper"} className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white line-clamp-1">{a.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${st?.color || "text-gray-400 bg-gray-500/10"}`}>{st?.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.preview}</p>
                        {a.tags && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {a.tags.split(",").map(t => (
                              <span key={t} className="text-xs text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-md">#{t.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(a)} className="p-1.5 text-gray-600 hover:text-white transition-colors">
                          <Icon name="Pencil" className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteArticle(a.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                          <Icon name="Trash2" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* === ШАБЛОНЫ === */}
        {tab === "templates" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{DOC_TEMPLATES.length} шаблонов документов</p>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white text-sm">
                <Icon name="Plus" className="h-4 w-4 mr-1.5" />
                Новый шаблон
              </Button>
            </div>
            <div className="space-y-3">
              {DOC_TEMPLATES.map(t => (
                <div key={t.id} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 flex items-center gap-4 hover:border-[#2a2a2a] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon name="FileText" className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.category} · {t.fields} полей</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white text-xs h-7">
                      <Icon name="Eye" className="h-3.5 w-3.5 mr-1" />
                      Просмотр
                    </Button>
                    <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white text-xs h-7">
                      <Icon name="Pencil" className="h-3.5 w-3.5 mr-1" />
                      Редактировать
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === ОТЧЁТЫ === */}
        {tab === "reports" && (
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">Генерация отчётов по данным платформы</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORTS.map(r => (
                <div key={r.id} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Icon name={r.icon as "Users"} className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{r.title}</div>
                      <div className="text-xs text-gray-600">Период: {r.period}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => generateReport(r.id)}
                      disabled={generating === r.id}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      {generating === r.id ? (
                        <><Icon name="Loader2" className="h-3.5 w-3.5 mr-1.5 animate-spin" />Генерация...</>
                      ) : (
                        <><Icon name="Download" className="h-3.5 w-3.5 mr-1.5" />Сформировать</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white text-xs h-8">
                      <Icon name="Settings2" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Диалог статьи */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать статью" : "Новая статья"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Заголовок *</label>
              <Input
                placeholder="Название статьи..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Категория</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {ARTICLE_CATS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Статус</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {ARTICLE_STATUS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Краткое описание (превью)</label>
              <Textarea
                placeholder="1-2 предложения о чём статья..."
                value={form.preview}
                onChange={e => setForm(f => ({ ...f, preview: e.target.value }))}
                rows={2}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Текст статьи</label>
              <Textarea
                placeholder="Основной контент..."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={8}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Теги (через запятую)</label>
              <Input
                placeholder="фиксация, брокер, коммерческая..."
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-[#1f1f1f]">
            <Button onClick={save} disabled={!form.title.trim()} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              {editing ? "Сохранить" : "Создать статью"}
            </Button>
            <Button variant="outline" onClick={() => setDialog(false)} className="border-[#2a2a2a] text-gray-400 hover:text-white">
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
