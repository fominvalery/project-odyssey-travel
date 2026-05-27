import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import SortablePhotoGrid from "@/components/wizard/SortablePhotoGrid"
import AddressMapPicker from "@/components/wizard/AddressMapPicker"
import func2url from "../../../backend/func2url.json"

const AGG_ADMIN_URL = (func2url as Record<string, string>)["agg-admin"]

const STEPS = ["Тип проекта", "Локация", "Характеристики", "Описание и фото", "Публикация"]

const PROJECT_TYPES = [
  {
    id: "bc", label: "Бизнес-центр", desc: "Офисная недвижимость, БЦ класса A/B/C",
    icon: "Building2", bg: "from-blue-900/60 to-blue-800/40", border: "border-blue-500/50", accent: "bg-blue-900/40",
  },
  {
    id: "mfk", label: "МФК", desc: "Многофункциональный комплекс",
    icon: "Layers", bg: "from-violet-900/60 to-violet-800/40", border: "border-violet-500/50", accent: "bg-violet-900/40",
  },
  {
    id: "zhk", label: "Жилой комплекс", desc: "ЖК, апартаменты, жильё",
    icon: "Home", bg: "from-emerald-900/60 to-emerald-800/40", border: "border-emerald-500/50", accent: "bg-emerald-900/40",
  },
  {
    id: "kp", label: "Коттеджный посёлок", desc: "КП, таунхаусы, загородная застройка",
    icon: "TreePine", bg: "from-green-900/60 to-green-800/40", border: "border-green-500/50", accent: "bg-green-900/40",
  },
  {
    id: "tc", label: "Торговый центр", desc: "ТЦ, ТРЦ, стрит-ритейл",
    icon: "ShoppingBag", bg: "from-orange-900/60 to-orange-800/40", border: "border-orange-500/50", accent: "bg-orange-900/40",
  },
  {
    id: "sk", label: "Складской комплекс", desc: "Логистика, склады, производство",
    icon: "Warehouse", bg: "from-slate-800/80 to-slate-700/40", border: "border-slate-500/50", accent: "bg-slate-800/40",
  },
  {
    id: "gk", label: "Гостиница / Отель", desc: "Апарт-отель, курортная недвижимость",
    icon: "Hotel", bg: "from-amber-900/60 to-amber-800/40", border: "border-amber-500/50", accent: "bg-amber-900/40",
  },
  {
    id: "other", label: "Другой проект", desc: "Производство, инфраструктура, прочее",
    icon: "LayoutGrid", bg: "from-gray-800/80 to-gray-700/40", border: "border-gray-500/50", accent: "bg-gray-800/40",
  },
]

const PROJECT_CLASSES = [
  { id: "A+", label: "A+" }, { id: "A", label: "A" },
  { id: "B+", label: "B+" }, { id: "B", label: "B" },
  { id: "C", label: "C" }, { id: "eco", label: "Эконом" },
  { id: "biz", label: "Бизнес" }, { id: "pre", label: "Премиум" },
]

const PROJECT_STATUSES = [
  { id: "planned", label: "Планируется" },
  { id: "construction", label: "Строится" },
  { id: "completed", label: "Сдан" },
  { id: "active", label: "Активно продаётся" },
]

const TYPE_LABELS: Record<string, string> = {
  bc: "Бизнес-центр", mfk: "МФК", zhk: "ЖК", kp: "Коттеджный посёлок",
  tc: "Торговый центр", sk: "Складской комплекс", gk: "Гостиница", other: "Проект",
}

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

  const isLastStep = step === STEPS.length - 1

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

  const selectedType = PROJECT_TYPES.find(t => t.id === projectType)

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Новый проект</h1>
            <p className="text-xs text-gray-500 mt-0.5">База / Проекты Кабинет-24</p>
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex items-center gap-0 mb-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                i === step ? "bg-amber-600 text-white" :
                i < step ? "text-amber-400" : "text-gray-500"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < step ? "bg-amber-500 text-white" :
                  i === step ? "bg-white text-amber-600" : "bg-[#1f1f1f] text-gray-500"
                }`}>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px min-w-2 ${i < step ? "bg-amber-500/40" : "bg-[#1f1f1f]"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-8">Шаг {step + 1} из {STEPS.length}</p>

        {/* ШАГ 1: Тип проекта */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Выберите тип проекта</h2>
              <p className="text-sm text-gray-500">От типа зависят поля и логика заполнения</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PROJECT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setProjectType(t.id)}
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
        )}

        {/* ШАГ 2: Локация */}
        {step === 1 && (
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
              onCityChange={setCity}
              onAddressChange={setAddress}
              onCoordsChange={(la, lo) => { setLat(la); setLon(lo) }}
            />
          </div>
        )}

        {/* ШАГ 3: Характеристики */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Характеристики</h2>
              <p className="text-sm text-gray-500">
                {selectedType ? `${selectedType.label} · ` : ""}{city || "Город не указан"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Название */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Название проекта *</label>
                <Input
                  placeholder={`${TYPE_LABELS[projectType] || "Проект"} в ${city || "городе"}...`}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
                />
              </div>

              {/* Застройщик */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Застройщик</label>
                <Input
                  placeholder="ПИК, Самолёт, Sminex..."
                  value={developer}
                  onChange={e => setDeveloper(e.target.value)}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
                />
              </div>

              {/* Класс */}
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

              {/* Статус строительства */}
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

              {/* Площадь */}
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

              {/* Этажи */}
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

              {/* Цена от */}
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

              {/* Срок сдачи */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Срок сдачи</label>
                <Input
                  placeholder="Q2 2026, 2027..."
                  value={completionDate}
                  onChange={e => setCompletionDate(e.target.value)}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
                />
              </div>

              {/* Комиссия */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Комиссия</label>
                <Input
                  placeholder="3% от сделки"
                  value={commission}
                  onChange={e => setCommission(e.target.value)}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 h-11"
                />
              </div>

              {/* Условия комиссии */}
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
        )}

        {/* ШАГ 4: Описание и фото */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Описание и медиа</h2>
              <p className="text-sm text-gray-500">Расскажите о проекте, добавьте фото и видео</p>
            </div>

            {/* Описание */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">Описание проекта</label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerate}
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

            {/* Фото */}
            <div>
              <label className="text-xs text-gray-500 mb-3 block">Фотографии проекта</label>
              <SortablePhotoGrid
                photos={photos}
                uploadingPhoto={uploadingPhoto}
                onPhotosChange={setPhotos}
                onUploadingChange={setUploadingPhoto}
              />
            </div>

            {/* Видео */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Видео (Rutube, VK Video, YouTube)</label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="https://rutube.ru/video/..."
                  value={videoInput}
                  onChange={e => setVideoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addVideo()}
                  className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
                <Button type="button" onClick={addVideo} variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white shrink-0">
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
        )}

        {/* ШАГ 5: Публикация */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Публикация</h2>
              <p className="text-sm text-gray-500">Проверьте данные и опубликуйте проект</p>
            </div>

            {/* Карточка итогов */}
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

            {/* Переключатель публикации */}
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-5">
              <button
                onClick={() => setPublishToBase(v => !v)}
                className="flex items-center justify-between w-full"
              >
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
        )}

        {/* Навигация */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#1f1f1f]">
          <Button onClick={handleBack} variant="ghost" className="text-gray-400 hover:text-white">
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            {step === 0 ? "Отмена" : "Назад"}
          </Button>

          {isLastStep ? (
            <Button
              onClick={handlePublish}
              disabled={saving || uploadingPhoto}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              {saving
                ? <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Сохраняю...</>
                : <><Icon name="Check" className="h-4 w-4 mr-2" />Опубликовать проект</>
              }
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={step === 0 && !projectType}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              Далее
              <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
