interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage может быть заполнен — молча игнорируем
  }
}

export function cacheDel(key: string): void {
  localStorage.removeItem(key)
}

export const TTL = {
  MIN_5: 5 * 60 * 1000,
  MIN_30: 30 * 60 * 1000,
  HOUR_1: 60 * 60 * 1000,
}
