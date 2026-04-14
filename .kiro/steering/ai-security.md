# API Security, Rate Limiting & Abuse Prevention

## Overview
Talastock uses AI features powered by Groq API. These are quota-limited APIs.
Abuse = quota exhaustion. Every AI endpoint must be protected. No exceptions.

## Environment Variables
- NEVER prefix AI keys with `NEXT_PUBLIC_` — that exposes them to the browser
- ALWAYS store keys in `.env.local` (frontend) or `.env` (backend) only
- NEVER commit `.env` files to git

```env
# frontend/.env.local
GROQ_API_KEY=gsk_xxxxxxxxxx          # NO NEXT_PUBLIC prefix
NEXT_PUBLIC_SUPABASE_URL=...         # public ok
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # public ok
```

## Rate Limiting
- Max 10 AI calls per minute per user
- Max 5 report exports per minute
- Use IP + user ID as rate limit key

## Caching TTLs
- AI Insight: 5 minutes
- Reorder Suggestions: 10 minutes
- Report Summary: 30 minutes
- Anomaly Detection: 2 minutes

## Retry Strategy
- Exponential backoff: 2s, 4s, 8s
- Max 3 retries on 429/503

## What NOT To Do
- NEVER call AI on page load automatically — only on user demand
- NEVER send entire product arrays to AI — send summaries only
- NEVER expose API keys with NEXT_PUBLIC prefix
- NEVER skip auth check on AI routes
- NEVER show raw API errors to the user
- NEVER call AI inside a loop
- NEVER disable caching in production
