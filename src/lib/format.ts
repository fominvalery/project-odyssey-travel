const NUM_KEYS = new Set([
  "start_price", "deposit", "bidding_step", "price",
  "rent", "rent_price_sqm", "opex", "roi", "payback",
])

export function formatNumber(value: string | number): string {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."))
  if (isNaN(n) || n === 0) return String(value)
  return n.toLocaleString("ru-RU")
}

export function formatFieldValue(key: string, value: string): string {
  if (NUM_KEYS.has(key)) return formatNumber(value)
  return value
}

export function formatPrice(price: string): string {
  if (!price || price === "—" || price === "По запросу") return price
  const cleaned = price.replace(/\s/g, "").replace(",", ".")
  const n = Number(cleaned)
  if (isNaN(n) || n === 0) return price
  return n.toLocaleString("ru-RU")
}
