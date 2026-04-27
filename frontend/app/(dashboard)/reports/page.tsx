'use client'

import { useState, useMemo, useEffect } from 'react'
import { Download, Package, TrendingUp, DollarSign, CreditCard } from 'lucide-react'
import { useSales } from '@/hooks/useSales'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { generateSalesReport, generateInventoryReport, generateProfitLossReport } from '@/lib/reports'
import { exportSalesReportExcel, exportInventoryReportExcel, exportProfitLossReportExcel } from '@/lib/excel-export'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStockStatus } from '@/types'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { AiReportSummary } from '@/components/reports/AiReportSummary'
import { CustomerStatementReport } from '@/components/credit/reports/CustomerStatementReport'
import { AgingReport } from '@/components/credit/reports/AgingReport'
import { CreditSummaryReport } from '@/components/credit/reports/CreditSummaryReport'

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, icon, danger }: {
  label: string; value: string | number; sub?: string
  icon: React.ReactNode; danger?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[#B89080]">{label}</p>
        <p className={`text-lg font-medium leading-tight ${danger ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>{value}</p>
        {sub && <p className="text-[10px] text-[#B89080]">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Report card ──────────────────────────────────────────────────────────────
function ReportCard({ title, description, icon, summaryMetrics, filters, onExportPDF, onExportExcel, exporting, exportLabel }: {
  title: string; description: string; icon: React.ReactNode
  summaryMetrics: React.ReactNode
  filters?: React.ReactNode
  onExportPDF: () => void
  onExportExcel: () => void
  exporting: boolean
  exportLabel: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0]">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-[#F2C4B0]">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FDE8DF] flex items-center justify-center shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[#7A3E2E]">{title}</h3>
          <p className="text-xs text-[#B89080] leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 py-4 flex flex-col gap-3">
        {/* Filters */}
        {filters}

        {/* Summary Metrics */}
        {summaryMetrics}

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={onExportPDF}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Generating…' : `${exportLabel} (PDF)`}
          </button>
          <button
            onClick={onExportExcel}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Generating…' : `${exportLabel} (Excel)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { allSales, loading: salesLoading } = useSales()
  const { inventory, loading: inventoryLoading } = useRealtimeInventory()
  const { allProducts, loading: productsLoading } = useProducts()
  const { categories } = useCategories()

  // Tab state
  const [activeTab, setActiveTab] = useState<'sales' | 'credit'>('sales')
  const [activeCreditTab, setActiveCreditTab] = useState<'statement' | 'aging' | 'summary'>('statement')

  const [salesDateRange, setSalesDateRange] = useState<DateRange>({ from: null, to: null })
  const [exportingSales, setExportingSales] = useState(false)
  const [exportingInventory, setExportingInventory] = useState(false)
  const [exportingProfitLoss, setExportingProfitLoss] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Profit & Loss date range
  const [plDateRange, setPlDateRange] = useState<DateRange>({ from: null, to: null })

  // Inventory filters
  const [invStatusFilter, setInvStatusFilter] = useState('')
  const [invCategoryFilter, setInvCategoryFilter] = useState('')

  // Filtered sales for preview
  const filteredSales = useMemo(() => {
    return allSales.filter(sale => {
      if (salesDateRange.from) {
        const d = new Date(sale.created_at)
        if (d < salesDateRange.from) return false
        if (salesDateRange.to && d > salesDateRange.to) return false
      }
      return true
    })
  }, [allSales, salesDateRange])

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (invStatusFilter) {
        const status = getStockStatus(item.quantity, item.low_stock_threshold)
        if (status !== invStatusFilter) return false
      }
      if (invCategoryFilter) {
        const product = allProducts.find(p => p.id === item.product_id)
        if (product?.category_id !== invCategoryFilter) return false
      }
      return true
    })
  }, [inventory, invStatusFilter, invCategoryFilter, allProducts])

  const salesRevenue = filteredSales.reduce((s, sale) => s + sale.total_amount, 0)
  const salesAvgOrder = filteredSales.length > 0 ? salesRevenue / filteredSales.length : 0

  // Profit & Loss calculations
  const plFilteredSales = useMemo(() => {
    return allSales.filter(sale => {
      if (plDateRange.from) {
        const d = new Date(sale.created_at)
        if (d < plDateRange.from) return false
        if (plDateRange.to && d > plDateRange.to) return false
      }
      return true
    })
  }, [allSales, plDateRange])

  const plRevenue = plFilteredSales.reduce((s, sale) => s + sale.total_amount, 0)
  const plDiscounts = plFilteredSales.reduce((s, sale) => s + (sale.discount_amount ?? 0), 0)
  const plCOGS = plFilteredSales.reduce((s, sale) => {
    return s + (sale.sale_items?.reduce((itemSum, item) => {
      const costPrice = allProducts.find(p => p.id === item.product_id)?.cost_price ?? 0
      return itemSum + (item.quantity * costPrice)
    }, 0) ?? 0)
  }, 0)
  const plGrossProfit = plRevenue - plCOGS
  const plGrossMargin = plRevenue > 0 ? (plGrossProfit / plRevenue) * 100 : 0
  const plNetRevenue = plRevenue - plDiscounts
  const plNetProfit = plNetRevenue - plCOGS

  const inventoryValue = filteredInventory.reduce((s, i) => s + i.quantity * (i.products?.cost_price ?? 0), 0)
  const lowStockCount = filteredInventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) !== 'in_stock').length
  const hasInvFilters = invStatusFilter || invCategoryFilter

  // Calculate top products from sales
  const topProducts = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number; revenue: number; image_url?: string | null }>()
    
    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const product = allProducts.find(p => p.id === item.product_id)
        if (product) {
          const existing = productSales.get(item.product_id) || { 
            name: product.name, 
            quantity: 0, 
            revenue: 0,
            image_url: product.image_url 
          }
          existing.quantity += item.quantity
          existing.revenue += item.subtotal
          productSales.set(item.product_id, existing)
        }
      })
    })

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        product: p.name,
        sales: p.quantity,
        revenue: p.revenue,
        image_url: p.image_url
      }))
  }, [filteredSales, allProducts])

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-lg font-medium text-[#7A3E2E]">Reports</h1>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-[#F2C4B0] h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  async function handleSalesExport() {
    setExportingSales(true)
    try {
      const range = salesDateRange.from
        ? { from: salesDateRange.from.toISOString(), to: (salesDateRange.to ?? new Date()).toISOString() }
        : undefined
      generateSalesReport(filteredSales, range)
    } finally {
      setExportingSales(false)
    }
  }

  async function handleSalesExportExcel() {
    setExportingSales(true)
    try {
      exportSalesReportExcel({
        sales: filteredSales,
        products: allProducts,
        startDate: salesDateRange.from,
        endDate: salesDateRange.to,
      })
    } finally {
      setExportingSales(false)
    }
  }

  async function handleInventoryExport() {
    setExportingInventory(true)
    try {
      generateInventoryReport(filteredInventory)
    } finally {
      setExportingInventory(false)
    }
  }

  async function handleInventoryExportExcel() {
    setExportingInventory(true)
    try {
      exportInventoryReportExcel({
        inventory: filteredInventory,
        products: allProducts,
        sales: allSales,
      })
    } finally {
      setExportingInventory(false)
    }
  }

  async function handleProfitLossExport() {
    setExportingProfitLoss(true)
    try {
      const range = plDateRange.from
        ? { from: plDateRange.from.toISOString(), to: (plDateRange.to ?? new Date()).toISOString() }
        : undefined
      generateProfitLossReport(plFilteredSales, allProducts, range)
    } finally {
      setExportingProfitLoss(false)
    }
  }

  async function handleProfitLossExportExcel() {
    setExportingProfitLoss(true)
    try {
      exportProfitLossReportExcel({
        sales: plFilteredSales,
        products: allProducts,
        startDate: plDateRange.from,
        endDate: plDateRange.to,
      })
    } finally {
      setExportingProfitLoss(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#7A3E2E]">Reports</h1>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'sales'
              ? 'bg-[#E8896A] text-white'
              : 'text-[#7A3E2E] hover:bg-[#FDE8DF]'
          }`}
        >
          Sales Reports
        </button>
        <button
          onClick={() => setActiveTab('credit')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'credit'
              ? 'bg-[#E8896A] text-white'
              : 'text-[#7A3E2E] hover:bg-[#FDE8DF]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Credit Reports
        </button>
      </div>

      {/* ── Sales Reports Tab ── */}
      {activeTab === 'sales' && (
        <>
          {/* ── Report cards ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Sales Report */}
        <ReportCard
          title="Sales Report"
          description="Transaction history with payment methods and product breakdown"
          icon={<TrendingUp className="w-4 h-4 text-[#E8896A]" />}
          onExportPDF={handleSalesExport}
          onExportExcel={handleSalesExportExcel}
          exporting={exportingSales}
          exportLabel={`Export Sales`}
          filters={
            <div>
              <label className="text-xs text-[#B89080] mb-1.5 block">Date range</label>
              <DateRangePicker value={salesDateRange} onChange={setSalesDateRange} />
            </div>
          }
          summaryMetrics={
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Transactions', value: filteredSales.length },
                { label: 'Revenue', value: formatCurrency(salesRevenue) },
                { label: 'Avg Order', value: formatCurrency(salesAvgOrder) },
              ].map(s => (
                <div key={s.label} className="bg-[#FDF6F0] rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-[#B89080]">{s.label}</p>
                  <p className="text-sm font-medium text-[#7A3E2E] mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          }
        />

        {/* Inventory Report */}
        <ReportCard
          title="Inventory Report"
          description="Stock status with valuation and low stock alerts"
          icon={<Package className="w-4 h-4 text-[#E8896A]" />}
          onExportPDF={handleInventoryExport}
          onExportExcel={handleInventoryExportExcel}
          exporting={exportingInventory}
          exportLabel={`Export Inventory`}
          filters={
            <>
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-[#B89080] mb-1.5 block">Status</label>
                  <FilterSelect value={invStatusFilter} onChange={setInvStatusFilter}
                    placeholder="All Status"
                    options={[
                      { label: 'In Stock', value: 'in_stock' },
                      { label: 'Low Stock', value: 'low_stock' },
                      { label: 'Out of Stock', value: 'out_of_stock' },
                    ]} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-[#B89080] mb-1.5 block">Category</label>
                  <FilterSelect value={invCategoryFilter} onChange={setInvCategoryFilter}
                    placeholder="All Categories"
                    options={categories.map(c => ({ label: c.name, value: c.id }))} />
                </div>
              </div>
              {hasInvFilters && (
                <button onClick={() => { setInvStatusFilter(''); setInvCategoryFilter('') }}
                  className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline w-fit">
                  Clear filters
                </button>
              )}
            </>
          }
          summaryMetrics={
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Products', value: filteredInventory.length },
                { label: 'Total Value', value: formatCurrency(inventoryValue) },
                { label: 'Low / Out', value: lowStockCount, danger: lowStockCount > 0 },
              ].map(s => (
                <div key={s.label} className="bg-[#FDF6F0] rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-[#B89080]">{s.label}</p>
                  <p className={`text-sm font-medium mt-0.5 ${s.danger ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>{s.value}</p>
                </div>
              ))}
            </div>
          }
        />

        {/* Profit & Loss Report */}
        <ReportCard
          title="Profit & Loss Report"
          description="Financial performance with revenue, costs, and margins"
          icon={<DollarSign className="w-4 h-4 text-[#E8896A]" />}
          onExportPDF={handleProfitLossExport}
          onExportExcel={handleProfitLossExportExcel}
          exporting={exportingProfitLoss}
          exportLabel={`Export P&L`}
          filters={
            <div>
              <label className="text-xs text-[#B89080] mb-1.5 block">Date range</label>
              <DateRangePicker value={plDateRange} onChange={setPlDateRange} />
            </div>
          }
          summaryMetrics={
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Revenue', value: formatCurrency(plRevenue) },
                  { label: 'COGS', value: formatCurrency(plCOGS) },
                  { label: 'Gross Profit', value: formatCurrency(plGrossProfit), highlight: true },
                  { label: 'Margin', value: `${plGrossMargin.toFixed(1)}%`, highlight: true },
                ].map(s => (
                  <div key={s.label} className={`rounded-lg p-2.5 text-center ${s.highlight ? 'bg-[#FDE8DF]' : 'bg-[#FDF6F0]'}`}>
                    <p className="text-[10px] text-[#B89080]">{s.label}</p>
                    <p className={`text-sm font-medium mt-0.5 ${s.highlight ? 'text-[#E8896A]' : 'text-[#7A3E2E]'}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#FDF6F0] rounded-lg p-3 border border-[#F2C4B0]">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#7A3E2E]">Net Profit</span>
                  <span className="text-sm font-medium text-[#C1614A]">{formatCurrency(plNetProfit)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-[#B89080]">After {formatCurrency(plDiscounts)} discounts</span>
                  <span className="text-[10px] text-[#B89080]">{((plNetProfit / (plRevenue || 1)) * 100).toFixed(1)}% margin</span>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* ── AI Report Summary ── */}
      <AiReportSummary
        metrics={{
          total_products: allProducts.length,
          total_inventory_value: filteredInventory.reduce((s, i) => s + i.quantity * (i.products?.cost_price ?? 0), 0),
          total_sales_revenue: filteredSales.reduce((s, sale) => s + sale.total_amount, 0),
          low_stock_count: lowStockCount,
          total_sales_count: filteredSales.length,
        }}
        topProducts={topProducts}
        recentSales={filteredSales.slice(0, 10)}
        salesChart={[]}
        inventory={filteredInventory}
        period={salesDateRange.from
          ? `${salesDateRange.from.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${(salesDateRange.to ?? new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
          : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        loading={productsLoading || inventoryLoading || salesLoading}
      />

      {/* ── Export formats info ── */}
      <div className="bg-[#FDF6F0] rounded-xl border border-[#F2C4B0] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#F2C4B0] flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-medium text-[#7A3E2E] mb-2">Export Formats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#B89080]">
              <div>
                <p className="font-medium text-[#7A3E2E] mb-1">PDF Reports</p>
                <p>Professional formatted documents with branded headers, perfect for printing or sharing with accountants.</p>
              </div>
              <div>
                <p className="font-medium text-[#7A3E2E] mb-1">Excel Spreadsheets</p>
                <p>Multi-sheet workbooks with raw data, summaries, and breakdowns for further analysis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* ── Credit Reports Tab ── */}
      {activeTab === 'credit' && (
        <>
          {/* Credit Reports Sub-tabs */}
          <div className="bg-white rounded-xl border border-[#F2C4B0] p-1 flex gap-1">
            <button
              onClick={() => setActiveCreditTab('statement')}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeCreditTab === 'statement'
                  ? 'bg-[#FDE8DF] text-[#C1614A]'
                  : 'text-[#7A3E2E] hover:bg-[#FDF6F0]'
              }`}
            >
              Customer Statement
            </button>
            <button
              onClick={() => setActiveCreditTab('aging')}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeCreditTab === 'aging'
                  ? 'bg-[#FDE8DF] text-[#C1614A]'
                  : 'text-[#7A3E2E] hover:bg-[#FDF6F0]'
              }`}
            >
              Aging Report
            </button>
            <button
              onClick={() => setActiveCreditTab('summary')}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeCreditTab === 'summary'
                  ? 'bg-[#FDE8DF] text-[#C1614A]'
                  : 'text-[#7A3E2E] hover:bg-[#FDF6F0]'
              }`}
            >
              Credit Summary
            </button>
          </div>

          {/* Credit Report Content */}
          {activeCreditTab === 'statement' && <CustomerStatementReport />}
          {activeCreditTab === 'aging' && <AgingReport />}
          {activeCreditTab === 'summary' && <CreditSummaryReport />}
        </>
      )}
    </div>
  )
}
