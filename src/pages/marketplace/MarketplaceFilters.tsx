import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { MARKET_CATEGORIES } from "./marketplaceData"
import type { CategoryItem } from "@/components/wizard/wizardTypes"

interface MarketplaceFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  activeCategory: string
  onCategoryChange: (cat: string) => void
  activeSubtype: string
  onSubtypeChange: (st: string) => void
  activeCatDef: CategoryItem | undefined
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  priceFrom: string
  priceTo: string
  areaFrom: string
  areaTo: string
  cityFilter: string
  extraFilters: Record<string, string>
  onPriceFromChange: (v: string) => void
  onPriceToChange: (v: string) => void
  onAreaFromChange: (v: string) => void
  onAreaToChange: (v: string) => void
  onCityFilterChange: (v: string) => void
  onExtraFilterChange: (key: string, value: string) => void
  onResetAllFilters: () => void
  onCloseFilters: () => void
  filteredCount: number
  activeCatFields: { key: string; label: string; placeholder: string }[]
}

export default function MarketplaceFilters({
  search, onSearchChange,
  activeCategory, onCategoryChange,
  activeSubtype, onSubtypeChange,
  activeCatDef,
  showFilters, onToggleFilters,
  hasActiveFilters,
  priceFrom, priceTo, areaFrom, areaTo, cityFilter, extraFilters,
  onPriceFromChange, onPriceToChange, onAreaFromChange, onAreaToChange,
  onCityFilterChange, onExtraFilterChange,
  onResetAllFilters, onCloseFilters,
  filteredCount, activeCatFields,
}: MarketplaceFiltersProps) {
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

      {/* Для Новостроек — второй ряд: группа Коммерческая / Жилая */}
      {(() => {
        if (activeCategory !== "Новостройки") return null
        const NEWBUILD_COMMERCIAL = ["Офис в БЦ", "Стрит-ритейл в БЦ", "Стрит-ритейл в ЖК", "Апарт-отель (юниты)", "ГАБ в новостройке"]
        const NEWBUILD_RESIDENTIAL = ["Квартира в новостройке", "Апартаменты", "Таунхаус", "Пентхаус"]
        const activeGroup = NEWBUILD_COMMERCIAL.includes(activeSubtype) ? "commercial"
          : NEWBUILD_RESIDENTIAL.includes(activeSubtype) ? "residential" : ""
        const visibleSubtypes = activeGroup === "commercial" ? NEWBUILD_COMMERCIAL
          : activeGroup === "residential" ? NEWBUILD_RESIDENTIAL
          : [...NEWBUILD_COMMERCIAL, ...NEWBUILD_RESIDENTIAL]
        return (
          <>
            <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {[
                { id: "commercial", label: "Коммерческая", subtypes: NEWBUILD_COMMERCIAL },
                { id: "residential", label: "Жилая", subtypes: NEWBUILD_RESIDENTIAL },
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    if (activeGroup === g.id) onSubtypeChange("")
                    else onSubtypeChange(g.subtypes[0])
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border ${
                    activeGroup === g.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626] border-[#2a2a2a]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {visibleSubtypes.map(st => (
                <button
                  key={st}
                  onClick={() => onSubtypeChange(activeSubtype === st ? "" : st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                    activeSubtype === st
                      ? "border-violet-500 bg-violet-500/15 text-violet-300"
                      : "border-[#2a2a2a] bg-transparent text-gray-500 hover:text-gray-300 hover:border-[#3a3a3a]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </>
        )
      })()}

      {/* Подтипы для всех остальных категорий */}
      {activeCategory !== "Новостройки" && activeCatDef?.subtypes && activeCatDef.subtypes.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {activeCatDef.subtypes.map(st => (
            <button
              key={st}
              onClick={() => onSubtypeChange(activeSubtype === st ? "" : st)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
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
                onClick={onResetAllFilters}
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
                onChange={e => onCityFilterChange(e.target.value)}
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
                  <Input value={priceFrom} onChange={e => onPriceFromChange(e.target.value)} placeholder="1 000 000"
                    className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-1">Цена до, ₽</label>
                  <Input value={priceTo} onChange={e => onPriceToChange(e.target.value)} placeholder="100 000 000"
                    className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-1">Площадь от, м²</label>
                  <Input value={areaFrom} onChange={e => onAreaFromChange(e.target.value)} placeholder="50"
                    className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 block mb-1">Площадь до, м²</label>
                  <Input value={areaTo} onChange={e => onAreaToChange(e.target.value)} placeholder="5000"
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
                        onChange={e => onExtraFilterChange(key, e.target.value)}
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
                <span className="text-white font-semibold">{filteredCount}</span>
              </p>
              <button
                onClick={onCloseFilters}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <Icon name="Check" className="h-3.5 w-3.5" />
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}