'use client'

import { useMemo } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Sale, PaymentMethod, DiscountType, ReportGrouping } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface SalesReportProps {
  sales: Sale[]
  startDate: Date | null
  endDate: Date | null
  grouping: ReportGrouping
}

interface PaymentMethodStat {
  method: PaymentMethod
  count: number
  total: number
  percentage: number
}

interface DiscountStat {
  type: DiscountType
  count: number
  total: number
}

interface ProductStat {
  product_id: string
  product_name: string
  sku: string
  quantity_sold: number
  revenue: number
  sales_count: number
}

interface TimeSeriesStat {
  period: string
  sales_count: number
  revenue: number
  avg_order_value: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Cash',
    card: 'Card',
    gcash: 'GCash',
    paymaya: 'PayMaya',
    bank_transfer: 'Bank Transfer',
  }
  return labels[method]
}

function getDiscountTypeLabel(type: DiscountType): string {
  const labels: Record<DiscountType, string> = {
    none: 'No Discount',
    percentage: 'Percentage',
    fixed: 'Fixed Amount',
    senior_pwd: 'Senior/PWD',
  }
  return labels[type]
}

function formatPeriod(date: Date, grouping: ReportGrouping): string {
  if (grouping === 'day') {
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } else if (grouping === 'week') {
    const weekEnd = new Date(date)
    weekEnd.setDate(date.getDate() + 6)
    return `${date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
  } else {
    return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesReport({ sales, startDate, endDate, grouping }: SalesReportProps) {
  // ─── Summary Metrics ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    return {
      totalSales,
      totalRevenue,
      avgOrderValue,
    }
  }, [sales])

  // ─── Payment Method Breakdown ───────────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const stats: Record<PaymentMethod, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      gcash: { count: 0, total: 0 },
      paymaya: { count: 0, total: 0 },
      bank_transfer: { count: 0, total: 0 },
    }

    sales.forEach(sale => {
      const method = sale.payment_method || 'cash'
      stats[method].count++
      stats[method].total += sale.total_amount
    })

    const result: PaymentMethodStat[] = Object.entries(stats).map(([method, data]) => ({
      method: method as PaymentMethod,
      count: data.count,
      total: data.total,
      percentage: summary.totalRevenue > 0 ? (data.total / summary.totalRevenue) * 100 : 0,
    }))

    return result.filter(stat => stat.count > 0).sort((a, b) => b.total - a.total)
  }, [sales, summary.totalRevenue])

  // ─── Discount Breakdown ─────────────────────────────────────────────────────
  const discountBreakdown = useMemo(() => {
    const stats: Record<DiscountType, { count: number; total: number }> = {
      none: { count: 0, total: 0 },
      percentage: { count: 0, total: 0 },
      fixed: { count: 0, total: 0 },
      senior_pwd: { count: 0, total: 0 },
    }

    let totalDiscounts = 0

    sales.forEach(sale => {
      const type = sale.discount_type || 'none'
      const amount = sale.discount_amount || 0
      stats[type].count++
      stats[type].total += amount
      totalDiscounts += amount
    })

    const result: DiscountStat[] = Object.entries(stats).map(([type, data]) => ({
      type: type as DiscountType,
      count: data.count,
      total: data.total,
    }))

    const percentageOfRevenue = summary.totalRevenue > 0 
      ? (totalDiscounts / (summary.totalRevenue + totalDiscounts)) * 100 
      : 0

    return {
      stats: result.filter(stat => stat.count > 0).sort((a, b) => b.total - a.total),
      totalDiscounts,
      percentageOfRevenue,
    }
  }, [sales, summary.totalRevenue])

  // ─── Top Products by Revenue ────────────────────────────────────────────────
  const topProductsByRevenue = useMemo(() => {
    const productMap: Record<string, ProductStat> = {}

    sales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const productId = item.product_id
        const productName = item.products?.name || 'Unknown Product'
        const sku = item.products?.sku || 'N/A'
        const revenue = item.subtotal

        if (!productMap[productId]) {
          productMap[productId] = {
            product_id: productId,
            product_name: productName,
            sku,
            quantity_sold: 0,
            revenue: 0,
            sales_count: 0,
          }
        }

        productMap[productId].quantity_sold += item.quantity
        productMap[productId].revenue += revenue
        productMap[productId].sales_count++
      })
    })

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [sales])

  // ─── Top Products by Quantity ───────────────────────────────────────────────
  const topProductsByQuantity = useMemo(() => {
    const productMap: Record<string, ProductStat> = {}

    sales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const productId = item.product_id
        const productName = item.products?.name || 'Unknown Product'
        const sku = item.products?.sku || 'N/A'
        const revenue = item.subtotal

        if (!productMap[productId]) {
          productMap[productId] = {
            product_id: productId,
            product_name: productName,
            sku,
            quantity_sold: 0,
            revenue: 0,
            sales_count: 0,
          }
        }

        productMap[productId].quantity_sold += item.quantity
        productMap[productId].revenue += revenue
        productMap[productId].sales_count++
      })
    })

    return Object.values(productMap)
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 10)
  }, [sales])

  // ─── Sales Over Time (Grouped) ──────────────────────────────────────────────
  const salesOverTime = useMemo(() => {
    if (!startDate || !endDate) return []

    const timeSeriesMap: Record<string, TimeSeriesStat> = {}

    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at)
      let periodKey: string
      let periodLabel: string

      if (grouping === 'day') {
        periodKey = saleDate.toISOString().split('T')[0]
        periodLabel = formatPeriod(saleDate, 'day')
      } else if (grouping === 'week') {
        const weekStart = getWeekStart(saleDate)
        periodKey = weekStart.toISOString().split('T')[0]
        periodLabel = formatPeriod(weekStart, 'week')
      } else {
        const monthStart = getMonthStart(saleDate)
        periodKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
        periodLabel = formatPeriod(monthStart, 'month')
      }

      if (!timeSeriesMap[periodKey]) {
        timeSeriesMap[periodKey] = {
          period: periodLabel,
          sales_count: 0,
          revenue: 0,
          avg_order_value: 0,
        }
      }

      timeSeriesMap[periodKey].sales_count++
      timeSeriesMap[periodKey].revenue += sale.total_amount
    })

    // Calculate average order value for each period
    Object.values(timeSeriesMap).forEach(stat => {
      stat.avg_order_value = stat.sales_count > 0 ? stat.revenue / stat.sales_count : 0
    })

    return Object.values(timeSeriesMap).sort((a, b) => a.period.localeCompare(b.period))
  }, [sales, startDate, endDate, grouping])

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-8 text-center">
        <p className="text-sm text-[#B89080]">No sales data available for the selected date range.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Metrics */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#FDF6F0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Sales</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{summary.totalSales}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Revenue</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Avg Order Value</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{formatCurrency(summary.avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Payment Method Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-2 text-[#B89080] font-medium">Payment Method</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Count</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Total Amount</th>
                <th className="text-right py-2 text-[#B89080] font-medium">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {paymentBreakdown.map(stat => (
                <tr key={stat.method} className="border-b border-[#FDE8DF]">
                  <td className="py-2 text-[#7A3E2E]">{getPaymentMethodLabel(stat.method)}</td>
                  <td className="py-2 text-[#7A3E2E] text-right">{stat.count}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(stat.total)}</td>
                  <td className="py-2 text-[#7A3E2E] text-right">{stat.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Breakdown */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Discount Breakdown</h3>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#7A3E2E]">Total Discounts Given</span>
            <span className="text-sm font-medium text-[#E8896A]">{formatCurrency(discountBreakdown.totalDiscounts)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#B89080]">Percentage of Gross Revenue</span>
            <span className="text-xs text-[#B89080]">{discountBreakdown.percentageOfRevenue.toFixed(1)}%</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-2 text-[#B89080] font-medium">Discount Type</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Count</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {discountBreakdown.stats.map(stat => (
                <tr key={stat.type} className="border-b border-[#FDE8DF]">
                  <td className="py-2 text-[#7A3E2E]">{getDiscountTypeLabel(stat.type)}</td>
                  <td className="py-2 text-[#7A3E2E] text-right">{stat.count}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(stat.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Products by Revenue */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Top 10 Products by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-2 text-[#B89080] font-medium">Rank</th>
                <th className="text-left py-2 text-[#B89080] font-medium">Product</th>
                <th className="text-left py-2 text-[#B89080] font-medium">SKU</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Qty Sold</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProductsByRevenue.map((product, index) => (
                <tr key={product.product_id} className="border-b border-[#FDE8DF]">
                  <td className="py-2 text-[#B89080]">#{index + 1}</td>
                  <td className="py-2 text-[#7A3E2E]">{product.product_name}</td>
                  <td className="py-2 text-[#B89080]">{product.sku}</td>
                  <td className="py-2 text-[#7A3E2E] text-right">{product.quantity_sold}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
              {topProductsByRevenue.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#B89080]">No product data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Products by Quantity */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Top 10 Products by Quantity Sold</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-2 text-[#B89080] font-medium">Rank</th>
                <th className="text-left py-2 text-[#B89080] font-medium">Product</th>
                <th className="text-left py-2 text-[#B89080] font-medium">SKU</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Qty Sold</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProductsByQuantity.map((product, index) => (
                <tr key={product.product_id} className="border-b border-[#FDE8DF]">
                  <td className="py-2 text-[#B89080]">#{index + 1}</td>
                  <td className="py-2 text-[#7A3E2E]">{product.product_name}</td>
                  <td className="py-2 text-[#B89080]">{product.sku}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{product.quantity_sold}</td>
                  <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
              {topProductsByQuantity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#B89080]">No product data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Over Time */}
      {salesOverTime.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">
            Sales Over Time (Grouped by {grouping === 'day' ? 'Day' : grouping === 'week' ? 'Week' : 'Month'})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-2 text-[#B89080] font-medium">Period</th>
                  <th className="text-right py-2 text-[#B89080] font-medium"># of Sales</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Revenue</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {salesOverTime.map(stat => (
                  <tr key={stat.period} className="border-b border-[#FDE8DF]">
                    <td className="py-2 text-[#7A3E2E]">{stat.period}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{stat.sales_count}</td>
                    <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(stat.revenue)}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(stat.avg_order_value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#F2C4B0] bg-[#FDF6F0]">
                  <td className="py-2 text-[#7A3E2E] font-medium">Total</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{summary.totalSales}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(summary.totalRevenue)}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(summary.avgOrderValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
