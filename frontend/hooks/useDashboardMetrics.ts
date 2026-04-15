'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retry'
import { getCached, setCached } from '@/lib/cache'
import { useDateRangeQuery } from '@/context/DateRangeContext'
import {
  getDashboardMetrics,
  getSalesChartData,
  getTopProductsData,
  getRevenueChartData,
  getRecentSales,
  getCategoryPerformance,
  getDeadStock,
} from '@/lib/supabase-queries'
import type { DashboardMetrics, SalesChartData, TopProductData, RevenueChartData, Sale, CategoryPerformance, DeadStockItem } from '@/types'

export type DateRange = '7d' | '30d' | '3m' | '6m'

const DEFAULT_METRICS: DashboardMetrics = {
  total_products: 0,
  total_inventory_value: 0,
  total_sales_revenue: 0,
  low_stock_count: 0,
}

// Cache keys
const CACHE_KEYS = {
  metrics: 'dashboard_metrics',
  salesChart: (range: DateRange) => `dashboard_sales_${range}`,
  topProducts: 'dashboard_top_products',
  revenueChart: 'dashboard_revenue',
  recentSales: 'dashboard_recent_sales',
  categoryPerf: 'dashboard_category_perf',
  deadStock: 'dashboard_dead_stock',
}

export function useDashboardMetrics() {
  // Get date range from context
  const { startDate, endDate } = useDateRangeQuery()
  
  // Use ref to store latest date values without causing re-renders
  const dateRangeRef = useRef({ startDate, endDate })
  dateRangeRef.current = { startDate, endDate }
  
  // Initialize from cache if available
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => 
    getCached<DashboardMetrics>(CACHE_KEYS.metrics) ?? DEFAULT_METRICS
  )
  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>(() =>
    getCached<SalesChartData[]>(CACHE_KEYS.salesChart('7d')) ?? []
  )
  const [topProductsData, setTopProductsData] = useState<TopProductData[]>(() =>
    getCached<TopProductData[]>(CACHE_KEYS.topProducts) ?? []
  )
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>(() =>
    getCached<RevenueChartData[]>(CACHE_KEYS.revenueChart) ?? []
  )
  const [recentSales, setRecentSales] = useState<Sale[]>(() =>
    getCached<Sale[]>(CACHE_KEYS.recentSales) ?? []
  )
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>(() =>
    getCached<CategoryPerformance[]>(CACHE_KEYS.categoryPerf) ?? []
  )
  const [deadStock, setDeadStock] = useState<DeadStockItem[]>(() =>
    getCached<DeadStockItem[]>(CACHE_KEYS.deadStock) ?? []
  )
  
  const [loading, setLoading] = useState(false) // Start with false, let the effect handle it
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchAll = useCallback(async (range: DateRange = dateRange, force = false) => {
    // Get latest date values from ref
    const { startDate: currentStartDate, endDate: currentEndDate } = dateRangeRef.current
    
    // Check cache first unless forced
    if (!force && isInitialized) {
      const cachedMetrics = getCached<DashboardMetrics>(CACHE_KEYS.metrics)
      const cachedSales = getCached<SalesChartData[]>(CACHE_KEYS.salesChart(range))
      
      if (cachedMetrics && cachedSales) {
        // We have cached data, use it and skip loading
        return
      }
    }
    
    setLoading(true)
    setError(null)
    try {
      // Wrap all queries with retry logic - pass date range to queries
      const [m, sales, top, revenue, recent, catPerf, dead] = await Promise.all([
        withRetry(() => getDashboardMetrics(currentStartDate, currentEndDate), { maxRetries: 2 }),
        withRetry(() => getSalesChartData(range, currentStartDate, currentEndDate), { maxRetries: 2 }),
        withRetry(() => getTopProductsData(currentStartDate, currentEndDate), { maxRetries: 2 }),
        withRetry(() => getRevenueChartData(currentStartDate, currentEndDate), { maxRetries: 2 }),
        withRetry(() => getRecentSales(5, currentStartDate, currentEndDate), { maxRetries: 2 }),
        withRetry(() => getCategoryPerformance(currentStartDate, currentEndDate), { maxRetries: 2 }),
        withRetry(() => getDeadStock(currentStartDate, currentEndDate), { maxRetries: 2 }),
      ])
      
      // Update state
      setMetrics(m)
      setSalesChartData(sales)
      setTopProductsData(top)
      setRevenueChartData(revenue)
      setRecentSales(recent)
      setCategoryPerformance(catPerf)
      setDeadStock(dead)
      setLastUpdated(new Date())
      
      // Cache the results
      setCached(CACHE_KEYS.metrics, m)
      setCached(CACHE_KEYS.salesChart(range), sales)
      setCached(CACHE_KEYS.topProducts, top)
      setCached(CACHE_KEYS.revenueChart, revenue)
      setCached(CACHE_KEYS.recentSales, recent)
      setCached(CACHE_KEYS.categoryPerf, catPerf)
      setCached(CACHE_KEYS.deadStock, dead)
      
      setIsInitialized(true)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [dateRange, isInitialized]) // Only depend on dateRange, not startDate/endDate

  // Initial load and refetch when date range changes
  useEffect(() => {
    // Check if we have cached data
    const cachedMetrics = getCached<DashboardMetrics>(CACHE_KEYS.metrics)
    
    if (cachedMetrics && !isInitialized) {
      // We have cached data, use it immediately
      setIsInitialized(true)
      return
    }
    
    if (!isInitialized) {
      // First load - fetch data
      fetchAll(dateRange, false)
    } else {
      // Date changed - force refetch
      fetchAll(dateRange, true)
    }
  }, [startDate, endDate, dateRange]) // Remove fetchAll and isInitialized from deps

  // Realtime subscriptions with error handling
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchAll(dateRange, true).catch(err => console.error('Realtime refetch error:', err))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        fetchAll(dateRange, true).catch(err => console.error('Realtime refetch error:', err))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          console.error('Realtime subscription error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dateRange, fetchAll]) // fetchAll is now stable

  const refresh = useCallback(() => fetchAll(dateRange, true), [fetchAll, dateRange])

  return {
    metrics,
    salesChartData,
    topProductsData,
    revenueChartData,
    recentSales,
    categoryPerformance,
    deadStock,
    loading,
    error,
    lastUpdated,
    dateRange,
    setDateRange,
    refresh,
  }
}
