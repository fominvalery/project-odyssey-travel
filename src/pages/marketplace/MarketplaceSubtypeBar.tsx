import type { CategoryItem } from "@/components/wizard/wizardTypes"

interface MarketplaceSubtypeBarProps {
  activeCategory: string
  activeSubtype: string
  onSubtypeChange: (st: string) => void
  activeCatDef: CategoryItem | undefined
}

function GroupAndSubtypeRow({
  groups,
  activeGroup,
  activeSubtype,
  visibleSubtypes,
  onSubtypeChange,
  groupActiveClass,
  subtypeActiveClass,
}: {
  groups: { id: string; label: string; subtypes: string[] }[]
  activeGroup: string
  activeSubtype: string
  visibleSubtypes: string[]
  onSubtypeChange: (st: string) => void
  groupActiveClass: string
  subtypeActiveClass: string
}) {
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
                ? groupActiveClass
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
                ? subtypeActiveClass
                : "border-[#2a2a2a] bg-transparent text-gray-500 hover:text-gray-300 hover:border-[#3a3a3a]"
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </>
  )
}

export default function MarketplaceSubtypeBar({
  activeCategory,
  activeSubtype,
  onSubtypeChange,
  activeCatDef,
}: MarketplaceSubtypeBarProps) {

  // Новостройки
  if (activeCategory === "Новостройки") {
    const NEWBUILD_COMMERCIAL = ["Офис в БЦ", "Стрит-ритейл в БЦ", "Стрит-ритейл в ЖК", "Апарт-отель (юниты)", "ГАБ в новостройке"]
    const NEWBUILD_RESIDENTIAL = ["Квартира в новостройке", "Апартаменты", "Таунхаус", "Пентхаус"]
    const activeGroup = NEWBUILD_COMMERCIAL.includes(activeSubtype) ? "commercial"
      : NEWBUILD_RESIDENTIAL.includes(activeSubtype) ? "residential" : ""
    const visibleSubtypes = activeGroup === "commercial" ? NEWBUILD_COMMERCIAL
      : activeGroup === "residential" ? NEWBUILD_RESIDENTIAL
      : [...NEWBUILD_COMMERCIAL, ...NEWBUILD_RESIDENTIAL]
    return (
      <GroupAndSubtypeRow
        groups={[
          { id: "commercial", label: "Коммерческая", subtypes: NEWBUILD_COMMERCIAL },
          { id: "residential", label: "Жилая", subtypes: NEWBUILD_RESIDENTIAL },
        ]}
        activeGroup={activeGroup}
        activeSubtype={activeSubtype}
        visibleSubtypes={visibleSubtypes}
        onSubtypeChange={onSubtypeChange}
        groupActiveClass="bg-blue-600 text-white border-blue-600"
        subtypeActiveClass="border-violet-500 bg-violet-500/15 text-violet-300"
      />
    )
  }

  // Жилая
  if (activeCategory === "Жилая") {
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
    return (
      <GroupAndSubtypeRow
        groups={[
          { id: "urban", label: "Городская", subtypes: URBAN },
          { id: "suburban", label: "Загородная", subtypes: SUBURBAN },
          { id: "premium", label: "Премиум", subtypes: PREMIUM },
          { id: "land", label: "Земля", subtypes: LAND },
        ]}
        activeGroup={activeGroup}
        activeSubtype={activeSubtype}
        visibleSubtypes={visibleSubtypes}
        onSubtypeChange={onSubtypeChange}
        groupActiveClass="bg-sky-600 text-white border-sky-600"
        subtypeActiveClass="border-sky-500 bg-sky-500/15 text-sky-300"
      />
    )
  }

  // Коммерческая
  if (activeCategory === "Коммерческая") {
    const OFFICE = ["Бизнес-центр", "Офис", "Смарт-офис", "Сервисный офис", "Коворкинг", "Особняк"]
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
    return (
      <GroupAndSubtypeRow
        groups={[
          { id: "office", label: "Офисная", subtypes: OFFICE },
          { id: "retail", label: "Торговая", subtypes: RETAIL },
          { id: "warehouse", label: "Склад / Произв.", subtypes: WAREHOUSE },
          { id: "service", label: "Сервис", subtypes: SERVICE },
          { id: "mixed", label: "Смешанные", subtypes: MIXED },
        ]}
        activeGroup={activeGroup}
        activeSubtype={activeSubtype}
        visibleSubtypes={visibleSubtypes}
        onSubtypeChange={onSubtypeChange}
        groupActiveClass="bg-violet-600 text-white border-violet-600"
        subtypeActiveClass="border-violet-500 bg-violet-500/15 text-violet-300"
      />
    )
  }

  // Инвестиционная
  if (activeCategory === "Инвестиционная") {
    const GAB = ["ГАБ (готовый арендный бизнес)", "Создание ГАБ", "ГАБ Субаренда"]
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
    return (
      <GroupAndSubtypeRow
        groups={[
          { id: "gab", label: "ГАБ / Аренда", subtypes: GAB },
          { id: "redev", label: "Редевелопмент", subtypes: REDEV },
          { id: "land", label: "Земля", subtypes: LAND },
          { id: "special", label: "Спец. форматы", subtypes: SPECIAL },
        ]}
        activeGroup={activeGroup}
        activeSubtype={activeSubtype}
        visibleSubtypes={visibleSubtypes}
        onSubtypeChange={onSubtypeChange}
        groupActiveClass="bg-amber-600 text-white border-amber-600"
        subtypeActiveClass="border-amber-500 bg-amber-500/15 text-amber-300"
      />
    )
  }

  // С торгов
  if (activeCategory === "С торгов") {
    const BANKRUPTCY = ["Банкротство физлица", "Банкротство юрлица", "Конкурсная масса"]
    const STATE = ["Муниципальные торги", "Государственный аукцион", "РФФИ", "Торги по 44-ФЗ / 223-ФЗ", "Приватизация", "Торги по исполнительному производству"]
    const PLEDGE = ["Реализация залогов банка", "Имущество под обременением", "Арестованное имущество"]
    const activeGroup = BANKRUPTCY.includes(activeSubtype) ? "bankruptcy"
      : STATE.includes(activeSubtype) ? "state"
      : PLEDGE.includes(activeSubtype) ? "pledge" : ""
    const visibleSubtypes = activeGroup === "bankruptcy" ? BANKRUPTCY
      : activeGroup === "state" ? STATE
      : activeGroup === "pledge" ? PLEDGE
      : [...BANKRUPTCY, ...STATE, ...PLEDGE]
    return (
      <GroupAndSubtypeRow
        groups={[
          { id: "bankruptcy", label: "Банкротство", subtypes: BANKRUPTCY },
          { id: "state", label: "Гос. и муниц.", subtypes: STATE },
          { id: "pledge", label: "Залоговое", subtypes: PLEDGE },
        ]}
        activeGroup={activeGroup}
        activeSubtype={activeSubtype}
        visibleSubtypes={visibleSubtypes}
        onSubtypeChange={onSubtypeChange}
        groupActiveClass="bg-green-700 text-white border-green-700"
        subtypeActiveClass="border-green-500 bg-green-500/15 text-green-300"
      />
    )
  }

  // Курортная
  if (activeCategory === "Курортная") {
    const ACCOMMODATION = ["Апарт-отель", "Апарт-комплекс", "Гостиница", "Отель", "Бутик-отель", "Мини-отель", "Хостел", "Гостевой дом", "Глэмпинг"]
    const WELLNESS = ["Санаторий", "Пансионат", "SPA-отель", "Wellness-отель", "Медицинский курорт"]
    const NATURE = ["База отдыха", "Турбаза", "Эко-отель", "Курортный комплекс", "Виллы и коттеджи под аренду", "Загородный клуб", "Кемпинг / Автокемпинг"]
    const INVEST = ["Объект под управление", "Земельный участок под курортный проект", "Инвестиционный проект под строительство", "Готовый арендный бизнес в курортной локации"]
    const activeGroup = ACCOMMODATION.includes(activeSubtype) ? "accommodation"
      : WELLNESS.includes(activeSubtype) ? "wellness"
      : NATURE.includes(activeSubtype) ? "nature"
      : INVEST.includes(activeSubtype) ? "invest" : ""
    const visibleSubtypes = activeGroup === "accommodation" ? ACCOMMODATION
      : activeGroup === "wellness" ? WELLNESS
      : activeGroup === "nature" ? NATURE
      : activeGroup === "invest" ? INVEST
      : [...ACCOMMODATION, ...WELLNESS, ...NATURE]
    return (
      <GroupAndSubtypeRow
        groups={[
          { id: "accommodation", label: "Размещение", subtypes: ACCOMMODATION },
          { id: "wellness", label: "SPA / Оздоровление", subtypes: WELLNESS },
          { id: "nature", label: "Загородный отдых", subtypes: NATURE },
          { id: "invest", label: "Инвестиции", subtypes: INVEST },
        ]}
        activeGroup={activeGroup}
        activeSubtype={activeSubtype}
        visibleSubtypes={visibleSubtypes}
        onSubtypeChange={onSubtypeChange}
        groupActiveClass="bg-cyan-700 text-white border-cyan-700"
        subtypeActiveClass="border-cyan-500 bg-cyan-500/15 text-cyan-300"
      />
    )
  }

  // Все остальные категории — простой ряд подтипов
  const GROUPED_CATS = ["Новостройки", "Жилая", "Коммерческая", "Инвестиционная", "С торгов", "Курортная"]
  if (!GROUPED_CATS.includes(activeCategory) && activeCatDef?.subtypes && activeCatDef.subtypes.length > 0) {
    return (
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
    )
  }

  return null
}