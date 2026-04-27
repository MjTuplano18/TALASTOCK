'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Package, DollarSign, TrendingUp, AlertTriangle, RefreshCw, ShoppingCart, Download, Sparkles, Percent, BarChart2, Wallet } from 'lucide-react'
import { useDashboardQuery, type DateRange } from '@/hooks/useDashboardQuery'
import { useDateRangeQuery } from '@/context/DateRangeContext'
import { useProducts } from '@/hooks/useProducts'
import { useSales } from '@/hooks/useSales'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { HydrationSafeMetricCard } from '@/components/shared/HydrationSafeMetricCard'
import { MetricCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import { SalesChart } from '@/components/charts/SalesChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { PaymentMethodsChart } from '@/components/charts/PaymentMethodsChart'
import { CategoryPerformanceChart } from '@/components/dashboard/CategoryPerformanceChart'
import { RevenueRadial } from '@/components/dashboard/RevenueRadial'
import { AiInsightCard } from '@/components/dashboard/AiInsightCard'
import { SmartReorderCard } from '@/components/dashboard/SmartReorderCard'
import { AnomalyDetectionCard } from '@/components/dashboard/AnomalyDetectionCard'
import { DeadStockRecoveryCard } from '@/components/dashboard/DeadStockRecoveryCard'
import { CreditDashboardTab } from '@/components/credit/CreditDashboardTab'
import { RecordPaymentTrigger } from '@/components/credit/RecordPaymentTrigger'
import { SaleForm } from '@/components/forms/SaleForm'
import { exportDashboardPDF } from '@/lib/export-dashboard'
import { formatCurrency, cn } from '@/lib/utils'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { ErrorState } from '@/components/shared/ErrorState'

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '3m', value: '3m' },
  { label: '6m', value: '6m' },
]

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} mins ago`
  return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function calcChange(current: number, previous?: number): number | null {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous) * 100
}

type TabType = 'overview' | 'credit'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saleFormOpen, setSaleFormOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [paymentOpen, setPaymentOpen] = useState(false)
  
  // Tab state management with URL persistence
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab')
    return (tabParam === 'credit' ? 'credit' : 'overview') as TabType
  })

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
  }

  const { startDate, endDate } = useDateRangeQuery()

  const {
    metricsState, salesChartState, topProductsState, categoryPerformanceState,
    // Legacy data for backward compatibility
    metrics, salesChartData, topProductsData, revenueChartData,
    recentSales, categoryPerformance, deadStock, loading, error, refresh,
  } = useDashboardQuery(dateRange)

  const { allProducts } = useProducts()
  const { createSale, allSales } = useSales()
  const { inventory } = useRealtimeInventory()

  // Filter sales by date range for payment methods chart
  const filteredSales = useMemo(() => {
    if (!allSales || !startDate || !endDate) return []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return allSales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= start && saleDate <= end
    })
  }, [allSales, startDate, endDate])

  async function handleExport() {
    setExporting(true)
    try {
      exportDashboardPDF(metrics, topProductsData, recentSales, salesChartData, categoryPerformance, deadStock)
    } finally {
      setExporting(false)
    }
  }

  const revenueChange = calcChange(metrics.total_sales_revenue, metrics.last_month_revenue)

  // Memoize chart components with individual loading and error states
  const salesChart = useMemo(() => {
    if (salesChartState.isLoading) return <ChartSkeleton />
    if (salesChartState.isError) return <ErrorState compact onRetry={salesChartState.refetch} />
    return <SalesChart data={salesChartState.data} />
  }, [salesChartState.isLoading, salesChartState.isError, salesChartState.data, salesChartState.refetch])

  const topProductsChart = useMemo(() => {
    if (topProductsState.isLoading) return <ChartSkeleton />
    if (topProductsState.isError) return <ErrorState compact onRetry={topProductsState.refetch} />
    return <TopProductsChart data={topProductsState.data} />
  }, [topProductsState.isLoading, topProductsState.isError, topProductsState.data, topProductsState.refetch])

  const categoryChart = useMemo(() => {
    if (categoryPerformanceState.isLoading) return <ChartSkeleton />
    if (categoryPerformanceState.isError) return <ErrorState compact onRetry={categoryPerformanceState.refetch} />
    return <CategoryPerformanceChart data={categoryPerformanceState.data} />
  }, [categoryPerformanceState.isLoading, categoryPerformanceState.isError, categoryPerformanceState.data, categoryPerformanceState.refetch])

  const paymentChart = useMemo(() => (
    loading ? <ChartSkeleton /> : <PaymentMethodsChart data={filteredSales || []} />
  ), [loading, filteredSales])

  return (
    <div className="flex flex-col gap-2 sm:gap-3">

      {/* Header with Tabs */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[#7A3E2E]">Dashboard</h1>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeFilter />

            <button onClick={handleExport} disabled={exporting || loading}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 whitespace-nowrap">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Export PDF</span>
              <span className="lg:hidden">Export</span>
            </button>
            <button onClick={refresh} disabled={loading}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 whitespace-nowrap">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span className="hidden lg:inline">Refresh</span>
            </button>

            {activeTab === 'overview' && (
              <button onClick={() => setSaleFormOpen(true)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors whitespace-nowrap">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Record Sale</span>
                <span className="lg:hidden">Sale</span>
              </button>
            )}

            {activeTab === 'credit' && (
              <button onClick={() => setPaymentOpen(true)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors whitespace-nowrap">
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Record Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 border-b border-[#F2C4B0] overflow-x-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === 'overview'
                ? 'text-[#E8896A] border-b-2 border-[#E8896A]'
                : 'text-[#B89080] hover:text-[#7A3E2E]'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('credit')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === 'credit'
                ? 'text-[#E8896A] border-b-2 border-[#E8896A]'
                : 'text-[#B89080] hover:text-[#7A3E2E]'
            )}
          >
            Credit
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <OverviewTab
          metricsState={metricsState}
          salesChartState={salesChartState}
          topProductsState={topProductsState}
          categoryPerformanceState={categoryPerformanceState}
          metrics={metrics}
          salesChartData={salesChartData}
          topProductsData={topProductsData}
          revenueChartData={revenueChartData}
          recentSales={recentSales}
          categoryPerformance={categoryPerformance}
          deadStock={deadStock}
          loading={loading}
          error={error}
          refresh={refresh}
          router={router}
          inventory={inventory}
          filteredSales={filteredSales}
          salesChart={salesChart}
          topProductsChart={topProductsChart}
          categoryChart={categoryChart}
          paymentChart={paymentChart}
          revenueChange={revenueChange}
        />
      ) : (
        <CreditDashboardTab dateRange={dateRange} />
      )}

      <SaleForm open={saleFormOpen} onOpenChange={setSaleFormOpen} products={allProducts}
        onSubmit={async (data) => { await createSale(data); refresh() }} />

      <RecordPaymentTrigger
        customerId={null}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onSuccess={refresh}
      />
    </div>
  )
}

// Overview Tab Component
function OverviewTab({
  metricsState, salesChartState, topProductsState, categoryPerformanceState,
  metrics, salesChartData, topProductsData, revenueChartData,
  recentSales, categoryPerformance, deadStock, loading, error, refresh,
  router, inventory, filteredSales, salesChart, topProductsChart, categoryChart, paymentChart, revenueChange
}: any) {
  return (
    <>
      {/* Low Stock Banner */}
      {!metricsState.isLoading && !metricsState.isError && metricsState.data.low_stock_count > 0 && (
        <button onClick={() => router.push('/inventory')}
          className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#FDECEA] border border-[#F2C4B0] rounded-xl px-4 py-2.5 hover:bg-[#fde0dd] transition-colors group gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0" />
            <span className="text-sm text-[#C05050]">
              <span className="font-medium">{metricsState.data.low_stock_count} {metricsState.data.low_stock_count === 1 ? 'item needs' : 'items need'} restocking</span>
              <span className="text-[#B89080] ml-1 hidden sm:inline">— check your inventory</span>
            </span>
          </div>
          <span className="text-xs text-[#C05050] group-hover:underline shrink-0 ml-6 sm:ml-0">View now →</span>
        </button>
      )}

      {/* Row 1 — 6 Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        <HydrationSafeMetricCard 
          label="Total Products" 
          value={metricsState.isLoading ? 0 : metricsState.data.total_products}
          icon={<Package className="w-4 h-4 text-[#E8896A]" />} 
        />
        <HydrationSafeMetricCard 
          label="Inventory Value" 
          value={metricsState.isLoading ? formatCurrency(0) : formatCurrency(metricsState.data.total_inventory_value)}
          icon={<DollarSign className="w-4 h-4 text-[#E8896A]" />} 
        />
        <HydrationSafeMetricCard 
          label="Sales This Month" 
          value={metricsState.isLoading ? formatCurrency(0) : formatCurrency(metricsState.data.total_sales_revenue)}
          icon={<TrendingUp className="w-4 h-4 text-[#E8896A]" />}
          change={metricsState.isLoading ? null : revenueChange} 
        />
        <HydrationSafeMetricCard 
          label="Gross Profit" 
          value={metricsState.isLoading ? formatCurrency(0) : formatCurrency(metricsState.data.gross_profit ?? 0)}
          icon={<Percent className="w-4 h-4 text-[#E8896A]" />}
          sub={metricsState.isLoading ? '0% margin' : `${metricsState.data.total_sales_revenue > 0 ? ((metricsState.data.gross_profit ?? 0) / metricsState.data.total_sales_revenue * 100).toFixed(1) : '0'}% margin`} 
        />
        <HydrationSafeMetricCard 
          label="Avg Order Value" 
          value={metricsState.isLoading ? formatCurrency(0) : formatCurrency(metricsState.data.avg_order_value ?? 0)}
          icon={<BarChart2 className="w-4 h-4 text-[#E8896A]" />}
          sub={metricsState.isLoading ? '0 orders' : `${metricsState.data.total_sales_count ?? 0} orders`} 
        />
        <HydrationSafeMetricCard 
          label="Low Stock Items" 
          value={metricsState.isLoading ? 0 : metricsState.data.low_stock_count}
          icon={<AlertTriangle className="w-4 h-4 text-[#E8896A]" />}
          danger={!metricsState.isLoading && metricsState.data.low_stock_count > 0} 
        />
      </div>

      {/* Row 2 — Sales Trend (Hero Chart) */}
      <ChartCard title="Sales Trend">
        {salesChart}
      </ChartCard>

      {/* Row 3 — Revenue Goal + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4 flex flex-col min-h-[280px]">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-3">Monthly Revenue Goal</h3>
          <div className="flex-1 flex items-center justify-center">
            <RevenueRadial current={metrics.total_sales_revenue} loading={loading} />
          </div>
        </div>
        <ChartCard title="Top Products by Revenue">
          {topProductsChart}
        </ChartCard>
      </div>

      {/* Row 4 — Payment Methods + Category Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4 flex flex-col min-h-[280px]">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-3">Payment Methods</h3>
          <div className="flex-1 flex items-center justify-center">
            {paymentChart}
          </div>
        </div>
        <ChartCard title="Sales by Category">
          {categoryChart}
        </ChartCard>
      </div>

      {/* Row 5 — Smart Alert Card */}
      <div className="bg-gradient-to-br from-[#FDF6F0] to-white rounded-xl border border-[#F2C4B0] p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FDE8DF] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#E8896A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">Smart Business Insights</h3>
            <p className="text-xs text-[#B89080]">AI-powered alerts and recommendations for your business</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <AiInsightCard
            metrics={metrics}
            topProducts={topProductsData}
            recentSales={recentSales}
            salesChart={salesChartData}
            loading={loading}
          />
          <SmartReorderCard
            inventory={inventory}
            salesChart={salesChartData}
            topProducts={topProductsData}
            loading={loading}
          />
          <AnomalyDetectionCard
            salesChart={salesChartData}
            topProducts={topProductsData}
            inventory={inventory}
            loading={loading}
          />
          <DeadStockRecoveryCard
            deadStock={deadStock}
            topProducts={topProductsData}
            categoryPerformance={categoryPerformance}
            totalRevenue={metrics.total_sales_revenue}
            loading={loading}
          />
        </div>
      </div>
    </>
  )
}
