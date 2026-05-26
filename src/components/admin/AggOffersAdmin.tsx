import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const AGG_ADMIN_URL = (func2url as Record<string, string>)["agg-admin"]

const CATEGORIES = [
  { id: "commercial",  label: "Коммерческая" },
  { id: "investment",  label: "Инвестиционная" },
  { id: "resort",      label: "Курортная" },
  { id: "auction",     label: "Торги" },
  { id: "residential", label: "Жилая" },
  { id: "land",        label: "Земля" },
  { id: "parking",     label: "Паркинги" },
]

const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))

const STATUS_OPTS = [
  { id: "active", label: "Активно" },
  { id: "hidden", label: "Скрыто" },
  { id: "sold",   label: "Продано" },
]

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10",
  hidden: "text-gray-400 bg-gray-500/10",
  sold:   "text-red-400 bg-red-500/10",
}

interface Offer {
  id: string
  title: string
  category: string
  subtype?: string
  city?: string
  price?: number
  price_label?: string
  area?: number
  yield_percent?: number
  status: string
  photos?: string[]
  presentation_url?: string
  commission?: string
  created_at?: string
}

const EMPTY_FORM = {
  title: "",
  category: "commercial",
  subtype: "",
  city: "",
  region: "",
  address: "",
  price: "",
  price_label: "",
  area: "",
  yield_percent: "",
  description: "",
  status: "active",
  photos: [] as string[],
  videos: [] as string[],
  presentation_url: "",
  commission: "",
  commission_notes: "",
}

function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}

export default function AggOffersAdmin({ token }: { token: string }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [photoInput, setPhotoInput] = useState("")
  const [videoInput, setVideoInput] = useState("")
  const [totalFixations, setTotalFixations] = useState(0)

  const load = async () => {
    setLoading(true)
    const url = new URL(AGG_ADMIN_URL)
    if (statusFilter) url.searchParams.set("status", statusFilter)
    if (catFilter) url.searchParams.set("category", catFilter)
    url.searchParams.set("limit", "100")
    try {
      const res = await fetch(url.toString())
      const data = await res.json()
      setOffers(data.offers || [])
      setTotal(data.total || 0)
      setTotalFixations(data.total_fixations || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [catFilter, statusFilter])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setPhotoInput("")
    setVideoInput("")
    setDialog(true)
  }

  const openEdit = (o: Offer) => {
    setEditing(o)
    setForm({
      title: o.title || "",
      category: o.category || "commercial",
      subtype: o.subtype || "",
      city: o.city || "",
      region: "",
      address: "",
      price: o.price ? String(o.price) : "",
      price_label: o.price_label || "",
      area: o.area ? String(o.area) : "",
      yield_percent: o.yield_percent ? String(o.yield_percent) : "",
      description: "",
      status: o.status || "active",
      photos: o.photos || [],
      videos: [],
      presentation_url: o.presentation_url || "",
      commission: o.commission || "",
      commission_notes: "",
    })
    setPhotoInput("")
    setVideoInput("")
    setDialog(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.category) return
    setSaving(true)
    const body: Record<string, unknown> = {
      title: form.title,
      category: form.category,
      subtype: form.subtype || undefined,
      city: form.city || undefined,
      region: form.region || undefined,
      address: form.address || undefined,
      price: form.price ? Number(form.price) : undefined,
      price_label: form.price_label || undefined,
      area: form.area ? Number(form.area) : undefined,
      yield_percent: form.yield_percent ? Number(form.yield_percent) : undefined,
      description: form.description || undefined,
      status: form.status,
      photos: form.photos,
      videos: form.videos,
      presentation_url: form.presentation_url || undefined,
      commission: form.commission || undefined,
      commission_notes: form.commission_notes || undefined,
    }
    if (editing) body.id = editing.id
    await fetch(AGG_ADMIN_URL, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setDialog(false)
    load()
  }

  const addPhoto = () => {
    if (!photoInput.trim()) return
    setForm(f => ({ ...f, photos: [...f.photos, photoInput.trim()] }))
    setPhotoInput("")
  }

  const removePhoto = (i: number) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))
  }

  const addVideo = () => {
    if (!videoInput.trim()) return
    setForm(f => ({ ...f, videos: [...f.videos, videoInput.trim()] }))
    setVideoInput("")
  }

  const removeVideo = (i: number) => {
    setForm(f => ({ ...f, videos: f.videos.filter((_, idx) => idx !== i) }))
  }

  const filtered = offers.filter(o =>
    !search ||
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    (o.city || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-lg text-white">Предложения базы</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Всего: {total} объектов · {totalFixations} фиксаций
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600 w-44"
            />
          </div>
          <Select value={catFilter || "all"} onValueChange={v => setCatFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-[#2a2a2a]">
              <SelectItem value="all">Все категории</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter || "all"} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-32 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-[#2a2a2a]">
              <SelectItem value="all">Все</SelectItem>
              {STATUS_OPTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={load} variant="ghost" size="icon" className="text-gray-500 hover:text-white">
            <Icon name="RefreshCw" className="h-4 w-4" />
          </Button>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            <Icon name="Plus" className="h-4 w-4 mr-1.5" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-600">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icon name="FolderOpen" className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-500">Предложений нет</p>
            <Button onClick={openNew} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm">
              Добавить первое
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">Название</th>
                <th className="text-left px-3 py-3 font-medium">Категория</th>
                <th className="text-left px-3 py-3 font-medium">Город</th>
                <th className="text-left px-3 py-3 font-medium">Цена</th>
                <th className="text-left px-3 py-3 font-medium">Статус</th>
                <th className="text-left px-3 py-3 font-medium">Фото</th>
                <th className="text-right px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr
                  key={o.id}
                  className="border-b border-[#141414] hover:bg-[#111] transition-colors cursor-pointer"
                  onClick={() => openEdit(o)}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white line-clamp-1">{o.title}</div>
                    {o.subtype && <div className="text-xs text-gray-600">{o.subtype}</div>}
                  </td>
                  <td className="px-3 py-3.5 text-gray-400">{CAT_LABEL[o.category] || o.category}</td>
                  <td className="px-3 py-3.5 text-gray-400">{o.city || "—"}</td>
                  <td className="px-3 py-3.5 text-white font-medium">
                    {o.price_label || formatPrice(o.price ?? null)}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || "text-gray-400 bg-gray-500/10"}`}>
                      {STATUS_OPTS.find(s => s.id === o.status)?.label || o.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-gray-500 text-xs">
                    {o.photos?.length ? `${o.photos.length} фото` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="text-gray-600 hover:text-white transition-colors"
                      onClick={e => { e.stopPropagation(); openEdit(o) }}
                    >
                      <Icon name="Pencil" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Диалог добавления/редактирования */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать предложение" : "Новое предложение"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Название */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Название *</label>
              <Input
                placeholder="Бизнес-центр Омега, БЦ 7one..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Категория */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Категория *</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#2a2a2a]">
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Подтип */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Подтип</label>
              <Input
                placeholder="Апарт-отель, ТЦ, База отдыха..."
                value={form.subtype}
                onChange={e => setForm(f => ({ ...f, subtype: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Город */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Город</label>
              <Input
                placeholder="Москва"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Регион */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Регион</label>
              <Input
                placeholder="Московская область"
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Адрес */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Адрес</label>
              <Input
                placeholder="ул. Ленина, 1"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Цена */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Цена (₽)</label>
              <Input
                placeholder="110000000"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                type="number"
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Метка цены */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Метка цены (опционально)</label>
              <Input
                placeholder="110 000 000 ₽ / от 5 млн ₽"
                value={form.price_label}
                onChange={e => setForm(f => ({ ...f, price_label: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Площадь */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Площадь (м²)</label>
              <Input
                placeholder="1200"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                type="number"
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Доходность */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Доходность (%)</label>
              <Input
                placeholder="12.5"
                value={form.yield_percent}
                onChange={e => setForm(f => ({ ...f, yield_percent: e.target.value }))}
                type="number"
                step="0.1"
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Комиссия */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Комиссия</label>
              <Input
                placeholder="3% от сделки"
                value={form.commission}
                onChange={e => setForm(f => ({ ...f, commission: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Статус */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Статус</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#2a2a2a]">
                  {STATUS_OPTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Условия комиссии */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Условия комиссии</label>
              <Input
                placeholder="Выплата по факту сделки, без порога"
                value={form.commission_notes}
                onChange={e => setForm(f => ({ ...f, commission_notes: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Описание */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Описание</label>
              <Textarea
                placeholder="Подробное описание объекта..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Фото */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Фотографии (URL)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="https://..."
                  value={photoInput}
                  onChange={e => setPhotoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPhoto()}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
                <Button type="button" onClick={addPhoto} variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
                  <Icon name="Plus" className="h-4 w-4" />
                </Button>
              </div>
              {form.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-16 h-12 object-cover rounded-lg border border-[#2a2a2a]" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Видео */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Видео (ссылки YouTube, VK)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoInput}
                  onChange={e => setVideoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addVideo()}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
                <Button type="button" onClick={addVideo} variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
                  <Icon name="Plus" className="h-4 w-4" />
                </Button>
              </div>
              {form.videos.length > 0 && (
                <div className="space-y-1">
                  {form.videos.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-blue-400 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2">
                      <Icon name="Play" className="h-3 w-3 shrink-0" />
                      <span className="flex-1 truncate">{url}</span>
                      <button onClick={() => removeVideo(i)} className="text-red-500 hover:text-red-400 shrink-0">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Презентация */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Ссылка на PDF-презентацию</label>
              <Input
                placeholder="https://... (Google Drive, Яндекс.Диск)"
                value={form.presentation_url}
                onChange={e => setForm(f => ({ ...f, presentation_url: e.target.value }))}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-[#1f1f1f]">
            <Button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {saving ? "Сохранение..." : editing ? "Сохранить изменения" : "Добавить предложение"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialog(false)}
              className="border-[#2a2a2a] text-gray-400 hover:text-white"
            >
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
