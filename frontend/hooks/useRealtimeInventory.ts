'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getInventory } from '@/lib/supabase-queries'
import { getCached, setCached } from '@/lib/cache'
import type { InventoryItem } from '@/types'

const CACHE_KEY = 'inventory'

export function useRealtimeInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => 
    getCached<InventoryItem[]>(CACHE_KEY) ?? []
  )
  const [loading, setLoading] = useState(() => !getCached<InventoryItem[]>(CACHE_KEY))
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const fetchInventory = useCallback(async (force = false) => {
    // Check cache first unless forced
    if (!force) {
      const cached = getCached<InventoryItem[]>(CACHE_KEY)
      if (cached) {
        setInventory(cached)
        setLoading(false)
        return
      }
    }
    
    setLoading(true)
    setError(null)
    try {
      const data = await getInventory()
      setInventory(data)
      setCached(CACHE_KEY, data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()

    const channel = supabase
      .channel('inventory-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          fetchInventory(true) // Force refresh on realtime update
        }
      )
      .subscribe(status => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchInventory])

  return { inventory, loading, error, connected }
}
