export interface Owner {
  name: string
  phone: string
  company: string
  avatar_url: string
}

export interface ObjectDetailData {
  id: string
  user_id: string | null
  category: string
  type: string
  title: string
  city: string
  address: string
  price: string
  area: string
  description: string
  yield_percent: string
  extra_fields: Record<string, string>
  status: string
  published: boolean
  created_at: string
  photos: string[]
  owner?: Owner
  presentation_url?: string | null
}

export const FIELD_LABELS: Record<string, string> = {
  roi: "ROI",
  yield: "Доходность",
  payback: "Срок окупаемости",
  rent: "Арендный доход",
  strategy: "Стратегия",
  subtype: "Подтип",
  floor: "Этаж",
  floors_total: "Этажей в здании",
  ceiling: "Высота потолков",
  class: "Класс объекта",
  etp: "ЭТП",
  lot_number: "Номер лота",
  auction_date: "Дата аукциона",
  start_price: "Начальная цена",
  deposit: "Залог",
  complex: "ЖК",
  developer: "Застройщик",
  delivery: "Срок сдачи",
  corpus: "Корпус / секция",
  chess: "Шахматка",
  furniture: "Мебель",
  appliances: "Техника",
  pets: "Животные",
  lease_term: "Срок аренды",
  rent_price_sqm: "Ставка аренды",
  opex: "Эксплуатационные расходы",
  lease_from: "Аренда от",
  encumbrance: "Арендатор / обременение",
  deal_type: "",
  ownership: "Форма собственности",
  bidding_step: "Шаг торгов",
  documents: "Документы",
  land_area: "Площадь участка",
  building_year: "Год постройки",
  condition: "Состояние",
  entrance: "Вход",
  parking: "Парковка",
  vat: "НДС",
}