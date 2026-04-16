'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem, Product, Sale, StockStatus } from '@/types'
import { getStockStatus } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface InventoryReportProps {
  inventory: InventoryItem[]
  products: Product[]
  sales: Sale[]
  categoryFilter?: string
}

interface InventoryReportItem {
  product_id: string
  product_name: string
  sku: string
  category_name: string | null
  quantity: number
  cost_price: number
  total_value: number
  low_stock_threshold: number
  stock_status: StockStatus
  is_dead_stock: boolean
  days_since_last_sale: number | null
}

interface CategoryBreakdown {
  category_name: string
  product_count: number
  total_quantity: number
  total_value: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStockStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  }
  return labels[status]
}

function getStockStatusColor(status: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    in_stock: 'text-[#C1614A]',
    low_stock: 'text-[#E8896A]',
    out_of_stock: 'text-[#C05050]',
  }
  return colors[status]
}

function getStockStatusBgColor(status: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    in_stock: '',
    low_stock: 'bg-[#FDECEA]',
    out_of_stock: 'bg-[#F5E0DF]',
  }
  return colors[status]
}

function calculateDaysSinceLastSale(productId: string, sales: Sale[]): number | null {
  // Find the most recent sale containing this product
  const productSales = sales
    .filter(sale => sale.sale_items?.some(item => item.product_id === productId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (productSales.length === 0) return null

  const lastSaleDate = new Date(productSales[0].created_at)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - lastSaleDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InventoryReport({ 
  inventory, 
  products, 
  sales,
  categoryFilter 
}: InventoryReportProps) {
  // ─── Process Inventory Data ─────────────────────────────────────────────────
  const inventoryItems = useMemo(() => {
    const items: InventoryReportItem[] = inventory.map(item => {
      const product = products.find(p => p.id === item.product_id)
      const quantity = item.quantity
      const costPrice = product?.cost_price ?? 0
      const totalValue = quantity * costPrice
      const stockStatus = getStockStatus(quantity, item.low_stock_threshold)
      const daysSinceLastSale = calculateDaysSinceLastSale(item.product_id, sales)
      const isDeadStock = daysSinceLastSale !== null && daysSinceLastSale > 60

      return {
        product_id: item.product_id,
        product_name: product?.name ?? 'Unknown Product',
        sku: product?.sku ?? 'N/A',
        category_name: product?.categories?.name ?? null,
        quantity,
        cost_price: costPrice,
        total_value: totalValue,
        low_stock_threshold: item.low_stock_threshold,
        stock_status: stockStatus,
        is_dead_stock: isDeadStock,
        days_since_last_sale: daysSinceLastSale,
      }
    })

    // Apply category filter if provided
    if (categoryFilter) {
      return items.filter(item => {
        const product = products.find(p => p.id === item.product_id)
        return product?.category_id === categoryFilter
      })
    }

    return items
  }, [inventory, products, sales, categoryFilter])

  // ─── Summary Metrics ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalProducts = inventoryItems.length
    const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.total_value, 0)
    const lowStockCount = inventoryItems.filter(item => item.stock_status === 'low_stock').length
    const outOfStockCount = inventoryItems.filter(item => item.stock_status === 'out_of_stock').length
    const deadStockCount = inventoryItems.filter(item => item.is_dead_stock).length

    return {
      totalProducts,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      deadStockCount,
    }
  }, [inventoryItems])

  // ─── Category Breakdown ─────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const categoryMap: Record<string, CategoryBreakdown> = {}

    inventoryItems.forEach(item => {
      const categoryName = item.category_name ?? 'Uncategorized'
      
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          category_name: categoryName,
          product_count: 0,
          total_quantity: 0,
          total_value: 0,
        }
      }

      categoryMap[categoryName].product_count++
      categoryMap[categoryName].total_quantity += item.quantity
      categoryMap[categoryName].total_value += item.total_value
    })

    return Object.values(categoryMap).sort((a, b) => b.total_value - a.total_value)
  }, [inventoryItems])

  // ─── Sorted Inventory Items ────────────────────────────────────────────────
  const sortedItems = useMemo(() => {
    // Sort by stock status (out of stock first, then low stock, then in stock)
    // Within each status, sort by total value descending
    return [...inventoryItems].sort((a, b) => {
      const statusOrder = { out_of_stock: 0, low_stock: 1, in_stock: 2 }
      const statusDiff = statusOrder[a.stock_status] - statusOrder[b.stock_status]
      if (statusDiff !== 0) return statusDiff
      return b.total_value - a.total_value
    })
  }, [inventoryItems])

  // ─── Dead Stock Items ───────────────────────────────────────────────────────
  const deadStockItems = useMemo(() => {
    return inventoryItems
      .filter(item => item.is_dead_stock)
      .sort((a, b) => (b.days_since_last_sale ?? 0) - (a.days_since_last_sale ?? 0))
  }, [inventoryItems])

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (inventoryItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-8 text-center">
        <p className="text-sm text-[#B89080]">No inventory data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Metrics */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#FDF6F0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Products</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{summary.totalProducts}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Value</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{formatCurrency(summary.totalInventoryValue)}</p>
          </div>
          <div className="bg-[#FDECEA] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Low Stock</p>
            <p className="text-2xl font-medium text-[#E8896A]">{summary.lowStockCount}</p>
          </div>
          <div className="bg-[#F5E0DF] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Out of Stock</p>
            <p className="text-2xl font-medium text-[#C05050]">{summary.outOfStockCount}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#B89080] mb-1">Dead Stock</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{summary.deadStockCount}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Inventory by Category</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-2 text-[#B89080] font-medium">Category</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Products</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Total Quantity</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map(category => (
                  <tr key={category.category_name} className="border-b border-[#FDE8DF]">
                    <td className="py-2 text-[#7A3E2E]">{category.category_name}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{category.product_count}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{category.total_quantity}</td>
                    <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(category.total_value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#F2C4B0] bg-[#FDF6F0]">
                  <td className="py-2 text-[#7A3E2E] font-medium">Total</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{summary.totalProducts}</td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">
                    {inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(summary.totalInventoryValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Full Inventory Table */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Complete Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-2 text-[#B89080] font-medium">Product</th>
                <th className="text-left py-2 text-[#B89080] font-medium">SKU</th>
                <th className="text-left py-2 text-[#B89080] font-medium">Category</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Quantity</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Cost Price</th>
                <th className="text-right py-2 text-[#B89080] font-medium">Total Value</th>
                <th className="text-center py-2 text-[#B89080] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(item => {
                const rowBgColor = getStockStatusBgColor(item.stock_status)
                const statusColor = getStockStatusColor(item.stock_status)
                
                return (
                  <tr key={item.product_id} className={`border-b border-[#FDE8DF] ${rowBgColor}`}>
                    <td className="py-2 text-[#7A3E2E]">
                      {item.product_name}
                      {item.is_dead_stock && (
                        <span className="ml-2 text-xs text-[#C05050]">(Dead Stock)</span>
                      )}
                    </td>
                    <td className="py-2 text-[#B89080]">{item.sku}</td>
                    <td className="py-2 text-[#B89080]">{item.category_name ?? '—'}</td>
                    <td className="py-2 text-[#7A3E2E] text-right font-medium">{item.quantity}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(item.cost_price)}</td>
                    <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(item.total_value)}</td>
                    <td className="py-2 text-center">
                      <span className={`text-xs font-medium ${statusColor}`}>
                        {getStockStatusLabel(item.stock_status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#F2C4B0] bg-[#FDF6F0]">
                <td colSpan={5} className="py-2 text-[#7A3E2E] font-medium">Total Inventory Value</td>
                <td className="py-2 text-[#7A3E2E] font-medium text-right">{formatCurrency(summary.totalInventoryValue)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dead Stock Alert */}
      {deadStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h3 className="text-sm font-medium text-[#C05050] mb-4">
            Dead Stock Alert ({deadStockItems.length} items)
          </h3>
          <p className="text-xs text-[#B89080] mb-3">
            Products with no sales in the last 60 days. Consider promotions or discontinuation.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-2 text-[#B89080] font-medium">Product</th>
                  <th className="text-left py-2 text-[#B89080] font-medium">SKU</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Quantity</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Value</th>
                  <th className="text-right py-2 text-[#B89080] font-medium">Days Since Last Sale</th>
                </tr>
              </thead>
              <tbody>
                {deadStockItems.map(item => (
                  <tr key={item.product_id} className="border-b border-[#FDE8DF]">
                    <td className="py-2 text-[#7A3E2E]">{item.product_name}</td>
                    <td className="py-2 text-[#B89080]">{item.sku}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{item.quantity}</td>
                    <td className="py-2 text-[#7A3E2E] text-right">{formatCurrency(item.total_value)}</td>
                    <td className="py-2 text-[#C05050] font-medium text-right">
                      {item.days_since_last_sale ?? 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Status Summary */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Stock Status Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#F2C4B0] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#B89080]">In Stock</span>
              <span className="text-lg font-medium text-[#C1614A]">
                {inventoryItems.filter(i => i.stock_status === 'in_stock').length}
              </span>
            </div>
            <div className="text-xs text-[#B89080]">
              {((inventoryItems.filter(i => i.stock_status === 'in_stock').length / inventoryItems.length) * 100).toFixed(1)}% of inventory
            </div>
          </div>
          <div className="border border-[#F2C4B0] rounded-lg p-4 bg-[#FDECEA]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#B89080]">Low Stock</span>
              <span className="text-lg font-medium text-[#E8896A]">{summary.lowStockCount}</span>
            </div>
            <div className="text-xs text-[#B89080]">
              Requires restocking soon
            </div>
          </div>
          <div className="border border-[#F2C4B0] rounded-lg p-4 bg-[#F5E0DF]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#B89080]">Out of Stock</span>
              <span className="text-lg font-medium text-[#C05050]">{summary.outOfStockCount}</span>
            </div>
            <div className="text-xs text-[#B89080]">
              Immediate action required
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
