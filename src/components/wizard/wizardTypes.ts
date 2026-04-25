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

export const STEPS = ["Основное", "Локация", "Характеристики", "Описание", "Презентация", "Публикация", "Собственник"]

// Группы категорий для визарда
export interface CategoryItem {
  id: string
  label: string
  desc: string
  icon: string
  group: "residential" | "commercial_group" | "resort_group" | "other"
  subtypes?: string[]
  subgroups?: { label: string; items: string[] }[]
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
    subtypes: ["Офис / БЦ", "Стрит-ритейл", "ОЗС (отдельно стоящее здание)", "Склад / Логистика", "Производство / Промзона", "Гостиница / Апарт-отель", "Земельный участок (ком.)", "ПСН (свободное назначение)"],
  },
  // Инвестиции
  {
    id: "investment",
    label: "Инвестиции",
    desc: "ROI, доходность, стратегия",
    icon: "TrendingUp",
    group: "commercial_group",
    subtypes: ["Арендный бизнес", "ГАБ (готовый арендный бизнес)", "Редевелопмент", "Земля под застройку"],
  },
  // Курортная — НОВЫЙ РАЗДЕЛ
  {
    id: "resort",
    label: "Курортная",
    desc: "Отели, SPA, турбизнес, инвест-проекты",
    icon: "Palmtree",
    group: "other",
    subtypes: [
      // Размещение
      "Апарт-отель", "Апарт-комплекс", "Гостиница", "Отель", "Мини-отель", "Хостел", "Гостевой дом",
      // Оздоровление
      "Санаторий", "Пансионат", "SPA-отель", "Wellness-отель",
      // Загородный отдых
      "База отдыха", "Турбаза", "Эко-отель", "Курортный комплекс", "Виллы и коттеджи под аренду",
      // Инвестиции
      "Объект под управление", "Земельный участок под курортный проект", "Инвестиционный проект под строительство", "Готовый арендный бизнес в курортной локации",
    ],
    subgroups: [
      { label: "Размещение", items: ["Апарт-отель", "Апарт-комплекс", "Гостиница", "Отель", "Мини-отель", "Хостел", "Гостевой дом"] },
      { label: "Оздоровление и отдых", items: ["Санаторий", "Пансионат", "SPA-отель", "Wellness-отель"] },
      { label: "Загородный и природный отдых", items: ["База отдыха", "Турбаза", "Эко-отель", "Курортный комплекс", "Виллы и коттеджи под аренду"] },
      { label: "Инвестиции и проекты", items: ["Объект под управление", "Земельный участок под курортный проект", "Инвестиционный проект под строительство", "Готовый арендный бизнес в курортной локации"] },
    ],
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
  { label: "Коммерческая недвижимость", ids: ["commercial", "investment"] },
  { label: "Специальные форматы", ids: ["resort", "auction"] },
  { label: "Жилая недвижимость", ids: ["residential", "newbuild"] },
]

// ── Поля аренды для Жилой ───────────────────────────────────────────────────
export const RESIDENTIAL_RENT_FIELDS = [
  { key: "rooms", label: "Количество комнат", placeholder: "3" },
  { key: "floor", label: "Этаж", placeholder: "5" },
  { key: "floors_total", label: "Этажей в доме", placeholder: "16" },
  { key: "building_type", label: "Тип дома", placeholder: "Монолит / Кирпич / Панель" },
  { key: "condition", label: "Состояние", placeholder: "Евроремонт / Дизайнерский / Стандарт" },
  { key: "bathroom", label: "Санузел", placeholder: "Раздельный / Совмещённый" },
  { key: "balcony", label: "Балкон / Лоджия", placeholder: "Есть / Нет" },
  { key: "furniture", label: "Мебель", placeholder: "Полностью меблирована / Частично / Без мебели" },
  { key: "appliances", label: "Техника", placeholder: "Вся техника / Частично / Нет" },
  { key: "pets", label: "Животные", placeholder: "Можно / Нельзя" },
  { key: "deposit", label: "Залог (₽)", placeholder: "100 000" },
  { key: "lease_term", label: "Срок аренды", placeholder: "Длительная / Посуточно / От 3 мес." },
]

// ── Поля для Жилой ──────────────────────────────────────────────────────────
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

// ── Поля для Инвестиций ──────────────────────────────────────────────────────
const INVESTMENT_FIELDS = [
  { key: "roi", label: "ROI (%)", placeholder: "12" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "8.5" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "7" },
  { key: "rent", label: "Арендный доход (₽/мес)", placeholder: "150 000" },
  { key: "strategy", label: "Стратегия инвестирования", placeholder: "Долгосрочная аренда" },
  { key: "encumbrance", label: "Обременение / Арендатор", placeholder: "Якорный арендатор, договор до 2028" },
]

// ── Поля аренды для Коммерции ────────────────────────────────────────────────
export const COMMERCIAL_RENT_FIELDS_OFFICE = [
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B / C" },
  { key: "floor", label: "Этаж", placeholder: "3" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.2" },
  { key: "condition", label: "Состояние", placeholder: "Open space / Кабинеты / С мебелью" },
  { key: "parking", label: "Парковка", placeholder: "40 м/м подземная" },
  { key: "access", label: "Доступ", placeholder: "Круглосуточный / Бизнес-часы" },
  { key: "rent_price_sqm", label: "Ставка аренды (₽/м²/мес)", placeholder: "2 500" },
  { key: "opex", label: "Эксплуатационные расходы (₽/м²)", placeholder: "500" },
  { key: "lease_from", label: "Аренда от (м²)", placeholder: "50" },
  { key: "lease_term", label: "Минимальный срок аренды", placeholder: "11 мес. / 1 год" },
]

export const COMMERCIAL_RENT_FIELDS_DEFAULT = [
  { key: "floor", label: "Этаж", placeholder: "1" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.5" },
  { key: "condition", label: "Состояние", placeholder: "Готово / Требует ремонта" },
  { key: "rent_price_sqm", label: "Ставка аренды (₽/м²/мес)", placeholder: "1 800" },
  { key: "opex", label: "Коммунальные платежи", placeholder: "Включены / По счётчику" },
  { key: "lease_term", label: "Минимальный срок аренды", placeholder: "11 мес." },
  { key: "tenant", label: "Арендатор", placeholder: "Свободно / Есть арендатор" },
  { key: "deposit", label: "Залог (мес.)", placeholder: "2" },
]

// ── Поля для Коммерции ───────────────────────────────────────────────────────
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

// ── Поля для Курортной недвижимости ─────────────────────────────────────────

// Базовые поля — для всех курортных объектов
const RESORT_BASE_FIELDS = [
  { key: "floors_total", label: "Этажность", placeholder: "3" },
  { key: "units", label: "Номеров / юнитов", placeholder: "24" },
  { key: "usage_format", label: "Формат использования", placeholder: "Продажа / Аренда / Инвестиция" },
  { key: "season", label: "Сезонность", placeholder: "Круглогодично / Летний / Зимний" },
  { key: "condition", label: "Состояние объекта", placeholder: "Действующий / Требует ремонта / Строится" },
  { key: "status_deal", label: "Статус сделки", placeholder: "Свободен / Под договором" },
]

// Действующие объекты (отели, гостиницы и т.д.)
const RESORT_HOTEL_FIELDS = [
  { key: "floors_total", label: "Этажность", placeholder: "4" },
  { key: "units", label: "Номерной фонд (ед.)", placeholder: "30" },
  { key: "usage_format", label: "Формат использования", placeholder: "Продажа / Аренда / Управление" },
  { key: "season", label: "Сезонность", placeholder: "Круглогодично / Лето" },
  { key: "occupancy", label: "Средняя загрузка (%)", placeholder: "72" },
  { key: "avg_check", label: "Средний чек (₽/ночь)", placeholder: "5 500" },
  { key: "annual_revenue", label: "Годовая выручка (₽)", placeholder: "14 000 000" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "12" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "8" },
  { key: "management_company", label: "Управляющая компания", placeholder: "Есть / Нет / Название УК" },
  { key: "management_format", label: "Формат управления", placeholder: "Собственное / Франшиза / УК" },
  { key: "sales_channels", label: "Каналы продаж", placeholder: "Booking, Airbnb, прямые продажи" },
  { key: "pool", label: "Бассейн", placeholder: "Есть / Нет" },
  { key: "spa", label: "SPA", placeholder: "Есть / Нет" },
  { key: "restaurant", label: "Ресторан", placeholder: "Есть / Нет" },
  { key: "beach", label: "Пляж", placeholder: "Собственный / Городской / Нет" },
  { key: "parking", label: "Парковка", placeholder: "Есть / Нет / мест" },
  { key: "conference", label: "Конференц-зал", placeholder: "Есть / Нет" },
  { key: "licenses", label: "Лицензии и разрешения", placeholder: "Классификация, пожарная и т.д." },
]

// SPA, Wellness, Санатории
const RESORT_SPA_FIELDS = [
  { key: "floors_total", label: "Этажность", placeholder: "3" },
  { key: "units", label: "Номеров / мест", placeholder: "50" },
  { key: "usage_format", label: "Формат использования", placeholder: "Продажа / Управление" },
  { key: "season", label: "Сезонность", placeholder: "Круглогодично" },
  { key: "occupancy", label: "Средняя загрузка (%)", placeholder: "65" },
  { key: "avg_check", label: "Средний чек (₽/ночь)", placeholder: "8 000" },
  { key: "annual_revenue", label: "Годовая выручка (₽)", placeholder: "20 000 000" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "10" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "10" },
  { key: "pool", label: "Бассейн", placeholder: "Есть / Нет" },
  { key: "spa", label: "SPA / Термы", placeholder: "Полный комплекс / Частично" },
  { key: "restaurant", label: "Ресторан / Столовая", placeholder: "Есть / Нет" },
  { key: "medical", label: "Медицинская лицензия", placeholder: "Есть / Нет" },
  { key: "management_company", label: "Управляющая компания", placeholder: "Есть / Нет" },
  { key: "licenses", label: "Лицензии", placeholder: "Мед. лицензия, классификация" },
]

// Базы отдыха, турбазы, эко-отели
const RESORT_NATURE_FIELDS = [
  { key: "land_area", label: "Площадь участка (Га)", placeholder: "2.5" },
  { key: "units", label: "Домиков / мест", placeholder: "15" },
  { key: "usage_format", label: "Формат использования", placeholder: "Продажа / Аренда" },
  { key: "season", label: "Сезонность", placeholder: "Летний / Круглогодично" },
  { key: "occupancy", label: "Средняя загрузка (%)", placeholder: "55" },
  { key: "avg_check", label: "Средний чек (₽/сутки)", placeholder: "3 500" },
  { key: "annual_revenue", label: "Годовая выручка (₽)", placeholder: "7 000 000" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "9" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "9" },
  { key: "pool", label: "Бассейн / Водоём", placeholder: "Есть / Нет" },
  { key: "beach", label: "Пляж", placeholder: "Собственный / Рядом" },
  { key: "parking", label: "Парковка", placeholder: "Есть / мест" },
  { key: "management_company", label: "Управляющая компания", placeholder: "Есть / Нет" },
]

// Виллы и коттеджи под аренду
const RESORT_VILLA_FIELDS = [
  { key: "units", label: "Количество объектов", placeholder: "5 коттеджей" },
  { key: "usage_format", label: "Формат", placeholder: "Посуточная / Сезонная аренда" },
  { key: "season", label: "Сезонность", placeholder: "Летний / Круглогодично" },
  { key: "occupancy", label: "Средняя загрузка (%)", placeholder: "60" },
  { key: "avg_check", label: "Средний чек (₽/сутки)", placeholder: "12 000" },
  { key: "annual_revenue", label: "Годовая выручка (₽)", placeholder: "8 000 000" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "10" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "10" },
  { key: "pool", label: "Бассейн", placeholder: "В каждом / Общий / Нет" },
  { key: "beach", label: "Пляж", placeholder: "Рядом / 10 мин до моря" },
  { key: "management_company", label: "Управление", placeholder: "Есть УК / Самостоятельно" },
  { key: "sales_channels", label: "Каналы продаж", placeholder: "Airbnb, Авито, прямые бронирования" },
]

// Инвестиционные и земельные проекты
const RESORT_INVEST_FIELDS = [
  { key: "land_area", label: "Площадь участка (Га)", placeholder: "5" },
  { key: "land_use", label: "Вид разрешённого использования", placeholder: "Туризм / Рекреация / ИЖС" },
  { key: "project_stage", label: "Стадия проекта", placeholder: "Концепция / Проект / Строительство" },
  { key: "tu", label: "Технические условия (ТУ)", placeholder: "Есть / Нет / В работе" },
  { key: "urban_restrictions", label: "Градостроительные ограничения", placeholder: "ЗОУИТ, охранные зоны и т.д." },
  { key: "build_potential", label: "Потенциал застройки (м²)", placeholder: "10 000" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "50 000 000" },
  { key: "yield", label: "Прогнозная доходность (%)", placeholder: "18" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "6" },
  { key: "revenue_model", label: "Модель дохода", placeholder: "Гостиница / Апарт-отель / ГАБ" },
  { key: "forecast_occupancy", label: "Прогноз загрузки (%)", placeholder: "70" },
  { key: "management_company", label: "Управляющая компания", placeholder: "Есть / Планируется" },
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
    if (subtype.includes("ОЗС")) return COMMERCIAL_FIELDS_OFFICE
    if (subtype.includes("Склад") || subtype.includes("Логистика")) return COMMERCIAL_FIELDS_WAREHOUSE
    if (subtype.includes("Производство") || subtype.includes("Промзона")) return COMMERCIAL_FIELDS_INDUSTRIAL
    return COMMERCIAL_FIELDS_DEFAULT
  }
  if (catId === "resort") {
    if (!subtype) return RESORT_BASE_FIELDS
    // Земля и инвест-проекты
    if (subtype.includes("Земельный") || subtype.includes("Инвестиционный проект") || subtype.includes("строительство")) return RESORT_INVEST_FIELDS
    // SPA, Wellness, Санатории, Пансионаты
    if (subtype.includes("SPA") || subtype.includes("Wellness") || subtype.includes("Санаторий") || subtype.includes("Пансионат")) return RESORT_SPA_FIELDS
    // Базы отдыха, Турбазы, Эко-отели, Курортные комплексы
    if (subtype.includes("База") || subtype.includes("Турбаза") || subtype.includes("Эко") || subtype.includes("Курортный")) return RESORT_NATURE_FIELDS
    // Виллы и коттеджи
    if (subtype.includes("Виллы") || subtype.includes("коттеджи")) return RESORT_VILLA_FIELDS
    // Отели, Гостиницы, Апарт-отели и т.д.
    return RESORT_HOTEL_FIELDS
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
  resort: "Курортная",
}

export const CAT_ID_MAP: Record<string, string> = {
  "Коммерческая": "commercial",
  "Инвестиционная": "investment",
  "С торгов": "auction",
  "Новостройки": "newbuild",
  "Жилая": "residential",
  "Курортная": "resort",
}