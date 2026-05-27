import { useState, useEffect } from "react"
import func2url from "../../../backend/func2url.json"
import { Offer, OfferForm, EMPTY_FORM } from "./AggOffersTypes"
import AggOffersToolbar from "./AggOffersToolbar"
import AggOffersTable from "./AggOffersTable"
import AggOffersDialog from "./AggOffersDialog"
import AddDeveloperDialog, { DeveloperForm } from "./AddDeveloperDialog"
import AddProjectDialog, { ProjectForm } from "./AddProjectDialog"
import { AddObjectWizardBase } from "@/components/AddObjectWizardBase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const AGG_ADMIN_URL = (func2url as Record<string, string>)["agg-admin"]

export default function AggOffersAdmin({ token }: { token: string }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Мастер — открывается при нажатии «Добавить объект»
  const [wizardOpen, setWizardOpen] = useState(false)
  const [developerOpen, setDeveloperOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [developerSaving, setDeveloperSaving] = useState(false)
  const [projectSaving, setProjectSaving] = useState(false)

  // XML Фид
  const [feedOpen, setFeedOpen] = useState(false)
  const [feedUrl, setFeedUrl] = useState("")
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedResult, setFeedResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [feedError, setFeedError] = useState("")

  // Диалог — открывается при редактировании существующего объекта
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [photoInput, setPhotoInput] = useState("")
  const [videoInput, setVideoInput] = useState("")
  const [totalFixations, setTotalFixations] = useState(0)

  const load = async () => {
    setLoading(true)
    const url = new URL(AGG_ADMIN_URL)
    if (statusFilter) url.searchParams.set("status", statusFilter)
    if (catFilter) url.searchParams.set("category", catFilter)
    url.searchParams.set("limit", "100")
    try {
      const res = await fetch(url.toString())
      const data = await res.json()
      const allOffers: Offer[] = data.offers || []
      // Автоудаление системного placeholder
      const placeholder = allOffers.find(o => o.id === "00000000-0000-0000-0000-000000000001")
      if (placeholder) {
        await fetch(`${AGG_ADMIN_URL}?id=${placeholder.id}`, { method: "DELETE" })
        setOffers(allOffers.filter(o => o.id !== "00000000-0000-0000-0000-000000000001"))
      } else {
        setOffers(allOffers)
      }
      setTotal(data.total || 0)
      setTotalFixations(data.total_fixations || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [catFilter, statusFilter])

  // «Добавить» — открывает полный мастер
  const openNew = () => setWizardOpen(true)

  const handleFeedImport = async () => {
    if (!feedUrl.trim()) return
    setFeedLoading(true)
    setFeedError("")
    setFeedResult(null)
    try {
      const FEED_URL = (func2url as Record<string, string>)["agg-feed-import"]
      const res = await fetch(FEED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feed_url: feedUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка импорта")
      setFeedResult(data)
      load()
    } catch (e: unknown) {
      setFeedError(e instanceof Error ? e.message : "Ошибка импорта")
    } finally {
      setFeedLoading(false)
    }
  }

  // Клик по строке таблицы — открывает быстрый диалог редактирования
  const openEdit = (o: Offer) => {
    setEditing(o)
    setForm({
      title: o.title || "",
      category: o.category || "commercial",
      subtype: o.subtype || "",
      city: o.city || "",
      region: o.region || "",
      address: o.address || "",
      price: o.price ? String(o.price) : "",
      price_label: o.price_label || "",
      area: o.area ? String(o.area) : "",
      yield_percent: o.yield_percent ? String(o.yield_percent) : "",
      description: o.description || "",
      status: o.status || "active",
      photos: o.photos || [],
      videos: o.videos || [],
      presentation_url: o.presentation_url || "",
      commission: o.commission || "",
      commission_notes: o.commission_notes || "",
    })
    setPhotoInput("")
    setVideoInput("")
    setDialog(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.category) return
    setSaving(true)
    const body: Record<string, unknown> = {
      title: form.title,
      category: form.category,
      subtype: form.subtype || undefined,
      city: form.city || undefined,
      region: form.region || undefined,
      address: form.address || undefined,
      price: form.price ? Number(form.price) : undefined,
      price_label: form.price_label || undefined,
      area: form.area ? Number(form.area) : undefined,
      yield_percent: form.yield_percent ? Number(form.yield_percent) : undefined,
      description: form.description || undefined,
      status: form.status,
      photos: form.photos,
      videos: form.videos,
      presentation_url: form.presentation_url || undefined,
      commission: form.commission || undefined,
      commission_notes: form.commission_notes || undefined,
    }
    if (editing) body.id = editing.id
    await fetch(AGG_ADMIN_URL, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setDialog(false)
    load()
  }

  const addPhoto = () => {
    if (!photoInput.trim()) return
    setForm(f => ({ ...f, photos: [...f.photos, photoInput.trim()] }))
    setPhotoInput("")
  }

  const removePhoto = (i: number) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))
  }

  const addVideo = () => {
    if (!videoInput.trim()) return
    setForm(f => ({ ...f, videos: [...f.videos, videoInput.trim()] }))
    setVideoInput("")
  }

  const removeVideo = (i: number) => {
    setForm(f => ({ ...f, videos: f.videos.filter((_, idx) => idx !== i) }))
  }

  const deleteOffer = async (o: Offer) => {
    if (!confirm(`Удалить "${o.title}"?`)) return
    await fetch(`${AGG_ADMIN_URL}?id=${o.id}`, { method: "DELETE" })
    load()
  }

  const handleDeveloperSave = async (data: DeveloperForm) => {
    setDeveloperSaving(true)
    await fetch(AGG_ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.name,
        category: "commercial",
        subtype: "Застройщик",
        city: data.city,
        description: [data.description, data.website && `Сайт: ${data.website}`, data.phone && `Тел: ${data.phone}`, data.email && `Email: ${data.email}`].filter(Boolean).join("\n"),
        status: "active",
        photos: [...(data.logo_url ? [data.logo_url] : []), ...data.photos],
        videos: data.videos,
      }),
    })
    setDeveloperSaving(false)
    setDeveloperOpen(false)
    load()
  }

  const handleProjectSave = async (data: ProjectForm) => {
    setProjectSaving(true)
    const projectTypes: Record<string, string> = { bc: "Бизнес-центр", mfk: "МФК", zhk: "ЖК", kp: "Коттеджный посёлок", tc: "ТЦ", sk: "Склад", gk: "Гостиница", other: "Проект" }
    await fetch(AGG_ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.name,
        category: "commercial",
        subtype: projectTypes[data.type] || data.type,
        city: data.city,
        address: data.address,
        price: data.price_from ? Number(data.price_from) : undefined,
        area: data.total_area ? Number(data.total_area) : undefined,
        description: [data.description, data.developer && `Застройщик: ${data.developer}`, data.floors && `Этажность: ${data.floors}`, data.completion_date && `Срок сдачи: ${data.completion_date}`, data.class_type && `Класс: ${data.class_type}`].filter(Boolean).join("\n"),
        status: "active",
        photos: data.photos,
        videos: data.videos,
      }),
    })
    setProjectSaving(false)
    setProjectOpen(false)
    load()
  }

  const filtered = offers.filter(o =>
    !search ||
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    (o.city || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AggOffersToolbar
        total={total}
        totalFixations={totalFixations}
        search={search}
        catFilter={catFilter}
        statusFilter={statusFilter}
        loading={loading}
        onSearch={setSearch}
        onCatFilter={setCatFilter}
        onStatusFilter={setStatusFilter}
        onRefresh={load}
        onAdd={openNew}
        onFeed={() => { setFeedOpen(true); setFeedResult(null); setFeedError("") }}
        onAddDeveloper={() => setDeveloperOpen(true)}
        onAddProject={() => setProjectOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        <AggOffersTable
          offers={filtered}
          loading={loading}
          onEdit={openEdit}
          onAdd={openNew}
          onDelete={deleteOffer}
        />
      </div>

      {/* Мастер добавления нового объекта */}
      {wizardOpen && (
        <AddObjectWizardBase
          onClose={() => setWizardOpen(false)}
          onSave={() => { setWizardOpen(false); load() }}
        />
      )}

      {/* Модалка застройщика */}
      <AddDeveloperDialog
        open={developerOpen}
        onOpenChange={setDeveloperOpen}
        onSave={handleDeveloperSave}
        saving={developerSaving}
      />

      {/* Модалка проекта */}
      <AddProjectDialog
        open={projectOpen}
        onOpenChange={setProjectOpen}
        onSave={handleProjectSave}
        saving={projectSaving}
      />

      {/* Модальное окно XML Фид */}
      <Dialog open={feedOpen} onOpenChange={(v) => { setFeedOpen(v); if (!v) { setFeedResult(null); setFeedError("") } }}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Rss" className="h-5 w-5 text-emerald-400" />
              Импорт XML Фида
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-400">
              Вставьте URL XML-фида (форматы: YRL, Циан, Авито Недвижимость). Система загрузит и добавит объекты в базу автоматически.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">URL фида</label>
              <Input
                placeholder="https://example.com/feed.xml"
                value={feedUrl}
                onChange={e => setFeedUrl(e.target.value)}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                disabled={feedLoading}
              />
            </div>

            {feedError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <Icon name="AlertCircle" className="h-4 w-4 shrink-0" />
                {feedError}
              </div>
            )}

            {feedResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                  <Icon name="CheckCircle" className="h-4 w-4" />
                  Импорт завершён
                </div>
                <p className="text-sm text-gray-300">Добавлено: <span className="text-white font-semibold">{feedResult.imported}</span> объектов</p>
                {feedResult.skipped > 0 && <p className="text-sm text-gray-400">Пропущено дублей: {feedResult.skipped}</p>}
                {feedResult.errors?.length > 0 && (
                  <details className="mt-1">
                    <summary className="text-xs text-red-400 cursor-pointer">Ошибок: {feedResult.errors.length}</summary>
                    <ul className="mt-1 space-y-0.5 text-xs text-red-300">
                      {feedResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleFeedImport}
                disabled={!feedUrl.trim() || feedLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
              >
                {feedLoading ? <Icon name="Loader2" className="h-4 w-4 mr-1.5 animate-spin" /> : <Icon name="Download" className="h-4 w-4 mr-1.5" />}
                {feedLoading ? "Загружаю фид..." : "Импортировать"}
              </Button>
              <Button variant="ghost" onClick={() => setFeedOpen(false)} className="text-gray-400 hover:text-white">
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Быстрый диалог редактирования существующего объекта */}
      <AggOffersDialog
        open={dialog}
        editing={editing}
        form={form}
        saving={saving}
        photoInput={photoInput}
        videoInput={videoInput}
        onOpenChange={setDialog}
        onFormChange={patch => setForm(f => ({ ...f, ...patch }))}
        onPhotoInputChange={setPhotoInput}
        onVideoInputChange={setVideoInput}
        onAddPhoto={addPhoto}
        onRemovePhoto={removePhoto}
        onAddVideo={addVideo}
        onRemoveVideo={removeVideo}
        onSave={handleSave}
      />
    </div>
  )
}