import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (data: ProjectForm) => void
  saving?: boolean
}

export interface ProjectForm {
  name: string
  type: string
  city: string
  address: string
  developer: string
  class_type: string
  status: string
  total_area: string
  floors: string
  price_from: string
  completion_date: string
  description: string
  photos: string[]
  videos: string[]
}

const PROJECT_TYPES = [
  { id: "bc",    label: "Бизнес-центр (БЦ)" },
  { id: "mfk",   label: "МФК" },
  { id: "zhk",   label: "Жилой комплекс (ЖК)" },
  { id: "kp",    label: "Коттеджный посёлок" },
  { id: "tc",    label: "Торговый центр (ТЦ)" },
  { id: "sk",    label: "Складской комплекс" },
  { id: "gk",    label: "Гостиничный комплекс" },
  { id: "other", label: "Другое" },
]

const PROJECT_CLASSES = [
  { id: "A+",  label: "Класс A+" },
  { id: "A",   label: "Класс A" },
  { id: "B+",  label: "Класс B+" },
  { id: "B",   label: "Класс B" },
  { id: "C",   label: "Класс C" },
  { id: "eco", label: "Эконом" },
  { id: "biz", label: "Бизнес" },
  { id: "pre", label: "Премиум" },
]

const PROJECT_STATUSES = [
  { id: "planned",      label: "Планируется" },
  { id: "construction", label: "Строится" },
  { id: "completed",    label: "Сдан" },
  { id: "active",       label: "Активно продаётся" },
]

const EMPTY: ProjectForm = {
  name: "",
  type: "bc",
  city: "",
  address: "",
  developer: "",
  class_type: "",
  status: "active",
  total_area: "",
  floors: "",
  price_from: "",
  completion_date: "",
  description: "",
  photos: [],
  videos: [],
}

const UPLOAD_URL = (func2url as Record<string, string>)["upload-photo"]
const MAX_SIZE = 1600
const QUALITY = 0.85

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", QUALITY))
    }
    img.onerror = reject
    img.src = url
  })
}

async function uploadFile(file: File): Promise<string | null> {
  try {
    const base64 = await compressImage(file)
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, content_type: "image/jpeg" }),
    })
    const data = await res.json()
    return data.url || null
  } catch { return null }
}

export default function AddProjectDialog({ open, onOpenChange, onSave, saving }: Props) {
  const [form, setForm] = useState<ProjectForm>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [videoInput, setVideoInput] = useState("")
  const photoRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<ProjectForm>) => setForm(f => ({ ...f, ...p }))

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const urls = (await Promise.all(files.map(uploadFile))).filter(Boolean) as string[]
    patch({ photos: [...form.photos, ...urls] })
    setUploading(false)
    if (photoRef.current) photoRef.current.value = ""
  }

  const addVideo = () => {
    if (!videoInput.trim()) return
    patch({ videos: [...form.videos, videoInput.trim()] })
    setVideoInput("")
  }

  const handleClose = (v: boolean) => {
    if (!v) setForm(EMPTY)
    onOpenChange(v)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave(form)
    setForm(EMPTY)
  }

  // Для видео — конвертируем ссылку в embed
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) return url.replace("watch?v=", "embed/")
    if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/")
    if (url.includes("vk.com/video")) return url.replace("vk.com/video", "vk.com/video_ext.php?oid=")
    if (url.includes("rutube.ru/video/")) {
      const id = url.split("/video/")[1]?.replace(/\//g, "")
      return id ? `https://rutube.ru/play/embed/${id}` : url
    }
    return url
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="LayoutDashboard" className="h-5 w-5 text-amber-400" />
            Добавить проект
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Название */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Название проекта *</label>
            <Input
              placeholder="БЦ Москва-Сити, ЖК Лесной, МФК Кристалл..."
              value={form.name}
              onChange={e => patch({ name: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Тип */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Тип проекта</label>
            <Select value={form.type} onValueChange={v => patch({ type: v })}>
              <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#2a2a2a]">
                {PROJECT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Класс */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Класс</label>
            <Select value={form.class_type || "none"} onValueChange={v => patch({ class_type: v === "none" ? "" : v })}>
              <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue placeholder="Не указан" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#2a2a2a]">
                <SelectItem value="none">Не указан</SelectItem>
                {PROJECT_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Статус */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Статус</label>
            <Select value={form.status} onValueChange={v => patch({ status: v })}>
              <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#2a2a2a]">
                {PROJECT_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Застройщик */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Застройщик</label>
            <Input
              placeholder="ПИК, Самолёт, Sminex..."
              value={form.developer}
              onChange={e => patch({ developer: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Город */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Город</label>
            <Input
              placeholder="Москва"
              value={form.city}
              onChange={e => patch({ city: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Адрес */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Адрес</label>
            <Input
              placeholder="ул. Ленина, 1"
              value={form.address}
              onChange={e => patch({ address: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Площадь */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Общая площадь (м²)</label>
            <Input
              placeholder="50000"
              value={form.total_area}
              onChange={e => patch({ total_area: e.target.value })}
              type="number"
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Этажи */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Этажность</label>
            <Input
              placeholder="25"
              value={form.floors}
              onChange={e => patch({ floors: e.target.value })}
              type="number"
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Цена от */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Цена от (₽)</label>
            <Input
              placeholder="5000000"
              value={form.price_from}
              onChange={e => patch({ price_from: e.target.value })}
              type="number"
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Срок сдачи */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Срок сдачи</label>
            <Input
              placeholder="Q2 2026, 2027..."
              value={form.completion_date}
              onChange={e => patch({ completion_date: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Описание */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Описание</label>
            <Textarea
              placeholder="Описание проекта, инфраструктура, преимущества..."
              value={form.description}
              onChange={e => patch({ description: e.target.value })}
              rows={3}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Фото */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-2 block">Фотографии проекта</label>
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
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={uploading}
                className="h-20 w-20 rounded-lg border border-dashed border-[#2a2a2a] bg-[#0a0a0a] flex flex-col items-center justify-center gap-1 hover:border-amber-500/50 transition-colors disabled:opacity-50"
              >
                {uploading
                  ? <Icon name="Loader2" className="h-5 w-5 text-gray-500 animate-spin" />
                  : <Icon name="Plus" className="h-5 w-5 text-gray-500" />
                }
                <span className="text-[10px] text-gray-600">Фото</span>
              </button>
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          </div>

          {/* Видео */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-2 block">Видео (Rutube, VK Video, YouTube)</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="https://rutube.ru/video/..."
                value={videoInput}
                onChange={e => setVideoInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addVideo()}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 text-sm"
              />
              <Button type="button" onClick={addVideo} variant="outline" size="sm" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
                <Icon name="Plus" className="h-4 w-4" />
              </Button>
            </div>
            {form.videos.map((v, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 text-xs text-gray-400 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-2 py-1.5 truncate">{v}</div>
                  <button onClick={() => patch({ videos: form.videos.filter((_, idx) => idx !== i) })} className="text-gray-600 hover:text-red-400">
                    <Icon name="X" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <iframe
                  src={getEmbedUrl(v)}
                  className="w-full h-40 rounded-lg border border-[#2a2a2a]"
                  allowFullScreen
                  title={`video-${i}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#1f1f1f] mt-2">
          <Button
            onClick={handleSave}
            disabled={!form.name.trim() || saving || uploading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saving ? <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="Save" className="h-4 w-4 mr-2" />}
            Сохранить проект
          </Button>
          <Button variant="ghost" onClick={() => handleClose(false)} className="text-gray-400">
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
