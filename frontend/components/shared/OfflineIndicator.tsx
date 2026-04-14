'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi, Cloud, CloudOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { isOnline, setupOfflineListeners, processQueue, getQueueSize } from '@/lib/offline'
import { toast } from '@/lib/toast'

/**
 * Offline Indicator
 * Shows connection status and queued requests
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [queueSize, setQueueSize] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Initial state
    setOnline(isOnline())
    setQueueSize(getQueueSize())

    // Setup listeners
    const cleanup = setupOfflineListeners(
      // On online
      async () => {
        setOnline(true)
        const size = getQueueSize()
        
        if (size > 0) {
          setSyncing(true)
          toast.info(`Syncing ${size} queued ${size === 1 ? 'request' : 'requests'}...`)
          
          const result = await processQueue()
          setSyncing(false)
          setQueueSize(getQueueSize())
          
          if (result.success > 0) {
            toast.success(`Synced ${result.success} ${result.success === 1 ? 'request' : 'requests'}`)
          }
          if (result.failed > 0) {
            toast.error(`Failed to sync ${result.failed} ${result.failed === 1 ? 'request' : 'requests'}`)
          }
        } else {
          toast.success('Back online')
        }
      },
      // On offline
      () => {
        setOnline(false)
        toast.warning('You are offline. Changes will be synced when back online.')
      }
    )

    // Check queue size periodically
    const interval = setInterval(() => {
      setQueueSize(getQueueSize())
    }, 5000)

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [])

  // Don't show anything if online and no queue
  if (online && queueSize === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-[60] pointer-events-none"
      >
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border
            ${online 
              ? 'bg-white border-[#F2C4B0] text-[#7A3E2E]' 
              : 'bg-[#FDECEA] border-[#C05050] text-[#C05050]'
            }
          `}
          role="status"
          aria-live="polite"
        >
          {syncing ? (
            <>
              <Cloud className="w-4 h-4 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-medium">Syncing...</span>
            </>
          ) : online ? (
            <>
              <Wifi className="w-4 h-4 text-[#4CAF50]" aria-hidden="true" />
              <span className="text-xs font-medium">
                {queueSize} queued
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium">Offline</span>
              {queueSize > 0 && (
                <span className="text-xs">({queueSize} queued)</span>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
