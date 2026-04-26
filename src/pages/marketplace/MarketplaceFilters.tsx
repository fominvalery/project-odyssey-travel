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

      {/* Для Жилой — группы + подтипы */}
      {(() => {
        if (activeCategory !== "Жилая") return null
        const URBAN = ["Квартира", "Студия", "Апартаменты", "Пентхаус", "Комната", "Многокомнатная квартира"]
        const SUBURBAN = ["Дом", "Коттедж", "Таунхаус", "Дуплекс", "Вилла", "Дача", "Частный дом", "Загородный дом", "Часть дома"]
        const PREMIUM = ["Элитная квартира", "Пентхаус", "Вилла", "Премиум-жильё", "Резиденция", "Особняк"]
        const LAND = ["Участок под жилую застройку", "Малоэтажный жилой дом"]
        const activeGroup = URBAN.includes(activeSubtype) ? "urban"
          : SUBURBAN.includes(activeSubtype) ? "suburban"
          : PREMIUM.includes(activeSubtype) ? "premium"
          : LAND.includes(activeSubtype) ? "land" : ""
        const visibleSubtypes = activeGroup === "urban" ? URBAN
          : activeGroup === "suburban" ? SUBURBAN
          : activeGroup === "premium" ? PREMIUM
          : activeGroup === "land" ? LAND
          : [...URBAN, ...SUBURBAN]
        const groups = [
          { id: "urban", label: "Городская", subtypes: URBAN },
          { id: "suburban", label: "Загородная", subtypes: SUBURBAN },
          { id: "premium", label: "Премиум", subtypes: PREMIUM },
          { id: "land", label: "Земля", subtypes: LAND },
        ]
        return (
          <>
            <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    if (activeGroup === g.id) onSubtypeChange("")
                    else onSubtypeChange(g.subtypes[0])
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border ${
                    activeGroup === g.id
                      ? "bg-sky-600 text-white border-sky-600"
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
                      ? "border-sky-500 bg-sky-500/15 text-sky-300"
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

      {/* Для Коммерческой — группы + подтипы */}
      {(() => {
        if (activeCategory !== "Коммерческая") return null
        const OFFICE = ["Офис", "Бизнес-центр", "Офисное помещение", "Коворкинг", "Арендный офис"]
        const RETAIL = ["Торговое помещение", "Street retail", "Магазин", "ТЦ / Торговый центр", "Торговая галерея", "Шоурум"]
        const WAREHOUSE = ["Склад", "Логистический комплекс", "Производственное помещение", "Промышленная база", "Флекс-помещение", "Light industrial"]
        const SERVICE = ["Ресторан", "Кафе", "Бар", "Салон красоты", "Медицинский центр", "Автосервис", "Автомойка"]
        const MIXED = ["ПСН (свободное назначение)", "ОЗС (отдельно стоящее здание)", "Объект смешанного назначения"]
        const activeGroup = OFFICE.includes(activeSubtype) ? "office"
          : RETAIL.includes(activeSubtype) ? "retail"
          : WAREHOUSE.includes(activeSubtype) ? "warehouse"
          : SERVICE.includes(activeSubtype) ? "service"
          : MIXED.includes(activeSubtype) ? "mixed" : ""
        const visibleSubtypes = activeGroup === "office" ? OFFICE
          : activeGroup === "retail" ? RETAIL
          : activeGroup === "warehouse" ? WAREHOUSE
          : activeGroup === "service" ? SERVICE
          : activeGroup === "mixed" ? MIXED
          : [...OFFICE, ...RETAIL, ...WAREHOUSE]
        const groups = [
          { id: "office", label: "Офисная", subtypes: OFFICE },
          { id: "retail", label: "Торговая", subtypes: RETAIL },
          { id: "warehouse", label: "Склад / Произв.", subtypes: WAREHOUSE },
          { id: "service", label: "Сервис", subtypes: SERVICE },
          { id: "mixed", label: "Смешанные", subtypes: MIXED },
        ]
        return (
          <>
            <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    if (activeGroup === g.id) onSubtypeChange("")
                    else onSubtypeChange(g.subtypes[0])
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border ${
                    activeGroup === g.id
                      ? "bg-violet-600 text-white border-violet-600"
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

      {/* Для Инвестиционной — группы + подтипы */}
      {(() => {
        if (activeCategory !== "Инвестиционная") return null
        const GAB = ["ГАБ (готовый арендный бизнес)", "Арендный бизнес", "Арендный поток"]
        const REDEV = ["Редевелопмент", "Девелоперский проект", "Реконструкция"]
        const LAND = ["Земля под застройку", "Земля под коммерцию", "Земля под жилую застройку"]
        const SPECIAL = ["Портфель объектов", "Доля в бизнесе / объекте", "Sale & Leaseback", "Объект под реализацию"]
        const activeGroup = GAB.includes(activeSubtype) ? "gab"
          : REDEV.includes(activeSubtype) ? "redev"
          : LAND.includes(activeSubtype) ? "land"
          : SPECIAL.includes(activeSubtype) ? "special" : ""
        const visibleSubtypes = activeGroup === "gab" ? GAB
          : activeGroup === "redev" ? REDEV
          : activeGroup === "land" ? LAND
          : activeGroup === "special" ? SPECIAL
          : [...GAB, ...REDEV, ...LAND]
        const groups = [
          { id: "gab", label: "ГАБ / Аренда", subtypes: GAB },
          { id: "redev", label: "Редевелопмент", subtypes: REDEV },
          { id: "land", label: "Земля", subtypes: LAND },
          { id: "special", label: "Спец. форматы", subtypes: SPECIAL },
        ]
        return (
          <>
            <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    if (activeGroup === g.id) onSubtypeChange("")
                    else onSubtypeChange(g.subtypes[0])
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border ${
                    activeGroup === g.id
                      ? "bg-amber-600 text-white border-amber-600"
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
                      ? "border-amber-500 bg-amber-500/15 text-amber-300"
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
      {activeCategory !== "Новостройки" && activeCategory !== "Жилая" && activeCategory !== "Коммерческая" && activeCategory !== "Инвестиционная" && activeCatDef?.subtypes && activeCatDef.subtypes.length > 0 && (
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

            {/* Специальные фильтры для Инвестиционной */}
            {activeCategory === "Инвестиционная" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Доходность от (%/год)</label>
                    <Input value={extraFilters["yield"] ?? ""} onChange={e => onExtraFilterChange("yield", e.target.value)}
                      placeholder="8"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">ROI от (%)</label>
                    <Input value={extraFilters["roi"] ?? ""} onChange={e => onExtraFilterChange("roi", e.target.value)}
                      placeholder="10"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Окупаемость до (лет)</label>
                    <Input value={extraFilters["payback"] ?? ""} onChange={e => onExtraFilterChange("payback", e.target.value)}
                      placeholder="12"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-amber-500" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Параметры актива</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: "encumbrance", val: "Нет", label: "Без обременений" },
                      { key: "indexing", val: "Есть", label: "Индексация аренды" },
                      { key: "permits", val: "Есть", label: "Разрешения есть" },
                      { key: "tu", val: "Есть", label: "ТУ подключены" },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          extraFilters[f.key] === f.val
                            ? "border-amber-500 bg-amber-500/15 text-amber-300"
                            : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Специальные фильтры для Коммерческой */}
            {activeCategory === "Коммерческая" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Класс здания</label>
                    <Input value={extraFilters["class"] ?? ""} onChange={e => onExtraFilterChange("class", e.target.value)}
                      placeholder="A / B+ / B / C"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Высота потолков от (м)</label>
                    <Input value={extraFilters["ceiling"] ?? ""} onChange={e => onExtraFilterChange("ceiling", e.target.value)}
                      placeholder="3.0"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Состояние</label>
                    <Input value={extraFilters["condition"] ?? ""} onChange={e => onExtraFilterChange("condition", e.target.value)}
                      placeholder="Готово / Shell&Core"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-violet-500" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Инфраструктура</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: "parking", val: "Есть", label: "Парковка" },
                      { key: "entrance", val: "Отдельный с улицы", label: "Вход с улицы" },
                      { key: "frontage", val: "Есть", label: "Витрины" },
                      { key: "elevator", val: "Есть", label: "Лифт" },
                      { key: "ramp", val: "Есть", label: "Пандус" },
                      { key: "wet_point", val: "Есть", label: "Мокрая точка" },
                      { key: "railway", val: "Есть", label: "Ж/Д ветка" },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          extraFilters[f.key] === f.val
                            ? "border-violet-500 bg-violet-500/15 text-violet-300"
                            : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Специальные фильтры для Жилой */}
            {(activeCategory === "Жилая") && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Комнаты</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Студия", "1", "2", "3", "4", "5+"].map(r => (
                      <button
                        key={r}
                        onClick={() => onExtraFilterChange("rooms", extraFilters["rooms"] === r ? "" : r)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          extraFilters["rooms"] === r
                            ? "border-sky-500 bg-sky-500/15 text-sky-300"
                            : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Ремонт / Состояние</label>
                    <Input value={extraFilters["condition"] ?? ""} onChange={e => onExtraFilterChange("condition", e.target.value)}
                      placeholder="Евроремонт / Черновая"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-sky-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Тип дома</label>
                    <Input value={extraFilters["building_type"] ?? ""} onChange={e => onExtraFilterChange("building_type", e.target.value)}
                      placeholder="Монолит / Кирпич"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-sky-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Класс жилья</label>
                    <Input value={extraFilters["housing_class"] ?? ""} onChange={e => onExtraFilterChange("housing_class", e.target.value)}
                      placeholder="Комфорт / Бизнес / Премиум"
                      className="h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus-visible:ring-sky-500" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Удобства</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: "furniture", val: "Есть", label: "Мебель" },
                      { key: "parking", val: "Есть", label: "Парковка" },
                      { key: "balcony", val: "Есть", label: "Балкон / Терраса" },
                      { key: "elevator", val: "Есть", label: "Лифт" },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          extraFilters[f.key] === f.val
                            ? "border-sky-500 bg-sky-500/15 text-sky-300"
                            : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Характеристики категории (для всех остальных) */}
            {activeCategory !== "Жилая" && activeCategory !== "Коммерческая" && activeCategory !== "Инвестиционная" && activeCatFields.length > 0 && (
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