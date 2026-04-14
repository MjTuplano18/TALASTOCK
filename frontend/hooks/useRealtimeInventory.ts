'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getInventory } from '@/lib/supabase-queries'
import type { InventoryItem } from '@/types'

export function useRealtimeInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getInventory()
      setInventory(data)
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
          fetchInventory()
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
