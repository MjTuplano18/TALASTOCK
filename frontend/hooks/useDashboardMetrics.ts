'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { withRetry } from '@/lib/retry'
import { getCached, setCached, CACHE_TTL } from '@/lib/cache'
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
  
  // All refs must be declared first and consistently
  const dateRangeRef = useRef({ startDate, endDate })
  const lastRefreshRef = useRef<number>(0)
  const REFRESH_COOLDOWN = 2000 // 2 seconds cooldown between refreshes
  
  // All state must be declared consistently with hydration-safe initialization
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS)
  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([])
  const [topProductsData, setTopProductsData] = useState<TopProductData[]>([])
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])
  const [deadStock, setDeadStock] = useState<DeadStockItem[]>([])
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Update ref after state declarations
  dateRangeRef.current = { startDate, endDate }

  const fetchAll = useCallback(async (range: DateRange = dateRange, force = false) => {
    // Prevent rapid successive refreshes
    const now = Date.now()
    if (!force && (now - lastRefreshRef.current) < REFRESH_COOLDOWN) {
      return
    }
    
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
    
    lastRefreshRef.current = now
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
      
      // Cache the results with longer TTL for dashboard data
      setCached(CACHE_KEYS.metrics, m, CACHE_TTL.DASHBOARD)
      setCached(CACHE_KEYS.salesChart(range), sales, CACHE_TTL.DASHBOARD)
      setCached(CACHE_KEYS.topProducts, top, CACHE_TTL.DASHBOARD)
      setCached(CACHE_KEYS.revenueChart, revenue, CACHE_TTL.DASHBOARD)
      setCached(CACHE_KEYS.recentSales, recent, CACHE_TTL.DASHBOARD)
      setCached(CACHE_KEYS.categoryPerf, catPerf, CACHE_TTL.DASHBOARD)
      setCached(CACHE_KEYS.deadStock, dead, CACHE_TTL.DASHBOARD)
      
      setIsInitialized(true)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [dateRange, isInitialized])

  // Simplified initialization - just fetch data once on mount
  useEffect(() => {
    if (!isInitialized) {
      fetchAll(dateRange, false)
    }
  }, [fetchAll, dateRange, isInitialized])
  
  // Handle date changes after initialization
  useEffect(() => {
    if (isInitialized) {
      fetchAll(dateRange, true)
    }
  }, [startDate, endDate, fetchAll, isInitialized])

  // Realtime subscriptions with error handling and visibility control - DISABLED to prevent excessive refreshes
  useEffect(() => {
    // Temporarily disable realtime subscriptions to prevent dashboard refreshes
    // Users can manually refresh if needed
    return () => {
      // Cleanup function (empty for now)
    }
  }, [])

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
