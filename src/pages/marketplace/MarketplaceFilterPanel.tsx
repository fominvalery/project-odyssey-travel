import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface MarketplaceFilterPanelProps {
  activeCategory: string
  showFilters: boolean
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

const INPUT_CLS = "h-8 text-xs bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-600"

export default function MarketplaceFilterPanel({
  activeCategory,
  showFilters,
  hasActiveFilters,
  priceFrom, priceTo, areaFrom, areaTo, cityFilter, extraFilters,
  onPriceFromChange, onPriceToChange, onAreaFromChange, onAreaToChange,
  onCityFilterChange, onExtraFilterChange,
  onResetAllFilters, onCloseFilters,
  filteredCount, activeCatFields,
}: MarketplaceFilterPanelProps) {
  if (!showFilters) return null

  return (
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
            className={`${INPUT_CLS} focus-visible:ring-blue-500 max-w-xs`}
          />
        </div>

        {/* Цена и площадь */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Цена и площадь</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-gray-600 block mb-1">Цена от, ₽</label>
              <Input value={priceFrom} onChange={e => onPriceFromChange(e.target.value)} placeholder="1 000 000"
                className={`${INPUT_CLS} focus-visible:ring-blue-500`} />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 block mb-1">Цена до, ₽</label>
              <Input value={priceTo} onChange={e => onPriceToChange(e.target.value)} placeholder="100 000 000"
                className={`${INPUT_CLS} focus-visible:ring-blue-500`} />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 block mb-1">Площадь от, м²</label>
              <Input value={areaFrom} onChange={e => onAreaFromChange(e.target.value)} placeholder="50"
                className={`${INPUT_CLS} focus-visible:ring-blue-500`} />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 block mb-1">Площадь до, м²</label>
              <Input value={areaTo} onChange={e => onAreaToChange(e.target.value)} placeholder="5000"
                className={`${INPUT_CLS} focus-visible:ring-blue-500`} />
            </div>
          </div>
        </div>

        {/* Специальные фильтры для Курортной */}
        {activeCategory === "Курортная" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Доходность от (%/год)</label>
                <Input value={extraFilters["yield"] ?? ""} onChange={e => onExtraFilterChange("yield", e.target.value)}
                  placeholder="10" className={`${INPUT_CLS} focus-visible:ring-cyan-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Загрузка от (%)</label>
                <Input value={extraFilters["occupancy"] ?? ""} onChange={e => onExtraFilterChange("occupancy", e.target.value)}
                  placeholder="60" className={`${INPUT_CLS} focus-visible:ring-cyan-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Сезонность</label>
                <Input value={extraFilters["season"] ?? ""} onChange={e => onExtraFilterChange("season", e.target.value)}
                  placeholder="Круглогодично / Лето" className={`${INPUT_CLS} focus-visible:ring-cyan-500`} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Инфраструктура</p>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "pool", val: "Есть", label: "Бассейн" },
                  { key: "spa", val: "Есть", label: "SPA" },
                  { key: "beach", val: "Собственный", label: "Пляж" },
                  { key: "restaurant", val: "Есть", label: "Ресторан" },
                  { key: "management_company", val: "Есть", label: "УК есть" },
                  { key: "parking", val: "Есть", label: "Парковка" },
                ].map(f => (
                  <button key={f.key}
                    onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      extraFilters[f.key] === f.val
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Специальные фильтры для С торгов */}
        {activeCategory === "С торгов" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">ЭТП (площадка)</label>
                <Input value={extraFilters["etp"] ?? ""} onChange={e => onExtraFilterChange("etp", e.target.value)}
                  placeholder="МЭТС / РФФИ / Торги.ру" className={`${INPUT_CLS} focus-visible:ring-green-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Дата аукциона</label>
                <Input value={extraFilters["auction_date"] ?? ""} onChange={e => onExtraFilterChange("auction_date", e.target.value)}
                  placeholder="01.06.2026" className={`${INPUT_CLS} focus-visible:ring-green-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Номер лота</label>
                <Input value={extraFilters["lot_number"] ?? ""} onChange={e => onExtraFilterChange("lot_number", e.target.value)}
                  placeholder="№ 12345" className={`${INPUT_CLS} focus-visible:ring-green-500`} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Параметры лота</p>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "encumbrance", val: "Нет", label: "Без обременений" },
                  { key: "bidding_step", val: "Есть", label: "Шаг торгов указан" },
                  { key: "documents", val: "Есть", label: "Документы готовы" },
                ].map(f => (
                  <button key={f.key}
                    onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      extraFilters[f.key] === f.val
                        ? "border-green-500 bg-green-500/15 text-green-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Специальные фильтры для Инвестиционной */}
        {activeCategory === "Инвестиционная" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Доходность от (%/год)</label>
                <Input value={extraFilters["yield"] ?? ""} onChange={e => onExtraFilterChange("yield", e.target.value)}
                  placeholder="8" className={`${INPUT_CLS} focus-visible:ring-amber-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">ROI от (%)</label>
                <Input value={extraFilters["roi"] ?? ""} onChange={e => onExtraFilterChange("roi", e.target.value)}
                  placeholder="10" className={`${INPUT_CLS} focus-visible:ring-amber-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Окупаемость до (лет)</label>
                <Input value={extraFilters["payback"] ?? ""} onChange={e => onExtraFilterChange("payback", e.target.value)}
                  placeholder="12" className={`${INPUT_CLS} focus-visible:ring-amber-500`} />
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
                  <button key={f.key}
                    onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      extraFilters[f.key] === f.val
                        ? "border-amber-500 bg-amber-500/15 text-amber-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                    }`}>{f.label}</button>
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
                  placeholder="A / B+ / B / C" className={`${INPUT_CLS} focus-visible:ring-violet-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Высота потолков от (м)</label>
                <Input value={extraFilters["ceiling"] ?? ""} onChange={e => onExtraFilterChange("ceiling", e.target.value)}
                  placeholder="3.0" className={`${INPUT_CLS} focus-visible:ring-violet-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Состояние</label>
                <Input value={extraFilters["condition"] ?? ""} onChange={e => onExtraFilterChange("condition", e.target.value)}
                  placeholder="Готово / Shell&Core" className={`${INPUT_CLS} focus-visible:ring-violet-500`} />
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
                  <button key={f.key}
                    onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      extraFilters[f.key] === f.val
                        ? "border-violet-500 bg-violet-500/15 text-violet-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Специальные фильтры для Жилой */}
        {activeCategory === "Жилая" && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Комнаты</p>
              <div className="flex gap-1.5 flex-wrap">
                {["Студия", "1", "2", "3", "4", "5+"].map(r => (
                  <button key={r}
                    onClick={() => onExtraFilterChange("rooms", extraFilters["rooms"] === r ? "" : r)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      extraFilters["rooms"] === r
                        ? "border-sky-500 bg-sky-500/15 text-sky-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                    }`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Ремонт / Состояние</label>
                <Input value={extraFilters["condition"] ?? ""} onChange={e => onExtraFilterChange("condition", e.target.value)}
                  placeholder="Евроремонт / Черновая" className={`${INPUT_CLS} focus-visible:ring-sky-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Тип дома</label>
                <Input value={extraFilters["building_type"] ?? ""} onChange={e => onExtraFilterChange("building_type", e.target.value)}
                  placeholder="Монолит / Кирпич" className={`${INPUT_CLS} focus-visible:ring-sky-500`} />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 block mb-1">Класс жилья</label>
                <Input value={extraFilters["housing_class"] ?? ""} onChange={e => onExtraFilterChange("housing_class", e.target.value)}
                  placeholder="Комфорт / Бизнес / Премиум" className={`${INPUT_CLS} focus-visible:ring-sky-500`} />
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
                  <button key={f.key}
                    onClick={() => onExtraFilterChange(f.key, extraFilters[f.key] === f.val ? "" : f.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      extraFilters[f.key] === f.val
                        ? "border-sky-500 bg-sky-500/15 text-sky-300"
                        : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-500 hover:text-gray-300"
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Характеристики категории (для всех остальных) */}
        {activeCategory !== "Жилая" && activeCategory !== "Коммерческая" && activeCategory !== "Инвестиционная" && activeCategory !== "С торгов" && activeCategory !== "Курортная" && activeCatFields.length > 0 && (
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
                    className={`${INPUT_CLS} focus-visible:ring-violet-500`}
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
  )
}
