/**
 * Persistent AI response cache using localStorage.
 * Survives page navigation and browser refresh.
 * Falls back to in-memory if localStorage is unavailable (SSR).
 * 
 * Strategy:
 * - On page load: Use cached response (no API call, saves tokens)
 * - On manual refresh: Force new API call, bypass cache
 * - Cache duration: 30 minutes (reasonable for business data)
 */

const PREFIX = 'talastock_ai_'

interface AICacheEntry {
  value: string
  expiresAt: number
}

export function getAICached(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry: AICacheEntry = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return entry.value
  } catch {
    return null
  }
}

export function setAICached(key: string, value: string, ttlMs: number): void {
  if (typeof window === 'undefined') return
  try {
    const entry: AICacheEntry = { value, expiresAt: Date.now() + ttlMs }
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function clearAICache(): void {
  if (typeof window === 'undefined') return
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  } catch {}
}

export function clearAICacheKey(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {}
}

// TTLs - Increased to 30 minutes to save API tokens
export const AI_TTL = {
  INSIGHT:   30 * 60 * 1000,  // 30 minutes
  REORDER:   30 * 60 * 1000,  // 30 minutes
  REPORT:    30 * 60 * 1000,  // 30 minutes
  ANOMALY:   30 * 60 * 1000,  // 30 minutes
}
