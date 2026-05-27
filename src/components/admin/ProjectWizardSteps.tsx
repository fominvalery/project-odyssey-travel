import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import SortablePhotoGrid from "@/components/wizard/SortablePhotoGrid"
import AddressMapPicker from "@/components/wizard/AddressMapPicker"
import { PROJECT_TYPES, PROJECT_CLASSES, PROJECT_STATUSES, TYPE_LABELS } from "./projectWizardData"

// ── Шаг 1: Тип проекта ──────────────────────────────────────────────────────

interface StepTypeProps {
  projectType: string
  onSelect: (id: string) => void
}

export function StepType({ projectType, onSelect }: StepTypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Выберите тип проекта</h2>
        <p className="text-sm text-gray-500">От типа зависят поля и логика заполнения</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROJECT_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all overflow-hidden ${
              projectType === t.id ? `${t.border} bg-gradient-to-br ${t.bg}` : "border-[#2a2a2a] bg-[#111] hover:border-[#3a3a3a]"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              projectType === t.id ? t.accent : "bg-[#1f1f1f]"
            }`}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} className="h-5 w-5 text-white" />
            </div>
            <div className="font-semibold text-white text-sm">{t.label}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t.desc}</div>
            {projectType === t.id && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Icon name="Check" className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Шаг 2: Локация ───────────────────────────────────────────────────────────

interface StepLocationProps {
  city: string
  address: string
  lat: number | undefined
  lon: number | undefined
  onCityChange: (v: string) => void
  onAddressChange: (v: string) => void
  onCoordsChange: (lat: number, lon: number) => void
}

export function StepLocation({ city, address, lat, lon, onCityChange, onAddressChange, onCoordsChange }: StepLocationProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Локация проекта</h2>
        <p className="text-sm text-gray-500">Укажите адрес и отметьте на карте</p>
      </div>
      <AddressMapPicker
        city={city}
        address={address}
        lat={lat}
        lon={lon}
        onCityChange={onCityChange}
        onAddressChange={onAddressChange}
        onCoordsChange={onCoordsChange}
      />
    </div>
  )
}

// ── Шаг 3: Характеристики ────────────────────────────────────────────────────

interface StepDetailsProps {
  projectType: string
  city: string
  name: string; setName: (v: string) => void
  developer: string; setDeveloper: (v: string) => void
  classType: string; setClassType: (v: string) => void
  status: string; setStatus: (v: string) => void
  totalArea: string; setTotalArea: (v: string) => void
  floors: string; setFloors: (v: string) => void
  priceFrom: string; setPriceFrom: (v: string) => void
  completionDate: string; setCompletionDate: (v: string) => void
  commission: string; setCommission: (v: string) => void
  commissionNotes: string; setCommissionNotes: (v: string) => void
}

export function StepDetails({
  projectType, city,
  name, setName, developer, setDeveloper,
  classType, setClassType, status, setStatus,
  totalArea, setTotalArea, floors, setFloors,
  priceFrom, setPriceFrom, completionDate, setCompletionDate,
  commission, setCommission, commissionNotes, setCommissionNotes,
}: StepDetailsProps) {
  const selectedType = PROJECT_TYPES.find(t => t.id === projectType)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Характеристики</h2>
        <p className="text-sm text-gray-500">
          {selectedType ? `${selectedType.label} · ` : ""}{city || "Город не указан"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Название проекта *</label>
          <Input
            placeholder={`${TYPE_LABELS[projectType] || "Проект"} в ${city || "городе"}...`}
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Застройщик</label>
          <Input
            placeholder="ПИК, Самолёт, Sminex..."
            value={developer}
            onChange={e => setDeveloper(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Класс</label>
          <Select value={classType || "none"} onValueChange={v => setClassType(v === "none" ? "" : v)}>
            <SelectTrigger className="bg-[#111] border-[#2a2a2a] text-white h-11">
              <SelectValue placeholder="Не указан" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-[#2a2a2a]">
              <SelectItem value="none">Не указан</SelectItem>
              {PROJECT_CLASSES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Статус строительства</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-[#111] border-[#2a2a2a] text-white h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-[#2a2a2a]">
              {PROJECT_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Общая площадь (м²)</label>
          <Input
            placeholder="50 000"
            value={totalArea}
            onChange={e => setTotalArea(e.target.value)}
            type="number"
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Этажность</label>
          <Input
            placeholder="25"
            value={floors}
            onChange={e => setFloors(e.target.value)}
            type="number"
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Цена от (₽)</label>
          <Input
            placeholder="5 000 000"
            value={priceFrom}
            onChange={e => setPriceFrom(e.target.value)}
            type="number"
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Срок сдачи</label>
          <Input
            placeholder="Q2 2026, 2027..."
            value={completionDate}
            onChange={e => setCompletionDate(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Комиссия</label>
          <Input
            placeholder="3% от сделки"
            value={commission}
            onChange={e => setCommission(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Условия выплаты комиссии</label>
          <Input
            placeholder="По факту сделки, без порога..."
            value={commissionNotes}
            onChange={e => setCommissionNotes(e.target.value)}
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
          />
        </div>
      </div>
    </div>
  )
}

// ── Шаг 4: Описание и медиа ──────────────────────────────────────────────────

interface StepMediaProps {
  description: string; setDescription: (v: string) => void
  photos: string[]; setPhotos: (v: string[]) => void
  uploadingPhoto: boolean; setUploadingPhoto: (v: boolean) => void
  videos: string[]; setVideos: (fn: (v: string[]) => string[]) => void
  videoInput: string; setVideoInput: (v: string) => void
  generating: boolean
  onGenerate: () => void
  onAddVideo: () => void
  getEmbedUrl: (url: string) => string
}

export function StepMedia({
  description, setDescription,
  photos, setPhotos,
  uploadingPhoto, setUploadingPhoto,
  videos, setVideos,
  videoInput, setVideoInput,
  generating, onGenerate, onAddVideo, getEmbedUrl,
}: StepMediaProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Описание и медиа</h2>
        <p className="text-sm text-gray-500">Расскажите о проекте, добавьте фото и видео</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">Описание проекта</label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onGenerate}
            disabled={generating}
            className="text-xs text-emerald-400 hover:text-emerald-300 h-6 px-2"
          >
            {generating
              ? <><Icon name="Loader2" className="h-3 w-3 mr-1 animate-spin" />Генерирую...</>
              : <><Icon name="Sparkles" className="h-3 w-3 mr-1" />Написать с ИИ</>
            }
          </Button>
        </div>
        <Textarea
          placeholder="Описание проекта, инфраструктура, преимущества, особенности..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-3 block">Фотографии проекта</label>
        <SortablePhotoGrid
          photos={photos}
          uploadingPhoto={uploadingPhoto}
          onPhotosChange={setPhotos}
          onUploadingChange={setUploadingPhoto}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-2 block">Видео (Rutube, VK Video, YouTube)</label>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="https://rutube.ru/video/..."
            value={videoInput}
            onChange={e => setVideoInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onAddVideo()}
            className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600"
          />
          <Button type="button" onClick={onAddVideo} variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
            <Icon name="Plus" className="h-4 w-4" />
          </Button>
        </div>
        {videos.map((v, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="Video" className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span className="flex-1 text-xs text-gray-400 truncate">{v}</span>
              <button onClick={() => setVideos(vs => vs.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400">
                <Icon name="X" className="h-3.5 w-3.5" />
              </button>
            </div>
            <iframe
              src={getEmbedUrl(v)}
              className="w-full h-44 rounded-xl border border-[#2a2a2a]"
              allowFullScreen
              title={`video-${i}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Шаг 5: Публикация ────────────────────────────────────────────────────────

interface StepPublishProps {
  projectType: string
  name: string
  city: string
  address: string
  developer: string
  classType: string
  totalArea: string
  floors: string
  priceFrom: string
  completionDate: string
  commission: string
  photos: string[]
  publishToBase: boolean
  onTogglePublish: () => void
}

export function StepPublish({
  projectType, name, city, address,
  developer, classType, totalArea, floors,
  priceFrom, completionDate, commission,
  photos, publishToBase, onTogglePublish,
}: StepPublishProps) {
  const selectedType = PROJECT_TYPES.find(t => t.id === projectType)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Публикация</h2>
        <p className="text-sm text-gray-500">Проверьте данные и опубликуйте проект</p>
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedType?.accent ?? "bg-[#1f1f1f]"}`}>
            <Icon name={(selectedType?.icon ?? "Building2") as Parameters<typeof Icon>[0]["name"]} className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">{name || TYPE_LABELS[projectType] || "Проект"}</div>
            <div className="text-xs text-gray-500">{selectedType?.label} · {city || "Город не указан"}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {address && <div className="col-span-2 text-gray-400 text-xs">{address}</div>}
          {developer && <div><span className="text-gray-500">Застройщик: </span><span className="text-white">{developer}</span></div>}
          {classType && <div><span className="text-gray-500">Класс: </span><span className="text-white">{classType}</span></div>}
          {totalArea && <div><span className="text-gray-500">Площадь: </span><span className="text-white">{Number(totalArea).toLocaleString("ru")} м²</span></div>}
          {floors && <div><span className="text-gray-500">Этажность: </span><span className="text-white">{floors}</span></div>}
          {priceFrom && <div><span className="text-gray-500">От: </span><span className="text-white">{Number(priceFrom).toLocaleString("ru")} ₽</span></div>}
          {completionDate && <div><span className="text-gray-500">Сдача: </span><span className="text-white">{completionDate}</span></div>}
          {commission && <div className="col-span-2"><span className="text-gray-500">Комиссия: </span><span className="text-white">{commission}</span></div>}
        </div>
        {photos.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {photos.slice(0, 4).map((p, i) => (
              <img key={i} src={p} alt="" className="h-12 w-12 rounded-lg object-cover border border-[#2a2a2a]" />
            ))}
            {photos.length > 4 && <div className="h-12 w-12 rounded-lg bg-[#1f1f1f] flex items-center justify-center text-xs text-gray-500">+{photos.length - 4}</div>}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-5">
        <button onClick={onTogglePublish} className="flex items-center justify-between w-full">
          <div>
            <div className="font-medium text-sm">Разместить в Базе / Проектах</div>
            <div className="text-xs text-gray-500 mt-0.5">Проект будет виден участникам платформы</div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${publishToBase ? "bg-amber-500" : "bg-[#2a2a2a]"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${publishToBase ? "left-7" : "left-1"}`} />
          </div>
        </button>
      </div>
    </div>
  )
}
