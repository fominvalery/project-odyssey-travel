import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

const CAT_LABEL: Record<string, string> = {
  commercial: "Коммерческая",
  investment: "Инвестиционная",
  resort: "Курортная",
  auction: "Торги",
  residential: "Жилая",
  land: "Земля",
  parking: "Паркинги",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает ответа",
  fixed: "Зафиксирован",
  invalid: "Неактуален",
  showing: "Показ",
  negotiation: "Переговоры",
  deal: "Сделка",
  docs: "Подготовка документов",
  payment: "Оплата",
}

function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}

interface OfferDetail {
  id: string
  title: string
  category: string
  subtype?: string
  city?: string
  region?: string
  address?: string
  price?: number
  price_label?: string
  area?: number
  yield_percent?: number
  description?: string
  photos?: string[]
  videos?: string[]
  presentation_url?: string
  extra_fields?: Record<string, string>
  commission?: string
  commission_notes?: string
}

const DEFAULT_IMG = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [fixDialog, setFixDialog] = useState(false)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixSuccess, setFixSuccess] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [fixNotes, setFixNotes] = useState("")

  useEffect(() => {
    if (!id) return
    const url = `${(func2url as Record<string, string>)["agg-offers"]}?id=${id}`
    fetch(url)
      .then(r => r.json())
      .then(d => setOffer(d.offer || null))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleFixation = async () => {
    if (!clientName.trim()) return
    setFixLoading(true)
    try {
      await fetch((func2url as Record<string, string>)["agg-fixations"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || "",
        },
        body: JSON.stringify({
          offer_id: id,
          full_name: clientName,
          phone: clientPhone,
          email: clientEmail,
          notes: fixNotes,
        }),
      })
      setFixSuccess(true)
    } catch {
      // pass
    } finally {
      setFixLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#0d0d0d] flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex-1 bg-[#0d0d0d] flex flex-col items-center justify-center min-h-screen gap-4">
        <Icon name="AlertCircle" className="h-12 w-12 text-gray-700" />
        <p className="text-gray-500">Предложение не найдено</p>
        <Button variant="ghost" onClick={() => navigate("/projects")}>← Назад</Button>
      </div>
    )
  }

  const photos = offer.photos && offer.photos.length > 0 ? offer.photos : [DEFAULT_IMG]

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Навигация */}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-5 transition-colors"
        >
          <Icon name="ChevronLeft" className="h-4 w-4" />
          База / Проекты
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-4">
            {/* Галерея */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
              <div className="relative h-72 bg-[#0d0d0d]">
                <img
                  src={photos[photoIdx]}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {CAT_LABEL[offer.category] || offer.category}
                  </span>
                  {offer.subtype && (
                    <span className="bg-[#1a1a1a]/80 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                      {offer.subtype}
                    </span>
                  )}
                </div>
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === photoIdx ? "border-blue-500" : "border-transparent"
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Заголовок */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
              <h1 className="text-xl font-bold text-white mb-2">{offer.title}</h1>
              {(offer.city || offer.address) && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Icon name="MapPin" className="h-4 w-4 shrink-0" />
                  {[offer.address, offer.city, offer.region].filter(Boolean).join(", ")}
                </div>
              )}
            </div>

            {/* Характеристики */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Характеристики</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {offer.area && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Площадь</div>
                    <div className="text-sm font-medium text-white">{offer.area} м²</div>
                  </div>
                )}
                {offer.yield_percent && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Доходность</div>
                    <div className="text-sm font-medium text-emerald-400">{offer.yield_percent}%</div>
                  </div>
                )}
                {offer.commission && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Комиссия</div>
                    <div className="text-sm font-medium text-white">{offer.commission}</div>
                  </div>
                )}
                {offer.extra_fields && Object.entries(offer.extra_fields).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-gray-500 mb-0.5 capitalize">{k}</div>
                    <div className="text-sm font-medium text-white">{v}</div>
                  </div>
                ))}
              </div>
              {offer.commission_notes && (
                <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-xl text-xs text-emerald-300">
                  {offer.commission_notes}
                </div>
              )}
            </div>

            {/* Описание */}
            {offer.description && (
              <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Описание</h2>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{offer.description}</p>
              </div>
            )}

            {/* Видео */}
            {offer.videos && offer.videos.length > 0 && (
              <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Видео</h2>
                <div className="space-y-2">
                  {offer.videos.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl hover:border-blue-500/40 transition-colors text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Icon name="Play" className="h-4 w-4 shrink-0" />
                      {url.length > 60 ? url.slice(0, 60) + "..." : url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка — CTA */}
          <div className="space-y-4">
            {/* Цена */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
              <div className="text-2xl font-bold text-white mb-1">
                {offer.price_label || formatPrice(offer.price ?? null)}
              </div>
              {offer.area && offer.price && (
                <div className="text-xs text-gray-500">
                  {Math.round(offer.price / offer.area).toLocaleString("ru")} ₽/м²
                </div>
              )}
            </div>

            {/* Действия */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 space-y-3">
              {offer.presentation_url && (
                <Button
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold"
                  onClick={() => window.open(offer.presentation_url, "_blank")}
                >
                  <Icon name="FileDown" className="h-4 w-4 mr-2" />
                  Скачать презентацию
                </Button>
              )}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={() => setFixDialog(true)}
              >
                <Icon name="BookmarkPlus" className="h-4 w-4 mr-2" />
                Зафиксировать клиента
              </Button>
              <button
                onClick={() => navigate("/projects/fixations")}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
              >
                Мои фиксации →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Диалог фиксации */}
      <Dialog open={fixDialog} onOpenChange={v => { setFixDialog(v); if (!v) { setFixSuccess(false); setClientName(""); setClientPhone(""); setClientEmail(""); setFixNotes("") } }}>
        <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Зафиксировать клиента</DialogTitle>
          </DialogHeader>
          {fixSuccess ? (
            <div className="py-8 text-center">
              <Icon name="CheckCircle2" className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Фиксация отправлена!</p>
              <p className="text-gray-400 text-sm mt-1">Ожидайте подтверждения от менеджера платформы</p>
              <Button
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/projects/fixations")}
              >
                Мои фиксации
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-xs text-gray-400">
                <span className="font-medium text-white">{offer.title}</span>
                {offer.city && ` · ${offer.city}`}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ФИО клиента *</label>
                <Input
                  placeholder="Иванов Иван Иванович"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Телефон</label>
                <Input
                  placeholder="+7 900 000 00 00"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <Input
                  placeholder="client@mail.ru"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Комментарий</label>
                <Textarea
                  placeholder="Источник клиента, пожелания..."
                  value={fixNotes}
                  onChange={e => setFixNotes(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={!clientName.trim() || fixLoading}
                onClick={handleFixation}
              >
                {fixLoading ? "Отправка..." : "Зафиксировать"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
