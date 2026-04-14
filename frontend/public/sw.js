// Service Worker for Talastock
// Provides offline support and caching

const CACHE_NAME = 'talastock-v1'
const RUNTIME_CACHE = 'talastock-runtime-v1'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/products',
  '/inventory',
  '/sales',
  '/categories',
  '/reports',
  '/offline',
]

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets')
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached
            }
            // Return offline page for API failures
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          })
        })
    )
    return
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached version and update in background
        fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, response)
              })
            }
          })
          .catch(() => {})
        return cached
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Network failed, return offline page
          return caches.match('/offline').then((offline) => {
            return offline || new Response('Offline', { status: 503 })
          })
        })
    })
  )
})

// Background sync event - sync queued requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      // Notify clients to process queue
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_QUEUE' })
        })
      })
    )
  }
})

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        )
      })
    )
  }
})

console.log('[SW] Service worker loaded')
