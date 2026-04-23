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

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [activeSubtype, setActiveSubtype] = useState("")
  const [search, setSearch] = useState("")
  const [dbObjects, setDbObjects] = useState<MarketObject[]>([])
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

        {loading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Объекты не найдены</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((obj) => (
              <MarketplaceCard
                key={obj.id}
                obj={obj}
                onShare={setShareTarget}
              />
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
      <Footer />
    </main>
  )
}
