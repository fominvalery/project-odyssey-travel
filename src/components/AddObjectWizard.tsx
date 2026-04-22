import { useState } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"
import { ObjectData, WizardForm, STEPS, CATEGORIES } from "./wizard/wizardTypes"
import { Step1Category, Step2Location, Step3Details, Step4Landing, Step5Presentation, Step6Publish } from "./wizard/WizardSteps"

export type { ObjectData }

interface AddObjectWizardProps {
  onClose: () => void
  onSave: (obj: ObjectData) => void
  userId?: string
  initial?: ObjectData
}

export function AddObjectWizard({ onClose, onSave, userId, initial }: AddObjectWizardProps) {
  const isEditing = Boolean(initial)
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState(initial?.category ?? "")
  const [publishToMarket, setPublishToMarket] = useState(initial?.published ?? true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<WizardForm>({
    title: initial?.title ?? "",
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    price: initial?.price ?? "",
    area: initial?.area ?? "",
    description: initial?.description ?? "",
    landing_title: "",
    landing_cta: "",
    presentation_notes: "",
    presentation_contact_name: "",
    presentation_contact_phone: "",
    presentation_contact_company: "",
  })
  const [categoryFields, setCategoryFields] = useState<Record<string, string>>(
    initial?.extra_fields ?? (initial?.yield ? { yield: initial.yield } : {})
  )
  const [presentationUrl, setPresentationUrl] = useState<string | null>(initial?.presentation_url ?? null)
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  function handleCategoryField(key: string, value: string) {
    setCategoryFields(prev => ({ ...prev, [key]: value }))
  }

  function handleNext() {
    if (step === 0 && !category) return
    setStep(s => Math.min(s + 1, 5))
  }

  function handleBack() {
    if (step === 0) { onClose(); return }
    setStep(s => Math.max(s - 1, 0))
  }

  async function handlePublish() {
    const cat = CATEGORIES.find(c => c.id === category)
    const payload = {
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
      status: initial?.status ?? "Активен",
      published: publishToMarket,
      photos,
      ...(presentationUrl !== null ? { presentation_url: presentationUrl } : {}),
    }

    setSaving(true)
    try {
      const res = await fetch(func2url.objects, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...payload, id: initial!.id } : payload),
      })
      const data = await res.json()
      const server = data.object as Record<string, unknown> | undefined

      const saved: ObjectData = server ? {
        id: String(server.id),
        type: String(server.type ?? payload.type),
        title: String(server.title ?? payload.title),
        city: String(server.city ?? ""),
        address: String(server.address ?? ""),
        price: String(server.price ?? ""),
        area: String(server.area ?? ""),
        yield: String(server.yield_percent ?? ""),
        description: String(server.description ?? ""),
        status: String(server.status ?? "Активен"),
        category: String(server.category ?? ""),
        published: Boolean(server.published),
        photos: Array.isArray(server.photos) ? server.photos as string[] : [],
        user_id: (server.user_id as string) ?? null,
        extra_fields: (server.extra_fields as Record<string, string>) ?? {},
      } : {
        id: initial?.id ?? Date.now(),
        type: payload.type,
        title: payload.title,
        city: payload.city,
        address: payload.address,
        price: payload.price,
        area: payload.area,
        yield: payload.yield_percent,
        description: payload.description,
        status: payload.status,
        category: payload.category,
        published: payload.published,
        photos: payload.photos,
        extra_fields: categoryFields,
      }
      onSave(saved)
    } catch {
      onSave({
        id: initial?.id ?? Date.now(),
        type: cat?.label ?? category,
        category,
        title: form.title || "Новый объект",
        city: form.city,
        address: form.address,
        price: form.price,
        area: form.area,
        yield: categoryFields["yield"] ?? "",
        description: form.description,
        status: initial?.status ?? "Активен",
        published: publishToMarket,
        photos,
        extra_fields: categoryFields,
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
          <h1 className="text-2xl font-bold">{isEditing ? "Редактирование объекта" : "Новый объект"}</h1>
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

        {/* Шаги */}
        {step === 0 && (
          <Step1Category category={category} setCategory={setCategory} form={form} setForm={setForm} />
        )}
        {step === 1 && (
          <Step2Location form={form} setForm={setForm} />
        )}
        {step === 2 && (
          <Step3Details
            form={form}
            setForm={setForm}
            category={category}
            categoryFields={categoryFields}
            onCategoryField={handleCategoryField}
          />
        )}
        {step === 3 && (
          <Step4Landing
            form={form}
            setForm={setForm}
            category={category}
            categoryFields={categoryFields}
            photos={photos}
            uploadingPhoto={uploadingPhoto}
            onPhotosChange={setPhotos}
            onUploadingChange={setUploadingPhoto}
          />
        )}
        {step === 4 && (
          <Step5Presentation
            form={form}
            setForm={setForm}
            category={category}
            categoryFields={categoryFields}
            photos={photos}
            objectId={initial ? String(initial.id) : undefined}
            onPresentationReady={(url) => setPresentationUrl(url)}
          />
        )}
        {step === 5 && (
          <Step6Publish
            form={form}
            category={category}
            publishToMarket={publishToMarket}
            setPublishToMarket={setPublishToMarket}
          />
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
          {step < 5 ? (
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
                : <><Icon name={isEditing ? "Save" : "Rocket"} className="h-4 w-4 mr-2" />{isEditing ? "Сохранить изменения" : "Опубликовать объект"}</>
              }
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}