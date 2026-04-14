/**
 * Retry utility with exponential backoff
 * Useful for handling transient network failures
 */

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: Error) => boolean
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('500')
    )
  },
}

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: Error | null = null
  let delay = opts.initialDelay

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if this is the last attempt or if error is not retryable
      if (attempt === opts.maxRetries || !opts.shouldRetry(lastError)) {
        throw lastError
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay)

      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`)
    }
  }

  throw lastError
}

/**
 * Wrap a function to automatically retry on failure
 * @param fn - The async function to wrap
 * @param options - Retry configuration options
 * @returns A wrapped function that retries on failure
 */
export function retryable<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), options)
  }
}
