export interface OfferDetail {
  id: string
  title: string
  category: string
  subtype?: string
  city?: string
  region?: string
  address?: string
  price?: number
  price_label?: string
  area?: number
  yield_percent?: number
  description?: string
  photos?: string[]
  videos?: string[]
  presentation_url?: string
  extra_fields?: Record<string, string>
  commission?: string
  commission_notes?: string
}

export const CAT_LABEL: Record<string, string> = {
  commercial: "Коммерческая",
  investment: "Инвестиционная",
  resort: "Курортная",
  auction: "Торги",
  residential: "Жилая",
  land: "Земля",
  parking: "Паркинги",
}

export const DEFAULT_IMG = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

// Ключи регламента и менеджера — не показываем в блоке «Характеристики»
export const REGULATION_KEYS = new Set([
  "commission", "commission_notes", "ad_rules", "work_rules",
  "manager_name", "manager_phone", "manager_email", "subtype", "deal_type",
  "price_label", "region", "developer_org_id", "developer_org_name",
  "related_project_id", "related_project_name",
])

export const FIELD_LABELS: Record<string, string> = {
  // Базовые
  floor: "Этаж", floors_total: "Этажей в здании", ceiling: "Высота потолков, м",
  rooms: "Комнат", living_area: "Жилая площадь, м²", land_area: "Площадь участка",
  build_year: "Год постройки", building_type: "Тип здания", condition: "Состояние",
  layout: "Планировка", bathroom: "Санузел", balcony: "Балкон", view: "Вид из окон",
  parking: "Парковка", elevator: "Лифт", housing_class: "Класс жилья",
  class: "Класс объекта", utilities: "Коммунальные платежи",
  wall_material: "Материал стен", heating: "Отопление", gas: "Газ",
  water: "Водоснабжение", sewage: "Канализация", electricity: "Электричество",
  security: "Охрана", concierge: "Консьерж", land_category: "Категория земли",
  cadastral: "Кадастровый номер", permits: "Разрешения", snp: "СНТ/КП",
  total_area: "Общая площадь, м²", management_company: "Управляющая компания",
  finishing: "Отделка", mortgage: "Ипотека", furniture: "Мебель",
  appliances: "Техника", pets: "Животные", children: "Дети",
  deposit: "Залог", lease_term: "Срок аренды", wifi: "WiFi",
  avg_check: "Средний чек", occupancy: "Загрузка, %",
  access: "Доступ", power: "Электромощность, кВт", tenant: "Арендатор",
  frontage: "Витрина, м", entrance: "Вход", traffic: "Трафик, чел/день",
  wet_point: "Мокрая точка", ventilation: "Вентиляция", gates: "Ворота",
  crane: "Кран-балка, т", floor_load: "Нагрузка на пол, т/м²",
  temp_regime: "Температурный режим", railway: "Ж/Д ветка",
  // ГАБ / Инвестиции
  yield: "Доходность, %/год", roi: "ROI, %", payback: "Срок окупаемости, лет",
  rent: "Арендный доход, ₽/мес", strategy: "Стратегия", encumbrance: "Обременения",
  indexing: "Индексация", lease_remaining: "Остаток срока, лет",
  rent_base: "Базовая ставка, ₽/мес", rent_sub: "Ставка субаренды, ₽/мес",
  rent_spread: "Арендный спред, ₽/мес", object_type: "Тип объекта",
  deal_stage: "Стадия сделки", planned_rent: "Планируемая аренда, ₽/мес",
  // Доли / Акции
  share_size: "Размер доли", min_investment: "Мин. взнос, ₽",
  total_value: "Оценка компании, ₽", entry_price: "Цена входа, ₽",
  business_type: "Сфера бизнеса", revenue: "Выручка, ₽/год",
  profit: "Чистая прибыль, ₽/год", dividend_yield: "Дивидендная доходность, %/год",
  payout_schedule: "График выплат", legal_form: "Правовая форма",
  co_owners: "Участники", exit_conditions: "Условия выхода",
  management: "Управление", documents_ready: "Документы",
  security_type: "Вид ЦБ", issuer: "Эмитент", total_securities: "Объём эмиссии",
  lot_size: "Размер лота", underlying_asset: "Базовый актив",
  liquidity: "Ликвидность", registration: "Регистрация",
  investment_horizon: "Горизонт инвестиции", loan_amount: "Сумма займа, ₽",
  interest_rate: "Процентная ставка, %/год", loan_term: "Срок займа, мес.",
  purpose: "Цель займа", collateral: "Обеспечение",
  collateral_value: "Стоимость залога, ₽", ltv: "LTV, %",
  borrower_type: "Заёмщик", repayment_type: "Тип погашения",
  total_payout: "Итого выплат, ₽", early_repayment: "Досрочное погашение",
  bond_type: "Тип облигации", total_issue: "Объём выпуска, ₽",
  nominal: "Номинал, ₽", coupon_rate: "Купонная ставка, %/год",
  maturity: "Срок обращения, лет", early_exit: "Досрочный выкуп",
  credit_rating: "Кредитный рейтинг", investors_needed: "Кол-во инвесторов",
  collected_now: "Уже собрано, ₽", target_raise: "Цель сбора, ₽",
  raise_deadline: "Срок сбора", revenue_model: "Модель дохода",
  // Новостройки
  complex: "ЖК / Комплекс", developer: "Застройщик", delivery: "Срок сдачи",
  corpus: "Корпус/секция", chess: "Шахматка", installment: "Рассрочка",
  // Торги
  etp: "ЭТП (площадка)", lot_number: "Номер лота", auction_date: "Дата аукциона",
  start_price: "Начальная цена, ₽", bidding_step: "Шаг торгов",
  // Прочее
  units: "Юнитов", season: "Сезонность", usage_format: "Формат использования",
}

export function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}