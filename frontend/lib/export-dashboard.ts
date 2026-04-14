import jsPDF from 'jspdf'
import type { DashboardMetrics, TopProductData, Sale, SalesChartData } from '@/types'

// ─── Colors (RGB) ─────────────────────────────────────────────────────────────
const C = {
  brand:    [122, 62, 46]  as [number,number,number],
  accent:   [232, 137, 106] as [number,number,number],
  muted:    [184, 144, 128] as [number,number,number],
  border:   [242, 196, 176] as [number,number,number],
  soft:     [253, 232, 223] as [number,number,number],
  bg:       [253, 246, 240] as [number,number,number],
  white:    [255, 255, 255] as [number,number,number],
  dark:     [60, 30, 20]   as [number,number,number],
  danger:   [192, 80, 80]  as [number,number,number],
  positive: [80, 150, 80]  as [number,number,number],
}

// Use PHP instead of ₱ — jsPDF default font doesn't support Unicode peso sign
function money(n: number): string {
  return `PHP ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pctChange(current: number, previous: number): { text: string; up: boolean } | null {
  if (!previous) return null
  const change = ((current - previous) / previous) * 100
  return { text: `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs last month`, up: change >= 0 }
}

function addPage(doc: jsPDF): number {
  doc.addPage()
  return 20
}

function checkPageBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 275) return addPage(doc)
  return y
}

function sectionHeader(doc: jsPDF, title: string, y: number): number {
  // Colored bar behind section title
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 10, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 17, y + 3)
  doc.setFont('helvetica', 'normal')
  return y + 12
}

function tableHeader(doc: jsPDF, cols: { label: string; x: number }[], y: number, width = 182): number {
  doc.setFillColor(...C.brand)
  doc.rect(14, y - 4, width, 8, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  cols.forEach(c => doc.text(c.label, c.x, y + 1))
  doc.setFont('helvetica', 'normal')
  return y + 8
}

function tableRow(doc: jsPDF, cols: { text: string; x: number }[], y: number, shade: boolean): number {
  if (shade) {
    doc.setFillColor(...C.bg)
    doc.rect(14, y - 4, 182, 7, 'F')
  }
  doc.setFontSize(8)
  doc.setTextColor(...C.dark)
  cols.forEach(c => doc.text(c.text, c.x, y))
  return y + 7
}

export function exportDashboardPDF(
  metrics: DashboardMetrics,
  topProducts: TopProductData[],
  recentSales: Sale[],
  salesChart: SalesChartData[],
  categoryPerformance: import('@/types').CategoryPerformance[] = [],
  deadStock: import('@/types').DeadStockItem[] = []
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date()
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  let y = 0

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER / HEADER
  // ══════════════════════════════════════════════════════════════════════════════

  // Top accent bar
  doc.setFillColor(...C.accent)
  doc.rect(0, 0, 210, 18, 'F')

  // Company name in bar
  doc.setFontSize(14)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.text('TALASTOCK', 14, 12)

  // Report type right-aligned
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('BUSINESS PERFORMANCE REPORT', 196, 12, { align: 'right' })

  y = 28

  // Report title block
  doc.setFontSize(18)
  doc.setTextColor(...C.brand)
  doc.setFont('helvetica', 'bold')
  doc.text('Dashboard Summary', 14, y)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.muted)
  doc.text(`Reporting Period: ${monthName}`, 14, (y += 8))
  doc.text(`Generated: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 14, (y += 5))
  doc.text('Prepared by: Talastock Inventory & Sales System', 14, (y += 5))

  // Divider
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.8)
  doc.line(14, (y += 5), 196, y)
  y += 10

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — EXECUTIVE SUMMARY (KPI CARDS)
  // ══════════════════════════════════════════════════════════════════════════════
  y = sectionHeader(doc, '1. Executive Summary', y)

  const kpis = [
    {
      label: 'Total Active Products',
      value: String(metrics.total_products),
      sub: 'Products in catalog',
      color: C.brand,
    },
    {
      label: 'Inventory Value',
      value: money(metrics.total_inventory_value),
      sub: 'Total stock at cost price',
      color: C.brand,
    },
    {
      label: 'Revenue This Month',
      value: money(metrics.total_sales_revenue),
      sub: metrics.last_month_revenue !== undefined
        ? (() => {
            const c = pctChange(metrics.total_sales_revenue, metrics.last_month_revenue!)
            return c ? c.text : 'vs last month'
          })()
        : 'Current month sales',
      color: metrics.last_month_revenue !== undefined && metrics.total_sales_revenue >= metrics.last_month_revenue
        ? C.positive : C.brand,
    },
    {
      label: 'Low Stock Alerts',
      value: String(metrics.low_stock_count),
      sub: metrics.low_stock_count > 0 ? 'Items need restocking' : 'All items well stocked',
      color: metrics.low_stock_count > 0 ? C.danger : C.positive,
    },
  ]

  const cardW = 43
  const cardH = 24
  kpis.forEach((kpi, i) => {
    const x = 14 + i * (cardW + 2)

    // Card background
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD')

    // Left accent stripe
    doc.setFillColor(...kpi.color)
    doc.roundedRect(x, y, 2.5, cardH, 1, 1, 'F')

    // Label
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x + 5, y + 6)

    // Value
    doc.setFontSize(kpi.value.length > 12 ? 8 : 11)
    doc.setTextColor(...kpi.color)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + 5, y + 14)

    // Sub
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    doc.text(kpi.sub, x + 5, y + 21)
  })

  y += cardH + 10

  // Month-over-month comparison note
  if (metrics.last_month_revenue !== undefined) {
    const change = pctChange(metrics.total_sales_revenue, metrics.last_month_revenue)
    if (change) {
      doc.setFillColor(...(change.up ? [240, 255, 240] as [number,number,number] : [255, 240, 240] as [number,number,number]))
      doc.roundedRect(14, y, 182, 10, 2, 2, 'F')
      doc.setFontSize(8)
      doc.setTextColor(...(change.up ? C.positive : C.danger))
      doc.setFont('helvetica', 'bold')
      const arrow = change.up ? '▲' : '▼'
      doc.text(`${arrow}  Revenue ${change.text}  |  This month: ${money(metrics.total_sales_revenue)}  |  Last month: ${money(metrics.last_month_revenue)}`, 17, y + 6.5)
      doc.setFont('helvetica', 'normal')
      y += 16
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — SALES TREND
  // ══════════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 60)
  y = sectionHeader(doc, '2. Sales Trend Analysis', y)

  // Mini bar chart (drawn manually)
  const chartData = salesChart.slice(-7)
  const maxSales = Math.max(...chartData.map(d => d.sales), 1)
  const chartH = 30
  const chartW = 182
  const barW = Math.floor(chartW / chartData.length) - 3

  // Chart background
  doc.setFillColor(...C.bg)
  doc.rect(14, y, chartW, chartH + 12, 'F')

  // Grid lines
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  for (let g = 0; g <= 4; g++) {
    const gy = y + chartH - (g / 4) * chartH
    doc.line(14, gy, 196, gy)
    doc.setFontSize(5.5)
    doc.setTextColor(...C.muted)
    doc.text(money((maxSales * g) / 4).replace('PHP ', 'PHP '), 15, gy - 1)
  }

  // Bars
  chartData.forEach((d, i) => {
    const bh = maxSales > 0 ? (d.sales / maxSales) * chartH : 2
    const bx = 14 + i * (barW + 3) + 2
    const by = y + chartH - bh

    doc.setFillColor(...(d.sales > 0 ? C.accent : C.border))
    doc.roundedRect(bx, by, barW, bh, 1, 1, 'F')

    // Date label
    doc.setFontSize(5.5)
    doc.setTextColor(...C.muted)
    doc.text(d.date, bx + barW / 2, y + chartH + 5, { align: 'center' })

    // Value on top of bar
    if (d.sales > 0) {
      doc.setFontSize(5)
      doc.setTextColor(...C.brand)
      const label = d.sales >= 1000 ? `${(d.sales / 1000).toFixed(1)}k` : String(Math.round(d.sales))
      doc.text(label, bx + barW / 2, by - 1, { align: 'center' })
    }
  })

  y += chartH + 18

  // Sales trend table
  y = tableHeader(doc, [
    { label: 'Date', x: 17 },
    { label: 'Sales Amount (PHP)', x: 80 },
    { label: 'vs Previous Day', x: 140 },
  ], y)

  chartData.forEach((d, i) => {
    y = checkPageBreak(doc, y, 8)
    const prev = i > 0 ? chartData[i - 1].sales : null
    const diff = prev !== null ? d.sales - prev : null
    const diffText = diff !== null
      ? (diff >= 0 ? `+${money(diff)}` : money(diff))
      : '—'
    y = tableRow(doc, [
      { text: d.date, x: 17 },
      { text: money(d.sales), x: 80 },
      { text: diffText, x: 140 },
    ], y, i % 2 === 0)
  })

  // Total row
  const totalSales = chartData.reduce((s, d) => s + d.sales, 0)
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text('TOTAL (7 DAYS)', 17, y)
  doc.text(money(totalSales), 80, y)
  doc.setFont('helvetica', 'normal')
  y += 12

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — TOP PRODUCTS
  // ══════════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 50)
  y = sectionHeader(doc, '3. Top Performing Products', y)

  y = tableHeader(doc, [
    { label: 'Rank', x: 17 },
    { label: 'Product Name', x: 32 },
    { label: 'Units Sold', x: 110 },
    { label: 'Revenue (PHP)', x: 145 },
    { label: '% of Total', x: 175 },
  ], y)

  const totalRevenue = topProducts.reduce((s, p) => s + (p.revenue ?? 0), 0)

  topProducts.forEach((p, i) => {
    y = checkPageBreak(doc, y, 8)
    const revPct = totalRevenue > 0 ? ((p.revenue ?? 0) / totalRevenue * 100).toFixed(1) + '%' : '—'
    y = tableRow(doc, [
      { text: `#${i + 1}`, x: 17 },
      { text: p.product.length > 30 ? p.product.slice(0, 28) + '...' : p.product, x: 32 },
      { text: String(p.sales), x: 110 },
      { text: p.revenue !== undefined ? money(p.revenue) : '—', x: 145 },
      { text: revPct, x: 175 },
    ], y, i % 2 === 0)
  })

  // Total row
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text('TOTAL REVENUE', 32, y)
  doc.text(money(totalRevenue), 145, y)
  doc.text('100%', 175, y)
  doc.setFont('helvetica', 'normal')
  y += 12

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — RECENT TRANSACTIONS
  // ══════════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 50)
  y = sectionHeader(doc, '4. Recent Transactions', y)

  y = tableHeader(doc, [
    { label: 'Date & Time', x: 17 },
    { label: 'Products', x: 70 },
    { label: 'Items', x: 130 },
    { label: 'Total Amount (PHP)', x: 155 },
  ], y)

  recentSales.forEach((sale, i) => {
    y = checkPageBreak(doc, y, 8)
    const d = new Date(sale.created_at)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const items = sale.sale_items?.length ?? 0
    const firstProduct = sale.sale_items?.[0]?.products?.name ?? '—'
    const productText = items > 1 ? `${firstProduct} +${items - 1} more` : firstProduct

    y = tableRow(doc, [
      { text: `${dateStr} ${timeStr}`, x: 17 },
      { text: productText.length > 25 ? productText.slice(0, 23) + '...' : productText, x: 70 },
      { text: `${items} item${items !== 1 ? 's' : ''}`, x: 130 },
      { text: money(sale.total_amount), x: 155 },
    ], y, i % 2 === 0)
  })

  // Grand total
  const grandTotal = recentSales.reduce((s, sale) => s + sale.total_amount, 0)
  doc.setFillColor(...C.soft)
  doc.rect(14, y - 4, 182, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.brand)
  doc.text(`TOTAL (${recentSales.length} TRANSACTIONS)`, 17, y)
  doc.text(money(grandTotal), 155, y)
  doc.setFont('helvetica', 'normal')
  y += 12

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — PROFITABILITY ANALYSIS
  // ══════════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 50)
  y = sectionHeader(doc, '5. Profitability Analysis', y)

  const grossMargin = metrics.total_sales_revenue > 0
    ? ((metrics.gross_profit ?? 0) / metrics.total_sales_revenue * 100).toFixed(1)
    : '0'
  const aov = metrics.avg_order_value ?? 0
  const totalOrders = metrics.total_sales_count ?? 0

  // Profit summary boxes
  const profitKpis = [
    { label: 'Gross Profit', value: money(metrics.gross_profit ?? 0), sub: `${grossMargin}% margin` },
    { label: 'Avg Order Value', value: money(aov), sub: `${totalOrders} total orders` },
    { label: 'Revenue per Product', value: metrics.total_products > 0 ? money(metrics.total_sales_revenue / metrics.total_products) : 'N/A', sub: 'avg per active product' },
    { label: 'Dead Stock Items', value: String(deadStock.length), sub: 'no sales in 30 days' },
  ]

  const pkW = 43
  profitKpis.forEach((kpi, i) => {
    const x = 14 + i * (pkW + 2)
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, pkW, 20, 2, 2, 'FD')
    doc.setFillColor(...C.accent)
    doc.roundedRect(x, y, 2.5, 20, 1, 1, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label, x + 5, y + 6)
    doc.setFontSize(9)
    doc.setTextColor(...C.brand)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + 5, y + 13)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    doc.text(kpi.sub, x + 5, y + 19)
  })
  y += 28

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — CATEGORY PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════════
  if (categoryPerformance.length > 0) {
    y = checkPageBreak(doc, y, 50)
    y = sectionHeader(doc, '6. Sales by Category', y)

    y = tableHeader(doc, [
      { label: 'Category', x: 17 },
      { label: 'Units Sold', x: 90 },
      { label: 'Revenue (PHP)', x: 130 },
      { label: '% of Total', x: 170 },
    ], y)

    const catTotal = categoryPerformance.reduce((s, c) => s + c.revenue, 0)
    categoryPerformance.forEach((cat, i) => {
      y = checkPageBreak(doc, y, 8)
      const pct = catTotal > 0 ? (cat.revenue / catTotal * 100).toFixed(1) + '%' : '—'
      y = tableRow(doc, [
        { text: cat.category, x: 17 },
        { text: String(cat.units), x: 90 },
        { text: money(cat.revenue), x: 130 },
        { text: pct, x: 170 },
      ], y, i % 2 === 0)
    })

    doc.setFillColor(...C.soft)
    doc.rect(14, y - 4, 182, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.brand)
    doc.text('TOTAL', 17, y)
    doc.text(money(catTotal), 130, y)
    doc.text('100%', 170, y)
    doc.setFont('helvetica', 'normal')
    y += 12
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 7 — DEAD STOCK REPORT
  // ══════════════════════════════════════════════════════════════════════════════
  if (deadStock.length > 0) {
    y = checkPageBreak(doc, y, 50)
    y = sectionHeader(doc, '7. Dead Stock Report (No Sales in 30 Days)', y)

    // Warning note
    doc.setFillColor(255, 245, 245)
    doc.roundedRect(14, y, 182, 10, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...C.danger)
    doc.setFont('helvetica', 'bold')
    const deadValue = deadStock.reduce((s, i) => s + i.value, 0)
    doc.text(`${deadStock.length} products with no movement — Total tied-up capital: ${money(deadValue)}`, 17, y + 6.5)
    doc.setFont('helvetica', 'normal')
    y += 16

    y = tableHeader(doc, [
      { label: 'Product', x: 17 },
      { label: 'SKU', x: 90 },
      { label: 'Qty', x: 125 },
      { label: 'Value (PHP)', x: 145 },
      { label: 'Last Sale', x: 175 },
    ], y)

    deadStock.slice(0, 15).forEach((item, i) => {
      y = checkPageBreak(doc, y, 8)
      const lastSale = item.days_since_last_sale !== null
        ? `${item.days_since_last_sale}d ago`
        : 'Never'
      y = tableRow(doc, [
        { text: item.product.length > 28 ? item.product.slice(0, 26) + '...' : item.product, x: 17 },
        { text: item.sku, x: 90 },
        { text: String(item.quantity), x: 125 },
        { text: money(item.value), x: 145 },
        { text: lastSale, x: 175 },
      ], y, i % 2 === 0)
    })
    y += 4
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ══════════════════════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Bottom bar
    doc.setFillColor(...C.accent)
    doc.rect(0, 285, 210, 12, 'F')

    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'normal')
    doc.text('TALASTOCK — Inventory & Sales Management System', 14, 292)
    doc.text(`Page ${i} of ${pageCount}  |  CONFIDENTIAL`, 196, 292, { align: 'right' })
  }

  doc.save(`talastock-report-${now.toISOString().slice(0, 10)}.pdf`)
}
