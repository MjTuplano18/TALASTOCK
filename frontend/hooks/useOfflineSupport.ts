'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/service-worker'
import { setupOfflineListeners, processQueue } from '@/lib/offline'

/**
 * Hook to initialize offline support
 * Registers service worker and sets up offline listeners
 */
export function useOfflineSupport() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker().then(registration => {
      if (registration) {
        console.log('Offline support enabled')
      }
    })

    // Setup offline listeners
    const cleanup = setupOfflineListeners()

    // Process queue on mount if online
    if (navigator.onLine) {
      processQueue()
    }

    // Listen for SW sync events
    const handleSyncQueue = () => {
      processQueue()
    }
    window.addEventListener('sw-sync-queue', handleSyncQueue)

    return () => {
      cleanup()
      window.removeEventListener('sw-sync-queue', handleSyncQueue)
    }
  }, [])
}
