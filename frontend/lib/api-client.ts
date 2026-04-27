/**
 * Authenticated fetch wrapper for /api/v1 backend calls.
 * Automatically attaches the Supabase session token as Bearer.
 */
import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  // Construct full URL - if path starts with /api/v1, use it as-is, otherwise prepend base URL
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
}
