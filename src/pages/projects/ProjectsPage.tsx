import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"

// ── Категории (соответствуют мастеру и Предложениям базы) ─────────────────────

const CATEGORY_GROUPS = [
  {
    label: "Коммерческая недвижимость",
    items: [
      {
        id: "commercial",
        label: "Коммерция",
        desc: "Офисы, ритейл, склады, сервис",
        icon: "Building2",
        bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
        color: "bg-blue-600",
      },
      {
        id: "investment",
        label: "Инвестиции",
        desc: "ГАБ, редевелопмент, земля, портфель",
        icon: "TrendingUp",
        bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
        color: "bg-emerald-600",
      },
    ],
  },
  {
    label: "Специальные форматы",
    items: [
      {
        id: "resort",
        label: "Курортная",
        desc: "Отели, базы отдыха, SPA, инвестпроекты",
        icon: "Waves",
        bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
        color: "bg-cyan-600",
      },
      {
        id: "auction",
        label: "Торги",
        desc: "Банкротство, госимущество, залоги",
        icon: "Gavel",
        bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
        color: "bg-orange-600",
      },
    ],
  },
  {
    label: "Жилая недвижимость",
    items: [
      {
        id: "residential",
        label: "Жилая",
        desc: "Городская, загородная, премиум",
        icon: "Home",
        bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
        color: "bg-purple-600",
      },
      {
        id: "newbuild",
        label: "Новостройки",
        desc: "Жилые и коммерческие в ЖК",
        icon: "HardHat",
        bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2e040e9f-00a8-40b1-801c-bd3442c7aafa.jpg",
        color: "bg-indigo-600",
      },
    ],
  },
]

const ALL_CATS = CATEGORY_GROUPS.flatMap(g => g.items)
const CAT_MAP = Object.fromEntries(ALL_CATS.map(c => [c.id, c]))

// Все категории в плоском виде для фильтра-пилюль
const PILL_CATS = ALL_CATS

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
  extra_fields?: Record<string, string>
}

const DEFAULT_IMG = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

type ViewMode = "grid" | "category"

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
  const [view, setView] = useState<ViewMode>("category") // начальный вид — выбор категории

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

  useEffect(() => { load() }, [load])

  // При выборе категории — переходим в grid-вид
  function handleCategorySelect(id: string) {
    setCategory(id)
    setView("grid")
  }

  // Сброс фильтров
  function resetFilters() {
    setCity("")
    setPriceFrom("")
    setPriceTo("")
    setShowFilters(false)
  }

  const hasActiveFilters = Boolean(city || priceFrom || priceTo)
  const selectedCat = category ? CAT_MAP[category] : null

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">

      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#1f1f1f] px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-500 hover:text-white transition-colors shrink-0"
              >
                <Icon name="ChevronLeft" className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white leading-tight">База / Проекты</h1>
                <p className="text-xs text-gray-500">
                  {total > 0 ? `${total} предложений` : "Каталог объектов"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Переключатель вида */}
              {view === "grid" && (
                <button
                  onClick={() => { setCategory(""); setView("category") }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
                >
                  <Icon name="LayoutGrid" className="h-3.5 w-3.5" />
                  Все типы
                </button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(v => !v)}
                className={`border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a] ${hasActiveFilters ? "border-blue-500/50 text-blue-400" : ""}`}
              >
                <Icon name="SlidersHorizontal" className="h-4 w-4 mr-1.5" />
                Фильтры
                {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/projects/fixations")}
                className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                <Icon name="BookmarkCheck" className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Мои фиксации</span>
              </Button>
            </div>
          </div>

          {/* ── Поиск и пилюли категорий (только в grid-виде) ────────────── */}
          {view === "grid" && (
            <div className="mt-3 space-y-2">
              {/* Поиск */}
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Поиск по названию, городу, описанию..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

              {/* Пилюли категорий */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategory("")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !category ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  Все
                </button>
                {PILL_CATS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(prev => prev === c.id ? "" : c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      category === c.id
                        ? `${c.color} text-white`
                        : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
                    }`}
                  >
                    <Icon name={c.icon} className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Расширенные фильтры ───────────────────────────────────────── */}
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
                  placeholder="10 000 000"
                  value={priceFrom}
                  onChange={e => setPriceFrom(e.target.value)}
                  type="number"
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Цена до (₽)</label>
                <Input
                  placeholder="500 000 000"
                  value={priceTo}
                  onChange={e => setPriceTo(e.target.value)}
                  type="number"
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-gray-500 hover:text-white w-full"
                >
                  Сбросить
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Вид: выбор категории (начальный экран) ────────────────────────── */}
      {view === "category" && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8">

          {/* Поиск в режиме выбора категории */}
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по всей базе..."
              value={search}
              onChange={e => { setSearch(e.target.value); if (e.target.value) setView("grid") }}
              className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          {CATEGORY_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{group.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.items.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="relative h-44 rounded-2xl overflow-hidden text-left group focus:outline-none"
                  >
                    {/* Фон */}
                    <img
                      src={cat.bg}
                      alt={cat.label}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Затемнение */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                    {/* Контент */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={`w-9 h-9 rounded-xl ${cat.color}/20 border border-white/10 flex items-center justify-center backdrop-blur-sm`}>
                          <Icon name={cat.icon} className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">{cat.label}</span>
                      </div>
                      <p className="text-xs text-gray-300">{cat.desc}</p>
                    </div>
                    {/* Hover-эффект */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Кнопка «Показать все» */}
          <button
            onClick={() => setView("grid")}
            className="w-full py-3 rounded-2xl border border-[#2a2a2a] text-gray-500 hover:text-white hover:border-[#3a3a3a] text-sm transition-colors"
          >
            Показать все предложения ({total > 0 ? total : "..."})
          </button>
        </div>
      )}

      {/* ── Вид: сетка объектов ───────────────────────────────────────────── */}
      {view === "grid" && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Заголовок выбранной категории */}
          {selectedCat && (
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-8 h-8 rounded-xl ${selectedCat.color} flex items-center justify-center shrink-0`}>
                <Icon name={selectedCat.icon} className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{selectedCat.label}</h2>
                <p className="text-xs text-gray-500">{selectedCat.desc}</p>
              </div>
            </div>
          )}

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
              <p className="text-gray-700 text-sm mt-1">
                {selectedCat ? `В категории «${selectedCat.label}» ещё нет объектов` : "База пополняется операторами платформы"}
              </p>
              {selectedCat && (
                <button
                  onClick={() => { setCategory(""); setView("category") }}
                  className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← Выбрать другую категорию
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map(offer => (
                <OfferCard key={offer.id} offer={offer} onOpen={() => navigate(`/projects/${offer.id}`)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Карточка объекта ──────────────────────────────────────────────────────────

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  const cat = CAT_MAP[offer.category]
  const photo = offer.photos?.[0] || DEFAULT_IMG
  const ef = offer.extra_fields || {}
  const commission = ef.commission || offer.commission || ""

  return (
    <div
      className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all cursor-pointer group"
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
        {/* Градиент */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Бейджи сверху */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
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

        {/* Кнопка презентации */}
        {offer.presentation_url && (
          <button
            className="absolute bottom-2.5 right-2.5 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors backdrop-blur-sm"
            onClick={e => { e.stopPropagation(); window.open(offer.presentation_url, "_blank") }}
          >
            <Icon name="FileDown" className="h-3 w-3" />
            PDF
          </button>
        )}

        {/* Цена поверх фото снизу */}
        <div className="absolute bottom-2.5 left-2.5">
          <div className="text-sm font-bold text-white drop-shadow">
            {offer.price_label || formatPrice(offer.price ?? null)}
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-snug">{offer.title}</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {offer.city && (
              <span className="flex items-center gap-1">
                <Icon name="MapPin" className="h-3 w-3" />
                {offer.city}
              </span>
            )}
            {offer.area && (
              <span className="flex items-center gap-1">
                <Icon name="Maximize2" className="h-3 w-3" />
                {offer.area} м²
              </span>
            )}
          </div>
          {commission && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px] shrink-0 ml-2">
              {commission}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
