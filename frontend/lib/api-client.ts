/**
 * Authenticated fetch wrapper for /api/v1 backend calls.
 * Automatically attaches the Supabase session token as Bearer.
 */
import { supabase } from './supabase'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
}
