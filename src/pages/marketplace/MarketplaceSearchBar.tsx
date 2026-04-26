import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { MARKET_CATEGORIES } from "./marketplaceData"

interface MarketplaceSearchBarProps {
  search: string
  onSearchChange: (v: string) => void
  activeCategory: string
  onCategoryChange: (cat: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  priceFrom: string
  priceTo: string
  areaFrom: string
  areaTo: string
  activeSubtype: string
  extraFilters: Record<string, string>
}

export default function MarketplaceSearchBar({
  search, onSearchChange,
  activeCategory, onCategoryChange,
  showFilters, onToggleFilters,
  hasActiveFilters,
  priceFrom, priceTo, areaFrom, areaTo, activeSubtype, extraFilters,
}: MarketplaceSearchBarProps) {
  return (
    <>
      {/* Строка поиска + кнопка фильтров */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Поиск по названию или городу..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#141414] border-[#262626] text-white placeholder:text-gray-500 focus-visible:ring-violet-500"
          />
        </div>
        <button
          onClick={onToggleFilters}
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

      {/* Кнопки категорий — на мобильном горизонтальный скролл без переноса */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {MARKET_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </>
  )
}
