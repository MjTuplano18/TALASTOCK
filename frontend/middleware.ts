import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Simple passthrough - just let requests through
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match API routes for now
    '/api/:path*',
  ],
}
