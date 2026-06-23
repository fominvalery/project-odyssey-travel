import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const CONTRACTOR_TYPES = [
  "Строительство и ремонт",
  "Клининг",
  "Дизайн интерьера",
  "Страхование",
  "Ипотека и финансы",
  "Юридические услуги",
  "Оценка недвижимости",
  "Управление объектами",
  "Фотосъёмка",
  "Другое",
]

export interface ContractorForm {
  title: string
  type: string
  company_name: string
  company_phone: string
  company_email: string
  company_website: string
  reward: string
  reward_type: "percent" | "fixed"
  description: string
  region: string
  status: string
  logo_url: string
  photos: string[]
}

const EMPTY: ContractorForm = {
  title: "",
  type: "",
  company_name: "",
  company_phone: "",
  company_email: "",
  company_website: "",
  reward: "",
  reward_type: "percent",
  description: "",
  region: "",
  status: "active",
  logo_url: "",
  photos: [],
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (data: ContractorForm) => void
  saving?: boolean
}

const UPLOAD_URL = (func2url as Record<string, string>)["upload-photo"]

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
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

export default function AddContractorDialog({ open, onOpenChange, onSave, saving }: Props) {
  const [form, setForm] = useState<ContractorForm>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<ContractorForm>) => setForm(f => ({ ...f, ...p }))

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

  const handleClose = (v: boolean) => {
    if (!v) setForm(EMPTY)
    onOpenChange(v)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.type || !form.company_name.trim() || !form.reward.trim()) return
    onSave(form)
    setForm(EMPTY)
  }

  const canSave = form.title.trim() && form.type && form.company_name.trim() && form.reward.trim()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Handshake" className="h-5 w-5 text-orange-400" />
            Добавить подряд
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">

          {/* Название подряда */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Название подряда *</label>
            <Input
              placeholder="Клининг офисов, Страхование недвижимости..."
              value={form.title}
              onChange={e => patch({ title: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Тип подряда */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Тип подряда *</label>
            <Select value={form.type} onValueChange={v => patch({ type: v })}>
              <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                {CONTRACTOR_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Регион */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Регион / Город</label>
            <Input
              placeholder="Москва, вся Россия..."
              value={form.region}
              onChange={e => patch({ region: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Компания-партнёр */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Компания-партнёр *</label>
            <Input
              placeholder="ООО «Чистота», СК «Надёжность»..."
              value={form.company_name}
              onChange={e => patch({ company_name: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Вознаграждение */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Вознаграждение брокера *</label>
            <Input
              placeholder="5 или 15000"
              value={form.reward}
              onChange={e => patch({ reward: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Тип вознаграждения */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Тип вознаграждения</label>
            <Select value={form.reward_type} onValueChange={v => patch({ reward_type: v as "percent" | "fixed" })}>
              <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="percent">% от сделки</SelectItem>
                <SelectItem value="fixed">Фиксированная сумма (₽)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Описание условий */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Описание условий</label>
            <Textarea
              placeholder="Подробности подряда, что нужно сделать, условия выплаты вознаграждения..."
              value={form.description}
              onChange={e => patch({ description: e.target.value })}
              rows={3}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Контакты — только для менеджеров/РОП */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-500">Контакты компании</label>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Icon name="Lock" className="h-3 w-3" />
                Скрыто от брокеров
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="+7 (999) 000-00-00"
                value={form.company_phone}
                onChange={e => patch({ company_phone: e.target.value })}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 text-sm"
              />
              <Input
                placeholder="info@company.ru"
                value={form.company_email}
                onChange={e => patch({ company_email: e.target.value })}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 text-sm"
              />
              <Input
                placeholder="https://company.ru"
                value={form.company_website}
                onChange={e => patch({ company_website: e.target.value })}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 text-sm"
              />
            </div>
          </div>

          {/* Статус */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Статус</label>
            <Select value={form.status} onValueChange={v => patch({ status: v })}>
              <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="paused">Приостановлен</SelectItem>
                <SelectItem value="closed">Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Логотип */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Логотип партнёра</label>
            <div className="flex items-center gap-3">
              {form.logo_url && (
                <img src={form.logo_url} alt="logo" className="h-10 w-10 rounded-lg object-cover border border-[#2a2a2a]" />
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
                {form.logo_url ? "Заменить" : "Загрузить"}
              </Button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          {/* Фотографии */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-2 block">Фотографии услуги</label>
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
                className="h-20 w-20 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center text-gray-600 hover:border-[#3a3a3a] hover:text-gray-400 transition-colors"
              >
                {uploading ? (
                  <Icon name="Loader2" className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon name="Plus" className="h-5 w-5" />
                )}
              </button>
              <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-[#1f1f1f]">
          <Button variant="ghost" onClick={() => handleClose(false)} className="text-gray-400 hover:text-white">
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving || uploading}
            className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
          >
            {saving ? (
              <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Сохраняем...</>
            ) : (
              <><Icon name="Handshake" className="h-4 w-4 mr-2" />Добавить подряд</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
