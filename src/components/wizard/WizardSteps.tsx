import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { CATEGORIES, getCategoryFields, WizardForm } from "./wizardTypes"
import SortablePhotoGrid from "./SortablePhotoGrid"
import func2url from "../../../backend/func2url.json"

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
  category: string
  categoryFields: Record<string, string>
  photos: string[]
  uploadingPhoto: boolean
  onPhotosChange: (photos: string[]) => void
  onUploadingChange: (v: boolean) => void
}

export function Step3Landing({ form, setForm, category, categoryFields, photos, uploadingPhoto, onPhotosChange, onUploadingChange }: Step3Props) {
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState("")

  async function handleGenerate() {
    setGenerating(true)
    setAiError("")
    try {
      const r = await fetch(func2url["describe-object"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: form.title,
          city: form.city,
          address: form.address,
          price: form.price,
          area: form.area,
          extra_fields: categoryFields,
          user_draft: form.description,
        }),
      }).then(r => r.json())
      if (r.description) {
        setForm({ ...form, description: r.description })
      } else {
        setAiError(r.error || "Не удалось сгенерировать описание")
      }
    } catch {
      setAiError("Ошибка соединения с ИИ")
    } finally {
      setGenerating(false)
    }
  }

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
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs text-gray-400">Описание объекта</Label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <><Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />Генерирую...</>
            ) : (
              <><Icon name="Sparkles" className="h-3.5 w-3.5" />Написать с ИИ</>
            )}
          </button>
        </div>
        <textarea
          rows={6}
          placeholder="Опишите объект в свободной форме или оставьте поле пустым — ИИ составит описание на основе введённых характеристик..."
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        {aiError && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <Icon name="AlertCircle" className="h-3.5 w-3.5" />{aiError}
          </p>
        )}
        {!generating && (
          <p className="text-[11px] text-gray-600 mt-1">
            Можно написать свой текст, ввести ключевые тезисы или нажать «Написать с ИИ» — он учтёт все данные объекта
          </p>
        )}
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
  category: string
  categoryFields: Record<string, string>
  photos: string[]
  objectId?: string
  onPresentationReady?: (url: string) => void
}

export function Step4Presentation({ form, setForm, category, categoryFields, photos, objectId, onPresentationReady }: Step4Props) {
  const [contactName, setContactName] = useState(form.presentation_contact_name ?? "")
  const [contactPhone, setContactPhone] = useState(form.presentation_contact_phone ?? "")
  const [contactCompany, setContactCompany] = useState(form.presentation_contact_company ?? "")
  const [notes, setNotes] = useState(form.presentation_notes ?? "")
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function syncToForm() {
    setForm({
      ...form,
      presentation_notes: notes,
      presentation_contact_name: contactName,
      presentation_contact_phone: contactPhone,
      presentation_contact_company: contactCompany,
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    setStatus("idle")
    setErrorMsg("")
    syncToForm()

    try {
      const r = await fetch(func2url["generate-presentation"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: form.title,
          city: form.city,
          address: form.address,
          price: form.price,
          area: form.area,
          description: form.description,
          extra_fields: categoryFields,
          notes,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_company: contactCompany,
        }),
      }).then(r => r.json())

      if (r.presentation) {
        setGenerating(false)
        setDownloading(true)
        const { buildPdf, buildPdfBase64 } = await import("./generatePdf")

        // Скачиваем локально
        await buildPdf(r.presentation, photos)

        // Загружаем в S3 для хранения
        try {
          const pdfB64 = await buildPdfBase64(r.presentation, photos)
          const uploadResp = await fetch(`${func2url["generate-presentation"]}?upload=1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdf_base64: pdfB64, object_id: objectId || "" }),
          }).then(r => r.json())

          if (uploadResp.cdn_url) {
            onPresentationReady?.(uploadResp.cdn_url)
            setForm({ ...form, presentation_notes: notes, presentation_contact_name: contactName, presentation_contact_phone: contactPhone, presentation_contact_company: contactCompany })
          }
        } catch {
          // Загрузка в S3 не критична — PDF уже скачан
        }

        setStatus("ready")
      } else {
        setErrorMsg(r.error || "Не удалось создать презентацию")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Ошибка соединения")
      setStatus("error")
    } finally {
      setGenerating(false)
      setDownloading(false)
    }
  }

  const inputCls = "bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 text-sm"
  const busy = generating || downloading

  return (
    <div className="space-y-5">
      {/* Описание шага */}
      <div className="rounded-2xl bg-violet-900/10 border border-violet-500/20 p-4 flex gap-3">
        <Icon name="FileText" className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white mb-0.5">PDF-презентация объекта</p>
          <p className="text-xs text-gray-400">ИИ подготовит профессиональную презентацию на основе всех данных объекта. Укажите контакты и дополнительные акценты — PDF скачается автоматически.</p>
        </div>
      </div>

      {/* Контактные данные */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ваши контакты в презентации</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-400 mb-1 block">Имя / ФИО</Label>
            <Input value={contactName} onChange={e => setContactName(e.target.value)}
              placeholder="Иван Иванов" className={inputCls} />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1 block">Телефон</Label>
            <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              placeholder="+7 999 000 00 00" className={inputCls} />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1 block">Компания</Label>
            <Input value={contactCompany} onChange={e => setContactCompany(e.target.value)}
              placeholder="Название компании" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Дополнительные заметки */}
      <div>
        <Label className="text-xs text-gray-400 mb-1.5 block">Дополнительные акценты для ИИ (необязательно)</Label>
        <textarea
          rows={3}
          placeholder="Уникальные преимущества, особые условия, целевая аудитория, инвестиционный потенциал..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Превью того, что войдёт в PDF */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Что войдёт в PDF</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "FileText", label: "Заголовок и описание", ok: Boolean(form.title || form.description) },
            { icon: "BarChart2", label: "Характеристики объекта", ok: Boolean(form.price || form.area) },
            { icon: "ListChecks", label: "Ключевые преимущества", ok: true },
            { icon: "Image", label: `Фото (${Math.min(photos.length, 3)} из ${photos.length})`, ok: photos.length > 0 },
            { icon: "TrendingUp", label: "Инвест. привлекательность", ok: true },
            { icon: "Phone", label: "Контакты", ok: Boolean(contactPhone || contactName) },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className={item.ok ? "text-emerald-400" : "text-gray-600"}>
                <Icon name={item.ok ? "CheckCircle" : "Circle"} className="h-3.5 w-3.5" />
              </span>
              <span className={item.ok ? "text-gray-300" : "text-gray-600"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка генерации */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {generating && <><Icon name="Loader2" className="h-4.5 w-4.5 animate-spin" />ИИ создаёт презентацию...</>}
        {downloading && <><Icon name="Loader2" className="h-4.5 w-4.5 animate-spin" />Собираю PDF...</>}
        {!busy && status === "idle" && <><Icon name="Sparkles" className="h-4 w-4" />Создать PDF-презентацию</>}
        {!busy && status === "ready" && <><Icon name="Download" className="h-4 w-4" />Скачать снова</>}
        {!busy && status === "error" && <><Icon name="RefreshCw" className="h-4 w-4" />Попробовать ещё раз</>}
      </button>

      {status === "ready" && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <Icon name="CheckCircle" className="h-4 w-4 shrink-0" />
          PDF успешно создан и скачан! Можно перейти к публикации объекта.
        </div>
      )}
      {status === "error" && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <Icon name="AlertCircle" className="h-3.5 w-3.5" />{errorMsg}
        </p>
      )}

      <p className="text-[11px] text-gray-600 text-center">
        Презентацию можно создать в любой момент — она не влияет на публикацию объекта
      </p>
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