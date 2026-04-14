/**
 * Input validation and sanitization for AI requests.
 * Prevents prompt injection and quota abuse.
 */

const ALLOWED_TYPES = [
  'dashboard_insight',
  'reorder_suggestions',
  'report_summary',
  'anomaly_detection',
] as const

export type AIRequestType = typeof ALLOWED_TYPES[number]

const MAX_PROMPT_DATA_LENGTH = 2000

export function sanitizeForAI(input: string, maxLength = 500): string {
  return input
    .replace(/[<>{}[\]\\]/g, '')   // remove special chars that could inject
    .replace(/\n{3,}/g, '\n\n')    // limit newlines
    .replace(/ignore previous|ignore all|system prompt|you are now/gi, '[filtered]')
    .trim()
    .slice(0, maxLength)
}

export function validateAIRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const { type } = body as Record<string, unknown>

  if (!ALLOWED_TYPES.includes(type as AIRequestType)) {
    return { valid: false, error: 'Invalid AI request type' }
  }

  return { valid: true }
}

/**
 * Truncate data payload to prevent sending too many tokens.
 * Never send raw arrays — send summaries.
 */
export function truncatePayload(data: unknown): string {
  return JSON.stringify(data).slice(0, MAX_PROMPT_DATA_LENGTH)
}
