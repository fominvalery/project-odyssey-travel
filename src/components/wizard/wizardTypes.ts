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
  published?: boolean
  photos?: string[]
  user_id?: string | null
  extra_fields?: Record<string, string>
}

export interface WizardForm {
  title: string
  city: string
  address: string
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

export const STEPS = ["Основное", "Характеристики", "Описание", "Презентация", "Публикация"]

export const CATEGORIES = [
  { id: "investment", label: "Инвестиции", desc: "ROI, доходность, стратегия", icon: "TrendingUp" },
  { id: "commercial", label: "Коммерция", desc: "Офисы, склады, ритейл", icon: "Building2" },
  { id: "auction", label: "Торги", desc: "Аукционы и банкротство", icon: "Gavel" },
  { id: "newbuild", label: "Новостройки", desc: "ЖК, шахматка, застройщик", icon: "Construction" },
]

const INVESTMENT_FIELDS = [
  { key: "roi", label: "ROI (%)", placeholder: "12" },
  { key: "yield", label: "Доходность (%/год)", placeholder: "8.5" },
  { key: "payback", label: "Срок окупаемости (лет)", placeholder: "7" },
  { key: "rent", label: "Арендный доход (₽/мес)", placeholder: "150 000" },
  { key: "strategy", label: "Стратегия инвестирования", placeholder: "Долгосрочная аренда" },
]

const COMMERCIAL_FIELDS = [
  { key: "subtype", label: "Подтип", placeholder: "Офис / Склад / Ритейл" },
  { key: "floor", label: "Этаж", placeholder: "3" },
  { key: "floors_total", label: "Этажей в здании", placeholder: "9" },
  { key: "ceiling", label: "Высота потолков (м)", placeholder: "3.2" },
  { key: "class", label: "Класс объекта", placeholder: "A / B+ / B" },
]

const AUCTION_FIELDS = [
  { key: "etp", label: "ЭТП (площадка)", placeholder: "Торги.ру / МЭТС" },
  { key: "lot_number", label: "Номер лота", placeholder: "№ 12345" },
  { key: "auction_date", label: "Дата аукциона", placeholder: "01.06.2026" },
  { key: "start_price", label: "Начальная цена (₽)", placeholder: "5 000 000" },
  { key: "deposit", label: "Залог (₽)", placeholder: "500 000" },
]

const NEWBUILD_FIELDS = [
  { key: "complex", label: "Название ЖК", placeholder: "Парк Апрель" },
  { key: "developer", label: "Застройщик", placeholder: "ГК Самолёт" },
  { key: "delivery", label: "Срок сдачи", placeholder: "Q3 2026" },
  { key: "corpus", label: "Корпус / Секция", placeholder: "К1, С2" },
  { key: "chess", label: "Шахматка", placeholder: "Доступна" },
]

export function getCategoryFields(catId: string) {
  if (catId === "investment") return INVESTMENT_FIELDS
  if (catId === "commercial") return COMMERCIAL_FIELDS
  if (catId === "auction") return AUCTION_FIELDS
  if (catId === "newbuild") return NEWBUILD_FIELDS
  return []
}