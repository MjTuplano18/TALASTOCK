'use client'

import { useState, useMemo } from 'react'
import { Download, Package, TrendingUp, Eye } from 'lucide-react'
import { useSales } from '@/hooks/useSales'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { generateSalesReport, generateInventoryReport } from '@/lib/reports'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStockStatus } from '@/types'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { AiReportSummary } from '@/components/reports/AiReportSummary'

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
function ReportCard({ title, description, icon, children, onExport, exporting, exportLabel }: {
  title: string; description: string; icon: React.ReactNode
  children?: React.ReactNode
  onExport: () => void; exporting: boolean; exportLabel: string
}) {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F2C4B0]">
        <div className="w-9 h-9 rounded-xl bg-[#FDE8DF] flex items-center justify-center shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[#7A3E2E]">{title}</h3>
          <p className="text-xs text-[#B89080]">{description}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {children}

        <div className="flex gap-2 pt-1">
          {children && (
            <button
              onClick={() => setPreviewOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {previewOpen ? 'Hide Preview' : 'Preview'}
            </button>
          )}
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Generating PDF…' : exportLabel}
          </button>
        </div>

        {/* Preview panel */}
        {previewOpen && children && (
          <div className="border border-[#F2C4B0] rounded-xl overflow-hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { allSales } = useSales()
  const { inventory } = useRealtimeInventory()
  const { allProducts } = useProducts()
  const { categories } = useCategories()

  const [salesDateRange, setSalesDateRange] = useState<DateRange>({ from: null, to: null })
  const [exportingSales, setExportingSales] = useState(false)
  const [exportingInventory, setExportingInventory] = useState(false)

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

  const inventoryValue = filteredInventory.reduce((s, i) => s + i.quantity * (i.products?.cost_price ?? 0), 0)
  const lowStockCount = filteredInventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) !== 'in_stock').length
  const hasInvFilters = invStatusFilter || invCategoryFilter

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

  async function handleInventoryExport() {
    setExportingInventory(true)
    try {
      generateInventoryReport(filteredInventory)
    } finally {
      setExportingInventory(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-[#7A3E2E]">Reports</h1>

      {/* ── Report cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sales Report */}
        <ReportCard
          title="Sales Report"
          description="Detailed transaction history with product breakdown and revenue analysis"
          icon={<TrendingUp className="w-4 h-4 text-[#E8896A]" />}
          onExport={handleSalesExport}
          exporting={exportingSales}
          exportLabel={`Export Sales PDF (${filteredSales.length} transactions)`}
        >
          {/* Date filter */}
          <div>
            <label className="text-xs text-[#B89080] mb-1.5 block">Filter by date range</label>
            <DateRangePicker value={salesDateRange} onChange={setSalesDateRange} />
          </div>

          {/* Live summary */}
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

          {/* Preview table */}
          <div>
            <p className="text-xs text-[#B89080] mb-2">Preview (last 5)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-1.5 text-[#B89080] font-medium">Date</th>
                  <th className="text-left py-1.5 text-[#B89080] font-medium">Items</th>
                  <th className="text-right py-1.5 text-[#B89080] font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, 5).map(sale => (
                  <tr key={sale.id} className="border-b border-[#FDE8DF]">
                    <td className="py-1.5 text-[#B89080]">{formatDateTime(sale.created_at)}</td>
                    <td className="py-1.5 text-[#7A3E2E]">{sale.sale_items?.length ?? 0} item{(sale.sale_items?.length ?? 0) !== 1 ? 's' : ''}</td>
                    <td className="py-1.5 text-[#7A3E2E] font-medium text-right">{formatCurrency(sale.total_amount)}</td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr><td colSpan={3} className="py-3 text-center text-[#B89080]">No sales in selected range</td></tr>
                )}
              </tbody>
            </table>
            {filteredSales.length > 5 && (
              <p className="text-[10px] text-[#B89080] mt-1.5 text-center">+{filteredSales.length - 5} more in the PDF</p>
            )}
          </div>
        </ReportCard>

        {/* Inventory Report */}
        <ReportCard
          title="Inventory Report"
          description="Complete stock status with valuation, thresholds, and low stock alerts"
          icon={<Package className="w-4 h-4 text-[#E8896A]" />}
          onExport={handleInventoryExport}
          exporting={exportingInventory}
          exportLabel={`Export Inventory PDF (${filteredInventory.length} products${hasInvFilters ? ', filtered' : ''})`}
        >
          {/* Inventory filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-[#B89080] mb-1.5 block">Filter by status</label>
              <div className="w-full">
                <FilterSelect value={invStatusFilter} onChange={setInvStatusFilter}
                  placeholder="All Status"
                  options={[
                    { label: 'In Stock', value: 'in_stock' },
                    { label: 'Low Stock', value: 'low_stock' },
                    { label: 'Out of Stock', value: 'out_of_stock' },
                  ]} />
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-[#B89080] mb-1.5 block">Filter by category</label>
              <div className="w-full">
                <FilterSelect value={invCategoryFilter} onChange={setInvCategoryFilter}
                  placeholder="All Categories"
                  options={categories.map(c => ({ label: c.name, value: c.id }))} />
              </div>
            </div>
          </div>
          {hasInvFilters && (
            <button onClick={() => { setInvStatusFilter(''); setInvCategoryFilter('') }}
              className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline w-fit">
              Clear filters
            </button>
          )}

          {/* Live summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Products', value: filteredInventory.length },
              { label: 'Total Value', value: formatCurrency(inventoryValue) },
              { label: 'Low / Out of Stock', value: lowStockCount },
            ].map(s => (
              <div key={s.label} className="bg-[#FDF6F0] rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-[#B89080]">{s.label}</p>
                <p className="text-sm font-medium text-[#7A3E2E] mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div>
            <p className="text-xs text-[#B89080] mb-2">Preview (first 5)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-1.5 text-[#B89080] font-medium">Product</th>
                  <th className="text-left py-1.5 text-[#B89080] font-medium">Qty</th>
                  <th className="text-left py-1.5 text-[#B89080] font-medium">Status</th>
                  <th className="text-right py-1.5 text-[#B89080] font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.slice(0, 5).map(item => {
                  const status = getStockStatus(item.quantity, item.low_stock_threshold)
                  const value = item.quantity * (item.products?.cost_price ?? 0)
                  const statusColor = status === 'in_stock' ? 'text-[#C1614A]' : status === 'low_stock' ? 'text-[#E8896A]' : 'text-[#C05050]'
                  const statusLabel = status === 'in_stock' ? 'In Stock' : status === 'low_stock' ? 'Low Stock' : 'Out of Stock'
                  return (
                    <tr key={item.id} className="border-b border-[#FDE8DF]">
                      <td className="py-1.5 text-[#7A3E2E] truncate max-w-[100px]">{item.products?.name ?? '—'}</td>
                      <td className="py-1.5 text-[#7A3E2E]">{item.quantity}</td>
                      <td className={`py-1.5 font-medium ${statusColor}`}>{statusLabel}</td>
                      <td className="py-1.5 text-[#7A3E2E] text-right">{formatCurrency(value)}</td>
                    </tr>
                  )
                })}
                {filteredInventory.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-center text-[#B89080]">No items match your filters</td></tr>
                )}
              </tbody>
            </table>
            {filteredInventory.length > 5 && (
              <p className="text-[10px] text-[#B89080] mt-1.5 text-center">+{filteredInventory.length - 5} more in the PDF</p>
            )}
          </div>
        </ReportCard>
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
        topProducts={[]}
        recentSales={filteredSales.slice(0, 10)}
        salesChart={[]}
        inventory={filteredInventory}
        period={salesDateRange.from
          ? `${salesDateRange.from.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${(salesDateRange.to ?? new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
          : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      />

      {/* ── What's included note ── */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <h3 className="text-xs font-medium text-[#7A3E2E] mb-3">What&apos;s included in each report</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[#E8896A] mb-1.5">Sales Report PDF</p>
            <ul className="text-xs text-[#B89080] space-y-1">
              <li>• Executive summary with KPI boxes</li>
              <li>• Full transaction list with date, time, products, total</li>
              <li>• Product breakdown — units sold & revenue per product</li>
              <li>• Grand total and average order value</li>
              <li>• Branded header, footer with page numbers</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[#E8896A] mb-1.5">Inventory Report PDF</p>
            <ul className="text-xs text-[#B89080] space-y-1">
              <li>• KPI summary — total products, value, stock status counts</li>
              <li>• Full inventory table with SKU, quantity, threshold, status</li>
              <li>• Unit cost and total value per product</li>
              <li>• Total inventory value at cost</li>
              <li>• Landscape format for better readability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
