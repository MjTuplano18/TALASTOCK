'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getDashboardMetrics,
  getSalesChartData,
  getTopProductsData,
  getRevenueChartData,
  getRecentSales,
} from '@/lib/supabase-queries'
import type { DashboardMetrics, SalesChartData, TopProductData, RevenueChartData, Sale } from '@/types'

export type DateRange = '7d' | '30d' | '3m' | '6m'

const DEFAULT_METRICS: DashboardMetrics = {
  total_products: 0,
  total_inventory_value: 0,
  total_sales_revenue: 0,
  low_stock_count: 0,
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS)
  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([])
  const [topProductsData, setTopProductsData] = useState<TopProductData[]>([])
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('7d')

  const fetchAll = useCallback(async (range: DateRange = dateRange) => {
    setLoading(true)
    setError(null)
    try {
      const [m, sales, top, revenue, recent] = await Promise.all([
        getDashboardMetrics(),
        getSalesChartData(range),
        getTopProductsData(),
        getRevenueChartData(),
        getRecentSales(5),
      ])
      setMetrics(m)
      setSalesChartData(sales)
      setTopProductsData(top)
      setRevenueChartData(revenue)
      setRecentSales(recent)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // Refetch when date range changes
  useEffect(() => {
    fetchAll(dateRange)
  }, [dateRange])

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => fetchAll(dateRange))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => fetchAll(dateRange))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll, dateRange])

  const refresh = useCallback(() => fetchAll(dateRange), [fetchAll, dateRange])

  return {
    metrics,
    salesChartData,
    topProductsData,
    revenueChartData,
    recentSales,
    loading,
    error,
    lastUpdated,
    dateRange,
    setDateRange,
    refresh,
  }
}
