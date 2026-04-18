import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import ShareDialog from "@/components/ShareDialog"
import func2url from "../../backend/func2url.json"
import { getCategoryFields } from "@/components/wizard/wizardTypes"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CATEGORIES = ["Все", "Коммерческая", "Инвестиционная", "С торгов", "Новостройки"]

// Маппинг категорий маркетплейса -> id категории визарда
const CAT_ID_MAP: Record<string, string> = {
  "Коммерческая": "commercial",
  "Инвестиционная": "investment",
  "С торгов": "auction",
  "Новостройки": "newbuild",
}

const OBJECTS = [
  {
    id: 1,
    title: "Торговое помещение на первой линии",
    type: "Коммерческая",
    city: "Москва, ЦАО",
    price: "18 500 000 ₽",
    area: "142 м²",
    yield: "9.2%",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    badge: "Горячее",
    badgeColor: "bg-orange-500",
  },
  {
    id: 2,
    title: "Офисный блок в бизнес-центре класса B+",
    type: "Коммерческая",
    city: "Москва, СЗАО",
    price: "42 000 000 ₽",
    area: "310 м²",
    yield: "8.5%",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    badge: null,
    badgeColor: "",
  },
  {
    id: 3,
    title: "Производственно-складской комплекс",
    type: "Инвестиционная",
    city: "Московская обл., Химки",
    price: "87 000 000 ₽",
    area: "1 200 м²",
    yield: "11.3%",
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
    badge: "Инвестиции",
    badgeColor: "bg-violet-600",
  },
  {
    id: 4,
    title: "Помещение под общепит / стрит-ритейл",
    type: "С торгов",
    city: "Санкт-Петербург, Центр",
    price: "6 200 000 ₽",
    area: "78 м²",
    yield: "12.1%",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    badge: "Торги",
    badgeColor: "bg-green-600",
  },
  {
    id: 5,
    title: "Апарт-комплекс на этапе котлована",
    type: "Новостройки",
    city: "Москва, ЮАО",
    price: "от 7 400 000 ₽",
    area: "от 38 м²",
    yield: "15%",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    badge: "Новостройка",
    badgeColor: "bg-blue-600",
  },
]

const CAT_MAP: Record<string, string> = {
  investment: "Инвестиционная",
  commercial: "Коммерческая",
  auction: "С торгов",
  newbuild: "Новостройки",
}

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [search, setSearch] = useState("")
  const [dbObjects, setDbObjects] = useState<typeof OBJECTS>([])
  const [loading, setLoading] = useState(true)
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string } | null>(null)
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [areaFrom, setAreaFrom] = useState("")
  const [areaTo, setAreaTo] = useState("")

  // Сбрасываем доп. фильтры при смене категории
  function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    setExtraFilters({})
    setShowFilters(cat !== "Все" && CAT_ID_MAP[cat] !== undefined)
  }

  function resetAllFilters() {
    setExtraFilters({})
    setPriceFrom("")
    setPriceTo("")
    setAreaFrom("")
    setAreaTo("")
  }

  const hasActiveFilters =
    Object.values(extraFilters).some(v => v.trim()) ||
    priceFrom || priceTo || areaFrom || areaTo

  // Поля фильтра для активной категории
  const activeCatFields = activeCategory !== "Все" && CAT_ID_MAP[activeCategory]
    ? getCategoryFields(CAT_ID_MAP[activeCategory])
    : []

  useEffect(() => {
    fetch(`${func2url.objects}?marketplace=true`)
      .then(r => r.json())
      .then(data => {
        const parsed = JSON.parse(typeof data === "string" ? data : JSON.stringify(data))
        const arr = (parsed.objects || []).map((o: Record<string, unknown>) => {
          const photos = Array.isArray(o.photos) ? (o.photos as string[]) : []
          return {
            id: String(o.id),
            title: String(o.title ?? ""),
            type: CAT_MAP[o.category as string] ?? (o.type as string),
            city: String(o.city ?? ""),
            price: o.price ? `${o.price} ₽` : "—",
            area: o.area ? `${o.area} м²` : "—",
            yield: (o.yield_percent as string) || "—",
            img: photos[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
            badge: null,
            badgeColor: "",
          }
        })
        setDbObjects(arr)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allObjects = [...dbObjects, ...OBJECTS]

  const filtered = allObjects.filter((o) => {
    const matchCat = activeCategory === "Все" || o.type === activeCategory
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || o.city.toLowerCase().includes(search.toLowerCase())

    // Фильтрация по extra_fields категории
    const matchExtra = activeCatFields.every(({ key }) => {
      const filterVal = (extraFilters[key] ?? "").trim().toLowerCase()
      if (!filterVal) return true
      const objVal = ((o as Record<string, unknown>).extra_fields as Record<string, string> | undefined)?.[key] ?? ""
      return objVal.toLowerCase().includes(filterVal)
    })

    // Фильтрация по цене (убираем нечисловые символы)
    const priceNum = parseFloat(o.price.replace(/[^\d.]/g, "")) || 0
    const matchPriceFrom = priceFrom ? priceNum >= parseFloat(priceFrom.replace(/\s/g, "")) : true
    const matchPriceTo = priceTo ? priceNum <= parseFloat(priceTo.replace(/\s/g, "")) : true

    // Фильтрация по площади
    const areaNum = parseFloat(o.area.replace(/[^\d.]/g, "")) || 0
    const matchAreaFrom = areaFrom ? areaNum >= parseFloat(areaFrom) : true
    const matchAreaTo = areaTo ? areaNum <= parseFloat(areaTo) : true

    return matchCat && matchSearch && matchExtra && matchPriceFrom && matchPriceTo && matchAreaFrom && matchAreaTo
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <section className="px-4 md:px-8 pt-8 pb-16 max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Каталог недвижимости</h1>
          <p className="text-gray-400 text-lg">Коммерческая, инвестиционная недвижимость, торги и новостройки</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по названию или городу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#141414] border-[#262626] text-white placeholder:text-gray-500 focus-visible:ring-violet-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Фильтры цены и площади — для всех категорий */}
        <div className="mb-4 rounded-2xl bg-[#111] border border-[#262626] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Icon name="SlidersHorizontal" className="h-4 w-4 text-blue-400" />
              Цена и площадь
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <Icon name="X" className="h-3 w-3" />
                Сбросить все
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Цена от, ₽</label>
              <Input
                value={priceFrom}
                onChange={e => setPriceFrom(e.target.value)}
                placeholder="1 000 000"
                className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Цена до, ₽</label>
              <Input
                value={priceTo}
                onChange={e => setPriceTo(e.target.value)}
                placeholder="100 000 000"
                className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Площадь от, м²</label>
              <Input
                value={areaFrom}
                onChange={e => setAreaFrom(e.target.value)}
                placeholder="50"
                className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Площадь до, м²</label>
              <Input
                value={areaTo}
                onChange={e => setAreaTo(e.target.value)}
                placeholder="5000"
                className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Панель фильтров по параметрам категории */}
        {showFilters && activeCatFields.length > 0 && (
          <div className="mb-6 rounded-2xl bg-[#111] border border-[#1f2937] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              <Icon name="Filter" className="h-4 w-4 text-violet-400" />
              Характеристики: {activeCategory}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {activeCatFields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
                  <Input
                    value={extraFilters[key] ?? ""}
                    onChange={e => setExtraFilters(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Объекты не найдены</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((obj) => (
              <div
                key={obj.id}
                className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-blue-500/40 transition-colors group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={obj.img}
                    alt={obj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {obj.badge && (
                    <span className={`absolute top-3 left-3 ${obj.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
                      {obj.badge}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-1">{obj.type}</p>
                  <h3 className="text-white font-semibold text-sm mb-2 leading-snug">{obj.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                    <Icon name="MapPin" className="h-3.5 w-3.5 text-violet-400" />
                    {obj.city}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-white">{obj.price}</p>
                      <p className="text-xs text-gray-500">{obj.area}</p>
                    </div>
                    {obj.yield !== "—" && (
                      <div className="text-right">
                        <p className="text-green-400 font-semibold text-sm">{obj.yield}</p>
                        <p className="text-xs text-gray-500">доходность</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {UUID_RE.test(String(obj.id)) ? (
                      <Link to={`/object/${obj.id}`} className="flex-1">
                        <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm">
                          Подробнее
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="flex-1 rounded-xl bg-[#1a1a1a] text-gray-500 text-sm cursor-not-allowed">
                        Демо-объект
                      </Button>
                    )}
                    {UUID_RE.test(String(obj.id)) && (
                      <button
                        onClick={() => setShareTarget({ id: String(obj.id), title: obj.title })}
                        aria-label="Поделиться"
                        className="shrink-0 w-10 h-10 rounded-xl border border-[#262626] bg-[#1a1a1a] text-gray-300 hover:text-white hover:border-blue-500/40 flex items-center justify-center transition-colors"
                      >
                        <Icon name="Share2" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {shareTarget && (
        <ShareDialog
          title={shareTarget.title}
          url={`${window.location.origin}/object/${shareTarget.id}`}
          onClose={() => setShareTarget(null)}
        />
      )}
    </main>
  )
}