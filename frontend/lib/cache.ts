/**
 * Enhanced in-memory cache with per-entry TTL support.
 * Used for both data caching and AI response caching.
 */

export const CACHE_TTL = {
  // Data caches
  PRODUCTS:          30_000,   // 30 seconds
  CATEGORIES:        60_000,   // 1 minute
  SALES:             30_000,   // 30 seconds
  // AI response caches
  AI_INSIGHT:        5  * 60_000,  // 5 minutes
  REORDER_SUGGEST:   10 * 60_000,  // 10 minutes
  REPORT_SUMMARY:    30 * 60_000,  // 30 minutes
  ANOMALY_DETECT:    2  * 60_000,  // 2 minutes
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T, ttl = CACHE_TTL.PRODUCTS): void {
  store.set(key, { data, timestamp: Date.now(), ttl })
}

export function invalidateCache(key: string): void {
  store.delete(key)
}

export function invalidatePattern(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

export function invalidateAll(): void {
  store.clear()
}

/**
 * Fetch with cache — returns cached data if fresh, otherwise fetches and caches.
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL.PRODUCTS
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached !== null) return cached
  const data = await fetcher()
  setCached(key, data, ttl)
  return data
}
