/**
 * Offline Support Utilities
 * Handles offline detection, queue management, and sync
 */

type QueuedRequest = {
  id: string
  url: string
  method: string
  body?: any
  timestamp: number
  retries: number
}

const QUEUE_KEY = 'offline_queue'
const MAX_RETRIES = 3

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Get queued requests from localStorage
 */
export function getQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const queue = localStorage.getItem(QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch {
    return []
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedRequest[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Failed to save offline queue:', error)
  }
}

/**
 * Add a request to the offline queue
 */
export function queueRequest(url: string, method: string, body?: any): void {
  const queue = getQueue()
  const request: QueuedRequest = {
    id: `${Date.now()}-${Math.random()}`,
    url,
    method,
    body,
    timestamp: Date.now(),
    retries: 0,
  }
  queue.push(request)
  saveQueue(queue)
}

/**
 * Remove a request from the queue
 */
function removeFromQueue(id: string): void {
  const queue = getQueue()
  const filtered = queue.filter(req => req.id !== id)
  saveQueue(filtered)
}

/**
 * Process the offline queue when back online
 */
export async function processQueue(): Promise<{
  success: number
  failed: number
}> {
  if (!isOnline()) {
    return { success: 0, failed: 0 }
  }

  const queue = getQueue()
  if (queue.length === 0) {
    return { success: 0, failed: 0 }
  }

  let success = 0
  let failed = 0

  for (const request of queue) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      })

      if (response.ok) {
        removeFromQueue(request.id)
        success++
      } else {
        // Increment retry count
        request.retries++
        if (request.retries >= MAX_RETRIES) {
          removeFromQueue(request.id)
          failed++
        } else {
          // Keep in queue for retry
          const queue = getQueue()
          const index = queue.findIndex(r => r.id === request.id)
          if (index !== -1) {
            queue[index] = request
            saveQueue(queue)
          }
        }
      }
    } catch (error) {
      console.error('Failed to process queued request:', error)
      request.retries++
      if (request.retries >= MAX_RETRIES) {
        removeFromQueue(request.id)
        failed++
      }
    }
  }

  return { success, failed }
}

/**
 * Clear the entire queue
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QUEUE_KEY)
}

/**
 * Get queue size
 */
export function getQueueSize(): number {
  return getQueue().length
}

/**
 * Setup online/offline event listeners
 */
export function setupOfflineListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => {
    console.log('Back online - processing queue')
    processQueue().then(result => {
      if (result.success > 0) {
        console.log(`Synced ${result.success} queued requests`)
      }
      if (result.failed > 0) {
        console.warn(`Failed to sync ${result.failed} requests`)
      }
    })
    onOnline?.()
  }

  const handleOffline = () => {
    console.log('Gone offline')
    onOffline?.()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
