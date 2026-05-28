export const CATEGORIES = [
  { id: "commercial",  label: "Коммерческая" },
  { id: "investment",  label: "Инвестиционная" },
  { id: "resort",      label: "Курортная" },
  { id: "auction",     label: "Торги" },
  { id: "residential", label: "Жилая" },
  { id: "land",        label: "Земля" },
  { id: "parking",     label: "Паркинги" },
]

export const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))

export const STATUS_OPTS = [
  { id: "active", label: "Активно" },
  { id: "hidden", label: "Скрыто" },
  { id: "sold",   label: "Продано" },
]

export const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10",
  hidden: "text-gray-400 bg-gray-500/10",
  sold:   "text-red-400 bg-red-500/10",
}

export interface Offer {
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
  status: string
  photos?: string[]
  videos?: string[]
  presentation_url?: string
  commission?: string
  commission_notes?: string
  extra_fields?: Record<string, string>
  created_at?: string
}

export const EMPTY_FORM = {
  title: "",
  category: "commercial",
  subtype: "",
  city: "",
  region: "",
  address: "",
  price: "",
  price_label: "",
  area: "",
  yield_percent: "",
  description: "",
  status: "active",
  photos: [] as string[],
  videos: [] as string[],
  presentation_url: "",
  commission: "",
  commission_notes: "",
}

export type OfferForm = typeof EMPTY_FORM

export function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}