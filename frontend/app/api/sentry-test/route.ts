import { NextResponse } from 'next/server'

export async function GET() {
  // This will trigger a Sentry error for testing
  throw new Error('Sentry Test Error - This is intentional for testing error tracking')
  
  return NextResponse.json({ message: 'This should not be reached' })
}
