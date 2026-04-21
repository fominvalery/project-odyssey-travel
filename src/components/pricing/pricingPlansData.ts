import func2url from "../../../backend/func2url.json"

export const YOOKASSA_URL = (func2url as Record<string, string>)["yookassa-yookassa"]

export function getReturnUrl(): string {
  const origin = window.location.origin
  const base = origin.startsWith("http://") ? origin.replace("http://", "https://") : origin
  return `${base}/dashboard`
}

export const plans = [
  {
    id: "basic",
    icon: "Shield",
    name: "Базовый",
    desc: "Для работы",
    price: "Бесплатно",
    period: "",
    featured: false,
    comingSoon: false,
    features: [
      "3 объявления бесплатно каждый месяц",
      "Дополнительные объявления",
      "Профиль участника платформы",
      "Реферальная программа",
      "Маркетплейс",
      "Поддержка",
    ],
  },
  {
    id: "pro",
    icon: "Zap",
    name: "КЛУБ",
    desc: "Для максимальной пользы",
    price: "990 ₽",
    period: "/ мес",
    featured: true,
    badge: "Выгодный",
    comingSoon: false,
    features: [
      "Всё что в тарифе Базовый",
      "Размещение объявлений безлимитно",
      "CRM система",
      "Дашборд",
      "Аналитика",
      "Чат Клуба",
      "Партнёрские сделки",
    ],
  },
  {
    id: "business",
    icon: "Crown",
    name: "БИЗНЕС",
    desc: "Для масштабных задач Компании/Агентства",
    price: "14 900 ₽",
    period: "/ мес",
    featured: false,
    comingSoon: true,
    features: [
      "Всё что в тарифе Про",
      "ИИ-генерация лендингов и презентаций",
      "ИИ-генерация видео и постов для соцсетей",
      "Конструктор шахматки",
      "CRM с ИИ-агентами",
      "Приватные чаты с партнёрами",
      "Комнаты для сделок",
      "Хранение документов",
    ],
  },
]

export type Plan = typeof plans[0]

export const PRICE_PER_AD = 199
export const DISCOUNT_TIERS = [
  { from: 1,  to: 9,   discount: 0,   label: "1–9 объявлений" },
  { from: 10, to: 24,  discount: 10,  label: "10–24 объявления" },
  { from: 25, to: 49,  discount: 20,  label: "25–49 объявлений" },
  { from: 50, to: 100, discount: 30,  label: "50–100 объявлений" },
]

export function getDiscount(qty: number): number {
  const tier = DISCOUNT_TIERS.find((t) => qty >= t.from && qty <= t.to)
  return tier ? tier.discount : 30
}

export function calcPrice(qty: number): number {
  const discount = getDiscount(qty)
  return Math.round(qty * PRICE_PER_AD * (1 - discount / 100))
}