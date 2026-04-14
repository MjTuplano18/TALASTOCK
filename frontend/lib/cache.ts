/**
 * Simple in-memory cache to avoid re-fetching on every navigation.
 * Data is considered fresh for 30 seconds.
 */

const CACHE_TTL = 30_000 // 30 seconds

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() })
}

export function invalidateCache(key: string): void {
  store.delete(key)
}

export function invalidateAll(): void {
  store.clear()
}

/**
 * Fetch with cache — returns cached data if fresh, otherwise fetches and caches.
 * Usage: const data = await getCachedOrFetch('products', () => getProducts())
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached !== null) return cached

  const data = await fetcher()
  setCached(key, data)
  return data
}
