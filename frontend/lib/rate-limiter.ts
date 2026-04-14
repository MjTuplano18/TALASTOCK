/**
 * Per-user in-memory rate limiter.
 * Resets automatically per time window.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const LIMITS = {
  ai:      { max: 10, windowMs: 60_000 }, // 10 AI calls/min per user
  reports: { max: 5,  windowMs: 60_000 }, // 5 report exports/min
  general: { max: 100, windowMs: 60_000 },
}

export function checkRateLimit(
  key: string,
  type: keyof typeof LIMITS
): { allowed: boolean; retryAfter?: number } {
  const limit = LIMITS[type]
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit.max) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { allowed: true }
}
