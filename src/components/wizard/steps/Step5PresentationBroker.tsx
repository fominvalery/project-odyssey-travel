import { useState } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../../backend/func2url.json"
import type { WizardForm } from "../wizardTypes"

interface Step5PresentationBrokerProps {
  form: WizardForm
  setForm: (f: WizardForm) => void
  category: string
  categoryFields: Record<string, string>
  photos: string[]
  objectId?: string
  onPresentationReady?: (url: string) => void
}

export function Step5PresentationBroker({ form, photos, objectId, onPresentationReady }: Step5PresentationBrokerProps) {
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")

  async function handleGenerate() {
    if (!objectId) {
      setErrorMsg("Сначала сохраните объект")
      setStatus("error")
      return
    }
    setGenerating(true)
    setStatus("idle")
    setErrorMsg("")

    try {
      const r = await fetch((func2url as Record<string, string>)["object-pdf"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_id: objectId,
          pdf_options: {
            show_contacts: false,
            show_card: false,
          },
        }),
      }).then(r => r.json())

      if (r.pdf_url) {
        setPdfUrl(r.pdf_url)
        onPresentationReady?.(r.pdf_url)
        setStatus("ready")
      } else {
        setErrorMsg(r.error || "Не удалось создать PDF")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Ошибка соединения")
      setStatus("error")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-violet-900/10 border border-violet-500/20 p-4 flex gap-3">
        <Icon name="FileText" className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white mb-0.5">PDF-презентация для брокеров</p>
          <p className="text-xs text-gray-400">
            PDF собирается автоматически из данных объекта. Презентация создаётся <span className="text-white font-medium">без личных контактов</span> — для передачи партнёрам-брокерам. После создания будет доступна в карточке объекта.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Что войдёт в PDF</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: "FileText", label: "Заголовок и описание", ok: Boolean(form.title || form.description) },
            { icon: "BarChart2", label: "Характеристики объекта", ok: Boolean(form.price || form.area) },
            { icon: "Image", label: `Фото (до 25 из ${photos.length})`, ok: photos.length > 0 },
            { icon: "MapPin", label: "Адрес и карта", ok: Boolean(form.address || form.city) },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className={item.ok ? "text-emerald-400" : "text-gray-600"}>
                <Icon name={item.ok ? "CheckCircle" : "Circle"} className="h-3.5 w-3.5" />
              </span>
              <span className={item.ok ? "text-gray-300" : "text-gray-600"}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Блок: без контактов */}
        <div className="border-t border-[#1f1f1f] pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Дополнительные блоки</p>
          <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#111] border border-[#1f1f1f]">
            <div className="mt-0.5">
              <div className="w-4 h-4 rounded border border-gray-700 bg-[#0d0d0d] flex items-center justify-center">
                <Icon name="X" className="h-2.5 w-2.5 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon name="Phone" className="h-4 w-4 text-gray-600" />
                Контакты не добавляются
              </div>
              <p className="text-xs text-gray-600 mt-0.5">Презентация для партнёров — без личных контактов брокера. Связь через менеджера проекта.</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !objectId}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {generating && <><Icon name="Loader2" className="h-4 w-4 animate-spin" />Создаю PDF...</>}
        {!generating && status === "idle" && <><Icon name="Sparkles" className="h-4 w-4" />Создать PDF-презентацию</>}
        {!generating && status === "ready" && <><Icon name="RefreshCw" className="h-4 w-4" />Создать заново</>}
        {!generating && status === "error" && <><Icon name="RefreshCw" className="h-4 w-4" />Попробовать ещё раз</>}
      </button>

      {!objectId && (
        <p className="text-xs text-amber-400 text-center">
          PDF можно создать после сохранения объекта
        </p>
      )}

      {status === "ready" && pdfUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <Icon name="CheckCircle" className="h-4 w-4 shrink-0" />
            PDF создан и сохранён в карточке объекта
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-violet-500/40 text-violet-300 hover:bg-violet-600/10 py-2.5 text-sm font-medium transition-all"
          >
            <Icon name="ExternalLink" className="h-4 w-4" />
            Открыть PDF
          </a>
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <Icon name="AlertCircle" className="h-3.5 w-3.5" />{errorMsg}
        </p>
      )}
    </div>
  )
}
