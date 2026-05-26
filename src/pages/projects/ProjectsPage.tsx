import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import QuickFixationModal from "./QuickFixationModal"
import { useAuthContext } from "@/context/AuthContext"

// ── Категории ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "",             label: "Все" },
  { id: "commercial",  label: "Коммерческая",  color: "bg-violet-600" },
  { id: "investment",  label: "Инвестиционная", color: "bg-amber-600" },
  { id: "newbuild",    label: "Новостройки",    color: "bg-blue-600" },
  { id: "resort",      label: "Курортная",      color: "bg-cyan-600" },
  { id: "auction",     label: "С торгов",       color: "bg-green-600" },
  { id: "residential", label: "Жилая",          color: "bg-sky-600" },
]

const CAT_COLOR: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id).map(c => [c.id, c.color!])
)
const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id).map(c => [c.id, c.label])
)

// ── Подтипы по категории ──────────────────────────────────────────────────────

type SubGroup = { id: string; label: string; subtypes: string[] }

const SUBTYPES: Record<string, SubGroup[]> = {
  commercial: [
    { id: "office",    label: "Офисная",        subtypes: ["Бизнес-центр", "Офис", "Смарт-офис", "Коворкинг", "Особняк"] },
    { id: "retail",    label: "Торговая",        subtypes: ["Торговое помещение", "Street retail", "Магазин", "ТЦ", "Шоурум"] },
    { id: "warehouse", label: "Склад / Произв.", subtypes: ["Склад", "Логистический комплекс", "Производственное помещение", "Light industrial"] },
    { id: "service",   label: "Сервис",          subtypes: ["Ресторан", "Кафе", "Салон красоты", "Медицинский центр", "Автосервис"] },
    { id: "mixed",     label: "Смешанные",       subtypes: ["ПСН (свободное назначение)", "ОЗС", "Объект смешанного назначения"] },
  ],
  investment: [
    { id: "gab",     label: "ГАБ / Аренда",  subtypes: ["ГАБ (готовый арендный бизнес)", "Создание ГАБ", "ГАБ Субаренда"] },
    { id: "redev",   label: "Редевелопмент", subtypes: ["Редевелопмент", "Девелоперский проект", "Реконструкция"] },
    { id: "land",    label: "Земля",          subtypes: ["Земля под строительство МКД", "Земля под застройку (коммерция)", "Земля под жилую застройку", "Земля под коммерцию"] },
    { id: "special", label: "Спец. форматы", subtypes: ["Портфель объектов", "Доля в объекте", "Sale & Leaseback", "Срочная продажа"] },
  ],
  resort: [
    { id: "hotel",   label: "Отели",            subtypes: ["Апарт-отель", "Гостиница", "Мини-отель", "SPA-отель", "Wellness-отель"] },
    { id: "leisure", label: "Загородный отдых", subtypes: ["База отдыха", "Эко-отель", "Глэмпинг", "Турбаза"] },
    { id: "invest",  label: "Инвестиции",       subtypes: ["ГАБ в курортной локации", "Земля под курортный проект"] },
  ],
  auction: [
    { id: "bankruptcy", label: "Банкротство", subtypes: ["Банкротство физлица", "Банкротство юрлица", "Конкурсная масса"] },
    { id: "state",      label: "Гос. торги",  subtypes: ["Муниципальные торги", "Государственный аукцион", "РФФИ"] },
    { id: "pledge",     label: "Залоги",      subtypes: ["Реализация залогов банка", "Арестованное имущество"] },
    { id: "special",    label: "Специальные", subtypes: ["Торги по 44-ФЗ / 223-ФЗ", "Приватизация"] },
  ],
  residential: [
    { id: "urban",    label: "Городская",  subtypes: ["Квартира", "Студия", "Апартаменты", "Лофт", "Комната"] },
    { id: "suburban", label: "Загородная", subtypes: ["Коттедж", "Дом", "Таунхаус", "Дача", "Вилла"] },
    { id: "premium",  label: "Премиум",    subtypes: ["Пентхаус", "Элитная квартира", "Резиденция", "Особняк"] },
  ],
  newbuild: [
    { id: "commercial",  label: "Коммерческая", subtypes: ["Офис в БЦ", "Стрит-ритейл в БЦ", "Стрит-ритейл в ЖК", "Апарт-отель (юниты)"] },
    { id: "residential", label: "Жилая",        subtypes: ["Квартира в новостройке", "Студия", "Апартаменты", "Таунхаус", "Пентхаус"] },
  ],
}

function getActiveGroup(catId: string, subtype: string): string {
  if (!subtype || !SUBTYPES[catId]) return ""
  return SUBTYPES[catId].find(g => g.subtypes.includes(subtype))?.id ?? ""
}

function getVisibleSubtypes(catId: string, activeGroup: string): string[] {
  if (!SUBTYPES[catId]) return []
  if (activeGroup) return SUBTYPES[catId].find(g => g.id === activeGroup)?.subtypes ?? []
  return SUBTYPES[catId].flatMap(g => g.subtypes.slice(0, 3))
}

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

const GROUP_ACTIVE: Record<string, string> = {
  commercial:  "bg-violet-600 text-white border-violet-600",
  investment:  "bg-amber-600 text-white border-amber-600",
  resort:      "bg-cyan-600 text-white border-cyan-600",
  auction:     "bg-green-600 text-white border-green-600",
  residential: "bg-sky-600 text-white border-sky-600",
  newbuild:    "bg-blue-600 text-white border-blue-600",
}
const SUBTYPE_ACTIVE: Record<string, string> = {
  commercial:  "border-violet-500 bg-violet-500/15 text-violet-300",
  investment:  "border-amber-500 bg-amber-500/15 text-amber-300",
  resort:      "border-cyan-500 bg-cyan-500/15 text-cyan-300",
  auction:     "border-green-500 bg-green-500/15 text-green-300",
  residential: "border-sky-500 bg-sky-500/15 text-sky-300",
  newbuild:    "border-blue-500 bg-blue-500/15 text-blue-300",
}

export default function ProjectsPage() {
  const navigate = useNavigate()

  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [category, setCategory] = useState("")
  const [subtype, setSubtype] = useState("")
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)

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

  const catGroups = SUBTYPES[category] ?? []
  const activeGroup = getActiveGroup(category, subtype)
  const visibleSubtypes = getVisibleSubtypes(category, activeGroup)
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

  function handleGroupClick(groupId: string) {
    const group = catGroups.find(g => g.id === groupId)
    if (!group) return
    setSubtype(activeGroup === groupId ? "" : group.subtypes[0])
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

  const groupActiveClass = GROUP_ACTIVE[category] ?? "bg-blue-600 text-white border-blue-600"
  const subtypeActiveClass = SUBTYPE_ACTIVE[category] ?? "border-blue-500 bg-blue-500/15 text-blue-300"

  const { user } = useAuthContext()
  const [showClientsMenu, setShowClientsMenu] = useState(false)
  const [showFixModal, setShowFixModal] = useState(false)
  const clientsMenuRef = useRef<HTMLDivElement>(null)

  // Данные клиентов из CRM
  const [clientsTab, setClientsTab] = useState<"fixations" | "showing" | "booking" | "deal">("fixations")
  const [clientsData, setClientsData] = useState<Record<string, { client_name: string; offer_title: string; client_phone?: string; status: string }[]>>({})
  const [clientsLoading, setClientsLoading] = useState(false)

  const CLIENT_TABS = [
    { id: "fixations", label: "Фиксации", statuses: ["pending", "fixed"], color: "text-emerald-400" },
    { id: "showing",   label: "Показы",   statuses: ["showing"],          color: "text-blue-400" },
    { id: "booking",   label: "Брони",    statuses: ["booking"],          color: "text-cyan-400" },
    { id: "deal",      label: "Сделки",   statuses: ["deal", "docs", "payment"], color: "text-violet-400" },
  ] as const

  const STATUS_LABEL_SHORT: Record<string, string> = {
    pending: "Ожидает", fixed: "Зафиксирован", showing: "Показ",
    booking: "Бронь", negotiation: "Переговоры", deal: "Сделка",
    docs: "Документы", payment: "Оплата", invalid: "Срыв",
  }

  const STATUS_DOT: Record<string, string> = {
    pending: "bg-yellow-400", fixed: "bg-emerald-400", showing: "bg-blue-400",
    booking: "bg-cyan-400", negotiation: "bg-violet-400", deal: "bg-emerald-300",
    docs: "bg-orange-400", payment: "bg-pink-400", invalid: "bg-red-400",
  }

  async function loadClients() {
    if (!user?.id || clientsLoading) return
    setClientsLoading(true)
    try {
      const res = await fetch((func2url as Record<string, string>)["agg-fixations"], {
        headers: { "X-User-Id": user.id },
      })
      const data = await res.json()
      const all: { client_name: string; offer_title: string; client_phone?: string; status: string }[] = data.fixations || []
      const grouped: Record<string, typeof all> = { fixations: [], showing: [], booking: [], deal: [] }
      for (const f of all) {
        if (["pending", "fixed"].includes(f.status)) grouped.fixations.push(f)
        else if (f.status === "showing") grouped.showing.push(f)
        else if (f.status === "booking") grouped.booking.push(f)
        else if (["deal", "docs", "payment"].includes(f.status)) grouped.deal.push(f)
      }
      setClientsData(grouped)
    } catch {
      // ignore
    } finally {
      setClientsLoading(false)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientsMenuRef.current && !clientsMenuRef.current.contains(e.target as Node)) {
        setShowClientsMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">

      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#1f1f1f] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">

          {/* Строка заголовка */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-500 hover:text-white transition-colors shrink-0"
            >
              <Icon name="ChevronLeft" className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">База / Проекты</h1>
              <p className="text-xs text-gray-500">
                {total > 0 ? `${total} предложений` : "Каталог объектов"}
              </p>
            </div>
            {/* Кнопка Клиенты с дропдауном */}
            <div className="relative shrink-0" ref={clientsMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowClientsMenu(v => !v); if (!showClientsMenu) loadClients() }}
                className={`border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a] gap-1.5 ${showClientsMenu ? "bg-[#1a1a1a] text-white" : ""}`}
              >
                <Icon name="Users" className="h-4 w-4" />
                <span>Клиенты</span>
                <Icon name="ChevronDown" className={`h-3.5 w-3.5 transition-transform ${showClientsMenu ? "rotate-180" : ""}`} />
              </Button>

              {showClientsMenu && (
                <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[95vw] bg-[#111] border border-[#2a2a2a] rounded-2xl shadow-2xl z-50">
                  {/* Шапка дропдауна */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#1f1f1f]">
                    <span className="text-sm font-semibold text-white">Мои клиенты</span>
                    <button
                      onClick={() => { setShowClientsMenu(false); setShowFixModal(true) }}
                      className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1"
                    >
                      <Icon name="Plus" className="h-3.5 w-3.5" />
                      Зафиксировать
                    </button>
                  </div>

                  {/* Вкладки */}
                  <div className="flex px-3 pt-3 gap-1">
                    {CLIENT_TABS.map(t => {
                      const count = (clientsData[t.id] || []).length
                      const isActive = clientsTab === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => setClientsTab(t.id)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                            isActive ? "bg-[#222] text-white" : "text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          <span>{t.label}</span>
                          <span className={`text-[10px] font-bold ${isActive ? t.color : "text-gray-600"}`}>
                            {clientsLoading ? "..." : count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Список клиентов */}
                  <div className="px-3 pb-3 pt-2 max-h-[260px] overflow-y-auto">
                    {clientsLoading ? (
                      <div className="space-y-2 py-2">
                        {[1,2,3].map(i => <div key={i} className="h-10 bg-[#1a1a1a] rounded-xl animate-pulse" />)}
                      </div>
                    ) : (clientsData[clientsTab] || []).length === 0 ? (
                      <div className="py-8 text-center">
                        <Icon name="Users" className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">Нет клиентов в этом статусе</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-1">
                        {(clientsData[clientsTab] || []).map((c, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#1a1a1a] transition-colors">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status] || "bg-gray-500"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{c.client_name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{c.offer_title}</p>
                            </div>
                            <span className="text-[10px] text-gray-600 shrink-0">{STATUS_LABEL_SHORT[c.status] || c.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Футер */}
                  <div className="border-t border-[#1f1f1f] px-4 py-2.5">
                    <button
                      onClick={() => { navigate("/projects/fixations"); setShowClientsMenu(false) }}
                      className="w-full text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      Все клиенты
                      <Icon name="ChevronRight" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Строка поиска + Фильтры */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Поиск по названию или городу..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
              />
            </div>
            <Button
              onClick={() => setShowFilters(v => !v)}
              className={`shrink-0 gap-2 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#252525]"
              }`}
            >
              <Icon name="SlidersHorizontal" className="h-4 w-4" />
              Фильтры
              {hasActiveFilters && !showFilters && (
                <span className="w-2 h-2 rounded-full bg-white inline-block ml-0.5" />
              )}
            </Button>
          </div>

          {/* Пилюли категорий */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border ${
                  category === c.id
                    ? c.id
                      ? `${c.color} text-white border-transparent`
                      : "bg-white text-black border-white"
                    : "bg-[#1a1a1a] text-gray-400 hover:text-white border-[#2a2a2a]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Группы подтипов */}
          {catGroups.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {catGroups.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleGroupClick(g.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border ${
                    activeGroup === g.id
                      ? groupActiveClass
                      : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626] border-[#2a2a2a]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {/* Подтипы */}
          {visibleSubtypes.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {visibleSubtypes.map(st => (
                <button
                  key={st}
                  onClick={() => setSubtype(prev => prev === st ? "" : st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                    subtype === st
                      ? subtypeActiveClass
                      : "border-[#2a2a2a] bg-transparent text-gray-500 hover:text-gray-300 hover:border-[#3a3a3a]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* ── Панель фильтров ───────────────────────────────────────────── */}
          {showFilters && (
            <div className="mt-3 p-4 bg-[#111] border border-[#2a2a2a] rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="SlidersHorizontal" className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Фильтры подбора</span>
                {category && (
                  <>
                    <span className="text-gray-600">—</span>
                    <span className={`text-sm font-semibold ${
                      category === "commercial" ? "text-violet-400" :
                      category === "investment" ? "text-amber-400" :
                      category === "resort" ? "text-cyan-400" :
                      category === "auction" ? "text-green-400" :
                      category === "residential" ? "text-sky-400" :
                      "text-blue-400"
                    }`}>{CAT_LABEL[category]}</span>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Город</label>
                  <Input
                    placeholder="Москва, Санкт-Петербург..."
                    value={cityDraft}
                    onChange={e => setCityDraft(e.target.value)}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Цена и площадь</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder="Цена от, ₽" value={priceFromDraft} onChange={e => setPriceFromDraft(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                    <Input placeholder="Цена до, ₽" value={priceToDraft} onChange={e => setPriceToDraft(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                    <Input placeholder="Площадь от, м²" value={areaFromDraft} onChange={e => setAreaFromDraft(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                    <Input placeholder="Площадь до, м²" value={areaToDraft} onChange={e => setAreaToDraft(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  Найдено объектов: <span className="text-white font-semibold">{total}</span>
                </span>
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500 hover:text-white">
                      Сбросить
                    </Button>
                  )}
                  <Button size="sm" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Icon name="Check" className="h-4 w-4" />
                    Применить
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) {
  const color = CAT_COLOR[offer.category] ?? "bg-gray-600"
  const label = CAT_LABEL[offer.category] ?? offer.category
  const photo = offer.photos?.[0] || DEFAULT_IMG
  const commission = offer.extra_fields?.commission || offer.commission || ""

  return (
    <div
      className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="relative h-48 overflow-hidden bg-[#0d0d0d]">
        <img
          src={photo}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`${color} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full`}>
            {label}
          </span>
          {offer.yield_percent && (
            <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              {offer.yield_percent}% доход
            </span>
          )}
        </div>

        {offer.presentation_url && (
          <button
            className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm transition-colors"
            onClick={e => { e.stopPropagation(); window.open(offer.presentation_url, "_blank") }}
          >
            <Icon name="FileDown" className="h-3 w-3" />
            PDF
          </button>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-base font-bold text-white drop-shadow-lg">
            {offer.price_label || formatPrice(offer.price ?? null)}
          </div>
          {offer.area && (
            <div className="text-xs text-gray-300 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {offer.area} м²
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-snug">{offer.title}</h3>
        <div className="flex items-center justify-between">
          {offer.city ? (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Icon name="MapPin" className="h-3 w-3" />
              {offer.city}
            </span>
          ) : <span />}
          {commission && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px] shrink-0">
              {commission}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}