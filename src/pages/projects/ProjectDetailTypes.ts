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
])

export function formatPrice(p: number | null): string {
  if (!p) return "—"
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} млрд ₽`
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} млн ₽`
  return `${p.toLocaleString("ru")} ₽`
}
