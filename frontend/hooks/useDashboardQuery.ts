'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
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

export function useDashboardQuery(dateRange: DateRange = '7d') {
  const { startDate, endDate } = useDateRangeQuery()

  // Use React Query for all dashboard data
  const queries = useQueries({
    queries: [
      {
        queryKey: ['dashboard-metrics', startDate, endDate],
        queryFn: () => getDashboardMetrics(startDate, endDate),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ['sales-chart', dateRange, startDate, endDate],
        queryFn: () => getSalesChartData(dateRange, startDate, endDate),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['top-products', startDate, endDate],
        queryFn: () => getTopProductsData(startDate, endDate),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['revenue-chart', startDate, endDate],
        queryFn: () => getRevenueChartData(startDate, endDate),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['recent-sales', startDate, endDate],
        queryFn: () => getRecentSales(5, startDate, endDate),
        staleTime: 1 * 60 * 1000, // 1 minute for recent sales
        gcTime: 3 * 60 * 1000,
      },
      {
        queryKey: ['category-performance', startDate, endDate],
        queryFn: () => getCategoryPerformance(startDate, endDate),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['dead-stock', startDate, endDate],
        queryFn: () => getDeadStock(startDate, endDate),
        staleTime: 5 * 60 * 1000, // 5 minutes for dead stock
        gcTime: 10 * 60 * 1000,
      },
    ],
  })

  const [
    metricsQuery,
    salesChartQuery,
    topProductsQuery,
    revenueChartQuery,
    recentSalesQuery,
    categoryPerformanceQuery,
    deadStockQuery,
  ] = queries

  // Determine overall loading state
  const isLoading = queries.some(query => query.isLoading)
  const isError = queries.some(query => query.isError)
  const error = queries.find(query => query.error)?.error

  return {
    // Data with fallbacks
    metrics: metricsQuery.data ?? DEFAULT_METRICS,
    salesChartData: salesChartQuery.data ?? [],
    topProductsData: topProductsQuery.data ?? [],
    revenueChartData: revenueChartQuery.data ?? [],
    recentSales: recentSalesQuery.data ?? [],
    categoryPerformance: categoryPerformanceQuery.data ?? [],
    deadStock: deadStockQuery.data ?? [],
    
    // Loading states
    loading: isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Failed to load dashboard data') : null,
    
    // Individual query states for fine-grained control
    queries: {
      metrics: metricsQuery,
      salesChart: salesChartQuery,
      topProducts: topProductsQuery,
      revenueChart: revenueChartQuery,
      recentSales: recentSalesQuery,
      categoryPerformance: categoryPerformanceQuery,
      deadStock: deadStockQuery,
    },
    
    // Refresh function
    refresh: () => {
      queries.forEach(query => query.refetch())
    },
  }
}