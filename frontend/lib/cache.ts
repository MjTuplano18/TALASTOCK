/**
 * Enhanced persistent cache with localStorage and per-entry TTL support.
 * Used for both data caching and AI response caching.
 * Persists across browser tabs and page refreshes.
 */

export const CACHE_TTL = {
  // Data caches
  PRODUCTS:          30_000,   // 30 seconds
  CATEGORIES:        60_000,   // 1 minute
  SALES:             30_000,   // 30 seconds
  DASHBOARD:         60_000,   // 1 minute - longer for dashboard data
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

const CACHE_PREFIX = 'talastock_cache_'

// Fallback in-memory store for when localStorage is not available
const memoryStore = new Map<string, CacheEntry<unknown>>()

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

function getFromStorage<T>(key: string): CacheEntry<T> | null {
  try {
    if (isLocalStorageAvailable()) {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      return item ? JSON.parse(item) : null
    } else {
      return memoryStore.get(key) as CacheEntry<T> | undefined || null
    }
  } catch {
    return null
  }
}

function setToStorage<T>(key: string, entry: CacheEntry<T>): void {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
    } else {
      memoryStore.set(key, entry)
    }
  } catch (error) {
    // If localStorage is full, clear old entries and try again
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearExpiredEntries()
      try {
        if (isLocalStorageAvailable()) {
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
        }
      } catch {
        // If still failing, use memory store as fallback
        memoryStore.set(key, entry)
      }
    }
  }
}

function removeFromStorage(key: string): void {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(CACHE_PREFIX + key)
    } else {
      memoryStore.delete(key)
    }
  } catch {
    // Ignore errors
  }
}

function clearExpiredEntries(): void {
  try {
    if (isLocalStorageAvailable()) {
      const now = Date.now()
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX)) {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '{}')
            if (now - entry.timestamp > entry.ttl) {
              keysToRemove.push(key)
            }
          } catch {
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } else {
      const now = Date.now()
      for (const [key, entry] of memoryStore.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          memoryStore.delete(key)
        }
      }
    }
  } catch {
    // Ignore errors
  }
}

export function getCached<T>(key: string): T | null {
  const entry = getFromStorage<T>(key)
  if (!entry) return null
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    removeFromStorage(key)
    return null
  }
  
  return entry.data
}

export function setCached<T>(key: string, data: T, ttl = CACHE_TTL.PRODUCTS): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }
  setToStorage(key, entry)
}

export function invalidateCache(key: string): void {
  removeFromStorage(key)
}

export function invalidatePattern(prefix: string): void {
  try {
    if (isLocalStorageAvailable()) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX + prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } else {
      for (const key of memoryStore.keys()) {
        if (key.startsWith(prefix)) memoryStore.delete(key)
      }
    }
  } catch {
    // Ignore errors
  }
}

export function invalidateAll(): void {
  try {
    if (isLocalStorageAvailable()) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } else {
      memoryStore.clear()
    }
  } catch {
    // Ignore errors
  }
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

// Clean up expired entries on module load
clearExpiredEntries()
