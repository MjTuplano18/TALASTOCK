'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getSales, createSale as createSaleQuery } from '@/lib/supabase-queries'
import { getCached, setCached } from '@/lib/cache'
import type { Sale, SaleCreate } from '@/types'

const PAGE_SIZE = 20
const CACHE_KEY = 'sales'

export function useSales() {
  const [allSales, setAllSales] = useState<Sale[]>(() => getCached<Sale[]>(CACHE_KEY) ?? [])
  const [loading, setLoading] = useState(() => !getCached<Sale[]>(CACHE_KEY))
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchSales = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<Sale[]>(CACHE_KEY)
      if (cached) { setAllSales(cached); setLoading(false); return }
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getSales()
      setCached(CACHE_KEY, data)
      setAllSales(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sales'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const sales = allSales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(allSales.length / PAGE_SIZE))

  async function createSale(data: SaleCreate): Promise<Sale | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const sale = await createSaleQuery(data, session.user.id)
      const updated = [sale, ...allSales]
      setAllSales(updated)
      setCached(CACHE_KEY, updated)
      toast.success('Sale recorded')
      return sale
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record sale')
      return null
    }
  }

  return {
    sales,
    allSales,
    loading,
    error,
    page,
    totalPages,
    setPage,
    createSale,
    refetch: () => fetchSales(true),
  }
}
