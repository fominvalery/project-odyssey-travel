import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import ShareDialog from "@/components/ShareDialog"
import { Footer } from "@/components/Footer"
import func2url from "../../backend/func2url.json"
import { getCategoryFields, CAT_ID_MAP, CATEGORIES as WIZ_CATEGORIES } from "@/components/wizard/wizardTypes"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MARKET_CATEGORIES = ["Все", "Жилая", "Новостройки", "Коммерческая", "Инвестиционная", "Курортная", "С торгов"]

const CAT_BADGE_COLOR: Record<string, string> = {
  "Жилая": "bg-sky-600",
  "Новостройки": "bg-blue-600",
  "Коммерческая": "bg-violet-600",
  "Инвестиционная": "bg-amber-600",
  "С торгов": "bg-green-600",
  "Курортная": "bg-cyan-600",
}

const OBJECTS = [
  {
    id: 1,
    title: "Торговое помещение на первой линии",
    type: "Коммерческая",
    subtype: "Стрит-ритейл",
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
    subtype: "Офис / БЦ",
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
    subtype: "ГАБ (готовый арендный бизнес)",
    city: "Московская обл., Химки",
    price: "87 000 000 ₽",
    area: "1 200 м²",
    yield: "11.3%",
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
    badge: "Инвестиции",
    badgeColor: "bg-amber-600",
  },
  {
    id: 4,
    title: "Помещение под общепит / стрит-ритейл",
    type: "С торгов",
    subtype: "Банкротство",
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
    subtype: "Апартаменты",
    city: "Москва, ЮАО",
    price: "от 7 400 000 ₽",
    area: "от 38 м²",
    yield: "15%",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    badge: "Новостройка",
    badgeColor: "bg-blue-600",
  },
  {
    id: 6,
    title: "3-комнатная квартира с видом на парк",
    type: "Жилая",
    subtype: "Квартира",
    city: "Москва, Хамовники",
    price: "32 500 000 ₽",
    area: "98 м²",
    yield: "—",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    badge: "Жилая",
    badgeColor: "bg-sky-600",
  },
  {
    id: 7,
    title: "Коттедж с участком 15 соток, Рублёвка",
    type: "Жилая",
    subtype: "Дом / Коттедж",
    city: "Московская обл., Одинцово",
    price: "85 000 000 ₽",
    area: "320 м²",
    yield: "—",
    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
    badge: "Жилая",
    badgeColor: "bg-sky-600",
  },
  {
    id: 8,
    title: "Бутик-отель на первой линии моря, Сочи",
    type: "Курортная",
    subtype: "Отель",
    city: "Сочи, Адлер",
    price: "185 000 000 ₽",
    area: "1 800 м²",
    yield: "14.2%",
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
    badge: "Горячее",
    badgeColor: "bg-orange-500",
  },
  {
    id: 9,
    title: "Wellness-отель с термами и SPA, Алтай",
    type: "Курортная",
    subtype: "Wellness-отель",
    city: "Республика Алтай, Белокуриха",
    price: "320 000 000 ₽",
    area: "4 200 м²",
    yield: "11.8%",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
    badge: "Курортная",
    badgeColor: "bg-cyan-600",
  },
  {
    id: 10,
    title: "Эко-турбаза на берегу озера, 15 домиков",
    type: "Курортная",
    subtype: "Эко-отель",
    city: "Карелия, Сортавала",
    price: "42 000 000 ₽",
    area: "3 500 м²",
    yield: "9.5%",
    img: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80",
    badge: "Курортная",
    badgeColor: "bg-cyan-600",
  },
  {
    id: 11,
    title: "Инвест-проект: апарт-отель у горнолыжного курорта",
    type: "Курортная",
    subtype: "Инвестиционный проект под строительство",
    city: "Красная Поляна, Роза Хутор",
    price: "от 8 500 000 ₽",
    area: "от 35 м²",
    yield: "18%",
    img: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=600&q=80",
    badge: "Инвест-проект",
    badgeColor: "bg-teal-600",
  },
]

const CAT_MAP: Record<string, string> = {
  investment: "Инвестиционная",
  commercial: "Коммерческая",
  auction: "С торгов",
  newbuild: "Новостройки",
  residential: "Жилая",
  resort: "Курортная",
}

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [activeSubtype, setActiveSubtype] = useState("")
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
  const [cityFilter, setCityFilter] = useState("")

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    setActiveSubtype("")
    setExtraFilters({})
    if (cat !== "Все" && CAT_ID_MAP[cat]) {
      setShowFilters(true)
    }
  }

  function resetAllFilters() {
    setExtraFilters({})
    setPriceFrom("")
    setPriceTo("")
    setAreaFrom("")
    setAreaTo("")
    setCityFilter("")
    setActiveSubtype("")
  }

  const hasActiveFilters =
    Object.values(extraFilters).some(v => v.trim()) ||
    priceFrom || priceTo || areaFrom || areaTo || cityFilter || activeSubtype

  const activeCatId = activeCategory !== "Все" ? (CAT_ID_MAP[activeCategory] ?? "") : ""
  const activeCatDef = WIZ_CATEGORIES.find(c => c.id === activeCatId)
  const activeCatFields = activeCatId
    ? getCategoryFields(activeCatId, activeSubtype)
    : []

  useEffect(() => {
    fetch(`${func2url.objects}?marketplace=true`)
      .then(r => r.json())
      .then(data => {
        const parsed = JSON.parse(typeof data === "string" ? data : JSON.stringify(data))
        const arr = (parsed.objects || []).map((o: Record<string, unknown>) => {
          const photos = Array.isArray(o.photos) ? (o.photos as string[]) : []
          const ef = (o.extra_fields as Record<string, string>) ?? {}
          const catLabel = CAT_MAP[o.category as string] ?? (o.type as string)
          return {
            id: String(o.id),
            title: String(o.title ?? ""),
            type: catLabel,
            subtype: ef.subtype ?? "",
            city: String(o.city ?? ""),
            price: o.price ? `${o.price} ₽` : "—",
            area: o.area ? `${o.area} м²` : "—",
            yield: (o.yield_percent as string) || "—",
            img: photos[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
            badge: catLabel,
            badgeColor: CAT_BADGE_COLOR[catLabel] ?? "bg-gray-600",
            extra_fields: ef,
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
    const oSubtype = (o as Record<string, unknown>).subtype as string ?? ""
    const matchSubtype = !activeSubtype || oSubtype === activeSubtype
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || o.city.toLowerCase().includes(search.toLowerCase())

    const matchExtra = activeCatFields.every(({ key }) => {
      const filterVal = (extraFilters[key] ?? "").trim().toLowerCase()
      if (!filterVal) return true
      const objVal = ((o as Record<string, unknown>).extra_fields as Record<string, string> | undefined)?.[key] ?? ""
      return objVal.toLowerCase().includes(filterVal)
    })

    const priceNum = parseFloat(o.price.replace(/[^\d.]/g, "")) || 0
    const matchPriceFrom = priceFrom ? priceNum >= parseFloat(priceFrom.replace(/\s/g, "")) : true
    const matchPriceTo = priceTo ? priceNum <= parseFloat(priceTo.replace(/\s/g, "")) : true

    const areaNum = parseFloat(o.area.replace(/[^\d.]/g, "")) || 0
    const matchAreaFrom = areaFrom ? areaNum >= parseFloat(areaFrom) : true
    const matchAreaTo = areaTo ? areaNum <= parseFloat(areaTo) : true

    const matchCity = cityFilter ? o.city.toLowerCase().includes(cityFilter.trim().toLowerCase()) : true

    return matchCat && matchSubtype && matchSearch && matchExtra && matchPriceFrom && matchPriceTo && matchAreaFrom && matchAreaTo && matchCity
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <section className="px-4 md:px-8 pt-8 pb-16 max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Каталог недвижимости</h1>
          <p className="text-gray-400 text-lg">Жилая, коммерческая, инвестиционная недвижимость, новостройки и торги</p>
        </div>

        {/* Строка поиска + кнопка фильтров */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по названию или городу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#141414] border-[#262626] text-white placeholder:text-gray-500 focus-visible:ring-violet-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors shrink-0 ${
              showFilters || hasActiveFilters
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-[#141414] border-[#262626] text-gray-400 hover:text-white hover:border-[#3a3a3a]"
            }`}
          >
            <Icon name="SlidersHorizontal" className="h-4 w-4" />
            Фильтры
            {hasActiveFilters && (
              <span className="ml-1 bg-white/20 rounded-full text-xs px-1.5 py-0.5 leading-none">
                {[priceFrom, priceTo, areaFrom, areaTo, activeSubtype, ...Object.values(extraFilters)].filter(v => v.trim()).length}
              </span>
            )}
          </button>
        </div>

        {/* Кнопки категорий */}
        <div className="flex flex-wrap gap-2 mb-3">
          {MARKET_CATEGORIES.map((cat) => (
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

        {/* Подтипы активной категории */}
        {activeCatDef?.subtypes && activeCatDef.subtypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeCatDef.subtypes.map(st => (
              <button
                key={st}
                onClick={() => setActiveSubtype(prev => prev === st ? "" : st)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeSubtype === st
                    ? "border-violet-500 bg-violet-500/15 text-violet-300"
                    : "border-[#2a2a2a] bg-transparent text-gray-500 hover:text-gray-300 hover:border-[#3a3a3a]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {/* Единая панель фильтров */}
        {showFilters && (
          <div className="mb-6 rounded-2xl bg-[#111] border border-[#262626] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon name="SlidersHorizontal" className="h-4 w-4 text-blue-400" />
                Фильтры подбора
                {activeCategory !== "Все" && (
                  <span className="text-blue-400">— {activeCategory}</span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Icon name="RotateCcw" className="h-3 w-3" />
                  Сбросить все
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Город */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Город</p>
                <Input
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  placeholder="Москва, Санкт-Петербург..."
                  className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500 max-w-xs"
                />
              </div>

              {/* Цена и площадь */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Цена и площадь</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Цена от, ₽</label>
                    <Input value={priceFrom} onChange={e => setPriceFrom(e.target.value)} placeholder="1 000 000"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Цена до, ₽</label>
                    <Input value={priceTo} onChange={e => setPriceTo(e.target.value)} placeholder="100 000 000"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Площадь от, м²</label>
                    <Input value={areaFrom} onChange={e => setAreaFrom(e.target.value)} placeholder="50"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Площадь до, м²</label>
                    <Input value={areaTo} onChange={e => setAreaTo(e.target.value)} placeholder="5000"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Характеристики категории */}
              {activeCatFields.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Характеристики</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {activeCatFields.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-[10px] text-gray-600 block mb-1">{label}</label>
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

              {/* Итог и сброс */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f]">
                <p className="text-sm text-gray-400">
                  Найдено объектов:{" "}
                  <span className="text-white font-semibold">{filtered.length}</span>
                </p>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  <Icon name="Check" className="h-3.5 w-3.5" />
                  Применить
                </button>
              </div>
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
            {filtered.map((obj) => {
              const isResort = obj.type === "Курортная"
              const ef = (obj as Record<string, unknown>).extra_fields as Record<string, string> | undefined
              const occupancy = ef?.occupancy ?? ""
              const avgCheck = ef?.avg_check ?? ""
              const units = ef?.units ?? ""
              return (
                <div
                  key={obj.id}
                  className={`rounded-2xl overflow-hidden transition-colors group ${
                    isResort
                      ? "bg-gradient-to-b from-[#0d1a1c] to-[#111] border border-cyan-900/40 hover:border-cyan-500/50"
                      : "bg-[#111111] border border-[#1f1f1f] hover:border-blue-500/40"
                  }`}
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
                    {isResort && obj.yield !== "—" && (
                      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-cyan-400 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-500/30">
                        {obj.yield} доход
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs ${isResort ? "text-cyan-500/70" : "text-gray-500"}`}>{obj.type}</p>
                      {(obj as Record<string, unknown>).subtype && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isResort
                            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400/70"
                            : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400"
                        }`}>
                          {(obj as Record<string, unknown>).subtype as string}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-2 leading-snug">{obj.title}</h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                      <Icon name="MapPin" className={`h-3.5 w-3.5 ${isResort ? "text-cyan-500" : "text-violet-400"}`} />
                      {obj.city}
                    </div>

                    {/* Для курортных — показатели */}
                    {isResort && (occupancy || avgCheck || units) ? (
                      <div className="flex gap-3 mb-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/15">
                        {units && (
                          <div className="text-center flex-1">
                            <p className="text-white font-semibold text-sm">{units}</p>
                            <p className="text-[10px] text-cyan-400/60">номеров</p>
                          </div>
                        )}
                        {occupancy && (
                          <div className="text-center flex-1 border-l border-cyan-500/20">
                            <p className="text-white font-semibold text-sm">{occupancy}%</p>
                            <p className="text-[10px] text-cyan-400/60">загрузка</p>
                          </div>
                        )}
                        {avgCheck && (
                          <div className="text-center flex-1 border-l border-cyan-500/20">
                            <p className="text-white font-semibold text-sm">{Number(avgCheck).toLocaleString("ru")}₽</p>
                            <p className="text-[10px] text-cyan-400/60">ср. чек</p>
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )}

                    {isResort && (
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-base font-bold text-white">{obj.price}</p>
                          <p className="text-xs text-gray-500">{obj.area}</p>
                        </div>
                        {obj.yield !== "—" && !occupancy && (
                          <div className="text-right">
                            <p className="text-cyan-400 font-semibold text-sm">{obj.yield}</p>
                            <p className="text-xs text-gray-500">доходность</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {UUID_RE.test(String(obj.id)) ? (
                        <Link to={`/object/${obj.id}`} className="flex-1">
                          <Button className={`w-full rounded-xl text-white text-sm ${isResort ? "bg-cyan-600 hover:bg-cyan-700" : "bg-blue-600 hover:bg-blue-700"}`}>
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
                          className={`shrink-0 w-10 h-10 rounded-xl border bg-[#1a1a1a] flex items-center justify-center transition-colors ${
                            isResort
                              ? "border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40"
                              : "border-[#262626] text-gray-300 hover:text-white hover:border-blue-500/40"
                          }`}
                        >
                          <Icon name="Share2" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
      <Footer />
    </main>
  )
}