import { useNavigate, useLocation } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import ClientsDropdown from "./ClientsDropdown"
import {
  CATEGORIES,
  SUBTYPES,
  CAT_LABEL,
  GROUP_ACTIVE,
  SUBTYPE_ACTIVE,
  getActiveGroup,
  getVisibleSubtypes,
} from "./projectsConstants"

const LOGO_URL = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

interface Props {
  total: number
  search: string
  onSearchChange: (v: string) => void
  category: string
  onCategoryChange: (id: string) => void
  subtype: string
  onSubtypeChange: (v: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  cityDraft: string
  onCityDraftChange: (v: string) => void
  priceFromDraft: string
  onPriceFromDraftChange: (v: string) => void
  priceToDraft: string
  onPriceToDraftChange: (v: string) => void
  areaFromDraft: string
  onAreaFromDraftChange: (v: string) => void
  areaToDraft: string
  onAreaToDraftChange: (v: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onOpenFixModal: () => void
}

export default function ProjectsHeader({
  total,
  search, onSearchChange,
  category, onCategoryChange,
  subtype, onSubtypeChange,
  showFilters, onToggleFilters,
  hasActiveFilters,
  cityDraft, onCityDraftChange,
  priceFromDraft, onPriceFromDraftChange,
  priceToDraft, onPriceToDraftChange,
  areaFromDraft, onAreaFromDraftChange,
  areaToDraft, onAreaToDraftChange,
  onApplyFilters, onResetFilters,
  onOpenFixModal,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo ?? "/dashboard"

  const catGroups = SUBTYPES[category] ?? []
  const activeGroup = getActiveGroup(category, subtype)
  const visibleSubtypes = getVisibleSubtypes(category, activeGroup)
  const groupActiveClass = GROUP_ACTIVE[category] ?? "bg-blue-600 text-white border-blue-600"
  const subtypeActiveClass = SUBTYPE_ACTIVE[category] ?? "border-blue-500 bg-blue-500/15 text-blue-300"

  function handleGroupClick(groupId: string) {
    const group = catGroups.find(g => g.id === groupId)
    if (!group) return
    onSubtypeChange(activeGroup === groupId ? "" : group.subtypes[0])
  }

  return (
    <div className="bg-[#0d0d0d]">

      {/* ── Хедер: логотип + кнопка Клиенты ── */}
      <div className="border-b border-[#1f1f1f] px-4 md:px-8 py-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(returnTo)} className="text-gray-400 hover:text-white transition-colors">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </button>
            <button onClick={() => navigate(returnTo)} className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Кабинет-24" className="h-14 w-auto object-contain" />
            </button>
          </div>
          <ClientsDropdown onOpenFixModal={onOpenFixModal} />
        </div>
      </div>

      {/* ── Hero: заголовок по центру ── */}
      <div className="px-4 md:px-8 pt-10 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
          База / Проекты
        </h1>
        <p className="text-lg text-gray-400">
          Платим брокеру за сделки
        </p>
      </div>

      {/* ── Поиск + фильтры + категории — sticky ── */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#1f1f1f] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto">

          {/* Строка поиска */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Поиск по названию или городу..."
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
              />
            </div>
            <Button
              onClick={onToggleFilters}
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
                onClick={() => onCategoryChange(c.id)}
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
                  onClick={() => onSubtypeChange(subtype === st ? "" : st)}
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

          {/* Панель фильтров */}
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
                    onChange={e => onCityDraftChange(e.target.value)}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Цена и площадь</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder="Цена от, ₽" value={priceFromDraft} onChange={e => onPriceFromDraftChange(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                    <Input placeholder="Цена до, ₽" value={priceToDraft} onChange={e => onPriceToDraftChange(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                    <Input placeholder="Площадь от, м²" value={areaFromDraft} onChange={e => onAreaFromDraftChange(e.target.value)} type="number"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600" />
                    <Input placeholder="Площадь до, м²" value={areaToDraft} onChange={e => onAreaToDraftChange(e.target.value)} type="number"
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
                    <Button variant="ghost" size="sm" onClick={onResetFilters} className="text-gray-500 hover:text-white">
                      Сбросить
                    </Button>
                  )}
                  <Button size="sm" onClick={onApplyFilters} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Icon name="Check" className="h-4 w-4" />
                    Применить
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}