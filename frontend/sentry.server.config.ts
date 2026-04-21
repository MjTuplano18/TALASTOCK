import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Remove passwords, tokens, API keys
          const sensitiveKeys = ['password', 'token', 'apiKey', 'api_key', 'authorization', 'secret']
          sensitiveKeys.forEach((key) => {
            if (breadcrumb.data && key in breadcrumb.data) {
              breadcrumb.data[key] = '[Filtered]'
            }
          })
        }
        return breadcrumb
      })
    }

    // Remove sensitive data from request
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }
      if (event.request.data) {
        const data = event.request.data as Record<string, any>
        const sensitiveKeys = ['password', 'token', 'apiKey', 'api_key', 'secret']
        sensitiveKeys.forEach((key) => {
          if (key in data) {
            data[key] = '[Filtered]'
          }
        })
      }
    }

    return event
  },

  // Ignore certain errors
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Aborted requests
    'AbortError',
    'The user aborted a request',
  ],
})
