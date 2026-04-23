import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import func2url from "../../../../backend/func2url.json"
import type { WizardForm } from "../wizardTypes"

interface Step5PresentationProps {
  form: WizardForm
  setForm: (f: WizardForm) => void
  category: string
  categoryFields: Record<string, string>
  photos: string[]
  objectId?: string
  onPresentationReady?: (url: string) => void
}

export function Step5Presentation({ form, setForm, category, categoryFields, photos, objectId, onPresentationReady }: Step5PresentationProps) {
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
        const { buildPdf, buildPdfBase64 } = await import("../generatePdf")

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
