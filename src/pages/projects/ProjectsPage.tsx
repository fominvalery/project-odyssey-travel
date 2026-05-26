import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import QuickFixationModal from "./QuickFixationModal"
import ProjectsHeader from "./ProjectsHeader"
import OfferCard from "./OfferCard"
import { Offer } from "./projectsConstants"

export default function ProjectsPage() {
  const navigate = useNavigate()

  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [category, setCategory] = useState("")
  const [subtype, setSubtype] = useState("")
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showFixModal, setShowFixModal] = useState(false)

  // Черновики полей фильтра
  const [cityDraft, setCityDraft] = useState("")
  const [priceFromDraft, setPriceFromDraft] = useState("")
  const [priceToDraft, setPriceToDraft] = useState("")
  const [areaFromDraft, setAreaFromDraft] = useState("")
  const [areaToDraft, setAreaToDraft] = useState("")

  // Применённые значения
  const [city, setCity] = useState("")
  const [priceFrom, setPriceFrom] = useState("")
  const [priceTo, setPriceTo] = useState("")
  const [areaFrom, setAreaFrom] = useState("")
  const [areaTo, setAreaTo] = useState("")

  const hasActiveFilters = Boolean(city || priceFrom || priceTo || areaFrom || areaTo)

  const load = useCallback(async () => {
    setLoading(true)
    const url = new URL((func2url as Record<string, string>)["agg-offers"])
    if (category) url.searchParams.set("category", category)
    if (subtype) url.searchParams.set("subtype", subtype)
    if (search) url.searchParams.set("search", search)
    if (city) url.searchParams.set("city", city)
    if (priceFrom) url.searchParams.set("price_from", priceFrom)
    if (priceTo) url.searchParams.set("price_to", priceTo)
    if (areaFrom) url.searchParams.set("area_from", areaFrom)
    if (areaTo) url.searchParams.set("area_to", areaTo)
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
  }, [category, subtype, search, city, priceFrom, priceTo, areaFrom, areaTo])

  useEffect(() => { load() }, [load])

  function handleCategoryChange(id: string) {
    setCategory(id)
    setSubtype("")
  }

  function applyFilters() {
    setCity(cityDraft)
    setPriceFrom(priceFromDraft)
    setPriceTo(priceToDraft)
    setAreaFrom(areaFromDraft)
    setAreaTo(areaToDraft)
  }

  function resetFilters() {
    setCityDraft(""); setPriceFromDraft(""); setPriceToDraft(""); setAreaFromDraft(""); setAreaToDraft("")
    setCity(""); setPriceFrom(""); setPriceTo(""); setAreaFrom(""); setAreaTo("")
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">

      <ProjectsHeader
        total={total}
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={handleCategoryChange}
        subtype={subtype}
        onSubtypeChange={setSubtype}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(v => !v)}
        hasActiveFilters={hasActiveFilters}
        cityDraft={cityDraft}
        onCityDraftChange={setCityDraft}
        priceFromDraft={priceFromDraft}
        onPriceFromDraftChange={setPriceFromDraft}
        priceToDraft={priceToDraft}
        onPriceToDraftChange={setPriceToDraft}
        areaFromDraft={areaFromDraft}
        onAreaFromDraftChange={setAreaFromDraft}
        areaToDraft={areaToDraft}
        onAreaToDraftChange={setAreaToDraft}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
        onOpenFixModal={() => setShowFixModal(true)}
      />

      {/* ── Каталог ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
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
            <p className="text-gray-700 text-sm mt-1">Попробуй изменить фильтры или выбрать другую категорию</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => (
              <OfferCard key={offer.id} offer={offer} onOpen={() => navigate(`/projects/${offer.id}`)} />
            ))}
          </div>
        )}
      </div>

      <QuickFixationModal
        open={showFixModal}
        onOpenChange={setShowFixModal}
      />
    </div>
  )
}
