import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

const CATEGORIES = [
  { id: "commercial",  label: "Коммерческая",   icon: "Building2",      color: "bg-blue-600" },
  { id: "investment",  label: "Инвестиционная",  icon: "TrendingUp",     color: "bg-emerald-600" },
  { id: "resort",      label: "Курортная",       icon: "Waves",          color: "bg-cyan-600" },
  { id: "auction",     label: "Торги",           icon: "Gavel",          color: "bg-orange-600" },
  { id: "residential", label: "Жилая",           icon: "Home",           color: "bg-purple-600" },
  { id: "land",        label: "Земля",           icon: "TreePine",       color: "bg-lime-600" },
  { id: "parking",     label: "Паркинги",        icon: "ParkingSquare",  color: "bg-gray-600" },
]

const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))
const PRIORITY_CATS = ["commercial", "investment", "resort", "auction"]

function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}

interface Offer {
  id: string
  title: string
  category: string
  subtype?: string
  city?: string
  price?: number
  price_label?: string
  area?: number
  yield_percent?: number
  photos?: string[]
  presentation_url?: string
  commission?: string
}

const DEFAULT_IMG = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("")
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const url = new URL((func2url as Record<string, string>)["agg-offers"])
    if (category) url.searchParams.set("category", category)
    if (search) url.searchParams.set("search", search)
    if (city) url.searchParams.set("city", city)
    if (priceFrom) url.searchParams.set("price_from", priceFrom)
    if (priceTo) url.searchParams.set("price_to", priceTo)
    url.searchParams.set("limit", "48")
    try {
      const res = await fetch(url.toString())
      const data = await res.json()
      setOffers(data.offers || [])
      setTotal(data.total || 0)
    } catch {
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [category, search, city, priceFrom, priceTo])

  useEffect(() => {
    load()
  }, [load])

  const priorityCats = CATEGORIES.filter(c => PRIORITY_CATS.includes(c.id))
  const restCats = CATEGORIES.filter(c => !PRIORITY_CATS.includes(c.id))

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">База / Проекты</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {total > 0 ? `${total} предложений` : "Каталог объектов агрегатора"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(v => !v)}
                className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                <Icon name="SlidersHorizontal" className="h-4 w-4 mr-2" />
                Фильтры
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/projects/fixations")}
                className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                <Icon name="BookmarkCheck" className="h-4 w-4 mr-2" />
                Мои фиксации
              </Button>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative mb-4">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по названию, городу, описанию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          {/* Категории — приоритетные */}
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setCategory("")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !category ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
              }`}
            >
              Все
            </button>
            {priorityCats.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(prev => prev === c.id ? "" : c.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === c.id
                    ? `${c.color} text-white`
                    : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
                }`}
              >
                <Icon name={c.icon} className="h-3.5 w-3.5" />
                {c.label}
              </button>
            ))}
            {restCats.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(prev => prev === c.id ? "" : c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === c.id
                    ? `${c.color} text-white`
                    : "bg-[#111] text-gray-600 hover:text-gray-400 border border-[#1f1f1f]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Расширенные фильтры */}
          {showFilters && (
            <div className="mt-3 p-4 bg-[#111] border border-[#2a2a2a] rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Город</label>
                <Input
                  placeholder="Москва, Сочи..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Цена от (₽)</label>
                <Input
                  placeholder="10000000"
                  value={priceFrom}
                  onChange={e => setPriceFrom(e.target.value)}
                  type="number"
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Цена до (₽)</label>
                <Input
                  placeholder="500000000"
                  value={priceTo}
                  onChange={e => setPriceTo(e.target.value)}
                  type="number"
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCity(""); setPriceFrom(""); setPriceTo("") }}
                  className="text-gray-500 hover:text-white w-full"
                >
                  Сбросить
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Каталог */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Icon name="FolderOpen" className="h-12 w-12 text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Предложений пока нет</p>
            <p className="text-gray-700 text-sm mt-1">База пополняется операторами платформы</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => (
              <OfferCard key={offer.id} offer={offer} onOpen={() => navigate(`/projects/${offer.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  const cat = CATEGORIES.find(c => c.id === offer.category)
  const photo = offer.photos?.[0] || DEFAULT_IMG

  return (
    <div
      className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      {/* Фото */}
      <div className="relative h-44 overflow-hidden bg-[#0d0d0d]">
        <img
          src={photo}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {cat && (
            <span className={`${cat.color} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
              {cat.label}
            </span>
          )}
          {offer.yield_percent && (
            <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {offer.yield_percent}% доход
            </span>
          )}
        </div>
        {offer.presentation_url && (
          <button
            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
            onClick={e => { e.stopPropagation(); window.open(offer.presentation_url, "_blank") }}
          >
            <Icon name="FileDown" className="h-3 w-3" />
            Презентация
          </button>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2">{offer.title}</h3>
        {offer.city && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <Icon name="MapPin" className="h-3 w-3" />
            {offer.city}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white">
              {offer.price_label || formatPrice(offer.price ?? null)}
            </div>
            {offer.area && (
              <div className="text-xs text-gray-500">{offer.area} м²</div>
            )}
          </div>
          {offer.commission && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">
              {offer.commission}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
