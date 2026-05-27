import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (data: DeveloperForm) => void
  saving?: boolean
}

export interface DeveloperForm {
  name: string
  description: string
  city: string
  website: string
  phone: string
  email: string
  photos: string[]
  videos: string[]
  logo_url: string
}

const EMPTY: DeveloperForm = {
  name: "",
  description: "",
  city: "",
  website: "",
  phone: "",
  email: "",
  photos: [],
  videos: [],
  logo_url: "",
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

export default function AddDeveloperDialog({ open, onOpenChange, onSave, saving }: Props) {
  const [form, setForm] = useState<DeveloperForm>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [videoInput, setVideoInput] = useState("")
  const photoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<DeveloperForm>) => setForm(f => ({ ...f, ...p }))

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const urls = (await Promise.all(files.map(uploadFile))).filter(Boolean) as string[]
    patch({ photos: [...form.photos, ...urls] })
    setUploading(false)
    if (photoRef.current) photoRef.current.value = ""
  }

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadFile(file)
    if (url) patch({ logo_url: url })
    setUploading(false)
    if (logoRef.current) logoRef.current.value = ""
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Building2" className="h-5 w-5 text-violet-400" />
            Добавить застройщика / компанию
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Название */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Название *</label>
            <Input
              placeholder="ПИК, Самолёт, Sminex..."
              value={form.name}
              onChange={e => patch({ name: e.target.value })}
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

          {/* Сайт */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Сайт</label>
            <Input
              placeholder="https://developer.ru"
              value={form.website}
              onChange={e => patch({ website: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Телефон</label>
            <Input
              placeholder="+7 (999) 000-00-00"
              value={form.phone}
              onChange={e => patch({ phone: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <Input
              placeholder="info@developer.ru"
              value={form.email}
              onChange={e => patch({ email: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Описание */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Описание</label>
            <Textarea
              placeholder="О компании, история, ключевые проекты..."
              value={form.description}
              onChange={e => patch({ description: e.target.value })}
              rows={3}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Логотип */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-2 block">Логотип</label>
            <div className="flex items-center gap-3">
              {form.logo_url && (
                <img src={form.logo_url} alt="logo" className="h-14 w-14 rounded-lg object-cover border border-[#2a2a2a]" />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoRef.current?.click()}
                disabled={uploading}
                className="border-[#2a2a2a] text-gray-400 hover:text-white text-xs"
              >
                <Icon name="Upload" className="h-3.5 w-3.5 mr-1.5" />
                {form.logo_url ? "Заменить" : "Загрузить логотип"}
              </Button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          {/* Фото */}
          <div className="col-span-2">
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
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={uploading}
                className="h-20 w-20 rounded-lg border border-dashed border-[#2a2a2a] bg-[#0a0a0a] flex flex-col items-center justify-center gap-1 hover:border-blue-500/50 transition-colors disabled:opacity-50"
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
            <label className="text-xs text-gray-500 mb-2 block">Видео (ссылка Rutube, VK Video, YouTube)</label>
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
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 text-xs text-gray-400 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-2 py-1.5 truncate">{v}</div>
                <button onClick={() => patch({ videos: form.videos.filter((_, idx) => idx !== i) })} className="text-gray-600 hover:text-red-400">
                  <Icon name="X" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#1f1f1f] mt-2">
          <Button
            onClick={handleSave}
            disabled={!form.name.trim() || saving || uploading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saving ? <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="Save" className="h-4 w-4 mr-2" />}
            Сохранить застройщика
          </Button>
          <Button variant="ghost" onClick={() => handleClose(false)} className="text-gray-400">
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
