import { useState } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"
import { ObjectData, WizardForm, CATEGORIES } from "./wizard/wizardTypes"
import { Step1Category, Step2Location, Step3Details, Step4Landing } from "./wizard/WizardSteps"
import { Step5PresentationBroker } from "./wizard/steps/Step5PresentationBroker"
import { Step6PublishBase } from "./wizard/steps/Step6PublishBase"
import { Step7Regulations } from "./wizard/steps/Step7Regulations"

export type { ObjectData }

const STEPS_BASE = ["Основное", "Локация", "Характеристики", "Описание", "Презентация", "Публикация", "Регламент"]

interface RegulationsFields {
  commission: string
  commission_notes: string
  ad_rules: string
  work_rules: string
  manager_name: string
  manager_phone: string
  manager_email: string
}

interface AddObjectWizardBaseProps {
  onClose: () => void
  onSave: (obj: ObjectData) => void
  initial?: ObjectData
}

export function AddObjectWizardBase({ onClose, onSave, initial }: AddObjectWizardBaseProps) {
  const isEditing = Boolean(initial)
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState(initial?.category ?? "")
  const [subtype, setSubtype] = useState(initial?.extra_fields?.subtype ?? initial?.subtype ?? "")
  const [dealType, setDealType] = useState(initial?.extra_fields?.deal_type ?? "")
  const [publishToBase, setPublishToBase] = useState(initial?.published ?? true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<WizardForm>({
    title: initial?.title ?? "",
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    lat: initial?.lat ?? undefined,
    lon: initial?.lon ?? undefined,
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

  const [regulationsFields, setRegulationsFields] = useState<RegulationsFields>({
    commission: initial?.extra_fields?.commission ?? "",
    commission_notes: initial?.extra_fields?.commission_notes ?? "",
    ad_rules: initial?.extra_fields?.ad_rules ?? "",
    work_rules: initial?.extra_fields?.work_rules ?? "",
    manager_name: initial?.extra_fields?.manager_name ?? "",
    manager_phone: initial?.extra_fields?.manager_phone ?? "",
    manager_email: initial?.extra_fields?.manager_email ?? "",
  })

  const [presentationUrl, setPresentationUrl] = useState<string | null>(initial?.presentation_url ?? null)
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savedObjectId, setSavedObjectId] = useState<string | undefined>(
    initial ? String(initial.id) : undefined
  )

  function handleCategoryField(key: string, value: string) {
    setCategoryFields(prev => ({ ...prev, [key]: value }))
  }

  function handleNext() {
    if (step === 0 && !category) return
    setStep(s => Math.min(s + 1, STEPS_BASE.length - 1))
  }

  function handleBack() {
    if (step === 0) { onClose(); return }
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleSaveAndNext() {
    // При переходе с шага описания (3) — сохраняем объект чтобы получить ID для PDF
    if (step === 3 && !savedObjectId) {
      await saveObject(false)
    }
    handleNext()
  }

  async function saveObject(andClose: boolean): Promise<string | undefined> {
    const cat = CATEGORIES.find(c => c.id === category)
    const enrichedFields = {
      ...categoryFields,
      ...(subtype ? { subtype } : {}),
      ...(dealType ? { deal_type: dealType } : {}),
      ...regulationsFields,
      ...(form.developer_org_id ? { developer_org_id: form.developer_org_id, developer_org_name: form.developer_org_name } : {}),
      ...(form.related_project_id ? { related_project_id: form.related_project_id, related_project_name: form.related_project_name } : {}),
    }
    const payload = {
      category,
      type: cat?.label ?? category,
      subtype,
      title: form.title || "Новый объект",
      city: form.city,
      address: form.address,
      lat: form.lat ?? null,
      lon: form.lon ?? null,
      price: form.price,
      area: form.area,
      yield_percent: categoryFields["yield"] ?? "",
      description: form.description,
      extra_fields: enrichedFields,
      status: "active",
      published: publishToBase,
      photos,
      ...(presentationUrl !== null ? { presentation_url: presentationUrl } : {}),
    }

    setSaving(true)
    try {
      const existingId = initial?.id ? String(initial.id) : savedObjectId
      const res = await fetch((func2url as Record<string, string>)["agg-admin"], {
        method: existingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existingId ? { ...payload, id: existingId } : payload),
      })
      const data = await res.json()
      const id = data.id ? String(data.id) : (data.offer?.id ? String(data.offer.id) : undefined)
      if (id) setSavedObjectId(id)

      const saved: ObjectData = {
        id: id ?? initial?.id ?? Date.now(),
        type: cat?.label ?? category,
        subtype,
        title: payload.title,
        city: payload.city,
        address: payload.address,
        price: payload.price,
        area: payload.area,
        yield: categoryFields["yield"] ?? "",
        description: payload.description,
        status: "active",
        category,
        published: publishToBase,
        photos,
        extra_fields: enrichedFields,
        presentation_url: presentationUrl ?? undefined,
      }

      if (andClose) {
        onSave(saved)
        onClose()
      }
      return id
    } catch {
      if (andClose) onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    await saveObject(true)
  }

  const isLastStep = step === STEPS_BASE.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? "Редактирование объекта" : "Новый объект"}</h1>
            <p className="text-xs text-gray-500 mt-0.5">База / Проекты Кабинет-24</p>
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex items-center gap-0 mb-2 overflow-x-auto pb-1">
          {STEPS_BASE.map((s, i) => (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                i === step ? "bg-emerald-600 text-white" :
                i < step ? "text-emerald-400" : "text-gray-500"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step ? "bg-emerald-500 text-white" :
                  i === step ? "bg-white text-emerald-600" : "bg-[#1f1f1f] text-gray-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS_BASE.length - 1 && (
                <div className={`flex-1 h-px min-w-2 ${i < step ? "bg-emerald-500/40" : "bg-[#1f1f1f]"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-8">Шаг {step + 1} из {STEPS_BASE.length}</p>

        {/* Шаги */}
        {step === 0 && (
          <Step1Category
            category={category} setCategory={setCategory}
            subtype={subtype} setSubtype={setSubtype}
            form={form} setForm={setForm}
            dealType={dealType} setDealType={setDealType}
          />
        )}
        {step === 1 && (
          <Step2Location form={form} setForm={setForm} />
        )}
        {step === 2 && (
          <Step3Details
            form={form} setForm={setForm}
            category={category} subtype={subtype}
            categoryFields={categoryFields}
            onCategoryField={handleCategoryField}
            dealType={dealType}
          />
        )}
        {step === 3 && (
          <Step4Landing
            form={form} setForm={setForm}
            category={category} categoryFields={categoryFields}
            photos={photos} uploadingPhoto={uploadingPhoto}
            onPhotosChange={setPhotos}
            onUploadingChange={setUploadingPhoto}
          />
        )}
        {step === 4 && (
          <Step5PresentationBroker
            form={form} setForm={setForm}
            category={category} categoryFields={categoryFields}
            photos={photos}
            objectId={savedObjectId}
            onPresentationReady={(url) => setPresentationUrl(url)}
          />
        )}
        {step === 5 && (
          <Step6PublishBase
            form={form} setForm={setForm} category={category}
            publishToBase={publishToBase}
            setPublishToBase={setPublishToBase}
          />
        )}
        {step === 6 && (
          <Step7Regulations
            regulationsFields={regulationsFields}
            setRegulationsFields={setRegulationsFields}
          />
        )}

        {/* Кнопки навигации */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[#1f1f1f]">
          <Button
            variant="outline"
            onClick={handleBack}
            className="rounded-xl border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
          >
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            Назад
          </Button>

          {isLastStep ? (
            <Button
              onClick={handlePublish}
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-semibold disabled:opacity-60"
            >
              {saving ? (
                <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Сохранение...</>
              ) : (
                <><Icon name="FolderOpen" className="h-4 w-4 mr-2" />Сохранить в базу</>
              )}
            </Button>
          ) : (
            <Button
              onClick={step === 3 ? handleSaveAndNext : handleNext}
              disabled={(step === 0 && !category) || saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
            >
              {saving ? (
                <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Сохраняю...</>
              ) : (
                <>Далее <Icon name="ArrowRight" className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}