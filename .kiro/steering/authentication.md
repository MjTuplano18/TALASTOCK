# Authentication Standards

## Auth Provider
Talastock uses Supabase Auth exclusively.
Never build a custom auth system — Supabase handles tokens, sessions, and refresh.

## Auth Flow
```
User enters email/password
        ↓
Supabase Auth validates credentials
        ↓
Returns access_token + refresh_token
        ↓
Store tokens in httpOnly cookies (not localStorage)
        ↓
All API requests send Bearer token in Authorization header
        ↓
FastAPI verifies token with Supabase on every request
```

## Frontend Auth Setup
```typescript
// lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

// lib/auth.ts
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
```

## Route Protection (Next.js Middleware)
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const protectedRoutes = ['/dashboard', '/products', '/inventory', '/sales', '/reports']
  const isProtected = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}
```

## FastAPI Token Verification
```python
# backend/dependencies/auth.py
from fastapi import Depends, HTTPException, Header
from supabase import create_client
import os

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

async def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

## Security Rules
- Never store tokens in localStorage — use httpOnly cookies
- Never log tokens or passwords anywhere
- Always use HTTPS in production
- Session expiry: 1 hour access token, 7 days refresh token
- On logout, invalidate token server-side via Supabase

## User Roles (Future)
- `owner` — full access to everything
- `manager` — can edit inventory and sales, cannot delete
- `staff` — can only record sales and view stock

## What NOT to Do
- Never bypass auth middleware for "convenience"
- Never expose the Supabase service key to the frontend
- Never store passwords manually — Supabase handles this
- Never disable RLS (Row Level Security) on Supabase tables
