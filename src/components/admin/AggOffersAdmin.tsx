import { useState, useEffect } from "react"
import func2url from "../../../backend/func2url.json"
import { Offer } from "./AggOffersTypes"
import AggOffersToolbar from "./AggOffersToolbar"
import AggOffersTable from "./AggOffersTable"
import AddDeveloperDialog, { DeveloperForm } from "./AddDeveloperDialog"
import AddProjectWizard from "./AddProjectWizard"
import { AddObjectWizardBase } from "@/components/AddObjectWizardBase"
import type { ObjectData } from "@/components/AddObjectWizard"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const AGG_ADMIN_URL = (func2url as Record<string, string>)["agg-admin"]

function offerToObjectData(o: Offer): ObjectData {
  return {
    id: o.id,
    type: o.category,
    subtype: o.subtype ?? "",
    title: o.title,
    city: o.city ?? "",
    address: o.address ?? "",
    price: o.price ? String(o.price) : "",
    area: o.area ? String(o.area) : "",
    yield: o.yield_percent ? String(o.yield_percent) : "",
    description: o.description ?? "",
    status: o.status === "active" ? "Активен" : o.status === "hidden" ? "Скрыт" : "Продан",
    category: o.category,
    published: o.status === "active",
    photos: o.photos ?? [],
    presentation_url: o.presentation_url ?? undefined,
    extra_fields: {
      ...(o.subtype ? { subtype: o.subtype } : {}),
      ...(o.price_label ? { price_label: o.price_label } : {}),
      ...(o.commission ? { commission: o.commission } : {}),
      ...(o.commission_notes ? { commission_notes: o.commission_notes } : {}),
      ...(o.region ? { region: o.region } : {}),
    },
  }
}

export default function AggOffersAdmin({ token }: { token: string }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Визард — для добавления и редактирования
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardInitial, setWizardInitial] = useState<ObjectData | undefined>(undefined)
  const [developerOpen, setDeveloperOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [developerSaving, setDeveloperSaving] = useState(false)

  // XML Фид
  const [feedOpen, setFeedOpen] = useState(false)
  const [feedUrl, setFeedUrl] = useState("")
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedResult, setFeedResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [feedError, setFeedError] = useState("")

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

  // «Добавить» — открывает визард без initial
  const openNew = () => { setWizardInitial(undefined); setWizardOpen(true) }

  // «Редактировать» — открывает визард с данными объекта
  const openEdit = (o: Offer) => { setWizardInitial(offerToObjectData(o)); setWizardOpen(true) }

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

      {/* Визард добавления / редактирования */}
      {wizardOpen && (
        <AddObjectWizardBase
          onClose={() => { setWizardOpen(false); setWizardInitial(undefined) }}
          onSave={() => { setWizardOpen(false); setWizardInitial(undefined); load() }}
          initial={wizardInitial}
        />
      )}

      {/* Модалка застройщика */}
      <AddDeveloperDialog
        open={developerOpen}
        onOpenChange={setDeveloperOpen}
        onSave={handleDeveloperSave}
        saving={developerSaving}
      />

      {/* Мастер добавления проекта */}
      {projectOpen && (
        <AddProjectWizard
          onClose={() => setProjectOpen(false)}
          onSave={() => { setProjectOpen(false); load() }}
        />
      )}

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

    </div>
  )
}