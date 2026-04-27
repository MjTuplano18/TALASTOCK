import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  return proxyRequest(request, params.path, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/')
  const url = `${API_URL}/api/v1/${path}`

  console.log(`[Proxy] ${method} ${url}`)

  // Forward all headers including Authorization
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    // Skip host header to avoid conflicts
    if (key.toLowerCase() !== 'host') {
      headers[key] = value
    }
  })

  try {
    const options: RequestInit = {
      method,
      headers,
    }

    // Include body for POST, PUT, DELETE
    if (method !== 'GET' && method !== 'HEAD') {
      const body = await request.text()
      if (body) {
        options.body = body
      }
    }

    const response = await fetch(url, options)
    const data = await response.text()

    console.log(`[Proxy] Response status: ${response.status}`)

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to proxy request', error: String(error) },
      { status: 500 }
    )
  }
}
