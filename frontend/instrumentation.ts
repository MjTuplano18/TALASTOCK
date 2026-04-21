export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = async (err: Error, request: Request, context: any) => {
  // You can use context to add additional information to the error
  // For example, you can add the request URL
  console.error('Request error:', err, request.url)
}
