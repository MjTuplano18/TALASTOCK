'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getCreditSales } from '@/lib/supabase-queries'
import { getCached, setCached } from '@/lib/cache'
import type { CreditSale } from '@/types'

const CACHE_KEY = 'credit_sales'

export function useCreditSales() {
  const [allCreditSales, setAllCreditSales] = useState<CreditSale[]>(() => getCached<CreditSale[]>(CACHE_KEY) ?? [])
  const [loading, setLoading] = useState(() => !getCached<CreditSale[]>(CACHE_KEY))
  const [error, setError] = useState<string | null>(null)

  const fetchCreditSales = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<CreditSale[]>(CACHE_KEY)
      if (cached) {
        setAllCreditSales(cached)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getCreditSales()
      setCached(CACHE_KEY, data)
      setAllCreditSales(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load credit sales'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCreditSales()
  }, [fetchCreditSales])

  return {
    allCreditSales,
    loading,
    error,
    refetch: () => fetchCreditSales(true),
  }
}
