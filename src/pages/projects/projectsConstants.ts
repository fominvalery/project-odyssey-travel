// ── Категории ─────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "",             label: "Все" },
  { id: "commercial",  label: "Коммерческая",  color: "bg-violet-600" },
  { id: "investment",  label: "Инвестиционная", color: "bg-amber-600" },
  { id: "newbuild",    label: "Новостройки",    color: "bg-blue-600" },
  { id: "resort",      label: "Курортная",      color: "bg-cyan-600" },
  { id: "auction",     label: "С торгов",       color: "bg-green-600" },
  { id: "residential", label: "Жилая",          color: "bg-sky-600" },
]

export const CAT_COLOR: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id).map(c => [c.id, c.color!])
)
export const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(c => c.id).map(c => [c.id, c.label])
)

// ── Подтипы по категории ──────────────────────────────────────────────────────

export type SubGroup = { id: string; label: string; subtypes: string[] }

export const SUBTYPES: Record<string, SubGroup[]> = {
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

export function getActiveGroup(catId: string, subtype: string): string {
  if (!subtype || !SUBTYPES[catId]) return ""
  return SUBTYPES[catId].find(g => g.subtypes.includes(subtype))?.id ?? ""
}

export function getVisibleSubtypes(catId: string, activeGroup: string): string[] {
  if (!SUBTYPES[catId]) return []
  if (activeGroup) return SUBTYPES[catId].find(g => g.id === activeGroup)?.subtypes ?? []
  return SUBTYPES[catId].flatMap(g => g.subtypes.slice(0, 3))
}

export function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}

export interface Offer {
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

export const DEFAULT_IMG = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

export const GROUP_ACTIVE: Record<string, string> = {
  commercial:  "bg-violet-600 text-white border-violet-600",
  investment:  "bg-amber-600 text-white border-amber-600",
  resort:      "bg-cyan-600 text-white border-cyan-600",
  auction:     "bg-green-600 text-white border-green-600",
  residential: "bg-sky-600 text-white border-sky-600",
  newbuild:    "bg-blue-600 text-white border-blue-600",
}

export const SUBTYPE_ACTIVE: Record<string, string> = {
  commercial:  "border-violet-500 bg-violet-500/15 text-violet-300",
  investment:  "border-amber-500 bg-amber-500/15 text-amber-300",
  resort:      "border-cyan-500 bg-cyan-500/15 text-cyan-300",
  auction:     "border-green-500 bg-green-500/15 text-green-300",
  residential: "border-sky-500 bg-sky-500/15 text-sky-300",
  newbuild:    "border-blue-500 bg-blue-500/15 text-blue-300",
}
