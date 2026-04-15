'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, DollarSign, TrendingUp, AlertTriangle, RefreshCw, ShoppingCart, Download, BarChart2, Percent } from 'lucide-react'
import { useDashboardMetrics, type DateRange } from '@/hooks/useDashboardMetrics'
import { useProducts } from '@/hooks/useProducts'
import { useSales } from '@/hooks/useSales'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { MetricCard } from '@/components/shared/MetricCard'
import { MetricCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import { SalesChart } from '@/components/charts/SalesChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { RevenueRadial } from '@/components/dashboard/RevenueRadial'
import { AiInsightCard } from '@/components/dashboard/AiInsightCard'
import { SmartReorderCard } from '@/components/dashboard/SmartReorderCard'
import { AnomalyDetectionCard } from '@/components/dashboard/AnomalyDetectionCard'
import { DeadStockRecoveryCard } from '@/components/dashboard/DeadStockRecoveryCard'
import { CategoryPerformanceChart } from '@/components/dashboard/CategoryPerformanceChart'
import { DeadStockWidget } from '@/components/dashboard/DeadStockWidget'
import { SaleForm } from '@/components/forms/SaleForm'
import { exportDashboardPDF } from '@/lib/export-dashboard'
import { formatCurrency, cn } from '@/lib/utils'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'

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

export default function DashboardPage() {
  const router = useRouter()
  const [saleFormOpen, setSaleFormOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const {
    metrics, salesChartData, topProductsData, revenueChartData,
    recentSales, categoryPerformance, deadStock, loading, lastUpdated,
    dateRange, setDateRange, refresh,
  } = useDashboardMetrics()

  const { allProducts } = useProducts()
  const { createSale } = useSales()
  const { inventory } = useRealtimeInventory()

  async function handleExport() {
    setExporting(true)
    try {
      exportDashboardPDF(metrics, topProductsData, recentSales, salesChartData, categoryPerformance, deadStock)
    } finally {
      setExporting(false)
    }
  }

  const revenueChange = calcChange(metrics.total_sales_revenue, metrics.last_month_revenue)
  const grossMarginPct = metrics.total_sales_revenue > 0
    ? ((metrics.gross_profit ?? 0) / metrics.total_sales_revenue * 100).toFixed(1)
    : '0'

  return (
    <div className="flex flex-col gap-2 sm:gap-3">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-[#7A3E2E]">Dashboard</h1>
          {lastUpdated && (
            <span className="text-xs text-[#B89080] hidden lg:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8896A] animate-pulse"></span>
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter />
          <button onClick={() => router.push('/pos')}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs font-medium transition-colors whitespace-nowrap">
            <ShoppingCart className="w-3.5 h-3.5" />
            Quick POS
          </button>
          <button onClick={handleExport} disabled={exporting || loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 whitespace-nowrap">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 whitespace-nowrap">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => setSaleFormOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors whitespace-nowrap">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Record Sale</span>
          </button>
        </div>
      </div>

      {/* Low Stock Banner */}
      {!loading && metrics.low_stock_count > 0 && (
        <button onClick={() => router.push('/inventory')}
          className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#FDECEA] border border-[#F2C4B0] rounded-xl px-4 py-2.5 hover:bg-[#fde0dd] transition-colors group gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0" />
            <span className="text-sm text-[#C05050]">
              <span className="font-medium">{metrics.low_stock_count} {metrics.low_stock_count === 1 ? 'item needs' : 'items need'} restocking</span>
              <span className="text-[#B89080] ml-1 hidden sm:inline">— check your inventory</span>
            </span>
          </div>
          <span className="text-xs text-[#C05050] group-hover:underline shrink-0 ml-6 sm:ml-0">View now →</span>
        </button>
      )}

      {/* Row 1 — 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {loading ? (
          <>{[...Array(6)].map((_, i) => <MetricCardSkeleton key={i} />)}</>
        ) : (
          <>
            <MetricCard label="Total Products" value={metrics.total_products}
              icon={<Package className="w-4 h-4 text-[#E8896A]" />} />
            <MetricCard label="Inventory Value" value={formatCurrency(metrics.total_inventory_value)}
              icon={<DollarSign className="w-4 h-4 text-[#E8896A]" />} />
            <MetricCard label="Sales This Month" value={formatCurrency(metrics.total_sales_revenue)}
              icon={<TrendingUp className="w-4 h-4 text-[#E8896A]" />}
              change={revenueChange} />
            <MetricCard label="Gross Profit" value={formatCurrency(metrics.gross_profit ?? 0)}
              icon={<Percent className="w-4 h-4 text-[#E8896A]" />}
              sub={`${grossMarginPct}% margin`} />
            <MetricCard label="Avg Order Value" value={formatCurrency(metrics.avg_order_value ?? 0)}
              icon={<BarChart2 className="w-4 h-4 text-[#E8896A]" />}
              sub={`${metrics.total_sales_count ?? 0} orders`} />
            <MetricCard label="Low Stock Items" value={metrics.low_stock_count}
              icon={<AlertTriangle className="w-4 h-4 text-[#E8896A]" />}
              danger={metrics.low_stock_count > 0} />
          </>
        )}
      </div>

      {/* Row 2 — Sales Trend */}
      <ChartCard title="Sales Trend"
        action={
          <div className="flex items-center gap-0.5 bg-[#FDF6F0] rounded-lg p-0.5">
            {DATE_RANGE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setDateRange(opt.value)}
                className={cn('px-2 py-1 rounded-md text-xs transition-colors',
                  dateRange === opt.value ? 'bg-white text-[#7A3E2E] shadow-sm font-medium' : 'text-[#B89080] hover:text-[#7A3E2E]')}>
                {opt.label}
              </button>
            ))}
          </div>
        }>
        {loading ? <ChartSkeleton /> : <SalesChart data={salesChartData} />}
      </ChartCard>

      {/* Row 3 — Revenue Goal + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#F2C4B0] p-4 flex flex-col min-h-[250px]">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-3">Monthly Revenue Goal</h3>
          <div className="flex-1 flex items-center justify-center">
            <RevenueRadial current={metrics.total_sales_revenue} loading={loading} />
          </div>
        </div>
        <div className="lg:col-span-3">
          <ChartCard title="Top Products by Revenue">
            {loading ? <ChartSkeleton /> : <TopProductsChart data={topProductsData} />}
          </ChartCard>
        </div>
      </div>

      {/* Row 4 — Revenue 6 months + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="lg:col-span-3">
          <ChartCard title="Revenue (Last 6 Months)">
            {loading ? <ChartSkeleton /> : <RevenueChart data={revenueChartData} />}
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="Recent Transactions">
            <RecentTransactions sales={recentSales} loading={loading} />
          </ChartCard>
        </div>
      </div>

      {/* Row 5 — Category Performance + Dead Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        <ChartCard title="Sales by Category">
          {loading ? <ChartSkeleton /> : <CategoryPerformanceChart data={categoryPerformance} />}
        </ChartCard>
        <ChartCard title="Dead Stock Alert">
          <DeadStockWidget items={deadStock} loading={loading} />
        </ChartCard>
      </div>

      {/* Row 6 — AI Features (4 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
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

      <SaleForm open={saleFormOpen} onOpenChange={setSaleFormOpen} products={allProducts}
        onSubmit={async (data) => { await createSale(data); refresh() }} />
    </div>
  )
}
