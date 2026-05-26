import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { Offer, OfferForm, CATEGORIES, STATUS_OPTS } from "./AggOffersTypes"

interface Props {
  open: boolean
  editing: Offer | null
  form: OfferForm
  saving: boolean
  photoInput: string
  videoInput: string
  onOpenChange: (v: boolean) => void
  onFormChange: (patch: Partial<OfferForm>) => void
  onPhotoInputChange: (v: string) => void
  onVideoInputChange: (v: string) => void
  onAddPhoto: () => void
  onRemovePhoto: (i: number) => void
  onAddVideo: () => void
  onRemoveVideo: (i: number) => void
  onSave: () => void
}

export default function AggOffersDialog({
  open,
  editing,
  form,
  saving,
  photoInput,
  videoInput,
  onOpenChange,
  onFormChange,
  onPhotoInputChange,
  onVideoInputChange,
  onAddPhoto,
  onRemovePhoto,
  onAddVideo,
  onRemoveVideo,
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={e => onFormChange({ title: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Категория *</label>
            <Select value={form.category} onValueChange={v => onFormChange({ category: v })}>
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
              onChange={e => onFormChange({ subtype: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Город */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Город</label>
            <Input
              placeholder="Москва"
              value={form.city}
              onChange={e => onFormChange({ city: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Регион */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Регион</label>
            <Input
              placeholder="Московская область"
              value={form.region}
              onChange={e => onFormChange({ region: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Адрес */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Адрес</label>
            <Input
              placeholder="ул. Ленина, 1"
              value={form.address}
              onChange={e => onFormChange({ address: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Цена */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Цена (₽)</label>
            <Input
              placeholder="110000000"
              value={form.price}
              onChange={e => onFormChange({ price: e.target.value })}
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
              onChange={e => onFormChange({ price_label: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Площадь */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Площадь (м²)</label>
            <Input
              placeholder="1200"
              value={form.area}
              onChange={e => onFormChange({ area: e.target.value })}
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
              onChange={e => onFormChange({ yield_percent: e.target.value })}
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
              onChange={e => onFormChange({ commission: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Статус */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Статус</label>
            <Select value={form.status} onValueChange={v => onFormChange({ status: v })}>
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
              onChange={e => onFormChange({ commission_notes: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>

          {/* Описание */}
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Описание</label>
            <Textarea
              placeholder="Подробное описание объекта..."
              value={form.description}
              onChange={e => onFormChange({ description: e.target.value })}
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
                onChange={e => onPhotoInputChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onAddPhoto()}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
              <Button type="button" onClick={onAddPhoto} variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
                <Icon name="Plus" className="h-4 w-4" />
              </Button>
            </div>
            {form.photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-16 h-12 object-cover rounded-lg border border-[#2a2a2a]" />
                    <button
                      onClick={() => onRemovePhoto(i)}
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
                onChange={e => onVideoInputChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onAddVideo()}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
              />
              <Button type="button" onClick={onAddVideo} variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
                <Icon name="Plus" className="h-4 w-4" />
              </Button>
            </div>
            {form.videos.length > 0 && (
              <div className="space-y-1">
                {form.videos.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-blue-400 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2">
                    <Icon name="Play" className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{url}</span>
                    <button onClick={() => onRemoveVideo(i)} className="text-red-500 hover:text-red-400 shrink-0">×</button>
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
              onChange={e => onFormChange({ presentation_url: e.target.value })}
              className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-[#1f1f1f]">
          <Button
            onClick={onSave}
            disabled={!form.title.trim() || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {saving ? "Сохранение..." : editing ? "Сохранить изменения" : "Добавить предложение"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2a2a2a] text-gray-400 hover:text-white"
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
