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

  async function bulkImportInventory(
    updates: Array<{
      productId: string
      quantity: number | null
      threshold: number | null
      price: number | null
      costPrice: number | null
      change: number
    }>,
    mode: 'replace' | 'add',
    filename: string
  ): Promise<{ imported: number; skipped: number }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      let imported = 0
      let skipped = 0

      // Process updates in batches
      for (const update of updates) {
        try {
          // Update inventory
          const inventoryUpdate: any = {
            updated_at: new Date().toISOString(),
          }

          if (update.quantity !== null) {
            inventoryUpdate.quantity = update.quantity
          }

          if (update.threshold !== null) {
            inventoryUpdate.low_stock_threshold = update.threshold
          }

          const { error: invError } = await supabase
            .from('inventory')
            .update(inventoryUpdate)
            .eq('product_id', update.productId)

          if (invError) throw invError

          // Update product price/cost_price if provided
          if (update.price !== null || update.costPrice !== null) {
            const productUpdate: any = {}
            if (update.price !== null) productUpdate.price = update.price
            if (update.costPrice !== null) productUpdate.cost_price = update.costPrice
            
            const { error: prodError } = await supabase
              .from('products')
              .update(productUpdate)
              .eq('id', update.productId)

            if (prodError) throw prodError
          }

          // Create stock movement record
          if (update.change !== 0) {
            const { error: movError } = await supabase
              .from('stock_movements')
              .insert({
                product_id: update.productId,
                type: 'import',
                quantity: update.change,
                note: `Import: ${filename} - ${mode} mode`,
                created_by: session.user.id,
              })

            if (movError) throw movError
          }

          imported++
        } catch (err) {
          console.error('Failed to import row:', err)
          skipped++
        }
      }

      await fetchInventory()
      return { imported, skipped }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Import failed')
    }
  }

  return { 
    inventory, 
    loading, 
    error, 
    adjustInventory, 
    bulkImportInventory,
    refetch: fetchInventory 
  }
}
