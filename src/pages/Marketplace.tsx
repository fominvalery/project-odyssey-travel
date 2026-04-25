import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import Icon from "@/components/ui/icon"
import ShareDialog from "@/components/ShareDialog"
import { Footer } from "@/components/Footer"
import func2url from "../../backend/func2url.json"
import { getCategoryFields, CAT_ID_MAP, CATEGORIES as WIZ_CATEGORIES } from "@/components/wizard/wizardTypes"
import { DEMO_OBJECTS, CAT_MAP, CAT_BADGE_COLOR, type MarketObject } from "./marketplace/marketplaceData"
import MarketplaceFilters from "./marketplace/MarketplaceFilters"
import MarketplaceCard from "./marketplace/MarketplaceCard"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { UUID_RE } from "./marketplace/marketplaceData"

const ARCHIVE_STATUSES = ["Продан", "Сдан"]

type ArchiveObject = MarketObject & { status: string }

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [activeSubtype, setActiveSubtype] = useState("")
  const [search, setSearch] = useState("")
  const [dbObjects, setDbObjects] = useState<MarketObject[]>([])
  const [archiveObjects, setArchiveObjects] = useState<ArchiveObject[]>([])
  const [loading, setLoading] = useState(true)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string } | null>(null)
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [areaFrom, setAreaFrom] = useState("")
  const [areaTo, setAreaTo] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [showArchive, setShowArchive] = useState(false)
  const [archiveSearch, setArchiveSearch] = useState("")
  const [dealFilter, setDealFilter] = useState("") // "sale" | "rent" | ""
  const [visibleCount, setVisibleCount] = useState(18)

  const PAGE_SIZE = 18
  const DEAL_FILTER_CATS = ["Коммерческая", "Жилая"]

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat)
    setActiveSubtype("")
    setVisibleCount(18)
    setExtraFilters({})
    if (!DEAL_FILTER_CATS.includes(cat)) setDealFilter("")
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
    setVisibleCount(18)
  }

  const hasActiveFilters =
    Object.values(extraFilters).some(v => v.trim()) ||
    priceFrom || priceTo || areaFrom || areaTo || cityFilter || activeSubtype

  const activeCatId = activeCategory !== "Все" ? (CAT_ID_MAP[activeCategory] ?? "") : ""
  const activeCatDef = WIZ_CATEGORIES.find(c => c.id === activeCatId)
  const activeCatFields = activeCatId
    ? getCategoryFields(activeCatId, activeSubtype)
    : []

  // Сброс пагинации при смене любого фильтра
  useEffect(() => { setVisibleCount(18) }, [
    search, activeCategory, activeSubtype, dealFilter,
    priceFrom, priceTo, areaFrom, areaTo, cityFilter,
  ])

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

  function loadArchive() {
    setArchiveLoading(true)
    fetch(`${func2url.objects}?archive=true`)
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
            status: String(o.status ?? ""),
          }
        })
        setArchiveObjects(arr)
      })
      .catch(() => {})
      .finally(() => setArchiveLoading(false))
  }

  function handleShowArchive() {
    setShowArchive(true)
    if (archiveObjects.length === 0) loadArchive()
  }

  const allObjects: MarketObject[] = [...dbObjects, ...DEMO_OBJECTS]

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

    const objDealType = ((o as Record<string, unknown>).extra_fields as Record<string, string> | undefined)?.deal_type ?? ""
    const matchDeal = !dealFilter || objDealType === dealFilter

    return matchCat && matchSubtype && matchSearch && matchExtra && matchPriceFrom && matchPriceTo && matchAreaFrom && matchAreaTo && matchCity && matchDeal
  })

  const filteredArchive = archiveObjects.filter(o => {
    if (!archiveSearch) return true
    return o.title.toLowerCase().includes(archiveSearch.toLowerCase())
      || o.city.toLowerCase().includes(archiveSearch.toLowerCase())
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <section className="px-4 md:px-8 pt-8 pb-16 max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Каталог недвижимости</h1>
          <p className="text-gray-400 text-lg">Коммерческая, инвестиционная недвижимость, новостройки, курортная и жилая</p>
        </div>

        {!showArchive ? (
          <>
            <MarketplaceFilters
              search={search}
              onSearchChange={setSearch}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              activeSubtype={activeSubtype}
              onSubtypeChange={setActiveSubtype}
              activeCatDef={activeCatDef}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(v => !v)}
              hasActiveFilters={!!hasActiveFilters}
              priceFrom={priceFrom}
              priceTo={priceTo}
              areaFrom={areaFrom}
              areaTo={areaTo}
              cityFilter={cityFilter}
              extraFilters={extraFilters}
              onPriceFromChange={setPriceFrom}
              onPriceToChange={setPriceTo}
              onAreaFromChange={setAreaFrom}
              onAreaToChange={setAreaTo}
              onCityFilterChange={setCityFilter}
              onExtraFilterChange={(key, value) => setExtraFilters(prev => ({ ...prev, [key]: value }))}
              onResetAllFilters={resetAllFilters}
              onCloseFilters={() => setShowFilters(false)}
              filteredCount={filtered.length}
              activeCatFields={activeCatFields}
            />

            {/* Фильтр Продажа / Аренда + кнопка Архив */}
            <div className="flex items-center justify-between mb-4 -mt-2 flex-wrap gap-2">
              {DEAL_FILTER_CATS.includes(activeCategory) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Тип сделки:</span>
                  {[
                    { value: "", label: "Все" },
                    { value: "sale", label: "Продажа" },
                    { value: "rent", label: "Аренда" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDealFilter(opt.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        dealFilter === opt.value
                          ? opt.value === "rent"
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                          : "bg-[#1a1a1a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleShowArchive}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors ml-auto"
              >
                <Icon name="Archive" className="h-4 w-4" />
                Архив объектов
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Объекты не найдены</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(0, visibleCount).map((obj) => (
                    <MarketplaceCard
                      key={obj.id}
                      obj={obj}
                      onShare={setShareTarget}
                    />
                  ))}
                </div>

                {/* Показать ещё */}
                {visibleCount < filtered.length && (
                  <div className="text-center mt-10">
                    <p className="text-sm text-gray-500 mb-4">
                      Показано {Math.min(visibleCount, filtered.length)} из {filtered.length} объектов
                    </p>
                    <button
                      onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-medium hover:bg-[#222] hover:border-blue-500/40 transition-all"
                    >
                      <Icon name="ChevronDown" className="h-4 w-4" />
                      Показать ещё {Math.min(PAGE_SIZE, filtered.length - visibleCount)}
                    </button>
                  </div>
                )}

                {/* Все загружены */}
                {visibleCount >= filtered.length && filtered.length > PAGE_SIZE && (
                  <p className="text-center text-xs text-gray-600 mt-8">
                    Все {filtered.length} объектов загружены
                  </p>
                )}
              </>
            )}
          </>
        ) : (
          /* === АРХИВ === */
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowArchive(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <Icon name="ArrowLeft" className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <Icon name="Archive" className="h-6 w-6 text-amber-400" />
                  Архив объектов
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Проданные и сданные объекты</p>
              </div>
            </div>

            {/* Поиск по архиву */}
            <div className="relative mb-6 max-w-sm">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                placeholder="Поиск по названию / городу..."
                value={archiveSearch}
                onChange={e => setArchiveSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141414] border border-[#262626] text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/40"
              />
            </div>

            {archiveLoading ? (
              <div className="text-center py-20">
                <Icon name="Loader2" className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
              </div>
            ) : filteredArchive.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Icon name="Archive" className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p>Архив пуст</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArchive.map((obj) => {
                  const isResort = obj.type === "Курортная"
                  const isSold = obj.status === "Продан"
                  return (
                    <div
                      key={obj.id}
                      className={`rounded-2xl overflow-hidden ${
                        isResort
                          ? "bg-gradient-to-b from-[#0d1a1c] to-[#111] border border-cyan-900/40"
                          : "bg-[#111111] border border-[#1f1f1f]"
                      }`}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={obj.img}
                          alt={obj.title}
                          className="w-full h-full object-cover opacity-55"
                        />
                        {/* Категория */}
                        {obj.badge && (
                          <span className={`absolute top-3 left-3 ${obj.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
                            {obj.badge}
                          </span>
                        )}
                        {/* Печать ПРОДАН / СДАН */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`border-4 rounded-sm px-5 py-2 rotate-[-15deg] shadow-lg ${
                            isSold
                              ? "border-red-500 bg-red-900/20"
                              : "border-orange-500 bg-orange-900/20"
                          }`}>
                            <span className={`text-2xl font-black tracking-widest uppercase ${
                              isSold ? "text-red-400" : "text-orange-400"
                            }`}>
                              {isSold ? "ПРОДАН" : "СДАН"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="text-xs text-gray-500 mb-1">{obj.type}</p>
                        <h3 className="text-white font-semibold text-sm mb-2 leading-snug line-clamp-2">{obj.title}</h3>
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                          <Icon name="MapPin" className="h-3.5 w-3.5 text-violet-400" />
                          {obj.city}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-base font-bold text-gray-300">{obj.price}</p>
                            <p className="text-xs text-gray-600">{obj.area}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            isSold ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                          }`}>
                            {obj.status}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {UUID_RE.test(String(obj.id)) ? (
                            <Link to={`/object/${obj.id}`} className="flex-1">
                              <Button className="w-full rounded-xl bg-[#1a1a1a] hover:bg-[#222] text-gray-300 text-sm">
                                Подробнее
                              </Button>
                            </Link>
                          ) : (
                            <Button disabled className="flex-1 rounded-xl bg-[#1a1a1a] text-gray-500 text-sm cursor-not-allowed">
                              Архивный объект
                            </Button>
                          )}
                          {UUID_RE.test(String(obj.id)) && (
                            <button
                              onClick={() => setShareTarget({ id: String(obj.id), title: obj.title })}
                              className="shrink-0 w-10 h-10 rounded-xl border border-[#262626] bg-[#1a1a1a] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
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
          </>
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