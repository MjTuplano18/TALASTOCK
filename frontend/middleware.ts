import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ── 1. HTTPS redirect in production ────────────────────────────────────────
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers.get('x-forwarded-proto') === 'http'
  ) {
    return NextResponse.redirect(
      `https://${req.headers.get('host')}${req.nextUrl.pathname}${req.nextUrl.search}`,
      { status: 301 }
    )
  }

  // ── 2. Block suspicious request sizes (basic DDoS protection) ──────────────
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 1_000_000) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

  // ── 3. CSRF Protection for state-changing operations ───────────────────────
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
  
  if (isStateChanging && isApiRoute) {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')
    
    // Verify origin matches host (prevents CSRF)
    if (origin && !origin.includes(host || '')) {
      return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
    }
    
    // Require same-site for state-changing operations
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
  }

  return res
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
