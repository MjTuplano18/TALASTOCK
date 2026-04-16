import jsPDF from 'jspdf'
import type { Sale, InventoryItem } from '@/types'
import { getStockStatus } from '@/types'

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  brand:  [122, 62, 46]   as [number,number,number],
  accent: [232, 137, 106] as [number,number,number],
  muted:  [184, 144, 128] as [number,number,number],
  border: [242, 196, 176] as [number,number,number],
  soft:   [253, 232, 223] as [number,number,number],
  bg:     [253, 246, 240] as [number,number,number],
  white:  [255, 255, 255] as [number,number,number],
  dark:   [60, 30, 20]    as [number,number,number],
  danger: [192, 80, 80]   as [number,number,number],
  good:   [80, 150, 80]   as [number,number,number],
}

function money(n: number) {
  return `PHP ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function dateStr(s: string) {
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function timeStr(s: string) {
  return new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function pageHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...C.accent)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setFontSize(13)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text('TALASTOCK', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(title.toUpperCase(), 196, 12, { align: 'right' })

  let y = 28
  doc.setFontSize(16)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text(subtitle, 14, y)
  doc.setFont('helvetica', 'normal')

  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 14, (y += 7))

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.6)
  doc.line(14, (y += 4), 196, y)
  return y + 8
}

function sectionTitle(doc: jsPDF, title: string, y: number, width = 182) {
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, width, 9, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 17, y + 2)
  doc.setFont('helvetica', 'normal')
  return y + 11
}

function tableHead(doc: jsPDF, cols: { label: string; x: number }[], y: number, width = 182) {
  doc.setFillColor(...C.brand)
  doc.rect(14, y - 4, width, 8, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  cols.forEach(c => doc.text(c.label, c.x, y + 1))
  doc.setFont('helvetica', 'normal')
  return y + 8
}

function tableRow(doc: jsPDF, cols: { text: string; x: number }[], y: number, shade: boolean, width = 182) {
  if (shade) { doc.setFillColor(...C.bg); doc.rect(14, y - 4, width, 7, 'F') }
  doc.setFontSize(8)
  doc.setTextColor(...C.dark)
  cols.forEach(c => doc.text(c.text, c.x, y))
  return y + 7
}

function pageFooter(doc: jsPDF) {
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFillColor(...C.accent)
    doc.rect(0, 285, 210, 12, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'normal')
    doc.text('TALASTOCK — Inventory & Sales Management System', 14, 292)
    doc.text(`Page ${i} of ${n}  |  CONFIDENTIAL`, 196, 292, { align: 'right' })
  }
}

function checkBreak(doc: jsPDF, y: number, needed = 15): number {
  if (y + needed > 275) { doc.addPage(); return 22 }
  return y
}

// ─── SALES REPORT ─────────────────────────────────────────────────────────────

export function generateSalesReport(
  sales: Sale[],
  dateRange?: { from: string; to: string }
): void {
  const doc = new jsPDF()
  const now = new Date()

  let filtered = sales
  if (dateRange?.from) filtered = filtered.filter(s => s.created_at >= dateRange.from)
  if (dateRange?.to) filtered = filtered.filter(s => s.created_at <= dateRange.to + 'T23:59:59')

  const totalRevenue = filtered.reduce((s, sale) => s + sale.total_amount, 0)
  const totalItems = filtered.reduce((s, sale) => s + (sale.sale_items?.length ?? 0), 0)
  const avgOrder = filtered.length > 0 ? totalRevenue / filtered.length : 0

  let y = pageHeader(doc, 'Sales Report', 'Sales Performance Report')

  // Period
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  if (dateRange?.from && dateRange?.to) {
    doc.text(`Period: ${dateStr(dateRange.from)} to ${dateStr(dateRange.to)}`, 14, y)
  } else {
    doc.text(`Period: All time  |  ${filtered.length} transactions`, 14, y)
  }
  y += 10

  // ── Summary KPI boxes ──
  y = sectionTitle(doc, '1. Executive Summary', y)

  const kpis = [
    { label: 'Total Revenue', value: money(totalRevenue) },
    { label: 'Total Transactions', value: String(filtered.length) },
    { label: 'Total Items Sold', value: String(totalItems) },
    { label: 'Avg Order Value', value: money(avgOrder) },
  ]
  const kW = 43
  kpis.forEach((k, i) => {
    const x = 14 + i * (kW + 2)
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, kW, 18, 2, 2, 'FD')
    doc.setFillColor(...C.accent)
    doc.roundedRect(x, y, 2.5, 18, 1, 1, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(k.label, x + 5, y + 6)
    doc.setFontSize(k.value.length > 12 ? 8 : 10)
    doc.setTextColor(...C.brand)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 5, y + 14)
    doc.setFont('helvetica', 'normal')
  })
  y += 26

  // ── Transactions table ──
  y = checkBreak(doc, y, 40)
  y = sectionTitle(doc, '2. Transaction Details', y)
  y = tableHead(doc, [
    { label: 'Date', x: 17 },
    { label: 'Time', x: 60 },
    { label: 'Products', x: 90 },
    { label: 'Items', x: 145 },
    { label: 'Total (PHP)', x: 165 },
  ], y)

  filtered.forEach((sale, i) => {
    y = checkBreak(doc, y, 8)
    const firstProduct = sale.sale_items?.[0]?.products?.name ?? '—'
    const itemCount = sale.sale_items?.length ?? 0
    const productText = itemCount > 1 ? `${firstProduct} +${itemCount - 1}` : firstProduct
    y = tableRow(doc, [
      { text: dateStr(sale.created_at), x: 17 },
      { text: timeStr(sale.created_at), x: 60 },
      { text: productText.length > 28 ? productText.slice(0, 26) + '...' : productText, x: 90 },
      { text: String(itemCount), x: 145 },
      { text: money(sale.total_amount), x: 165 },
    ], y, i % 2 === 0)
  })

  // Grand total row
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text(`GRAND TOTAL (${filtered.length} transactions)`, 17, y)
  doc.text(money(totalRevenue), 165, y)
  doc.setFont('helvetica', 'normal')
  y += 12

  // ── Top products breakdown ──
  if (filtered.length > 0) {
    y = checkBreak(doc, y, 40)
    y = sectionTitle(doc, '3. Product Breakdown', y)
    y = tableHead(doc, [
      { label: 'Product', x: 17 },
      { label: 'Units Sold', x: 110 },
      { label: 'Revenue (PHP)', x: 150 },
    ], y)

    const productMap: Record<string, { units: number; revenue: number }> = {}
    filtered.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const name = item.products?.name ?? 'Unknown'
        if (!productMap[name]) productMap[name] = { units: 0, revenue: 0 }
        productMap[name].units += item.quantity
        productMap[name].revenue += item.subtotal
      })
    })

    Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .forEach(([name, data], i) => {
        y = checkBreak(doc, y, 8)
        y = tableRow(doc, [
          { text: name.length > 40 ? name.slice(0, 38) + '...' : name, x: 17 },
          { text: String(data.units), x: 110 },
          { text: money(data.revenue), x: 150 },
        ], y, i % 2 === 0)
      })
  }

  pageFooter(doc)
  doc.save(`talastock-sales-report-${now.toISOString().slice(0, 10)}.pdf`)
}

// ─── INVENTORY REPORT ─────────────────────────────────────────────────────────

export function generateInventoryReport(inventory: InventoryItem[]): void {
  const doc = new jsPDF({ orientation: 'landscape' })
  const now = new Date()
  const W = 267 // usable landscape width

  const totalValue = inventory.reduce((s, i) => s + i.quantity * (i.products?.cost_price ?? 0), 0)
  const inStock = inventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) === 'in_stock').length
  const lowStock = inventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) === 'low_stock').length
  const outOfStock = inventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) === 'out_of_stock').length

  // Header (landscape)
  doc.setFillColor(...C.accent)
  doc.rect(0, 0, 297, 18, 'F')
  doc.setFontSize(13)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text('TALASTOCK', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('INVENTORY REPORT', 283, 12, { align: 'right' })

  let y = 28
  doc.setFontSize(16)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text('Inventory Status Report', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, (y += 7))
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.6)
  doc.line(14, (y += 4), 283, y)
  y += 8

  // ── KPI boxes ──
  const kpis = [
    { label: 'Total Products', value: String(inventory.length), color: C.brand },
    { label: 'Total Value (at cost)', value: money(totalValue), color: C.brand },
    { label: 'In Stock', value: String(inStock), color: C.good },
    { label: 'Low Stock', value: String(lowStock), color: C.accent },
    { label: 'Out of Stock', value: String(outOfStock), color: C.danger },
  ]
  const kW = 51
  kpis.forEach((k, i) => {
    const x = 14 + i * (kW + 2)
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, kW, 18, 2, 2, 'FD')
    doc.setFillColor(...k.color)
    doc.roundedRect(x, y, 2.5, 18, 1, 1, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(k.label, x + 5, y + 6)
    doc.setFontSize(k.value.length > 12 ? 8 : 10)
    doc.setTextColor(...k.color)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 5, y + 14)
    doc.setFont('helvetica', 'normal')
  })
  y += 26

  // ── Inventory table ──
  doc.setFontSize(9)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, W, 9, 'F')
  doc.text('INVENTORY DETAILS', 17, y + 2)
  doc.setFont('helvetica', 'normal')
  y += 11

  y = tableHead(doc, [
    { label: 'Product Name', x: 17 },
    { label: 'SKU', x: 90 },
    { label: 'Quantity', x: 140 },
    { label: 'Threshold', x: 165 },
    { label: 'Status', x: 190 },
    { label: 'Unit Cost', x: 225 },
    { label: 'Total Value', x: 252 },
  ], y, W)

  inventory.forEach((item, i) => {
    if (y > 185) { doc.addPage(); y = 22 }
    const cost = item.products?.cost_price ?? 0
    const value = item.quantity * cost
    const status = getStockStatus(item.quantity, item.low_stock_threshold)
    const statusLabel = status === 'in_stock' ? 'In Stock' : status === 'low_stock' ? 'Low Stock' : 'Out of Stock'
    const name = item.products?.name ?? item.product_id
    y = tableRow(doc, [
      { text: name.length > 32 ? name.slice(0, 30) + '...' : name, x: 17 },
      { text: item.products?.sku ?? '—', x: 90 },
      { text: String(item.quantity), x: 140 },
      { text: String(item.low_stock_threshold), x: 165 },
      { text: statusLabel, x: 190 },
      { text: money(cost), x: 225 },
      { text: money(value), x: 252 },
    ], y, i % 2 === 0, W)
  })

  // Total row
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, W, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text('TOTAL INVENTORY VALUE', 17, y)
  doc.text(money(totalValue), 252, y)
  doc.setFont('helvetica', 'normal')

  // Footer
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFillColor(...C.accent)
    doc.rect(0, 200, 297, 10, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.text('TALASTOCK — Inventory & Sales Management System', 14, 206)
    doc.text(`Page ${i} of ${n}  |  CONFIDENTIAL`, 283, 206, { align: 'right' })
  }

  doc.save(`talastock-inventory-report-${now.toISOString().slice(0, 10)}.pdf`)
}

// ─── PROFIT & LOSS REPORT ─────────────────────────────────────────────────────

export function generateProfitLossReport(
  sales: Sale[],
  products: Array<{ id: string; name: string; cost_price: number; category_id: string | null; categories?: { name: string } | null }>,
  dateRange?: { from: string; to: string }
): void {
  const doc = new jsPDF()
  const now = new Date()

  // Filter sales by date range
  let filtered = sales
  if (dateRange?.from) filtered = filtered.filter(s => s.created_at >= dateRange.from)
  if (dateRange?.to) filtered = filtered.filter(s => s.created_at <= dateRange.to + 'T23:59:59')

  // Calculate metrics
  const totalRevenue = filtered.reduce((s, sale) => s + sale.total_amount, 0)
  const totalDiscounts = filtered.reduce((s, sale) => s + (sale.discount_amount ?? 0), 0)
  const netRevenue = totalRevenue - totalDiscounts

  // Calculate COGS
  const cogs = filtered.reduce((s, sale) => {
    return s + (sale.sale_items?.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.product_id)
      const costPrice = product?.cost_price ?? 0
      return itemSum + (item.quantity * costPrice)
    }, 0) ?? 0)
  }, 0)

  const grossProfit = totalRevenue - cogs
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netProfit = netRevenue - cogs
  const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

  let y = pageHeader(doc, 'Profit & Loss Report', 'Financial Performance Report')

  // Period
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  if (dateRange?.from && dateRange?.to) {
    doc.text(`Period: ${dateStr(dateRange.from)} to ${dateStr(dateRange.to)}`, 14, y)
  } else {
    doc.text(`Period: All time  |  ${filtered.length} transactions`, 14, y)
  }
  y += 10

  // ── Summary KPI boxes ──
  y = sectionTitle(doc, '1. Financial Summary', y)

  const kpis = [
    { label: 'Total Revenue', value: money(totalRevenue) },
    { label: 'Cost of Goods Sold', value: money(cogs) },
    { label: 'Gross Profit', value: money(grossProfit) },
    { label: 'Net Profit', value: money(netProfit) },
  ]
  const kW = 43
  kpis.forEach((k, i) => {
    const x = 14 + i * (kW + 2)
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, kW, 18, 2, 2, 'FD')
    doc.setFillColor(...C.accent)
    doc.roundedRect(x, y, 2.5, 18, 1, 1, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(k.label, x + 5, y + 6)
    doc.setFontSize(k.value.length > 12 ? 8 : 10)
    doc.setTextColor(...C.brand)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 5, y + 14)
    doc.setFont('helvetica', 'normal')
  })
  y += 26

  // ── Income Statement ──
  y = checkBreak(doc, y, 60)
  y = sectionTitle(doc, '2. Income Statement', y)

  // Revenue section
  doc.setFontSize(8)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text('Revenue', 17, y)
  doc.setFont('helvetica', 'normal')
  y += 7

  doc.setTextColor(...C.dark)
  doc.text('Total Sales Revenue', 20, y)
  doc.text(money(totalRevenue), 165, y)
  y += 7

  if (totalDiscounts > 0) {
    doc.setTextColor(...C.muted)
    doc.text('Less: Discounts Given', 20, y)
    doc.text(`(${money(totalDiscounts)})`, 165, y)
    y += 7
  }

  // Net Revenue
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text('Net Revenue', 17, y)
  doc.text(money(netRevenue), 165, y)
  doc.setFont('helvetica', 'normal')
  y += 12

  // Cost section
  doc.setFontSize(8)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text('Cost of Goods Sold', 17, y)
  doc.setFont('helvetica', 'normal')
  y += 7

  doc.setTextColor(...C.dark)
  doc.text('Total COGS', 20, y)
  doc.text(money(cogs), 165, y)
  y += 10

  // Gross Profit
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text('Gross Profit', 17, y)
  doc.text(money(grossProfit), 165, y)
  doc.setFont('helvetica', 'normal')
  y += 7

  doc.setFontSize(7)
  doc.setTextColor(...C.muted)
  doc.text(`Gross Margin: ${grossMargin.toFixed(1)}%`, 20, y)
  y += 12

  // Net Profit (highlighted)
  doc.setFillColor(...C.accent)
  doc.rect(14, y - 4, 182, 10, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('NET PROFIT', 17, y + 1)
  doc.text(money(netProfit), 165, y + 1)
  doc.setFont('helvetica', 'normal')
  y += 10

  doc.setFontSize(7)
  doc.setTextColor(...C.white)
  doc.text(`Net Margin: ${netMargin.toFixed(1)}%`, 20, y - 2)
  y += 12

  // ── Category Breakdown ──
  if (filtered.length > 0) {
    y = checkBreak(doc, y, 40)
    y = sectionTitle(doc, '3. Breakdown by Category', y)

    // Calculate category metrics
    const categoryMap: Record<string, { revenue: number; cogs: number; units: number }> = {}
    
    filtered.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id)
        const categoryName = product?.categories?.name ?? 'Uncategorized'
        
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = { revenue: 0, cogs: 0, units: 0 }
        }
        
        categoryMap[categoryName].revenue += item.subtotal
        categoryMap[categoryName].cogs += item.quantity * (product?.cost_price ?? 0)
        categoryMap[categoryName].units += item.quantity
      })
    })

    y = tableHead(doc, [
      { label: 'Category', x: 17 },
      { label: 'Units Sold', x: 80 },
      { label: 'Revenue', x: 115 },
      { label: 'COGS', x: 145 },
      { label: 'Gross Profit', x: 170 },
    ], y)

    Object.entries(categoryMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .forEach(([name, data], i) => {
        y = checkBreak(doc, y, 8)
        const profit = data.revenue - data.cogs
        y = tableRow(doc, [
          { text: name.length > 25 ? name.slice(0, 23) + '...' : name, x: 17 },
          { text: String(data.units), x: 80 },
          { text: money(data.revenue), x: 115 },
          { text: money(data.cogs), x: 145 },
          { text: money(profit), x: 170 },
        ], y, i % 2 === 0)
      })

    // Total row
    doc.setFillColor(...C.soft)
    doc.rect(14, y - 4, 182, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.brand)
    doc.text('TOTAL', 17, y)
    doc.text(money(totalRevenue), 115, y)
    doc.text(money(cogs), 145, y)
    doc.text(money(grossProfit), 170, y)
    doc.setFont('helvetica', 'normal')
  }

  pageFooter(doc)
  doc.save(`talastock-profit-loss-report-${now.toISOString().slice(0, 10)}.pdf`)
}
