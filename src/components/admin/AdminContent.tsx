import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

type ContentTab = "blog" | "training"

const API_URL = (func2url as Record<string, string>)["content-articles"]
const UPLOAD_URL = (func2url as Record<string, string>)["upload-photo"]

const BLOG_CATS = [
  { id: "news",      label: "Новости",    icon: "Newspaper",  color: "text-blue-400 bg-blue-500/10" },
  { id: "analytics", label: "Аналитика",  icon: "BarChart2",  color: "text-emerald-400 bg-emerald-500/10" },
  { id: "case",      label: "Кейсы",      icon: "Trophy",     color: "text-purple-400 bg-purple-500/10" },
  { id: "promo",     label: "Промо",      icon: "Megaphone",  color: "text-pink-400 bg-pink-500/10" },
]

const TRAINING_CATS = [
  { id: "guide",    label: "Инструкция",  icon: "BookOpen",  color: "text-amber-400 bg-amber-500/10" },
  { id: "video",    label: "Видеоурок",   icon: "PlayCircle", color: "text-blue-400 bg-blue-500/10" },
  { id: "faq",      label: "FAQ",         icon: "HelpCircle", color: "text-emerald-400 bg-emerald-500/10" },
  { id: "webinar",  label: "Вебинар",     icon: "MonitorPlay",color: "text-violet-400 bg-violet-500/10" },
]

const ARTICLE_STATUS = [
  { id: "draft",     label: "Черновик",    color: "text-gray-400 bg-gray-500/10" },
  { id: "published", label: "Опубликован", color: "text-emerald-400 bg-emerald-500/10" },
  { id: "archived",  label: "Архив",       color: "text-red-400 bg-red-500/10" },
]

interface Article {
  id: string
  content_type: string
  title: string
  category: string
  status: string
  preview: string
  body: string
  tags: string
  photos: string[]
  videos: string[]
  created_at: string
}

const EMPTY_FORM = {
  title: "", category: "news", status: "published",
  preview: "", body: "", tags: "",
  photos: [] as string[], videos: [] as string[],
}

async function compressAndUpload(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL("image/jpeg", 0.85)
      try {
        const res = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, content_type: "image/jpeg" }),
        })
        const data = await res.json()
        resolve(data.url || null)
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function getEmbedUrl(url: string): string {
  if (url.includes("youtube.com/watch")) return url.replace("watch?v=", "embed/")
  if (url.includes("youtu.be/")) return "https://www.youtube.com/embed/" + url.split("youtu.be/")[1]
  if (url.includes("rutube.ru/video/")) {
    const id = url.split("/video/")[1]?.replace(/\//g, "")
    return id ? `https://rutube.ru/play/embed/${id}` : url
  }
  return url
}

export default function AdminContent() {
  const { user } = useAuthContext()
  const [tab, setTab] = useState<ContentTab>("blog")
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, category: "news" })
  const [videoInput, setVideoInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const cats = tab === "blog" ? BLOG_CATS : TRAINING_CATS

  const load = async () => {
    if (!API_URL) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}?type=${tab}&status=all`)
      const text = await res.text()
      const data = JSON.parse(text.startsWith('"') ? JSON.parse(text) : text)
      setArticles(data.articles || [])
    } catch { setArticles([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab])

  const patch = (p: Partial<typeof form>) => setForm(f => ({ ...f, ...p }))

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, category: cats[0].id })
    setVideoInput("")
    setDialog(true)
  }
  const openEdit = (a: Article) => {
    setEditing(a)
    setForm({ title: a.title, category: a.category, status: a.status, preview: a.preview, body: a.body, tags: a.tags, photos: a.photos || [], videos: a.videos || [] })
    setVideoInput("")
    setDialog(true)
  }

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const urls = (await Promise.all(files.map(compressAndUpload))).filter(Boolean) as string[]
    patch({ photos: [...form.photos, ...urls] })
    setUploading(false)
    if (photoRef.current) photoRef.current.value = ""
  }

  const addVideo = () => {
    if (!videoInput.trim()) return
    patch({ videos: [...form.videos, videoInput.trim()] })
    setVideoInput("")
  }

  const save = async () => {
    if (!form.title.trim() || !user?.id) return
    setSaving(true)
    const body = { ...form, content_type: tab }
    const url = editing ? API_URL : API_URL
    const method = editing ? "PUT" : "POST"
    const payload = editing ? { ...body, id: editing.id } : body
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-User-Id": user.id },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setDialog(false)
    load()
  }

  const deleteArticle = async (id: string) => {
    if (!confirm("Удалить?") || !user?.id) return
    await fetch(`${API_URL}?id=${id}`, {
      method: "DELETE",
      headers: { "X-User-Id": user.id },
    })
    load()
  }

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="p-5 border-b border-[#1f1f1f]">
        <h2 className="font-bold text-lg text-white mb-4">Контент-менеджмент</h2>
        <div className="flex gap-1 bg-[#0d0d0d] p-1 rounded-xl border border-[#1f1f1f] w-fit">
          {([
            { id: "blog",     icon: "Newspaper",  label: "Новости / Блог" },
            { id: "training", icon: "GraduationCap", label: "Обучение по платформе" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-[#1f1f1f] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div>
          {/* Тулбар */}
          <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center gap-3">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <Input
                placeholder={tab === "blog" ? "Поиск новостей..." : "Поиск материалов..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#2a2a2a]">
                <SelectItem value="all">Все статусы</SelectItem>
                {ARTICLE_STATUS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-700 text-white text-sm shrink-0">
              <Icon name="Plus" className="h-4 w-4 mr-1.5" />
              {tab === "blog" ? "Создать новость" : "Добавить материал"}
            </Button>
          </div>

          {/* Список */}
          <div className="p-5 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-20 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <Icon name={tab === "blog" ? "Newspaper" : "GraduationCap"} className="h-10 w-10 mx-auto mb-3 text-gray-700" />
                <p>{tab === "blog" ? "Новостей нет. Создайте первую!" : "Материалов нет. Добавьте первый!"}</p>
              </div>
            ) : (
              filtered.map(a => {
                const cat = cats.find(c => c.id === a.category)
                const st = ARTICLE_STATUS.find(s => s.id === a.status)
                return (
                  <div key={a.id} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 flex items-start gap-4 hover:border-[#2a2a2a] transition-colors">
                    {a.photos?.[0] ? (
                      <img src={a.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#2a2a2a]" />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat?.color || "text-gray-400 bg-gray-500/10"}`}>
                        <Icon name={(cat?.icon || "FileText") as "Newspaper"} className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white line-clamp-1">{a.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${st?.color || "text-gray-400 bg-gray-500/10"}`}>{st?.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.preview}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {a.tags && (
                          <div className="flex gap-1 flex-wrap">
                            {a.tags.split(",").slice(0, 3).map(t => (
                              <span key={t} className="text-xs text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-md">#{t.trim()}</span>
                            ))}
                          </div>
                        )}
                        {a.photos?.length > 0 && <span className="text-xs text-gray-600 flex items-center gap-1"><Icon name="Image" className="h-3 w-3" />{a.photos.length}</span>}
                        {a.videos?.length > 0 && <span className="text-xs text-gray-600 flex items-center gap-1"><Icon name="Play" className="h-3 w-3" />{a.videos.length}</span>}
                      </div>
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
      </div>

      {/* Диалог создания/редактирования */}
      <Dialog open={dialog} onOpenChange={v => { if (!v) setDialog(false) }}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name={tab === "blog" ? "Newspaper" : "GraduationCap"} className="h-5 w-5 text-amber-400" />
              {editing ? "Редактировать" : (tab === "blog" ? "Новая новость / запись блога" : "Новый материал обучения")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Категория + статус */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Категория</label>
                <Select value={form.category} onValueChange={v => patch({ category: v })}>
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {cats.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Статус</label>
                <Select value={form.status} onValueChange={v => patch({ status: v })}>
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {ARTICLE_STATUS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Заголовок / Вопрос */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{form.category === "faq" ? "Вопрос *" : "Заголовок *"}</label>
              <Input
                placeholder={form.category === "faq" ? "Введите вопрос..." : "Введите заголовок..."}
                value={form.title}
                onChange={e => patch({ title: e.target.value })}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Краткое описание — скрываем для FAQ */}
            {form.category !== "faq" && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Краткое описание</label>
                <Input
                  placeholder="Одна строка — анонс материала..."
                  value={form.preview}
                  onChange={e => patch({ preview: e.target.value })}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
            )}

            {/* Текст / Ответ */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{form.category === "faq" ? "Ответ *" : "Текст материала"}</label>
              <Textarea
                placeholder={form.category === "faq" ? "Введите ответ на вопрос..." : "Полный текст статьи..."}
                value={form.body}
                onChange={e => patch({ body: e.target.value })}
                rows={form.category === "faq" ? 4 : 6}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Теги */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Теги (через запятую)</label>
              <Input
                placeholder="фиксация, брокер, инструкция"
                value={form.tags}
                onChange={e => patch({ tags: e.target.value })}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Фото */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Фотографии</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-[#2a2a2a]" />
                    <button
                      onClick={() => patch({ photos: form.photos.filter((_, idx) => idx !== i) })}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="X" className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => photoRef.current?.click()}
                  disabled={uploading}
                  className="h-20 w-20 rounded-lg border border-dashed border-[#2a2a2a] flex flex-col items-center justify-center text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-colors text-xs gap-1"
                >
                  {uploading ? <Icon name="Loader2" className="h-5 w-5 animate-spin" /> : <><Icon name="Plus" className="h-5 w-5" /><span>Фото</span></>}
                </button>
              </div>
              <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
            </div>

            {/* Видео */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Видео (Rutube, VK Видео, YouTube, Дзен)</label>
              <div className="space-y-2 mb-2">
                {form.videos.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2">
                    <Icon name="Play" className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="text-xs text-gray-400 flex-1 truncate">{url}</span>
                    <button onClick={() => patch({ videos: form.videos.filter((_, idx) => idx !== i) })} className="text-gray-600 hover:text-red-400">
                      <Icon name="X" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://rutube.ru/video/..."
                  value={videoInput}
                  onChange={e => setVideoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addVideo()}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 text-sm"
                />
                <Button type="button" variant="outline" onClick={addVideo} className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
                  <Icon name="Plus" className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                {saving ? <Icon name="Loader2" className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Сохранить" : "Опубликовать"}
              </Button>
              <Button variant="outline" onClick={() => setDialog(false)} className="border-[#2a2a2a] text-gray-400 hover:text-white">
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}