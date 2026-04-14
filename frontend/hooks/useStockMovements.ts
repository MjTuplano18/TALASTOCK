'use client'

import { useState, useEffect, useCallback } from 'react'
import { getStockMovements } from '@/lib/supabase-queries'
import type { StockMovement } from '@/types'

export function useStockMovements(productId?: string) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStockMovements(productId)
      setMovements(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock movements'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  return { movements, loading, error, refetch: fetchMovements }
}
