/**
 * Service Worker Registration
 * Handles SW lifecycle and updates
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service worker registered:', registration.scope)

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          console.log('New service worker available')
          
          // Notify user about update
          if (window.confirm('A new version is available. Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          }
        }
      })
    })

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_QUEUE') {
        // Trigger queue processing
        const syncEvent = new CustomEvent('sw-sync-queue')
        window.dispatchEvent(syncEvent)
      }
    })

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed')
    })

    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const success = await registration.unregister()
      console.log('Service worker unregistered:', success)
      return success
    }
    return false
  } catch (error) {
    console.error('Service worker unregistration failed:', error)
    return false
  }
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return !!registration
  } catch {
    return false
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('All caches cleared')
  } catch (error) {
    console.error('Failed to clear caches:', error)
  }
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string = 'sync-queue'): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      await (registration as any).sync.register(tag)
      console.log('Background sync requested:', tag)
    }
  } catch (error) {
    console.error('Background sync request failed:', error)
  }
}
