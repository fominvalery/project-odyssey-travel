import { useState, useEffect } from "react"
import func2url from "../../../backend/func2url.json"
import { Offer, OfferForm, EMPTY_FORM } from "./AggOffersTypes"
import AggOffersToolbar from "./AggOffersToolbar"
import AggOffersTable from "./AggOffersTable"
import AggOffersDialog from "./AggOffersDialog"

const AGG_ADMIN_URL = (func2url as Record<string, string>)["agg-admin"]

export default function AggOffersAdmin({ token }: { token: string }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
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
      setOffers(data.offers || [])
      setTotal(data.total || 0)
      setTotalFixations(data.total_fixations || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [catFilter, statusFilter])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setPhotoInput("")
    setVideoInput("")
    setDialog(true)
  }

  const openEdit = (o: Offer) => {
    setEditing(o)
    setForm({
      title: o.title || "",
      category: o.category || "commercial",
      subtype: o.subtype || "",
      city: o.city || "",
      region: "",
      address: "",
      price: o.price ? String(o.price) : "",
      price_label: o.price_label || "",
      area: o.area ? String(o.area) : "",
      yield_percent: o.yield_percent ? String(o.yield_percent) : "",
      description: "",
      status: o.status || "active",
      photos: o.photos || [],
      videos: [],
      presentation_url: o.presentation_url || "",
      commission: o.commission || "",
      commission_notes: "",
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
      />

      <div className="flex-1 overflow-y-auto">
        <AggOffersTable
          offers={filtered}
          loading={loading}
          onEdit={openEdit}
          onAdd={openNew}
        />
      </div>

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
