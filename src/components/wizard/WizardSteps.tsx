import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { CATEGORIES, getCategoryFields, WizardForm } from "./wizardTypes"
import SortablePhotoGrid from "./SortablePhotoGrid"

// ── Шаг 1: Выбор категории ──────────────────────────────────────────────────

interface Step1Props {
  category: string
  setCategory: (v: string) => void
  form: WizardForm
  setForm: (f: WizardForm) => void
}

export function Step1Category({ category, setCategory }: Step1Props) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  )
}

// ── Шаг 2: Характеристики ───────────────────────────────────────────────────

interface Step2Props {
  form: WizardForm
  setForm: (f: WizardForm) => void
  category: string
  categoryFields: Record<string, string>
  onCategoryField: (key: string, value: string) => void
}

export function Step2Details({
  form, setForm, category, categoryFields, onCategoryField,
}: Step2Props) {
  return (
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
                  onChange={e => onCategoryField(field.key, e.target.value)}
                  className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ── Шаг 3: Описание ─────────────────────────────────────────────────────────

interface Step3Props {
  form: WizardForm
  setForm: (f: WizardForm) => void
  photos: string[]
  uploadingPhoto: boolean
  onPhotosChange: (photos: string[]) => void
  onUploadingChange: (v: boolean) => void
}

export function Step3Landing({ form, setForm, photos, uploadingPhoto, onPhotosChange, onUploadingChange }: Step3Props) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs text-gray-400 mb-1.5 block">Название объекта</Label>
        <Input
          placeholder="Офисное помещение в центре, БЦ Арбат..."
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
        />
      </div>

      <div>
        <Label className="text-xs text-gray-400 mb-1.5 block">Описание объекта</Label>
        <textarea
          rows={5}
          placeholder="Краткое описание для покупателей — особенности, преимущества, условия..."
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <Label className="text-xs text-gray-400 mb-1.5 block">Фотографии объекта</Label>
        <SortablePhotoGrid
          photos={photos}
          uploadingPhoto={uploadingPhoto}
          onPhotosChange={onPhotosChange}
          onUploadingChange={onUploadingChange}
        />
      </div>
    </div>
  )
}

// ── Шаг 4: Презентация ───────────────────────────────────────────────────────

interface Step4Props {
  form: WizardForm
  setForm: (f: WizardForm) => void
}

export function Step4Presentation({ form, setForm }: Step4Props) {
  return (
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
  )
}

// ── Шаг 5: Публикация ────────────────────────────────────────────────────────

interface Step5Props {
  form: WizardForm
  category: string
  publishToMarket: boolean
  setPublishToMarket: (v: boolean) => void
}

export function Step5Publish({ form, category, publishToMarket, setPublishToMarket }: Step5Props) {
  return (
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

      <button
        onClick={() => setPublishToMarket(!publishToMarket)}
        className={`w-full rounded-2xl border p-5 flex items-center gap-4 transition-all text-left ${
          publishToMarket ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f] bg-[#111]"
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
  )
}