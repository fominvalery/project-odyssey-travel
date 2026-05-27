import { useState } from "react"
import func2url from "../../../backend/func2url.json"
import { STEPS, TYPE_LABELS } from "./projectWizardData"
import ProjectWizardShell from "./ProjectWizardShell"
import { StepType, StepLocation, StepDetails, StepMedia, StepPublish } from "./ProjectWizardSteps"

const AGG_ADMIN_URL = (func2url as Record<string, string>)["agg-admin"]

interface Props {
  onClose: () => void
  onSave: () => void
}

export default function AddProjectWizard({ onClose, onSave }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Шаг 1: Тип
  const [projectType, setProjectType] = useState("")

  // Шаг 2: Локация
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState<number | undefined>()
  const [lon, setLon] = useState<number | undefined>()

  // Шаг 3: Характеристики
  const [name, setName] = useState("")
  const [developer, setDeveloper] = useState("")
  const [classType, setClassType] = useState("")
  const [status, setStatus] = useState("active")
  const [totalArea, setTotalArea] = useState("")
  const [floors, setFloors] = useState("")
  const [priceFrom, setPriceFrom] = useState("")
  const [completionDate, setCompletionDate] = useState("")
  const [commission, setCommission] = useState("")
  const [commissionNotes, setCommissionNotes] = useState("")

  // Шаг 4: Описание и фото
  const [description, setDescription] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [videos, setVideos] = useState<string[]>([])
  const [videoInput, setVideoInput] = useState("")
  const [generating, setGenerating] = useState(false)

  // Шаг 5: Публикация
  const [publishToBase, setPublishToBase] = useState(true)

  function handleBack() {
    if (step === 0) { onClose(); return }
    setStep(s => s - 1)
  }

  function handleNext() {
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const r = await fetch((func2url as Record<string, string>)["describe-object"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "commercial",
          title: name || TYPE_LABELS[projectType],
          city,
          address,
          price: priceFrom,
          area: totalArea,
          extra_fields: {
            subtype: TYPE_LABELS[projectType],
            floors,
            class_type: classType,
            developer,
            completion_date: completionDate,
          },
          user_draft: description,
        }),
      }).then(r => r.json())
      if (r.description) setDescription(r.description)
    } finally {
      setGenerating(false)
    }
  }

  function addVideo() {
    if (!videoInput.trim()) return
    setVideos(v => [...v, videoInput.trim()])
    setVideoInput("")
  }

  function getEmbedUrl(url: string) {
    if (url.includes("youtube.com/watch")) return url.replace("watch?v=", "embed/")
    if (url.includes("youtu.be/")) return "https://www.youtube.com/embed/" + url.split("youtu.be/")[1]
    if (url.includes("rutube.ru/video/")) {
      const id = url.split("/video/")[1]?.replace(/\//g, "")
      return id ? `https://rutube.ru/play/embed/${id}` : url
    }
    if (url.includes("vkvideo.ru") || url.includes("vk.com/video")) return url
    return url
  }

  async function handlePublish() {
    setSaving(true)
    const descLines = [
      description,
      developer && `Застройщик: ${developer}`,
      floors && `Этажность: ${floors}`,
      completionDate && `Срок сдачи: ${completionDate}`,
      classType && `Класс: ${classType}`,
    ].filter(Boolean).join("\n")

    await fetch(AGG_ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: name || TYPE_LABELS[projectType] || "Новый проект",
        category: "commercial",
        subtype: TYPE_LABELS[projectType] || projectType,
        city,
        address,
        price: priceFrom ? Number(priceFrom) : undefined,
        area: totalArea ? Number(totalArea) : undefined,
        description: descLines || undefined,
        status: "active",
        published: publishToBase,
        photos,
        videos,
        commission: commission || undefined,
        commission_notes: commissionNotes || undefined,
        extra_fields: {
          subtype: TYPE_LABELS[projectType],
          developer,
          class_type: classType,
          project_status: status,
          floors,
          completion_date: completionDate,
          lat: lat ? String(lat) : undefined,
          lon: lon ? String(lon) : undefined,
        },
      }),
    })
    setSaving(false)
    onSave()
  }

  return (
    <ProjectWizardShell
      step={step}
      saving={saving}
      uploadingPhoto={uploadingPhoto}
      projectType={projectType}
      onBack={handleBack}
      onNext={handleNext}
      onPublish={handlePublish}
    >
      {step === 0 && (
        <StepType projectType={projectType} onSelect={setProjectType} />
      )}
      {step === 1 && (
        <StepLocation
          city={city} address={address} lat={lat} lon={lon}
          onCityChange={setCity}
          onAddressChange={setAddress}
          onCoordsChange={(la, lo) => { setLat(la); setLon(lo) }}
        />
      )}
      {step === 2 && (
        <StepDetails
          projectType={projectType} city={city}
          name={name} setName={setName}
          developer={developer} setDeveloper={setDeveloper}
          classType={classType} setClassType={setClassType}
          status={status} setStatus={setStatus}
          totalArea={totalArea} setTotalArea={setTotalArea}
          floors={floors} setFloors={setFloors}
          priceFrom={priceFrom} setPriceFrom={setPriceFrom}
          completionDate={completionDate} setCompletionDate={setCompletionDate}
          commission={commission} setCommission={setCommission}
          commissionNotes={commissionNotes} setCommissionNotes={setCommissionNotes}
        />
      )}
      {step === 3 && (
        <StepMedia
          description={description} setDescription={setDescription}
          photos={photos} setPhotos={setPhotos}
          uploadingPhoto={uploadingPhoto} setUploadingPhoto={setUploadingPhoto}
          videos={videos} setVideos={setVideos}
          videoInput={videoInput} setVideoInput={setVideoInput}
          generating={generating}
          onGenerate={handleGenerate}
          onAddVideo={addVideo}
          getEmbedUrl={getEmbedUrl}
        />
      )}
      {step === 4 && (
        <StepPublish
          projectType={projectType} name={name} city={city} address={address}
          developer={developer} classType={classType}
          totalArea={totalArea} floors={floors} priceFrom={priceFrom}
          completionDate={completionDate} commission={commission}
          photos={photos}
          publishToBase={publishToBase}
          onTogglePublish={() => setPublishToBase(v => !v)}
        />
      )}
    </ProjectWizardShell>
  )
}
