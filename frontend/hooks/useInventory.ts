'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getInventory, adjustInventory as adjustInventoryQuery } from '@/lib/supabase-queries'
import type { InventoryItem } from '@/types'

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [fetchInventory])

  async function adjustInventory(
    productId: string,
    quantity: number,
    note: string
  ): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      await adjustInventoryQuery(productId, quantity, note, session.user.id)
      await fetchInventory()
      toast.success('Inventory updated')
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update inventory')
      return false
    }
  }

  return { inventory, loading, error, adjustInventory, refetch: fetchInventory }
}
