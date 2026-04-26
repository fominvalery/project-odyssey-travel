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
    desc: "Квартира, дом, загородная, премиум",
    icon: "Home",
    group: "residential",
    subtypes: [
      // Городская
      "Квартира", "Студия", "Апартаменты", "Пентхаус", "Комната", "Многокомнатная квартира",
      // Загородная
      "Дом", "Коттедж", "Таунхаус", "Дуплекс", "Вилла", "Дача", "Частный дом", "Загородный дом", "Часть дома",
      // Премиум
      "Элитная квартира", "Премиум-жильё", "Резиденция", "Особняк",
      // Земля
      "Участок под жилую застройку", "Малоэтажный жилой дом",
    ],
    subgroups: [
      { label: "Городская", items: ["Квартира", "Студия", "Апартаменты", "Пентхаус", "Комната", "Многокомнатная квартира"] },
      { label: "Загородная", items: ["Дом", "Коттедж", "Таунхаус", "Дуплекс", "Вилла", "Дача", "Частный дом", "Загородный дом", "Часть дома"] },
      { label: "Премиум", items: ["Элитная квартира", "Пентхаус", "Вилла", "Премиум-жильё", "Резиденция", "Особняк"] },
      { label: "Земля и проекты", items: ["Участок под жилую застройку", "Малоэтажный жилой дом"] },
    ],
  },
  // Новостройки
  {
    id: "newbuild",
    label: "Новостройки",
    desc: "ЖК, БЦ, застройщик, шахматка",
    icon: "Construction",
    group: "residential",
    subtypes: [
      // Коммерческие
      "Офис в БЦ", "Стрит-ритейл в БЦ", "Стрит-ритейл в ЖК", "Апарт-отель (юниты)", "ГАБ в новостройке",
      // Жилые
      "Квартира в новостройке", "Апартаменты", "Таунхаус", "Пентхаус",
    ],
    subgroups: [
      { label: "Коммерческие", items: ["Офис в БЦ", "Стрит-ритейл в БЦ", "Стрит-ритейл в ЖК", "Апарт-отель (юниты)", "ГАБ в новостройке"] },
      { label: "Жилые", items: ["Квартира в новостройке", "Апартаменты", "Таунхаус", "Пентхаус"] },
    ],
  },
  // Коммерческая
  {
    id: "commercial",
    label: "Коммерция",
    desc: "Офисы, ритейл, склады, сервис",
    icon: "Building2",
    group: "commercial_group",
    subtypes: [
      // Офисная
      "Бизнес-центр", "Офис", "Смарт-офис", "Сервисный офис", "Коворкинг", "Особняк",
      // Торговая
      "Торговое помещение", "Street retail", "Магазин", "ТЦ / Торговый центр", "Торговая галерея", "Шоурум",
      // Складская и производственная
      "Склад", "Логистический комплекс", "Производственное помещение", "Промышленная база", "Флекс-помещение", "Light industrial",
      // Сервис и общепит
      "Ресторан", "Кафе", "Бар", "Салон красоты", "Медицинский центр", "Автосервис", "Автомойка",
      // Смешанные
      "ПСН (свободное назначение)", "ОЗС (отдельно стоящее здание)", "Объект смешанного назначения",
    ],
    subgroups: [
      { label: "Офисная недвижимость", items: ["Бизнес-центр", "Офис", "Смарт-офис", "Сервисный офис", "Коворкинг", "Особняк"] },
      { label: "Торговая недвижимость", items: ["Торговое помещение", "Street retail", "Магазин", "ТЦ / Торговый центр", "Торговая галерея", "Шоурум"] },
      { label: "Складская и производственная", items: ["Склад", "Логистический комплекс", "Производственное помещение", "Промышленная база", "Флекс-помещение", "Light industrial"] },
      { label: "Сервис и общепит", items: ["Ресторан", "Кафе", "Бар", "Салон красоты", "Медицинский центр", "Автосервис", "Автомойка"] },
      { label: "Смешанные и универсальные", items: ["ПСН (свободное назначение)", "ОЗС (отдельно стоящее здание)", "Объект смешанного назначения"] },
    ],
  },
  // Инвестиции
  {
    id: "investment",
    label: "Инвестиции",
    desc: "ГАБ, редевелопмент, земля, портфель",
    icon: "TrendingUp",
    group: "commercial_group",
    subtypes: [
      // Готовый арендный бизнес
      "ГАБ (готовый арендный бизнес)", "Создание ГАБ", "ГАБ Субаренда",
      // Редевелопмент и девелопмент
      "Редевелопмент", "Девелоперский проект", "Реконструкция",
      // Земля
      "Земля под строительство МКД", "Земля под застройку (коммерция)", "Земля под жилую застройку", "Земля под коммерцию",
      // Специальные форматы
      "Портфель объектов", "Доля в бизнесе / объекте", "Sale & Leaseback", "Объект под реализацию",
    ],
    subgroups: [
      { label: "Готовый арендный бизнес", items: ["ГАБ (готовый арендный бизнес)", "Создание ГАБ", "ГАБ Субаренда"] },
      { label: "Редевелопмент и девелопмент", items: ["Редевелопмент", "Девелоперский проект", "Реконструкция"] },
      { label: "Земельные участки", items: ["Земля под строительство МКД", "Земля под застройку (коммерция)", "Земля под жилую застройку", "Земля под коммерцию"] },
      { label: "Специальные форматы", items: ["Портфель объектов", "Доля в бизнесе / объекте", "Sale & Leaseback", "Объект под реализацию"] },
    ],
  },
  // Курортная — НОВЫЙ РАЗДЕЛ
  {
    id: "resort",
    label: "Курортная",
    desc: "Отели, SPA, eco, загородный отдых, инвест",
    icon: "Palmtree",
    group: "other",
    subtypes: [
      // Размещение
      "Апарт-отель", "Апарт-комплекс", "Гостиница", "Отель", "Бутик-отель", "Мини-отель", "Хостел", "Гостевой дом", "Глэмпинг",
      // Оздоровление
      "Санаторий", "Пансионат", "SPA-отель", "Wellness-отель", "Медицинский курорт",
      // Загородный отдых
      "База отдыха", "Турбаза", "Эко-отель", "Курортный комплекс", "Виллы и коттеджи под аренду", "Загородный клуб", "Кемпинг / Автокемпинг",
      // Инвестиции и проекты
      "Объект под управление", "Земельный участок под курортный проект", "Инвестиционный проект под строительство", "Готовый арендный бизнес в курортной локации",
    ],
    subgroups: [
      { label: "Размещение", items: ["Апарт-отель", "Апарт-комплекс", "Гостиница", "Отель", "Бутик-отель", "Мини-отель", "Хостел", "Гостевой дом", "Глэмпинг"] },
      { label: "Оздоровление и SPA", items: ["Санаторий", "Пансионат", "SPA-отель", "Wellness-отель", "Медицинский курорт"] },
      { label: "Загородный и eco-отдых", items: ["База отдыха", "Турбаза", "Эко-отель", "Курортный комплекс", "Виллы и коттеджи под аренду", "Загородный клуб", "Кемпинг / Автокемпинг"] },
      { label: "Инвестиции и проекты", items: ["Объект под управление", "Земельный участок под курортный проект", "Инвестиционный проект под строительство", "Готовый арендный бизнес в курортной локации"] },
    ],
  },
  // Торги
  {
    id: "auction",
    label: "Торги",
    desc: "Банкротство, РФФИ, залоги, муниципальные",
    icon: "Gavel",
    group: "other",
    subtypes: [
      // Банкротство
      "Банкротство физлица", "Банкротство юрлица", "Конкурсная масса",
      // Государственные и муниципальные
      "Муниципальные торги", "Государственный аукцион", "РФФИ",
      // Залоговое имущество
      "Реализация залогов банка", "Имущество под обременением", "Арестованное имущество",
      // Специальные
      "Торги по 44-ФЗ / 223-ФЗ", "Приватизация", "Торги по исполнительному производству",
    ],
    subgroups: [
      { label: "Банкротство", items: ["Банкротство физлица", "Банкротство юрлица", "Конкурсная масса"] },
      { label: "Государственные и муниципальные", items: ["Муниципальные торги", "Государственный аукцион", "РФФИ"] },
      { label: "Залоговое имущество", items: ["Реализация залогов банка", "Имущество под обременением", "Арестованное имущество"] },
      { label: "Специальные форматы", items: ["Торги по 44-ФЗ / 223-ФЗ", "Приватизация", "Торги по исполнительному производству"] },
    ],
  },
]

export const CATEGORY_GROUPS = [
  { label: "Коммерческая недвижимость", ids: ["commercial", "investment"] },
  { label: "Специальные форматы", ids: ["resort", "auction"] },
  { label: "Жилая недвижимость", ids: ["residential", "newbuild"] },
]

// ── Поля Жилой: Городская (квартира, студия, апартаменты) ───────────────────
const RESIDENTIAL_URBAN_FIELDS = [
  { key: "rooms", label: "Количество комнат", placeholder: "2" },
  { key: "living_area", label: "Жилая площадь (м²)", placeholder: "38" },
  { key: "floor", label: "Этаж", placeholder: "7" },
  { key: "floors_total", label: "Этажей в доме", placeholder: "16" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "2.8" },
  { key: "building_type", label: "Тип дома", placeholder: "Монолит / Кирпич / Панель" },
  { key: "build_year", label: "Год постройки", placeholder: "2018" },
  { key: "condition", label: "Состояние / Ремонт", placeholder: "Евроремонт / Дизайнерский / Черновая" },
  { key: "layout", label: "Планировка", placeholder: "Свободная / Раздельные комнаты / Студия" },
  { key: "bathroom", label: "Санузел", placeholder: "Раздельный / Совмещённый / 2 санузла" },
  { key: "balcony", label: "Балкон / Терраса", placeholder: "Балкон / Лоджия / Нет" },
  { key: "view", label: "Вид из окон", placeholder: "Двор / Улица / Парк / Река" },
  { key: "parking", label: "Парковка", placeholder: "Подземная / Наземная / Нет" },
  { key: "elevator", label: "Лифт", placeholder: "Есть / Нет / Грузовой" },
  { key: "housing_class", label: "Класс жилья", placeholder: "Эконом / Комфорт / Бизнес / Премиум" },
  { key: "utilities", label: "Коммунальные платежи", placeholder: "~8 000 ₽/мес" },
]

// ── Поля Жилой: Загородная (дом, коттедж, дача) ─────────────────────────────
const RESIDENTIAL_SUBURBAN_FIELDS = [
  { key: "land_area", label: "Площадь участка (сот.)", placeholder: "15" },
  { key: "floors_total", label: "Этажность дома", placeholder: "2" },
  { key: "build_year", label: "Год постройки", placeholder: "2015" },
  { key: "wall_material", label: "Материал стен", placeholder: "Кирпич / Брус / Газобетон / Каркас" },
  { key: "condition", label: "Состояние", placeholder: "Жилое / Требует ремонта / Строится" },
  { key: "heating", label: "Отопление", placeholder: "Газ / Электро / Дрова / Нет" },
  { key: "gas", label: "Газ", placeholder: "Подведён / По улице / Нет" },
  { key: "water", label: "Водоснабжение", placeholder: "Центральное / Скважина / Колодец" },
  { key: "sewage", label: "Канализация", placeholder: "Центральная / Септик / Нет" },
  { key: "electricity", label: "Электричество (кВт)", placeholder: "15 / 25 кВт" },
  { key: "distance_city", label: "Удалённость от города (км)", placeholder: "30" },
  { key: "road", label: "Дорога", placeholder: "Асфальт / Грунт / Круглогодичный доступ" },
  { key: "infrastructure", label: "Инфраструктура участка", placeholder: "Баня, гараж, бассейн" },
  { key: "parking", label: "Парковка / Гараж", placeholder: "Гараж / Навес / Открытая" },
  { key: "bathroom", label: "Санузлов", placeholder: "2" },
  { key: "housing_class", label: "Класс жилья", placeholder: "Эконом / Комфорт / Бизнес" },
]

// ── Поля Жилой: Премиум (пентхаус, вилла, особняк) ──────────────────────────
const RESIDENTIAL_PREMIUM_FIELDS = [
  { key: "rooms", label: "Количество комнат", placeholder: "5" },
  { key: "living_area", label: "Жилая площадь (м²)", placeholder: "300" },
  { key: "floor", label: "Этаж", placeholder: "25" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "30" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.5" },
  { key: "housing_class", label: "Класс жилья", placeholder: "Премиум / Элит / De Luxe" },
  { key: "condition", label: "Отделка", placeholder: "Дизайнерский ремонт / Под ключ / Авторский проект" },
  { key: "view", label: "Вид из окон", placeholder: "Панорама города / Река / Парк" },
  { key: "bathroom", label: "Санузлов", placeholder: "3" },
  { key: "balcony", label: "Терраса / Балкон", placeholder: "Панорамная терраса / Нет" },
  { key: "parking", label: "Парковка", placeholder: "2 машиноместа в подземном паркинге" },
  { key: "security", label: "Охрана / Безопасность", placeholder: "Консьерж 24/7 / Видеонаблюдение" },
  { key: "elevator", label: "Лифт", placeholder: "Лифт с выходом в квартиру" },
  { key: "building_type", label: "Тип здания", placeholder: "Монолит / Клубный дом / Исторический" },
  { key: "build_year", label: "Год постройки / Сдачи", placeholder: "2023" },
  { key: "concierge", label: "Консьерж-сервис", placeholder: "Есть / Нет" },
  { key: "utilities", label: "Коммунальные платежи", placeholder: "~50 000 ₽/мес" },
]

// ── Поля аренды для Жилой ───────────────────────────────────────────────────
export const RESIDENTIAL_RENT_FIELDS = [
  { key: "rooms", label: "Количество комнат", placeholder: "2" },
  { key: "floor", label: "Этаж", placeholder: "5" },
  { key: "floors_total", label: "Этажей в доме", placeholder: "16" },
  { key: "condition", label: "Состояние / Ремонт", placeholder: "Евроремонт / Дизайнерский / Стандарт" },
  { key: "furniture", label: "Мебель", placeholder: "Полностью / Частично / Без мебели" },
  { key: "appliances", label: "Техника", placeholder: "Вся / Частично / Нет" },
  { key: "bathroom", label: "Санузел", placeholder: "Раздельный / Совмещённый" },
  { key: "balcony", label: "Балкон / Лоджия", placeholder: "Есть / Нет" },
  { key: "parking", label: "Парковка", placeholder: "Есть / Нет" },
  { key: "elevator", label: "Лифт", placeholder: "Есть / Нет" },
  { key: "pets", label: "Животные", placeholder: "Можно / Нельзя" },
  { key: "children", label: "Дети", placeholder: "Можно / Нельзя" },
  { key: "deposit", label: "Залог (₽)", placeholder: "100 000" },
  { key: "utilities", label: "Коммунальные платежи", placeholder: "Включены / По счётчику / ~8 000 ₽" },
  { key: "lease_term", label: "Срок аренды", placeholder: "Длительная / Посуточно / От 3 мес." },
  { key: "check_in", label: "Условия заселения", placeholder: "С 14:00 / Обсуждается" },
]

// ── Поля Жилой (общий fallback) ──────────────────────────────────────────────
const RESIDENTIAL_FIELDS = RESIDENTIAL_URBAN_FIELDS

// ── Поля для Инвестиций: ГАБ / Арендный бизнес ──────────────────────────────
const INVESTMENT_FIELDS_GAB = [
  { key: "roi", label: "ROI (%)", placeholder: "10" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "8.5" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "10" },
  { key: "rent", label: "Арендный доход (₽/мес)", placeholder: "500 000" },
  { key: "encumbrance", label: "Арендатор / Договор", placeholder: "Сбербанк, договор до 2028" },
  { key: "lease_term", label: "Срок договора аренды", placeholder: "5 лет, остаток 3 года" },
  { key: "indexing", label: "Индексация аренды", placeholder: "5% в год / По CPI" },
  { key: "object_type", label: "Тип объекта", placeholder: "Торговое / Офисное / Склад" },
  { key: "condition", label: "Состояние объекта", placeholder: "Готово / Требует ремонта" },
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B" },
  { key: "encumbrance_risk", label: "Риски / Обременения", placeholder: "Нет / Залог банка" },
  { key: "strategy", label: "Стратегия выхода", placeholder: "Перепродажа / Удержание" },
]

// ── Поля для Инвестиций: Создание ГАБ ───────────────────────────────────────
const INVESTMENT_FIELDS_CREATE_GAB = [
  { key: "deal_stage", label: "Стадия сделки", placeholder: "LOI подписан / ПД подписан / Ищем покупателя" },
  { key: "tenant_interest", label: "Арендатор / Интересант", placeholder: "ООО Ромашка, торговля, ~150 м²" },
  { key: "pre_agreement", label: "Формат преддоговора", placeholder: "LOI / Предварительный договор / Намерение" },
  { key: "planned_rent", label: "Планируемая ставка аренды (₽/мес)", placeholder: "200 000" },
  { key: "roi", label: "Прогнозный ROI (%)", placeholder: "12" },
  { key: "yield", label: "Прогнозная доходность (%/год)", placeholder: "9" },
  { key: "deal_timeline", label: "Срок закрытия сделки", placeholder: "2–3 мес. / После ДКП" },
  { key: "dkp_terms", label: "Условия ДКП", placeholder: "Задаток 10%, расчёт при регистрации" },
  { key: "object_type", label: "Тип объекта", placeholder: "Торговое / Офисное / Склад" },
  { key: "condition", label: "Состояние объекта", placeholder: "Готово к въезду / Требует отделки" },
  { key: "legal_status", label: "Юридический статус", placeholder: "Собственность / Аренда / Иное" },
  { key: "encumbrance_risk", label: "Обременения / Риски", placeholder: "Нет / Залог банка" },
]

// ── Поля для Инвестиций: ГАБ Субаренда ──────────────────────────────────────
const INVESTMENT_FIELDS_SUBLEASE_GAB = [
  { key: "rent_base", label: "Основная ставка аренды (₽/мес)", placeholder: "100 000" },
  { key: "rent_sub", label: "Ставка субаренды (₽/мес)", placeholder: "150 000" },
  { key: "rent_spread", label: "Арендный спред / доход (₽/мес)", placeholder: "50 000 — рассчитывается автоматически" },
  { key: "lease_term_years", label: "Срок договора аренды (лет)", placeholder: "10" },
  { key: "lease_remaining", label: "Остаток срока (лет)", placeholder: "8" },
  { key: "sublease_right", label: "Право субаренды подтверждено", placeholder: "Да, в договоре / Есть доп. соглашение" },
  { key: "subtenant", label: "Субарендатор", placeholder: "ООО Ромашка / Ищем" },
  { key: "total_income", label: "Прогнозный доход за срок (₽)", placeholder: "6 000 000 (50 тыс × 12 × 10 лет)" },
  { key: "map_multiplier", label: "Множитель МАП (мес.)", placeholder: "12 / 18 / Другой" },
  { key: "asset_price", label: "Стоимость актива (₽)", placeholder: "600 000 (МАП × множитель)" },
  { key: "indexing", label: "Индексация аренды", placeholder: "5% в год / По CPI / Нет" },
  { key: "assignment_terms", label: "Условия переуступки прав", placeholder: "Согласие арендодателя / Уведомление" },
  { key: "encumbrance_risk", label: "Риски", placeholder: "Расторжение договора / Нет" },
]

// ── Поля для Инвестиций: Редевелопмент / Девелопмент ────────────────────────
const INVESTMENT_FIELDS_REDEVELOPMENT = [
  { key: "project_stage", label: "Стадия проекта", placeholder: "Концепция / Проект / Строительство" },
  { key: "build_potential", label: "Потенциал застройки (м²)", placeholder: "15 000" },
  { key: "yield", label: "Прогнозная доходность (%)", placeholder: "25" },
  { key: "payback", label: "Срок реализации (лет)", placeholder: "3" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "200 000 000" },
  { key: "revenue_model", label: "Модель монетизации", placeholder: "Продажа / Аренда / Смешанная" },
  { key: "tu", label: "Технические условия (ТУ)", placeholder: "Есть / Нет / В работе" },
  { key: "permits", label: "Разрешения / ГПЗУ", placeholder: "Есть / В работе / Нет" },
  { key: "urban_restrictions", label: "Ограничения застройки", placeholder: "ЗОУИТ, охранные зоны" },
  { key: "partner", label: "Партнёр / Девелопер", placeholder: "Есть / Ищем" },
  { key: "strategy", label: "Стратегия инвестирования", placeholder: "Fix & Flip / Долгосрочное удержание" },
]

// ── Поля: Земля под строительство МКД ───────────────────────────────────────
const INVESTMENT_FIELDS_LAND_MKD = [
  { key: "land_area", label: "Площадь участка (Га / сот.)", placeholder: "1.2 Га" },
  { key: "cadastral", label: "Кадастровый номер", placeholder: "77:01:0001234:567" },
  { key: "land_use", label: "Текущий ВРИ", placeholder: "Под жилую застройку / Смешанное" },
  { key: "gpzu", label: "ГПЗУ", placeholder: "Есть / В работе / Нет" },
  { key: "max_floors", label: "Разрешённая этажность", placeholder: "20 этажей" },
  { key: "build_potential", label: "Потенциал застройки (м²)", placeholder: "25 000" },
  { key: "planned_units", label: "Прогнозное кол-во квартир", placeholder: "300" },
  { key: "housing_class", label: "Класс жилья", placeholder: "Комфорт / Бизнес / Премиум" },
  { key: "rns", label: "Разрешение на строительство (РНС)", placeholder: "Есть / В работе / Нет" },
  { key: "tu", label: "Технические условия (ТУ)", placeholder: "Электро, газ, вода — есть" },
  { key: "strategy", label: "Инвестиционная стратегия", placeholder: "Девелопмент и продажа квартир / Продажа участка с ГПЗУ / Совместный девелопмент" },
  { key: "investment_horizon", label: "Горизонт инвестиции (лет)", placeholder: "3–5" },
  { key: "forecast_revenue", label: "Прогнозная выручка от реализации (₽)", placeholder: "1 500 000 000" },
  { key: "partner", label: "Партнёр-девелопер", placeholder: "Есть / Ищем" },
  { key: "urban_restrictions", label: "Ограничения / ЗОУИТ", placeholder: "Нет / Охранная зона" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "150 000 000" },
]

// ── Поля: Земля под застройку (коммерческую) ────────────────────────────────
const INVESTMENT_FIELDS_LAND_COMMERCIAL_BUILD = [
  { key: "land_area", label: "Площадь участка (Га / сот.)", placeholder: "0.5 Га" },
  { key: "cadastral", label: "Кадастровый номер", placeholder: "77:01:0001234:567" },
  { key: "land_use", label: "Текущий ВРИ", placeholder: "Коммерческое использование" },
  { key: "target_object", label: "Целевой объект застройки", placeholder: "БЦ / ТЦ / Склад / Производство / МФК" },
  { key: "build_potential", label: "Потенциал застройки (м²)", placeholder: "8 000" },
  { key: "gpzu", label: "ГПЗУ", placeholder: "Есть / В работе / Нет" },
  { key: "tu", label: "Технические условия (ТУ)", placeholder: "Электро 500кВт, газ — есть" },
  { key: "road", label: "Подъезд / Трафик", placeholder: "Первая линия / Асфальт / Фуры" },
  { key: "strategy", label: "Инвестиционная стратегия", placeholder: "Строительство и ГАБ / Строительство и продажа / Перепродажа с ГПЗУ" },
  { key: "investment_horizon", label: "Горизонт инвестиции (лет)", placeholder: "2–4" },
  { key: "forecast_revenue", label: "Прогнозная стоимость после застройки (₽)", placeholder: "500 000 000" },
  { key: "yield", label: "Прогнозная доходность (%)", placeholder: "25" },
  { key: "urban_restrictions", label: "Ограничения застройки", placeholder: "ЗОУИТ / Нет" },
  { key: "partner", label: "Партнёр / Девелопер", placeholder: "Есть / Ищем" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "80 000 000" },
]

// ── Поля: Земля под жилую застройку (ИЖС, деление) ──────────────────────────
const INVESTMENT_FIELDS_LAND_RESIDENTIAL = [
  { key: "land_area", label: "Площадь участка (Га / сот.)", placeholder: "5 Га" },
  { key: "cadastral", label: "Кадастровый номер", placeholder: "50:01:0001234:567" },
  { key: "land_category", label: "Категория земли", placeholder: "Земли населённых пунктов / С/Х назначения" },
  { key: "land_use", label: "Текущий ВРИ", placeholder: "ИЖС / ЛПХ / С/Х" },
  { key: "target_vri", label: "Целевой ВРИ", placeholder: "ИЖС / Малоэтажная застройка" },
  { key: "vri_change_stage", label: "Стадия изменения ВРИ / категории", placeholder: "Не начато / В работе / Завершено" },
  { key: "division_possible", label: "Возможность деления участка", placeholder: "Да, на 20 участков по 15 сот." },
  { key: "plots_count", label: "Кол-во участков после деления", placeholder: "20" },
  { key: "plot_area", label: "Площадь каждого участка (сот.)", placeholder: "15" },
  { key: "strategy", label: "Инвестиционная стратегия", placeholder: "Деление и продажа / Смена ВРИ и перепродажа / Строительство домов на продажу / Удержание" },
  { key: "forecast_revenue", label: "Прогнозная выручка (₽)", placeholder: "40 000 000 (20 участков × 2 млн)" },
  { key: "investment_horizon", label: "Горизонт инвестиции (лет)", placeholder: "1–3" },
  { key: "tu", label: "Коммуникации", placeholder: "Электро / Газ / Вода / Нет" },
  { key: "road", label: "Подъезд / Дорога", placeholder: "Асфальт до участка / Грунт" },
  { key: "distance_city", label: "Удалённость от города (км)", placeholder: "30" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "15 000 000" },
]

// ── Поля: Земля под коммерцию (аренда / продажа без застройки) ───────────────
const INVESTMENT_FIELDS_LAND_COMMERCIAL = [
  { key: "land_area", label: "Площадь участка (Га / сот.)", placeholder: "0.3 Га" },
  { key: "cadastral", label: "Кадастровый номер", placeholder: "77:01:0001234:567" },
  { key: "land_use", label: "Вид разрешённого использования", placeholder: "Торговля / Сервис / Смешанное" },
  { key: "road", label: "Расположение / Трафик", placeholder: "Первая линия шоссе / 5 000 авт/день" },
  { key: "visibility", label: "Видимость с дороги", placeholder: "Отличная / Хорошая / Ограниченная" },
  { key: "division_possible", label: "Возможность деления / аренды частями", placeholder: "Да, от 500 м² / Нет" },
  { key: "strategy", label: "Инвестиционная стратегия", placeholder: "Аренда участка / Строительство и ГАБ / Перепродажа / Смена ВРИ" },
  { key: "vri_change_stage", label: "Стадия изменения ВРИ", placeholder: "Не требуется / В работе / Завершено" },
  { key: "current_tenant", label: "Текущий арендатор", placeholder: "Свободно / АЗС / Стройрынок" },
  { key: "rent_potential", label: "Потенциальный арендный доход (₽/мес)", placeholder: "200 000" },
  { key: "yield", label: "Прогнозная доходность (%/год)", placeholder: "15" },
  { key: "investment_horizon", label: "Горизонт инвестиции (лет)", placeholder: "3–7" },
  { key: "tu", label: "Технические условия / Коммуникации", placeholder: "Электро есть / Газ по улице" },
  { key: "urban_restrictions", label: "Ограничения / Обременения", placeholder: "Нет / ЗОУИТ / Аренда" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "25 000 000" },
]

// ── Поля для Инвестиций: Специальные форматы ────────────────────────────────
const INVESTMENT_FIELDS_SPECIAL = [
  { key: "roi", label: "ROI (%)", placeholder: "15" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "12" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "7" },
  { key: "entry_price", label: "Цена входа (₽)", placeholder: "100 000 000" },
  { key: "share", label: "Доля / Объём сделки", placeholder: "25% / 100% / Пул" },
  { key: "object_type", label: "Тип актива", placeholder: "Портфель / Доля / ГАБ" },
  { key: "revenue_model", label: "Модель дохода", placeholder: "Аренда / Дивиденды / Прирост стоимости" },
  { key: "strategy", label: "Стратегия выхода", placeholder: "IPO / Перепродажа / Удержание" },
  { key: "encumbrance", label: "Обременения / Риски", placeholder: "Нет / Залог / Судебные споры" },
  { key: "partner", label: "Партнёр / Соинвестор", placeholder: "Ищем / Есть" },
]

// ── Поля для Инвестиций (общий fallback) ─────────────────────────────────────
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

// ── Расширенные поля офисной недвижимости ────────────────────────────────────
const COMMERCIAL_FIELDS_OFFICE_EXT = [
  { key: "class", label: "Класс офиса", placeholder: "A / B+ / B / C" },
  { key: "floor", label: "Этаж", placeholder: "5" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "16" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.0" },
  { key: "layout", label: "Планировка", placeholder: "Open space / Кабинетная / Смешанная" },
  { key: "workplaces", label: "Рабочих мест", placeholder: "30" },
  { key: "condition", label: "Состояние", placeholder: "С отделкой / Shell&Core / Под ключ" },
  { key: "furniture", label: "Мебель", placeholder: "Есть / Нет / Частично" },
  { key: "reception", label: "Ресепшн", placeholder: "Общий / Отдельный / Нет" },
  { key: "parking", label: "Парковка", placeholder: "30 м/м подземная" },
  { key: "access", label: "Доступ", placeholder: "Круглосуточный / Пн-Пт 9-18" },
  { key: "elevator", label: "Лифт", placeholder: "Есть / Нет / Грузовой" },
  { key: "power", label: "Электромощность (кВт)", placeholder: "50" },
  { key: "tenant", label: "Арендатор", placeholder: "Свободно / Действующий" },
]

// ── Расширенные поля торговой недвижимости ───────────────────────────────────
const COMMERCIAL_FIELDS_RETAIL_EXT = [
  { key: "floor", label: "Этаж", placeholder: "1 (первая линия)" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "4.5" },
  { key: "frontage", label: "Витрина (м)", placeholder: "12" },
  { key: "entrance", label: "Вход", placeholder: "Отдельный с улицы / Из ТЦ" },
  { key: "trade_area", label: "Площадь торгового зала (м²)", placeholder: "150" },
  { key: "traffic", label: "Трафик (чел/день)", placeholder: "5 000" },
  { key: "neighbors", label: "Соседние арендаторы", placeholder: "Магнит, Сбер, аптека" },
  { key: "zoning", label: "Зонирование", placeholder: "Торговый зал / Склад / Подсобка" },
  { key: "wet_point", label: "Мокрая точка", placeholder: "Есть / Нет" },
  { key: "condition", label: "Состояние", placeholder: "Готово к торговле / Требует отделки" },
  { key: "parking", label: "Парковка", placeholder: "Есть / Нет" },
  { key: "tenant", label: "Текущий арендатор", placeholder: "Свободно / Продуктовый ритейл" },
]

// ── Расширенные поля складской / производственной ────────────────────────────
const COMMERCIAL_FIELDS_WAREHOUSE_EXT = [
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "12" },
  { key: "gates", label: "Ворота", placeholder: "4 доктерных / Секционные" },
  { key: "ramp", label: "Пандус", placeholder: "Есть / Нет" },
  { key: "floor_load", label: "Нагрузка на пол (т/м²)", placeholder: "5" },
  { key: "temp_regime", label: "Температурный режим", placeholder: "Отапливаемый / Холодный / Заморозка" },
  { key: "power", label: "Электромощность (кВт)", placeholder: "200" },
  { key: "railway", label: "Ж/Д ветка", placeholder: "Есть / Нет" },
  { key: "truck_access", label: "Подъезд для фур", placeholder: "Да, 20-тонники / Нет" },
  { key: "class", label: "Класс склада", placeholder: "A / B+ / B / C" },
  { key: "gas", label: "Газ", placeholder: "Подведён / Нет" },
  { key: "parking", label: "Парковка фур", placeholder: "20 мест" },
  { key: "crane", label: "Кран-балка (т)", placeholder: "5 / Нет" },
]

// ── Поля сервиса и общепита ──────────────────────────────────────────────────
const COMMERCIAL_FIELDS_SERVICE = [
  { key: "floor", label: "Этаж", placeholder: "1" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.5" },
  { key: "entrance", label: "Вход", placeholder: "Отдельный с улицы / Из здания" },
  { key: "wet_point", label: "Мокрая точка", placeholder: "Есть / Нет" },
  { key: "ventilation", label: "Вытяжная вентиляция", placeholder: "Есть / Нет / Проект" },
  { key: "power", label: "Электромощность (кВт)", placeholder: "30" },
  { key: "condition", label: "Состояние", placeholder: "Готово / Требует ремонта / Под ключ" },
  { key: "traffic", label: "Трафик (чел/день)", placeholder: "3 000" },
  { key: "frontage", label: "Витрина (м)", placeholder: "8" },
  { key: "parking", label: "Парковка", placeholder: "Есть / Нет" },
  { key: "neighbors", label: "Окружение", placeholder: "Жилой дом / ТЦ / Офисный центр" },
  { key: "tenant", label: "Текущий арендатор", placeholder: "Свободно / Ресторан" },
]

// ── Поля аренды расширенные для Коммерции ────────────────────────────────────
export const COMMERCIAL_RENT_FIELDS_RETAIL = [
  { key: "floor", label: "Этаж", placeholder: "1" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "4.0" },
  { key: "rent_price_sqm", label: "Ставка аренды (₽/м²/мес)", placeholder: "3 000" },
  { key: "opex", label: "Коммунальные платежи", placeholder: "По счётчику / ~30 000 ₽" },
  { key: "deposit", label: "Залог (мес.)", placeholder: "2" },
  { key: "lease_term", label: "Минимальный срок аренды", placeholder: "11 мес. / 3 года" },
  { key: "frontage", label: "Витрина (м)", placeholder: "10" },
  { key: "entrance", label: "Вход", placeholder: "Отдельный / Из ТЦ" },
  { key: "wet_point", label: "Мокрая точка", placeholder: "Есть / Нет" },
  { key: "indexing", label: "Индексация", placeholder: "5% в год / По CPI" },
]

export const COMMERCIAL_RENT_FIELDS_WAREHOUSE = [
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "10" },
  { key: "rent_price_sqm", label: "Ставка аренды (₽/м²/мес)", placeholder: "800" },
  { key: "opex", label: "Эксплуатационные расходы (₽/м²)", placeholder: "150" },
  { key: "deposit", label: "Залог (мес.)", placeholder: "2" },
  { key: "lease_term", label: "Минимальный срок аренды", placeholder: "1 год / 3 года" },
  { key: "gates", label: "Ворота", placeholder: "4 доктерных" },
  { key: "ramp", label: "Пандус", placeholder: "Есть / Нет" },
  { key: "temp_regime", label: "Температурный режим", placeholder: "Отапливаемый / Холодный" },
  { key: "truck_access", label: "Подъезд для фур", placeholder: "Да / Нет" },
  { key: "indexing", label: "Индексация", placeholder: "5% в год" },
]

// ── Поля Торгов: Банкротство ─────────────────────────────────────────────────
const AUCTION_FIELDS_BANKRUPTCY = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "МЭТС / Торги.ру / Сбербанк-АСТ" },
  { key: "lot_number", label: "Номер лота", placeholder: "№ 12345-ЕФРСБ" },
  { key: "auction_date", label: "Дата аукциона", placeholder: "01.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "5 000 000" },
  { key: "deposit", label: "Задаток (₽)", placeholder: "500 000" },
  { key: "case_number", label: "Номер дела о банкротстве", placeholder: "А40-123456/2024" },
  { key: "arbitration_manager", label: "Арбитражный управляющий", placeholder: "Иванов И.И." },
  { key: "efrsb_link", label: "Ссылка на ЕФРСБ", placeholder: "https://fedresurs.ru/..." },
  { key: "bidding_step", label: "Шаг торгов", placeholder: "5% / 100 000 ₽" },
  { key: "object_condition", label: "Состояние объекта", placeholder: "Жилое / Требует ремонта" },
  { key: "encumbrance", label: "Обременения", placeholder: "Нет / Залог банка / Аренда" },
  { key: "documents", label: "Документы", placeholder: "Правоустанавливающие / Техплан" },
]

// ── Поля Торгов: Государственные / Муниципальные / РФФИ ──────────────────────
const AUCTION_FIELDS_STATE = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "РФФИ / Росимущество / ГИС Торги" },
  { key: "lot_number", label: "Номер лота / извещения", placeholder: "№ 270520241234" },
  { key: "auction_date", label: "Дата аукциона", placeholder: "15.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "8 000 000" },
  { key: "deposit", label: "Задаток (₽)", placeholder: "800 000" },
  { key: "organizer", label: "Организатор торгов", placeholder: "Росимущество / Администрация МО" },
  { key: "bidding_step", label: "Шаг аукциона", placeholder: "100 000 ₽ / 1%" },
  { key: "ownership", label: "Форма собственности", placeholder: "Федеральная / Муниципальная" },
  { key: "object_condition", label: "Состояние объекта", placeholder: "Действующее / Требует ремонта" },
  { key: "encumbrance", label: "Обременения", placeholder: "Нет / Аренда до 2027" },
  { key: "documents", label: "Документы", placeholder: "Выписка ЕГРН, техпаспорт" },
]

// ── Поля Торгов: Залоговое имущество ─────────────────────────────────────────
const AUCTION_FIELDS_PLEDGE = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "Сбербанк-АСТ / ВТБ / Альфа" },
  { key: "lot_number", label: "Номер лота", placeholder: "№ 2024-ЗАЛ-0042" },
  { key: "auction_date", label: "Дата реализации", placeholder: "20.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "12 000 000" },
  { key: "deposit", label: "Задаток (₽)", placeholder: "1 200 000" },
  { key: "pledgee", label: "Залогодержатель (банк)", placeholder: "Сбербанк / ВТБ / Газпромбанк" },
  { key: "pledge_agreement", label: "Договор залога", placeholder: "№ ДЗ-2021-001 от 01.01.2021" },
  { key: "bidding_step", label: "Шаг торгов", placeholder: "100 000 ₽" },
  { key: "object_condition", label: "Состояние объекта", placeholder: "Жилое / Коммерческое / Земля" },
  { key: "encumbrance", label: "Прочие обременения", placeholder: "Нет / Арест / Аренда" },
  { key: "documents", label: "Документы", placeholder: "Оценка, выписка ЕГРН" },
]

// ── Поля Торгов (общий fallback) ──────────────────────────────────────────────
const AUCTION_FIELDS = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "Торги.ру / МЭТС" },
  { key: "lot_number", label: "Номер лота", placeholder: "№ 12345" },
  { key: "auction_date", label: "Дата аукциона", placeholder: "01.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "5 000 000" },
  { key: "deposit", label: "Залог (₽)", placeholder: "500 000" },
  { key: "auction_subtype", label: "Тип торгов", placeholder: "Банкротство / Муниципальные" },
  { key: "bidding_step", label: "Шаг торгов", placeholder: "5% / 100 000 ₽" },
  { key: "encumbrance", label: "Обременения", placeholder: "Нет / Залог / Арест" },
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

// Коммерческие новостройки — офис/ритейл в БЦ
const NEWBUILD_COMMERCIAL_OFFICE_FIELDS = [
  { key: "complex", label: "Название БЦ / ЖК", placeholder: "БЦ Москва-Сити / ЖК Апрель" },
  { key: "developer", label: "Застройщик", placeholder: "ГК ПИК / Самолёт" },
  { key: "delivery", label: "Срок сдачи", placeholder: "Q3 2026" },
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B" },
  { key: "floor", label: "Этаж", placeholder: "5" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "25" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.2" },
  { key: "finishing", label: "Отделка", placeholder: "Чистовая / Shell&Core / Open Space" },
  { key: "parking", label: "Парковка", placeholder: "Подземная / Наземная" },
  { key: "mortgage", label: "Ипотека / Рассрочка", placeholder: "Есть / Нет / Условия" },
  { key: "chess", label: "Шахматка", placeholder: "Доступна" },
]

// Коммерческие новостройки — стрит-ритейл
const NEWBUILD_COMMERCIAL_RETAIL_FIELDS = [
  { key: "complex", label: "Название ЖК / БЦ", placeholder: "ЖК Парк Апрель" },
  { key: "developer", label: "Застройщик", placeholder: "ГК Самолёт" },
  { key: "delivery", label: "Срок сдачи", placeholder: "Q4 2026" },
  { key: "floor", label: "Этаж", placeholder: "1 (первая линия)" },
  { key: "frontage", label: "Витрина (м)", placeholder: "12" },
  { key: "entrance", label: "Вход", placeholder: "Отдельный с улицы" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "4.5" },
  { key: "traffic", label: "Трафик (чел/день)", placeholder: "5 000" },
  { key: "finishing", label: "Отделка", placeholder: "Без отделки / Белая коробка" },
  { key: "tenant", label: "Якорный арендатор", placeholder: "Свободно / Продуктовый ритейл" },
  { key: "mortgage", label: "Ипотека / Рассрочка", placeholder: "Есть / Нет / Условия" },
  { key: "chess", label: "Шахматка", placeholder: "Доступна" },
]

// Коммерческие новостройки — апарт-отель / ГАБ
const NEWBUILD_COMMERCIAL_APART_FIELDS = [
  { key: "complex", label: "Название комплекса", placeholder: "Апарт-отель Сочи Парк" },
  { key: "developer", label: "Застройщик", placeholder: "ГК Курорты России" },
  { key: "delivery", label: "Срок сдачи", placeholder: "Q2 2027" },
  { key: "units", label: "Юнитов в комплексе", placeholder: "120" },
  { key: "finishing", label: "Отделка", placeholder: "Чистовая с мебелью / Под ключ" },
  { key: "management_company", label: "Управляющая компания", placeholder: "Есть / Планируется" },
  { key: "yield", label: "Прогнозная доходность (%/год)", placeholder: "12" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "8" },
  { key: "mortgage", label: "Ипотека / Рассрочка", placeholder: "Есть / Нет / Условия" },
  { key: "chess", label: "Шахматка", placeholder: "Доступна" },
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

const RESIDENTIAL_SUBURBAN_SUBTYPES = ["Дом", "Коттедж", "Таунхаус", "Дуплекс", "Дача", "Частный дом", "Загородный дом", "Часть дома", "Участок под жилую застройку", "Малоэтажный жилой дом"]
const RESIDENTIAL_PREMIUM_SUBTYPES = ["Вилла", "Пентхаус", "Элитная квартира", "Премиум-жильё", "Резиденция", "Особняк"]

export function getCategoryFields(catId: string, subtype?: string) {
  if (catId === "residential") {
    if (!subtype) return RESIDENTIAL_URBAN_FIELDS
    if (RESIDENTIAL_SUBURBAN_SUBTYPES.includes(subtype)) return RESIDENTIAL_SUBURBAN_FIELDS
    if (RESIDENTIAL_PREMIUM_SUBTYPES.includes(subtype)) return RESIDENTIAL_PREMIUM_FIELDS
    return RESIDENTIAL_URBAN_FIELDS
  }
  if (catId === "investment") {
    if (!subtype) return INVESTMENT_FIELDS
    if (subtype === "ГАБ (готовый арендный бизнес)") return INVESTMENT_FIELDS_GAB
    if (subtype === "Создание ГАБ") return INVESTMENT_FIELDS_CREATE_GAB
    if (subtype === "ГАБ Субаренда") return INVESTMENT_FIELDS_SUBLEASE_GAB
    if (["Редевелопмент", "Девелоперский проект", "Реконструкция"].includes(subtype)) return INVESTMENT_FIELDS_REDEVELOPMENT
    if (subtype === "Земля под строительство МКД") return INVESTMENT_FIELDS_LAND_MKD
    if (subtype === "Земля под застройку (коммерция)") return INVESTMENT_FIELDS_LAND_COMMERCIAL_BUILD
    if (subtype === "Земля под жилую застройку") return INVESTMENT_FIELDS_LAND_RESIDENTIAL
    if (subtype === "Земля под коммерцию") return INVESTMENT_FIELDS_LAND_COMMERCIAL
    if (["Портфель объектов", "Доля в бизнесе / объекте", "Sale & Leaseback", "Объект под реализацию"].includes(subtype)) return INVESTMENT_FIELDS_SPECIAL
    return INVESTMENT_FIELDS
  }
  if (catId === "auction") {
    if (!subtype) return AUCTION_FIELDS
    if (["Банкротство физлица", "Банкротство юрлица", "Конкурсная масса"].includes(subtype)) return AUCTION_FIELDS_BANKRUPTCY
    if (["Муниципальные торги", "Государственный аукцион", "РФФИ", "Торги по 44-ФЗ / 223-ФЗ", "Приватизация", "Торги по исполнительному производству"].includes(subtype)) return AUCTION_FIELDS_STATE
    if (["Реализация залогов банка", "Имущество под обременением", "Арестованное имущество"].includes(subtype)) return AUCTION_FIELDS_PLEDGE
    return AUCTION_FIELDS
  }
  if (catId === "newbuild") {
    if (!subtype) return NEWBUILD_FIELDS
    if (subtype.includes("Офис")) return NEWBUILD_COMMERCIAL_OFFICE_FIELDS
    if (subtype.includes("Стрит") || subtype.includes("ритейл")) return NEWBUILD_COMMERCIAL_RETAIL_FIELDS
    if (subtype.includes("Апарт-отель") || subtype.includes("ГАБ")) return NEWBUILD_COMMERCIAL_APART_FIELDS
    return NEWBUILD_FIELDS
  }
  if (catId === "commercial") {
    if (!subtype) return COMMERCIAL_FIELDS_DEFAULT
    // Офисная группа
    if (["Бизнес-центр", "Офис", "Смарт-офис", "Сервисный офис", "Коворкинг", "Особняк"].includes(subtype)) return COMMERCIAL_FIELDS_OFFICE_EXT
    // Торговая группа
    if (["Торговое помещение", "Street retail", "Магазин", "ТЦ / Торговый центр", "Торговая галерея", "Шоурум"].includes(subtype)) return COMMERCIAL_FIELDS_RETAIL_EXT
    // Складская и производственная
    if (["Склад", "Логистический комплекс", "Производственное помещение", "Промышленная база", "Флекс-помещение", "Light industrial"].includes(subtype)) return COMMERCIAL_FIELDS_WAREHOUSE_EXT
    // Сервис и общепит
    if (["Ресторан", "Кафе", "Бар", "Салон красоты", "Медицинский центр", "Автосервис", "Автомойка"].includes(subtype)) return COMMERCIAL_FIELDS_SERVICE
    // Смешанные
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