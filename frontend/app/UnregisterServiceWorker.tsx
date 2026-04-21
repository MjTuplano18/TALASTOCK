'use client'

import { useEffect } from 'react'

/**
 * Component to unregister any existing service workers
 * This prevents redirect issues and clears old SW registrations
 */
export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log('Service worker unregistered')
          })
        }
      })
    }
  }, [])

  return null
}
