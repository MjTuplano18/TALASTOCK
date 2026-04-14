/**
 * Helper to call the AI API with the current user's auth token.
 * Ensures the auth guard in /api/ai works correctly.
 */
import { supabase } from './supabase'

export async function aiPost(body: Record<string, unknown>): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch('/api/ai', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}
