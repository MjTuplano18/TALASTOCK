'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { Sale, Product } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface ProfitLossReportProps {
  sales: Sale[]
  products: Product[]
  startDate: Date | null
  endDate: Date | null
}

interface CategoryProfitStat {
  category_name: string
  revenue: number
  cogs: number
  gross_profit: number
  gross_margin_percentage: number
  units_sold: number
}

interface MonthlyProfitStat {
  month: string
  revenue: number
  cogs: number
  gross_profit: number
  gross_margin_percentage: number
  discounts: number
  net_profit: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}

function getDateRangeInMonths(startDate: Date, endDate: Date): number {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth())
  return months
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProfitLossReport({ sales, products, startDate, endDate }: ProfitLossReportProps) {
  // ─── Overall P&L Metrics ────────────────────────────────────────────────────
  const overallMetrics = useMemo(() => {
    // Calculate total revenue (sum of all sale total_amount)
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    
    // Calculate total discounts given
    const totalDiscounts = sales.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0)
    
    // Calculate COGS (Cost of Goods Sold)
    let totalCOGS = 0
    sales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id)
        const costPrice = product?.cost_price ?? 0
        totalCOGS += item.quantity * costPrice
      })
    })
    
    // Calculate gross profit (Revenue - COGS)
    const grossProfit = totalRevenue - totalCOGS
    
    // Calculate gross margin % ((Gross Profit / Revenue) × 100)
    const grossMarginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    
    // Calculate net revenue (Revenue - Discounts)
    const netRevenue = totalRevenue - totalDiscounts
    
    // Calculate net profit (Net Revenue - COGS)
    const netProfit = netRevenue - totalCOGS
    
    // Calculate net margin %
    const netMarginPercentage = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0
    
    return {
      totalRevenue,
      totalDiscounts,
      netRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPercentage,
      netProfit,
      netMarginPercentage,
    }
  }, [sales, products])

  // ─── Category Breakdown ─────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const categoryMap: Record<string, CategoryProfitStat> = {}

    sales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id)
        const categoryName = product?.categories?.name ?? 'Uncategorized'
        const costPrice = product?.cost_price ?? 0
        const revenue = item.subtotal
        const cogs = item.quantity * costPrice
        const grossProfit = revenue - cogs

        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = {
            category_name: categoryName,
            revenue: 0,
            cogs: 0,
            gross_profit: 0,
            gross_margin_percentage: 0,
            units_sold: 0,
          }
        }

        categoryMap[categoryName].revenue += revenue
        categoryMap[categoryName].cogs += cogs
        categoryMap[categoryName].gross_profit += grossProfit
        categoryMap[categoryName].units_sold += item.quantity
      })
    })

    // Calculate gross margin percentage for each category
    Object.values(categoryMap).forEach(category => {
      category.gross_margin_percentage = category.revenue > 0 
        ? (category.gross_profit / category.revenue) * 100 
        : 0
    })

    return Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue)
  }, [sales, products])

  // ─── Monthly Breakdown (if date range > 1 month) ────────────────────────────
  const monthlyBreakdown = useMemo(() => {
    if (!startDate || !endDate) return null
    
    const monthsInRange = getDateRangeInMonths(startDate, endDate)
    if (monthsInRange <= 1) return null

    const monthlyMap: Record<string, MonthlyProfitStat> = {}

    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at)
      const monthKey = getMonthKey(saleDate)
      const monthLabel = formatMonthLabel(monthKey)

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthLabel,
          revenue: 0,
          cogs: 0,
          gross_profit: 0,
          gross_margin_percentage: 0,
          discounts: 0,
          net_profit: 0,
        }
      }

      const revenue = sale.total_amount
      const discounts = sale.discount_amount || 0
      
      // Calculate COGS for this sale
      let saleCOGS = 0
      sale.sale_items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id)
        const costPrice = product?.cost_price ?? 0
        saleCOGS += item.quantity * costPrice
      })

      monthlyMap[monthKey].revenue += revenue
      monthlyMap[monthKey].cogs += saleCOGS
      monthlyMap[monthKey].discounts += discounts
    })

    // Calculate derived metrics for each month
    Object.values(monthlyMap).forEach(month => {
      month.gross_profit = month.revenue - month.cogs
      month.gross_margin_percentage = month.revenue > 0 
        ? (month.gross_profit / month.revenue) * 100 
        : 0
      const netRevenue = month.revenue - month.discounts
      month.net_profit = netRevenue - month.cogs
    })

    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))
  }, [sales, products, startDate, endDate])

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
      {/* Overall P&L Summary */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Profit & Loss Summary</h3>
        
        {/* Revenue Section */}
        <div className="space-y-2 mb-4 pb-4 border-b border-[#F2C4B0]">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#7A3E2E]">Total Revenue</span>
            <span className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(overallMetrics.totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#B89080] pl-4">Less: Discounts Given</span>
            <span className="text-sm text-[#E8896A]">-{formatCurrency(overallMetrics.totalDiscounts)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#FDE8DF]">
            <span className="text-sm font-medium text-[#7A3E2E]">Net Revenue</span>
            <span className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(overallMetrics.netRevenue)}</span>
          </div>
        </div>

        {/* Cost Section */}
        <div className="space-y-2 mb-4 pb-4 border-b border-[#F2C4B0]">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#7A3E2E]">Cost of Goods Sold (COGS)</span>
            <span className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(overallMetrics.totalCOGS)}</span>
          </div>
        </div>

        {/* Profit Section */}
        <div className="space-y-3">
          <div className="bg-[#FDF6F0] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#7A3E2E]">Gross Profit</span>
              <span className="text-lg font-medium text-[#E8896A]">{formatCurrency(overallMetrics.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#B89080]">Gross Margin</span>
              <span className="text-xs text-[#B89080]">{overallMetrics.grossMarginPercentage.toFixed(2)}%</span>
            </div>
          </div>

          <div className="bg-[#FDE8DF] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#7A3E2E]">Net Profit</span>
              <span className="text-lg font-medium text-[#C1614A]">{formatCurrency(overallMetrics.netProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#B89080]">Net Margin</span>
              <span className="text-xs text-[#B89080]">{overallMetrics.netMarginPercentage.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Profit & Loss by Category</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-2 text-[#B89080] font-medium">Category</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Units Sold</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Revenue</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">COGS</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Gross Profit</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map(category => (
                  <tr key={category.category_name} className="border-b border-[#FDE8DF]">
                    <td className="py-2 text-[#7A3E2E]">{category.category_name}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{category.units_sold}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(category.revenue)}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(category.cogs)}</td>
                    <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(category.gross_profit)}</td>
                    <td className="py-2 text-[#E8896A] font-medium text-right">{category.gross_margin_percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#F2C4B0] bg-[#FDF6F0]">
                  <td className="py-2 text-[#7A3E2E] font-medium">Total</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">
                    {categoryBreakdown.reduce((sum, cat) => sum + cat.units_sold, 0)}
                  </td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(overallMetrics.totalRevenue)}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(overallMetrics.totalCOGS)}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(overallMetrics.grossProfit)}</td>
                  <td className="py-2 text-[#E8896A] font-medium text-right">{overallMetrics.grossMarginPercentage.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Breakdown (if date range > 1 month) */}
      {monthlyBreakdown && monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Monthly Profit & Loss Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-2 text-[#B89080] font-medium">Month</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Revenue</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Discounts</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">COGS</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Gross Profit</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Margin %</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map(month => (
                  <tr key={month.month} className="border-b border-[#FDE8DF]">
                    <td className="py-2 text-[#7A3E2E]">{month.month}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(month.revenue)}</td>
                    <td className="py-2 text-[#E8896A] text-right">-{formatCurrency(month.discounts)}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(month.cogs)}</td>
                    <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(month.gross_profit)}</td>
                    <td className="py-2 text-[#E8896A] text-right">{month.gross_margin_percentage.toFixed(1)}%</td>
                    <td className="py-2 text-[#C1614A] font-medium text-right">{formatCurrency(month.net_profit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#F2C4B0] bg-[#FDF6F0]">
                  <td className="py-2 text-[#7A3E2E] font-medium">Total</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(overallMetrics.totalRevenue)}</td>
                  <td className="py-2 text-[#E8896A] font-medium text-right">-{formatCurrency(overallMetrics.totalDiscounts)}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(overallMetrics.totalCOGS)}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(overallMetrics.grossProfit)}</td>
                  <td className="py-2 text-[#E8896A] font-medium text-right">{overallMetrics.grossMarginPercentage.toFixed(1)}%</td>
                  <td className="py-2 text-[#C1614A] font-medium text-right">{formatCurrency(overallMetrics.netProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Key Insights</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-[#E8896A] mt-0.5">•</span>
            <p className="text-[#7A3E2E]">
              Your gross margin is <span className="font-medium">{overallMetrics.grossMarginPercentage.toFixed(1)}%</span>, 
              meaning you keep ₱{(overallMetrics.grossMarginPercentage / 100).toFixed(2)} for every ₱1.00 in sales before discounts.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#E8896A] mt-0.5">•</span>
            <p className="text-[#7A3E2E]">
              Total discounts given: <span className="font-medium">{formatCurrency(overallMetrics.totalDiscounts)}</span> 
              ({((overallMetrics.totalDiscounts / overallMetrics.totalRevenue) * 100).toFixed(1)}% of revenue)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#E8896A] mt-0.5">•</span>
            <p className="text-[#7A3E2E]">
              Net profit after discounts: <span className="font-medium">{formatCurrency(overallMetrics.netProfit)}</span> 
              (Net margin: {overallMetrics.netMarginPercentage.toFixed(1)}%)
            </p>
          </div>
          {categoryBreakdown.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[#E8896A] mt-0.5">•</span>
              <p className="text-[#7A3E2E]">
                Most profitable category: <span className="font-medium">{categoryBreakdown[0].category_name}</span> 
                ({formatCurrency(categoryBreakdown[0].gross_profit)} gross profit)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
