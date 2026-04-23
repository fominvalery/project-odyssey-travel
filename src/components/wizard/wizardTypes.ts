export interface ObjectData {
  id: number | string
  type: string
  title: string
  city: string
  address: string
  price: string
  area: string
  yield: string
  description: string
  status: string
  category: string
  subtype?: string
  yield_percent?: string
  published?: boolean
  photos?: string[]
  user_id?: string | null
  extra_fields?: Record<string, string>
  presentation_url?: string | null
}

export interface WizardForm {
  title: string
  city: string
  address: string
  lat?: number
  lon?: number
  price: string
  area: string
  description: string
  landing_title: string
  landing_cta: string
  presentation_notes: string
  presentation_contact_name: string
  presentation_contact_phone: string
  presentation_contact_company: string
}

export const STEPS = ["Основное", "Локация", "Характеристики", "Описание", "Презентация", "Публикация"]

// Группы категорий для визарда
export interface CategoryItem {
  id: string
  label: string
  desc: string
  icon: string
  group: "residential" | "commercial_group" | "other"
  subtypes?: string[]
}

export const CATEGORIES: CategoryItem[] = [
  // Жилая недвижимость
  {
    id: "residential",
    label: "Жилая",
    desc: "Квартира, дом, таунхаус, апартаменты",
    icon: "Home",
    group: "residential",
    subtypes: ["Квартира", "Комната", "Дом / Коттедж", "Таунхаус", "Апартаменты", "Дача"],
  },
  // Новостройки
  {
    id: "newbuild",
    label: "Новостройки",
    desc: "ЖК, шахматка, застройщик",
    icon: "Construction",
    group: "residential",
    subtypes: ["Квартира в новостройке", "Апартаменты", "Таунхаус", "Пентхаус"],
  },
  // Коммерческая
  {
    id: "commercial",
    label: "Коммерция",
    desc: "Офисы, склады, ритейл",
    icon: "Building2",
    group: "commercial_group",
    subtypes: ["Офис / БЦ", "Стрит-ритейл", "ОЗС (открытый склад)", "Склад / Логистика", "Производство / Промзона", "Гостиница / Апарт-отель", "Земельный участок (ком.)", "ПСН (свободное назначение)"],
  },
  // Инвестиции
  {
    id: "investment",
    label: "Инвестиции",
    desc: "ROI, доходность, стратегия",
    icon: "TrendingUp",
    group: "other",
    subtypes: ["Арендный бизнес", "ГАБ (готовый арендный бизнес)", "Редевелопмент", "Земля под застройку"],
  },
  // Торги
  {
    id: "auction",
    label: "Торги",
    desc: "Аукционы и банкротство",
    icon: "Gavel",
    group: "other",
    subtypes: ["Банкротство", "Муниципальные торги", "РФФИ", "Реализация залогов"],
  },
]

export const CATEGORY_GROUPS = [
  { label: "Жилая недвижимость", ids: ["residential", "newbuild"] },
  { label: "Коммерческая недвижимость", ids: ["commercial", "investment"] },
  { label: "Специальные форматы", ids: ["auction"] },
]

// Поля по категориям
const RESIDENTIAL_FIELDS = [
  { key: "rooms", label: "Количество комнат", placeholder: "3" },
  { key: "floor", label: "Этаж", placeholder: "5" },
  { key: "floors_total", label: "Этажей в доме", placeholder: "16" },
  { key: "building_type", label: "Тип дома", placeholder: "Монолит / Кирпич / Панель" },
  { key: "condition", label: "Состояние", placeholder: "Евроремонт / Черновая / Без отделки" },
  { key: "bathroom", label: "Санузел", placeholder: "Раздельный / Совмещённый" },
  { key: "balcony", label: "Балкон / Лоджия", placeholder: "Есть / Нет" },
  { key: "parking", label: "Парковка", placeholder: "Подземная / Наземная / Нет" },
]

const INVESTMENT_FIELDS = [
  { key: "roi", label: "ROI (%)", placeholder: "12" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "8.5" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "7" },
  { key: "rent", label: "Арендный доход (₽/мес)", placeholder: "150 000" },
  { key: "strategy", label: "Стратегия инвестирования", placeholder: "Долгосрочная аренда" },
  { key: "encumbrance", label: "Обременение / Арендатор", placeholder: "Якорный арендатор, договор до 2028" },
]

const COMMERCIAL_FIELDS_OFFICE = [
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B / C" },
  { key: "floor", label: "Этаж", placeholder: "3" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "9" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.2" },
  { key: "parking", label: "Парковка", placeholder: "40 м/м подземная" },
  { key: "condition", label: "Состояние", placeholder: "Open space / Кабинеты / Shell&Core" },
  { key: "access", label: "Доступ", placeholder: "Круглосуточный / Бизнес-часы" },
]

const COMMERCIAL_FIELDS_RETAIL = [
  { key: "floor", label: "Этаж", placeholder: "1 (первая линия)" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "4.5" },
  { key: "frontage", label: "Витрина (м)", placeholder: "12" },
  { key: "entrance", label: "Вход", placeholder: "Отдельный с улицы" },
  { key: "traffic", label: "Трафик (чел/день)", placeholder: "5 000" },
  { key: "condition", label: "Состояние", placeholder: "Готово к торговле" },
  { key: "tenant", label: "Арендатор", placeholder: "Свободно / Продуктовый ритейл" },
]

const COMMERCIAL_FIELDS_WAREHOUSE = [
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "12" },
  { key: "gates", label: "Ворота", placeholder: "4 доктерных ворот" },
  { key: "floor_load", label: "Нагрузка на пол (т/м²)", placeholder: "5" },
  { key: "temp_regime", label: "Температурный режим", placeholder: "Отапливаемый / Холодный" },
  { key: "railway", label: "Ж/Д ветка", placeholder: "Есть / Нет" },
  { key: "class", label: "Класс склада", placeholder: "A / B / C" },
  { key: "parking", label: "Парковка фур", placeholder: "20 мест" },
]

const COMMERCIAL_FIELDS_INDUSTRIAL = [
  { key: "power", label: "Электромощность (кВт)", placeholder: "500" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "8" },
  { key: "crane", label: "Кран-балка (т)", placeholder: "5" },
  { key: "floor_load", label: "Нагрузка на пол (т/м²)", placeholder: "10" },
  { key: "gates", label: "Ворота", placeholder: "3 ворот (6×4)" },
  { key: "gas", label: "Газ", placeholder: "Есть / Нет" },
  { key: "railway", label: "Ж/Д ветка", placeholder: "Есть / Нет" },
]

const COMMERCIAL_FIELDS_DEFAULT = [
  { key: "floor", label: "Этаж", placeholder: "3" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "9" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.2" },
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B" },
  { key: "condition", label: "Состояние", placeholder: "Готово / Требует ремонта" },
  { key: "tenant", label: "Арендатор", placeholder: "Свободно / Действующий договор" },
]

const AUCTION_FIELDS = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "Торги.ру / МЭТС" },
  { key: "lot_number", label: "Номер лота", placeholder: "№ 12345" },
  { key: "auction_date", label: "Дата аукциона", placeholder: "01.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "5 000 000" },
  { key: "deposit", label: "Залог (₽)", placeholder: "500 000" },
  { key: "auction_subtype", label: "Тип торгов", placeholder: "Банкротство / Муниципальные" },
]

const NEWBUILD_FIELDS = [
  { key: "complex", label: "Название ЖК", placeholder: "Парк Апрель" },
  { key: "developer", label: "Застройщик", placeholder: "ГК Самолёт" },
  { key: "delivery", label: "Срок сдачи", placeholder: "Q3 2026" },
  { key: "corpus", label: "Корпус / Секция", placeholder: "К1, С2" },
  { key: "chess", label: "Шахматка", placeholder: "Доступна" },
  { key: "finishing", label: "Отделка", placeholder: "Чистовая / Предчистовая / Без отделки" },
  { key: "mortgage", label: "Ипотека", placeholder: "Семейная 6% / Военная" },
]

export function getCategoryFields(catId: string, subtype?: string) {
  if (catId === "residential") return RESIDENTIAL_FIELDS
  if (catId === "investment") return INVESTMENT_FIELDS
  if (catId === "auction") return AUCTION_FIELDS
  if (catId === "newbuild") return NEWBUILD_FIELDS
  if (catId === "commercial") {
    if (!subtype) return COMMERCIAL_FIELDS_DEFAULT
    if (subtype.includes("Офис") || subtype.includes("БЦ")) return COMMERCIAL_FIELDS_OFFICE
    if (subtype.includes("Стрит") || subtype.includes("ритейл") || subtype.includes("ПСН")) return COMMERCIAL_FIELDS_RETAIL
    if (subtype.includes("Склад") || subtype.includes("Логистика") || subtype.includes("ОЗС")) return COMMERCIAL_FIELDS_WAREHOUSE
    if (subtype.includes("Производство") || subtype.includes("Промзона")) return COMMERCIAL_FIELDS_INDUSTRIAL
    return COMMERCIAL_FIELDS_DEFAULT
  }
  return []
}

// Маппинг категорий для маркетплейса
export const CAT_MAP: Record<string, string> = {
  investment: "Инвестиционная",
  commercial: "Коммерческая",
  auction: "С торгов",
  newbuild: "Новостройки",
  residential: "Жилая",
}

export const CAT_ID_MAP: Record<string, string> = {
  "Коммерческая": "commercial",
  "Инвестиционная": "investment",
  "С торгов": "auction",
  "Новостройки": "newbuild",
  "Жилая": "residential",
}