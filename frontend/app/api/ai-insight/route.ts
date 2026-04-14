// Redirect to the unified /api/ai route
import { NextRequest } from 'next/server'
import { POST as unifiedPOST } from '../ai/route'

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Forward to unified route with type
  const newReq = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ type: 'dashboard_insight', ...body }),
  })
  return unifiedPOST(new NextRequest(newReq))
}
