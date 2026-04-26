import type { CategoryItem } from "@/components/wizard/wizardTypes"
import MarketplaceSearchBar from "./MarketplaceSearchBar"
import MarketplaceSubtypeBar from "./MarketplaceSubtypeBar"
import MarketplaceFilterPanel from "./MarketplaceFilterPanel"

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
      <MarketplaceSearchBar
        search={search}
        onSearchChange={onSearchChange}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        hasActiveFilters={hasActiveFilters}
        priceFrom={priceFrom}
        priceTo={priceTo}
        areaFrom={areaFrom}
        areaTo={areaTo}
        activeSubtype={activeSubtype}
        extraFilters={extraFilters}
      />

      <MarketplaceSubtypeBar
        activeCategory={activeCategory}
        activeSubtype={activeSubtype}
        onSubtypeChange={onSubtypeChange}
        activeCatDef={activeCatDef}
      />

      <MarketplaceFilterPanel
        activeCategory={activeCategory}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        priceFrom={priceFrom}
        priceTo={priceTo}
        areaFrom={areaFrom}
        areaTo={areaTo}
        cityFilter={cityFilter}
        extraFilters={extraFilters}
        onPriceFromChange={onPriceFromChange}
        onPriceToChange={onPriceToChange}
        onAreaFromChange={onAreaFromChange}
        onAreaToChange={onAreaToChange}
        onCityFilterChange={onCityFilterChange}
        onExtraFilterChange={onExtraFilterChange}
        onResetAllFilters={onResetAllFilters}
        onCloseFilters={onCloseFilters}
        filteredCount={filteredCount}
        activeCatFields={activeCatFields}
      />
    </>
  )
}
