import * as XLSX from 'xlsx'
import type { Sale, Product, InventoryItem, PaymentMethod, DiscountType, StockStatus } from '@/types'
import { getStockStatus } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface SalesReportData {
  sales: Sale[]
  products: Product[]
  startDate: Date | null
  endDate: Date | null
}

interface InventoryReportData {
  inventory: InventoryItem[]
  products: Product[]
  sales: Sale[]
}

interface ProfitLossReportData {
  sales: Sale[]
  products: Product[]
  startDate: Date | null
  endDate: Date | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

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

function getStockStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  }
  return labels[status]
}

function calculateDaysSinceLastSale(productId: string, sales: Sale[]): number | null {
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
// SALES REPORT EXPORT
// ============================================================================

export function exportSalesReportExcel(data: SalesReportData): void {
  const { sales, products, startDate, endDate } = data
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // ─── Sheet 1: Summary ───────────────────────────────────────────────────────
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
  const totalDiscounts = sales.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0)
  
  const summaryData = [
    ['Sales Report'],
    ['Generated:', new Date().toLocaleString('en-PH')],
    ['Period:', startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'All Time'],
    [],
    ['Summary Metrics'],
    ['Total Sales', totalSales],
    ['Total Revenue', formatCurrency(totalRevenue)],
    ['Average Order Value', formatCurrency(avgOrderValue)],
    ['Total Discounts Given', formatCurrency(totalDiscounts)],
  ]
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  
  // ─── Sheet 2: Payment Method Breakdown ──────────────────────────────────────
  const paymentStats: Record<PaymentMethod, { count: number; total: number }> = {
    cash: { count: 0, total: 0 },
    card: { count: 0, total: 0 },
    gcash: { count: 0, total: 0 },
    paymaya: { count: 0, total: 0 },
    bank_transfer: { count: 0, total: 0 },
  }
  
  sales.forEach(sale => {
    const method = sale.payment_method || 'cash'
    paymentStats[method].count++
    paymentStats[method].total += sale.total_amount
  })
  
  const paymentData = [
    ['Payment Method Breakdown'],
    [],
    ['Payment Method', 'Count', 'Total Amount', '% of Revenue'],
  ]
  
  Object.entries(paymentStats).forEach(([method, data]) => {
    if (data.count > 0) {
      const percentage = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0
      paymentData.push([
        getPaymentMethodLabel(method as PaymentMethod),
        data.count,
        formatCurrency(data.total),
        `${percentage.toFixed(1)}%`,
      ])
    }
  })
  
  const wsPayment = XLSX.utils.aoa_to_sheet(paymentData)
  XLSX.utils.book_append_sheet(wb, wsPayment, 'Payment Methods')
  
  // ─── Sheet 3: Discount Breakdown ────────────────────────────────────────────
  const discountStats: Record<DiscountType, { count: number; total: number }> = {
    none: { count: 0, total: 0 },
    percentage: { count: 0, total: 0 },
    fixed: { count: 0, total: 0 },
    senior_pwd: { count: 0, total: 0 },
  }
  
  sales.forEach(sale => {
    const type = sale.discount_type || 'none'
    const amount = sale.discount_amount || 0
    discountStats[type].count++
    discountStats[type].total += amount
  })
  
  const discountData = [
    ['Discount Breakdown'],
    [],
    ['Discount Type', 'Count', 'Total Amount'],
  ]
  
  Object.entries(discountStats).forEach(([type, data]) => {
    if (data.count > 0) {
      discountData.push([
        getDiscountTypeLabel(type as DiscountType),
        data.count,
        formatCurrency(data.total),
      ])
    }
  })
  
  const wsDiscount = XLSX.utils.aoa_to_sheet(discountData)
  XLSX.utils.book_append_sheet(wb, wsDiscount, 'Discounts')
  
  // ─── Sheet 4: Top Products by Revenue ───────────────────────────────────────
  const productRevenueMap: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {}
  
  sales.forEach(sale => {
    sale.sale_items?.forEach(item => {
      const productId = item.product_id
      const product = products.find(p => p.id === productId)
      const productName = product?.name || 'Unknown Product'
      const sku = product?.sku || 'N/A'
      const revenue = item.subtotal
      
      if (!productRevenueMap[productId]) {
        productRevenueMap[productId] = { name: productName, sku, quantity: 0, revenue: 0 }
      }
      
      productRevenueMap[productId].quantity += item.quantity
      productRevenueMap[productId].revenue += revenue
    })
  })
  
  const topProductsByRevenue = Object.values(productRevenueMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
  
  const topRevenueData = [
    ['Top 10 Products by Revenue'],
    [],
    ['Rank', 'Product', 'SKU', 'Quantity Sold', 'Revenue'],
  ]
  
  topProductsByRevenue.forEach((product, index) => {
    topRevenueData.push([
      index + 1,
      product.name,
      product.sku,
      product.quantity,
      formatCurrency(product.revenue),
    ])
  })
  
  const wsTopRevenue = XLSX.utils.aoa_to_sheet(topRevenueData)
  XLSX.utils.book_append_sheet(wb, wsTopRevenue, 'Top Products Revenue')
  
  // ─── Sheet 5: Top Products by Quantity ──────────────────────────────────────
  const topProductsByQuantity = Object.values(productRevenueMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
  
  const topQuantityData = [
    ['Top 10 Products by Quantity Sold'],
    [],
    ['Rank', 'Product', 'SKU', 'Quantity Sold', 'Revenue'],
  ]
  
  topProductsByQuantity.forEach((product, index) => {
    topQuantityData.push([
      index + 1,
      product.name,
      product.sku,
      product.quantity,
      formatCurrency(product.revenue),
    ])
  })
  
  const wsTopQuantity = XLSX.utils.aoa_to_sheet(topQuantityData)
  XLSX.utils.book_append_sheet(wb, wsTopQuantity, 'Top Products Quantity')
  
  // ─── Sheet 6: All Sales (Raw Data) ─────────────────────────────────────────
  const allSalesData = [
    ['All Sales - Raw Data'],
    [],
    ['Date', 'Sale ID', 'Total Amount', 'Payment Method', 'Discount Type', 'Discount Amount', 'Items Count'],
  ]
  
  sales.forEach(sale => {
    allSalesData.push([
      formatDate(sale.created_at),
      sale.id.substring(0, 8),
      formatCurrency(sale.total_amount),
      getPaymentMethodLabel(sale.payment_method || 'cash'),
      getDiscountTypeLabel(sale.discount_type || 'none'),
      formatCurrency(sale.discount_amount || 0),
      sale.sale_items?.length || 0,
    ])
  })
  
  const wsAllSales = XLSX.utils.aoa_to_sheet(allSalesData)
  XLSX.utils.book_append_sheet(wb, wsAllSales, 'All Sales')
  
  // ─── Export ─────────────────────────────────────────────────────────────────
  const fileName = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// ============================================================================
// INVENTORY REPORT EXPORT
// ============================================================================

export function exportInventoryReportExcel(data: InventoryReportData): void {
  const { inventory, products, sales } = data
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // ─── Process Inventory Data ─────────────────────────────────────────────────
  const inventoryItems = inventory.map(item => {
    const product = products.find(p => p.id === item.product_id)
    const quantity = item.quantity
    const costPrice = product?.cost_price ?? 0
    const totalValue = quantity * costPrice
    const stockStatus = getStockStatus(quantity, item.low_stock_threshold)
    const daysSinceLastSale = calculateDaysSinceLastSale(item.product_id, sales)
    const isDeadStock = daysSinceLastSale !== null && daysSinceLastSale > 60
    
    return {
      product_name: product?.name ?? 'Unknown Product',
      sku: product?.sku ?? 'N/A',
      category_name: product?.categories?.name ?? 'Uncategorized',
      quantity,
      cost_price: costPrice,
      total_value: totalValue,
      low_stock_threshold: item.low_stock_threshold,
      stock_status: stockStatus,
      is_dead_stock: isDeadStock,
      days_since_last_sale: daysSinceLastSale,
    }
  })
  
  // ─── Sheet 1: Summary ───────────────────────────────────────────────────────
  const totalProducts = inventoryItems.length
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.total_value, 0)
  const lowStockCount = inventoryItems.filter(item => item.stock_status === 'low_stock').length
  const outOfStockCount = inventoryItems.filter(item => item.stock_status === 'out_of_stock').length
  const deadStockCount = inventoryItems.filter(item => item.is_dead_stock).length
  
  const summaryData = [
    ['Inventory Report'],
    ['Generated:', new Date().toLocaleString('en-PH')],
    [],
    ['Summary Metrics'],
    ['Total Products', totalProducts],
    ['Total Inventory Value', formatCurrency(totalInventoryValue)],
    ['Low Stock Items', lowStockCount],
    ['Out of Stock Items', outOfStockCount],
    ['Dead Stock Items (>60 days)', deadStockCount],
  ]
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  
  // ─── Sheet 2: Category Breakdown ────────────────────────────────────────────
  const categoryMap: Record<string, { productCount: number; totalQuantity: number; totalValue: number }> = {}
  
  inventoryItems.forEach(item => {
    const categoryName = item.category_name
    
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = { productCount: 0, totalQuantity: 0, totalValue: 0 }
    }
    
    categoryMap[categoryName].productCount++
    categoryMap[categoryName].totalQuantity += item.quantity
    categoryMap[categoryName].totalValue += item.total_value
  })
  
  const categoryData = [
    ['Inventory by Category'],
    [],
    ['Category', 'Product Count', 'Total Quantity', 'Total Value'],
  ]
  
  Object.entries(categoryMap)
    .sort(([, a], [, b]) => b.totalValue - a.totalValue)
    .forEach(([categoryName, data]) => {
      categoryData.push([
        categoryName,
        data.productCount,
        data.totalQuantity,
        formatCurrency(data.totalValue),
      ])
    })
  
  const wsCategory = XLSX.utils.aoa_to_sheet(categoryData)
  XLSX.utils.book_append_sheet(wb, wsCategory, 'By Category')
  
  // ─── Sheet 3: Complete Inventory ────────────────────────────────────────────
  const inventoryData = [
    ['Complete Inventory'],
    [],
    ['Product', 'SKU', 'Category', 'Quantity', 'Cost Price', 'Total Value', 'Status', 'Dead Stock'],
  ]
  
  inventoryItems
    .sort((a, b) => {
      const statusOrder = { out_of_stock: 0, low_stock: 1, in_stock: 2 }
      const statusDiff = statusOrder[a.stock_status] - statusOrder[b.stock_status]
      if (statusDiff !== 0) return statusDiff
      return b.total_value - a.total_value
    })
    .forEach(item => {
      inventoryData.push([
        item.product_name,
        item.sku,
        item.category_name,
        item.quantity,
        formatCurrency(item.cost_price),
        formatCurrency(item.total_value),
        getStockStatusLabel(item.stock_status),
        item.is_dead_stock ? 'Yes' : 'No',
      ])
    })
  
  const wsInventory = XLSX.utils.aoa_to_sheet(inventoryData)
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Complete Inventory')
  
  // ─── Sheet 4: Low Stock Alert ───────────────────────────────────────────────
  const lowStockItems = inventoryItems.filter(item => item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock')
  
  const lowStockData = [
    ['Low Stock & Out of Stock Items'],
    [],
    ['Product', 'SKU', 'Category', 'Quantity', 'Threshold', 'Status'],
  ]
  
  lowStockItems.forEach(item => {
    lowStockData.push([
      item.product_name,
      item.sku,
      item.category_name,
      item.quantity,
      item.low_stock_threshold,
      getStockStatusLabel(item.stock_status),
    ])
  })
  
  const wsLowStock = XLSX.utils.aoa_to_sheet(lowStockData)
  XLSX.utils.book_append_sheet(wb, wsLowStock, 'Low Stock Alert')
  
  // ─── Sheet 5: Dead Stock ────────────────────────────────────────────────────
  const deadStockItems = inventoryItems.filter(item => item.is_dead_stock)
  
  const deadStockData = [
    ['Dead Stock Items (No sales in 60+ days)'],
    [],
    ['Product', 'SKU', 'Quantity', 'Value', 'Days Since Last Sale'],
  ]
  
  deadStockItems
    .sort((a, b) => (b.days_since_last_sale ?? 0) - (a.days_since_last_sale ?? 0))
    .forEach(item => {
      deadStockData.push([
        item.product_name,
        item.sku,
        item.quantity,
        formatCurrency(item.total_value),
        item.days_since_last_sale ?? 'Never',
      ])
    })
  
  const wsDeadStock = XLSX.utils.aoa_to_sheet(deadStockData)
  XLSX.utils.book_append_sheet(wb, wsDeadStock, 'Dead Stock')
  
  // ─── Export ─────────────────────────────────────────────────────────────────
  const fileName = `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// ============================================================================
// PROFIT & LOSS REPORT EXPORT
// ============================================================================

export function exportProfitLossReportExcel(data: ProfitLossReportData): void {
  const { sales, products, startDate, endDate } = data
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // ─── Calculate Overall Metrics ──────────────────────────────────────────────
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalDiscounts = sales.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0)
  
  let totalCOGS = 0
  sales.forEach(sale => {
    sale.sale_items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id)
      const costPrice = product?.cost_price ?? 0
      totalCOGS += item.quantity * costPrice
    })
  })
  
  const grossProfit = totalRevenue - totalCOGS
  const grossMarginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netRevenue = totalRevenue - totalDiscounts
  const netProfit = netRevenue - totalCOGS
  const netMarginPercentage = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0
  
  // ─── Sheet 1: P&L Summary ───────────────────────────────────────────────────
  const summaryData = [
    ['Profit & Loss Report'],
    ['Generated:', new Date().toLocaleString('en-PH')],
    ['Period:', startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'All Time'],
    [],
    ['Revenue'],
    ['Total Revenue', formatCurrency(totalRevenue)],
    ['Less: Discounts Given', formatCurrency(totalDiscounts)],
    ['Net Revenue', formatCurrency(netRevenue)],
    [],
    ['Cost'],
    ['Cost of Goods Sold (COGS)', formatCurrency(totalCOGS)],
    [],
    ['Profit'],
    ['Gross Profit', formatCurrency(grossProfit)],
    ['Gross Margin %', `${grossMarginPercentage.toFixed(2)}%`],
    [],
    ['Net Profit', formatCurrency(netProfit)],
    ['Net Margin %', `${netMarginPercentage.toFixed(2)}%`],
  ]
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'P&L Summary')
  
  // ─── Sheet 2: Category Breakdown ────────────────────────────────────────────
  const categoryMap: Record<string, { revenue: number; cogs: number; unitsSold: number }> = {}
  
  sales.forEach(sale => {
    sale.sale_items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id)
      const categoryName = product?.categories?.name ?? 'Uncategorized'
      const costPrice = product?.cost_price ?? 0
      const revenue = item.subtotal
      const cogs = item.quantity * costPrice
      
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = { revenue: 0, cogs: 0, unitsSold: 0 }
      }
      
      categoryMap[categoryName].revenue += revenue
      categoryMap[categoryName].cogs += cogs
      categoryMap[categoryName].unitsSold += item.quantity
    })
  })
  
  const categoryData = [
    ['Profit & Loss by Category'],
    [],
    ['Category', 'Units Sold', 'Revenue', 'COGS', 'Gross Profit', 'Margin %'],
  ]
  
  Object.entries(categoryMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .forEach(([categoryName, data]) => {
      const grossProfit = data.revenue - data.cogs
      const marginPercentage = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0
      
      categoryData.push([
        categoryName,
        data.unitsSold,
        formatCurrency(data.revenue),
        formatCurrency(data.cogs),
        formatCurrency(grossProfit),
        `${marginPercentage.toFixed(1)}%`,
      ])
    })
  
  // Add totals row
  const totalUnitsSold = Object.values(categoryMap).reduce((sum, cat) => sum + cat.unitsSold, 0)
  categoryData.push([
    'TOTAL',
    totalUnitsSold,
    formatCurrency(totalRevenue),
    formatCurrency(totalCOGS),
    formatCurrency(grossProfit),
    `${grossMarginPercentage.toFixed(1)}%`,
  ])
  
  const wsCategory = XLSX.utils.aoa_to_sheet(categoryData)
  XLSX.utils.book_append_sheet(wb, wsCategory, 'By Category')
  
  // ─── Sheet 3: Monthly Breakdown (if applicable) ─────────────────────────────
  if (startDate && endDate) {
    const monthsInRange = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth())
    
    if (monthsInRange > 1) {
      const monthlyMap: Record<string, { revenue: number; cogs: number; discounts: number }> = {}
      
      sales.forEach(sale => {
        const saleDate = new Date(sale.created_at)
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { revenue: 0, cogs: 0, discounts: 0 }
        }
        
        const revenue = sale.total_amount
        const discounts = sale.discount_amount || 0
        
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
      
      const monthlyData = [
        ['Monthly Profit & Loss Breakdown'],
        [],
        ['Month', 'Revenue', 'Discounts', 'COGS', 'Gross Profit', 'Margin %', 'Net Profit'],
      ]
      
      Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([monthKey, data]) => {
          const [year, month] = monthKey.split('-')
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          const monthLabel = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
          
          const grossProfit = data.revenue - data.cogs
          const marginPercentage = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0
          const netRevenue = data.revenue - data.discounts
          const netProfit = netRevenue - data.cogs
          
          monthlyData.push([
            monthLabel,
            formatCurrency(data.revenue),
            formatCurrency(data.discounts),
            formatCurrency(data.cogs),
            formatCurrency(grossProfit),
            `${marginPercentage.toFixed(1)}%`,
            formatCurrency(netProfit),
          ])
        })
      
      // Add totals row
      monthlyData.push([
        'TOTAL',
        formatCurrency(totalRevenue),
        formatCurrency(totalDiscounts),
        formatCurrency(totalCOGS),
        formatCurrency(grossProfit),
        `${grossMarginPercentage.toFixed(1)}%`,
        formatCurrency(netProfit),
      ])
      
      const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Breakdown')
    }
  }
  
  // ─── Sheet 4: Product Profitability ─────────────────────────────────────────
  const productMap: Record<string, { name: string; sku: string; unitsSold: number; revenue: number; cogs: number }> = {}
  
  sales.forEach(sale => {
    sale.sale_items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id)
      const productId = item.product_id
      const productName = product?.name || 'Unknown Product'
      const sku = product?.sku || 'N/A'
      const costPrice = product?.cost_price ?? 0
      const revenue = item.subtotal
      const cogs = item.quantity * costPrice
      
      if (!productMap[productId]) {
        productMap[productId] = { name: productName, sku, unitsSold: 0, revenue: 0, cogs: 0 }
      }
      
      productMap[productId].unitsSold += item.quantity
      productMap[productId].revenue += revenue
      productMap[productId].cogs += cogs
    })
  })
  
  const productData = [
    ['Product Profitability'],
    [],
    ['Product', 'SKU', 'Units Sold', 'Revenue', 'COGS', 'Gross Profit', 'Margin %'],
  ]
  
  Object.values(productMap)
    .sort((a, b) => (b.revenue - b.cogs) - (a.revenue - a.cogs))
    .forEach(product => {
      const grossProfit = product.revenue - product.cogs
      const marginPercentage = product.revenue > 0 ? (grossProfit / product.revenue) * 100 : 0
      
      productData.push([
        product.name,
        product.sku,
        product.unitsSold,
        formatCurrency(product.revenue),
        formatCurrency(product.cogs),
        formatCurrency(grossProfit),
        `${marginPercentage.toFixed(1)}%`,
      ])
    })
  
  const wsProduct = XLSX.utils.aoa_to_sheet(productData)
  XLSX.utils.book_append_sheet(wb, wsProduct, 'Product Profitability')
  
  // ─── Export ─────────────────────────────────────────────────────────────────
  const fileName = `Profit_Loss_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
