import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
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

  // ── 4. Auth check ───────────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const protectedRoutes = ['/dashboard', '/products', '/inventory', '/sales', '/reports', '/categories']
  const isProtected = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
