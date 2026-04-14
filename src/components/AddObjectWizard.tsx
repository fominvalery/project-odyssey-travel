import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface AddObjectWizardProps {
  onClose: () => void
  onSave: (obj: ObjectData) => void
  userId?: string
}

export interface ObjectData {
  id: number | string
  type: string
  title: string
  city: string
  address: string
  price: string
  area: string
  yield: string
  description: string
  status: string
  category: string
  published?: boolean
  photos?: string[]
}

const STEPS = ["Основное", "Характеристики", "Лендинг", "Презентация", "Публикация"]

const CATEGORIES = [
  { id: "investment", label: "Инвестиции", desc: "ROI, доходность, стратегия", icon: "TrendingUp" },
  { id: "commercial", label: "Коммерция", desc: "Офисы, склады, ритейл", icon: "Building2" },
  { id: "auction", label: "Торги", desc: "Аукционы и банкротство", icon: "Gavel" },
  { id: "newbuild", label: "Новостройки", desc: "ЖК, шахматка, застройщик", icon: "Construction" },
]

const INVESTMENT_FIELDS = [
  { key: "roi", label: "ROI (%)", placeholder: "12" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "8.5" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "7" },
  { key: "rent", label: "Арендный доход (₽/мес)", placeholder: "150 000" },
  { key: "strategy", label: "Стратегия инвестирования", placeholder: "Долгосрочная аренда" },
]

const COMMERCIAL_FIELDS = [
  { key: "subtype", label: "Подтип", placeholder: "Офис / Склад / Ритейл" },
  { key: "floor", label: "Этаж", placeholder: "3" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "9" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.2" },
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B" },
]

const AUCTION_FIELDS = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "Торги.ру / МЭТС" },
  { key: "lot_number", label: "Номер лота", placeholder: "№ 12345" },
  { key: "auction_date", label: "Дата аукциона", placeholder: "01.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "5 000 000" },
  { key: "deposit", label: "Залог (₽)", placeholder: "500 000" },
]

const NEWBUILD_FIELDS = [
  { key: "complex", label: "Название ЖК", placeholder: "Парк Апрель" },
  { key: "developer", label: "Застройщик", placeholder: "ГК Самолёт" },
  { key: "delivery", label: "Срок сдачи", placeholder: "Q3 2026" },
  { key: "corpus", label: "Корпус / Секция", placeholder: "К1, С2" },
  { key: "chess", label: "Шахматка", placeholder: "Доступна" },
]

function getCategoryFields(catId: string) {
  if (catId === "investment") return INVESTMENT_FIELDS
  if (catId === "commercial") return COMMERCIAL_FIELDS
  if (catId === "auction") return AUCTION_FIELDS
  if (catId === "newbuild") return NEWBUILD_FIELDS
  return []
}

interface SortablePhotoProps {
  id: string
  url: string
  index: number
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  isFirst: boolean
  isLast: boolean
}

function SortablePhoto({ id, url, index, onRemove, onMoveLeft, onMoveRight, isFirst, isLast }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-xl overflow-hidden border border-[#1f1f1f] touch-none"
    >
      <img src={url} alt="" className="w-full h-full object-cover" />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Удалить */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <Icon name="X" className="h-3 w-3 text-white" />
      </button>

      {/* Стрелки (мобильный fallback) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {!isFirst && (
          <button
            type="button"
            onClick={onMoveLeft}
            className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Icon name="ChevronLeft" className="h-3 w-3 text-white" />
          </button>
        )}
        {!isLast && (
          <button
            type="button"
            onClick={onMoveRight}
            className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Icon name="ChevronRight" className="h-3 w-3 text-white" />
          </button>
        )}
      </div>

      {index === 0 && (
        <span className="absolute top-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md z-10">Главное</span>
      )}
    </div>
  )
}

export function AddObjectWizard({ onClose, onSave, userId }: AddObjectWizardProps) {
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState("")
  const [publishToMarket, setPublishToMarket] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", city: "", address: "", price: "", area: "",
    description: "", landing_title: "", landing_cta: "",
    presentation_notes: "",
  })
  const [categoryFields, setCategoryFields] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPhotos(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function movePhoto(from: number, to: number) {
    setPhotos(prev => arrayMove(prev, from, to))
  }

  function handleCategoryField(key: string, value: string) {
    setCategoryFields(prev => ({ ...prev, [key]: value }))
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingPhoto(true)
    const uploadUrl = (func2url as Record<string, string>)["upload-photo"]
    const uploaded: string[] = []
    for (const file of files) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string)
        reader.readAsDataURL(file)
      })
      try {
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, content_type: file.type }),
        })
        const data = await res.json()
        if (data.url) uploaded.push(data.url)
      } catch {
        // пропускаем файл при ошибке
      }
    }
    setPhotos(prev => [...prev, ...uploaded])
    setUploadingPhoto(false)
    if (photoInputRef.current) photoInputRef.current.value = ""
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  function handleNext() {
    if (step === 0 && !category) return
    setStep(s => Math.min(s + 1, 4))
  }

  function handleBack() {
    if (step === 0) { onClose(); return }
    setStep(s => Math.max(s - 1, 0))
  }

  async function handlePublish() {
    const cat = CATEGORIES.find(c => c.id === category)
    const objData = {
      user_id: userId ?? "",
      category,
      type: cat?.label ?? category,
      title: form.title || "Новый объект",
      city: form.city,
      address: form.address,
      price: form.price,
      area: form.area,
      yield_percent: categoryFields["yield"] ?? "",
      description: form.description,
      extra_fields: categoryFields,
      status: "Активен",
      published: publishToMarket,
      photos,
    }

    setSaving(true)
    try {
      const res = await fetch(func2url.objects, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(objData),
      })
      const data = await res.json()
      onSave({
        id: data.id ?? Date.now(),
        ...objData,
        yield: objData.yield_percent,
      })
    } catch {
      onSave({
        id: Date.now(),
        type: cat?.label ?? category,
        category,
        title: form.title || "Новый объект",
        city: form.city,
        address: form.address,
        price: form.price,
        area: form.area,
        yield: categoryFields["yield"] ?? "",
        description: form.description,
        status: "Активен",
        published: publishToMarket,
        photos,
      })
    } finally {
      setSaving(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Новый объект</h1>
        </div>

        {/* Прогресс */}
        <div className="flex items-center gap-0 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                i === step ? "bg-blue-600 text-white" :
                i < step ? "text-emerald-400" : "text-gray-500"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step ? "bg-emerald-500 text-white" :
                  i === step ? "bg-white text-blue-600" : "bg-[#1f1f1f] text-gray-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-emerald-500/40" : "bg-[#1f1f1f]"}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-8">Шаг {step + 1} из {STEPS.length}</p>

        {/* Шаг 1 — Выбор категории */}
        {step === 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`rounded-2xl border p-8 text-center transition-all hover:border-blue-500/50 ${
                    category === cat.id ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f] bg-[#111]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    category === cat.id ? "bg-blue-500/20" : "bg-[#1a1a1a]"
                  }`}>
                    <Icon name={cat.icon as "TrendingUp"} className={`h-6 w-6 ${category === cat.id ? "text-blue-400" : "text-gray-400"}`} />
                  </div>
                  <p className="font-semibold text-white mb-1">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.desc}</p>
                </button>
              ))}
            </div>
            <Input
              placeholder="Название объекта"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
            />
          </div>
        )}

        {/* Шаг 2 — Характеристики */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">Город</Label>
                <Input placeholder="Москва" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600" />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">Адрес</Label>
                <Input placeholder="ул. Тверская, 1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600" />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">Цена (₽)</Label>
                <Input placeholder="18 500 000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600" />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">Площадь (м²)</Label>
                <Input placeholder="142" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                  className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600" />
              </div>
            </div>

            {category && (
              <>
                <div className="border-t border-[#1f1f1f] pt-4">
                  <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-4">
                    {CATEGORIES.find(c => c.id === category)?.label} — дополнительные поля
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getCategoryFields(category).map(field => (
                      <div key={field.key}>
                        <Label className="text-xs text-gray-400 mb-1.5 block">{field.label}</Label>
                        <Input
                          placeholder={field.placeholder}
                          value={categoryFields[field.key] ?? ""}
                          onChange={e => handleCategoryField(field.key, e.target.value)}
                          className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Описание объекта</Label>
              <textarea
                rows={3}
                placeholder="Краткое описание для покупателей..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Фотографии */}
            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Фотографии объекта</Label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {photos.length > 0 && (
                <div className="mb-3">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={photos} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {photos.map((url, i) => (
                          <SortablePhoto
                            key={url}
                            id={url}
                            url={url}
                            index={i}
                            onRemove={() => removePhoto(i)}
                            onMoveLeft={() => movePhoto(i, i - 1)}
                            onMoveRight={() => movePhoto(i, i + 1)}
                            isFirst={i === 0}
                            isLast={i === photos.length - 1}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="aspect-square rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] flex flex-col items-center justify-center gap-1 hover:border-blue-500/50 transition-colors disabled:opacity-50"
                        >
                          <Icon name="Plus" className="h-5 w-5 text-gray-500" />
                          <span className="text-xs text-gray-600">Ещё</span>
                        </button>
                      </div>
                    </SortableContext>
                  </DndContext>
                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
                    <Icon name="GripHorizontal" className="h-3 w-3" /> Перетащите фото для изменения порядка. Первое — главное.
                  </p>
                </div>
              )}
              {photos.length === 0 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-6 flex flex-col items-center gap-2 hover:border-blue-500/50 transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Icon name="Loader2" className="h-6 w-6 text-gray-500 animate-spin" />
                  ) : (
                    <Icon name="ImagePlus" className="h-6 w-6 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-500">
                    {uploadingPhoto ? "Загрузка..." : "Нажмите, чтобы добавить фото"}
                  </span>
                  <span className="text-xs text-gray-600">JPG, PNG, WEBP до 10 МБ</span>
                </button>
              )}
              {uploadingPhoto && photos.length > 0 && (
                <p className="text-xs text-blue-400 flex items-center gap-1.5 mt-2">
                  <Icon name="Loader2" className="h-3 w-3 animate-spin" /> Загрузка фото...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Шаг 3 — Лендинг */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
              <p className="text-sm text-gray-400 mb-4">Каждый объект получает персональный лендинг. Настройте заголовок и призыв к действию.</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">Заголовок лендинга</Label>
                  <Input
                    placeholder={form.title || "Название объекта"}
                    value={form.landing_title}
                    onChange={e => setForm({ ...form, landing_title: e.target.value })}
                    className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1.5 block">Призыв к действию (кнопка)</Label>
                  <Input
                    placeholder="Запросить информацию"
                    value={form.landing_cta}
                    onChange={e => setForm({ ...form, landing_cta: e.target.value })}
                    className="bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-blue-900/20 border border-blue-500/20 p-4 flex gap-3">
              <Icon name="Zap" className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">Лендинг автоматически оптимизирован для мобильных и SEO. Добавленные фото появятся на лендинге объекта.</p>
            </div>
          </div>
        )}

        {/* Шаг 4 — Презентация */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
              <p className="text-sm text-gray-400 mb-4">ИИ сгенерирует презентацию объекта на основе введённых данных. Добавьте дополнительные заметки.</p>
              <div>
                <Label className="text-xs text-gray-400 mb-1.5 block">Заметки для презентации</Label>
                <textarea
                  rows={5}
                  placeholder="Уникальные преимущества, особые условия, целевая аудитория..."
                  value={form.presentation_notes}
                  onChange={e => setForm({ ...form, presentation_notes: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="rounded-2xl bg-violet-900/20 border border-violet-500/20 p-4 flex gap-3">
              <Icon name="Sparkles" className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">ИИ автоматически создаст PDF-презентацию и видеотур после публикации объекта.</p>
            </div>
          </div>
        )}

        {/* Шаг 5 — Публикация */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
              <h2 className="font-semibold mb-4">Сводка объекта</h2>
              <div className="space-y-3">
                {[
                  { label: "Тип", value: CATEGORIES.find(c => c.id === category)?.label ?? "—" },
                  { label: "Название", value: form.title || "—" },
                  { label: "Город", value: form.city || "—" },
                  { label: "Адрес", value: form.address || "—" },
                  { label: "Цена", value: form.price ? `${form.price} ₽` : "—" },
                  { label: "Площадь", value: form.area ? `${form.area} м²` : "—" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm border-b border-[#1a1a1a] pb-2 last:border-0">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="text-white font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Маркетплейс */}
            <button
              onClick={() => setPublishToMarket(v => !v)}
              className={`w-full rounded-2xl border p-5 flex items-center gap-4 transition-all text-left ${
                publishToMarket
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[#1f1f1f] bg-[#111]"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${publishToMarket ? "bg-blue-500/20" : "bg-[#1a1a1a]"}`}>
                <Icon name="Store" className={`h-6 w-6 ${publishToMarket ? "text-blue-400" : "text-gray-500"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Разместить на маркетплейсе</p>
                <p className="text-xs text-gray-400 mt-0.5">Объект появится в публичном каталоге и будет доступен покупателям</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${publishToMarket ? "bg-blue-600" : "bg-[#2a2a2a]"}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${publishToMarket ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </button>

            {publishToMarket && (
              <div className="rounded-2xl bg-emerald-900/20 border border-emerald-500/20 p-4 flex gap-3">
                <Icon name="CheckCircle" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Объект будет виден в разделе <span className="text-white font-medium">«{CATEGORIES.find(c => c.id === category)?.label ?? category}»</span> на маркетплейсе сразу после сохранения.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Кнопки навигации */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[#1f1f1f]">
          <Button
            variant="outline"
            onClick={handleBack}
            className="rounded-xl border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
          >
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" /> Назад
          </Button>
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={step === 0 && !category}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
            >
              Далее <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {saving
                ? <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Сохранение...</>
                : <><Icon name="Rocket" className="h-4 w-4 mr-2" />Опубликовать объект</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}