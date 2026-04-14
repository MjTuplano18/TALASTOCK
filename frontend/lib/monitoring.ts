/**
 * Error monitoring and structured logging.
 * 
 * To enable Sentry:
 * 1. npm install @sentry/nextjs
 * 2. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 3. Uncomment the Sentry imports below
 * 
 * For now, this provides a consistent logging interface
 * that can be swapped for Sentry without changing call sites.
 */

const isDev = process.env.NODE_ENV === 'development'
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

// ─── Structured logger ────────────────────────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  page?: string
  action?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    ...context,
  }

  if (isDev) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(`[${level.toUpperCase()}]`, message, context ?? '')
  }

  // In production, send to monitoring service
  // Sentry.captureMessage(message, { level, extra: context })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
}

export function captureError(error: unknown, context?: LogContext) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  log('error', message, { ...context, stack })

  // Sentry.captureException(error, { extra: context })
}

export function captureMessage(message: string, context?: LogContext) {
  log('warn', message, context)
  // Sentry.captureMessage(message, { extra: context })
}
