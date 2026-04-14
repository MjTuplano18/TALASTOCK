import jsPDF from 'jspdf'
import type { DashboardMetrics, TopProductData, Sale, SalesChartData } from '@/types'

const BRAND: [number, number, number] = [122, 62, 46]
const MUTED: [number, number, number] = [184, 144, 128]
const BORDER: [number, number, number] = [242, 196, 176]
const ACCENT: [number, number, number] = [232, 137, 106]

function php(n: number) {
  return `\u20B1${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(current: number, previous: number): string {
  if (!previous) return '—'
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

export function exportDashboardPDF(
  metrics: DashboardMetrics,
  topProducts: TopProductData[],
  recentSales: Sale[],
  salesChart: SalesChartData[]
) {
  const doc = new jsPDF()
  const now = new Date()
  let y = 20

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFontSize(22)
  doc.setTextColor(...BRAND)
  doc.text('Talastock', 14, y)

  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text('Dashboard Report', 14, (y += 7))
  doc.text(`Generated: ${now.toLocaleString('en-PH')}`, 14, (y += 5))
  doc.text(`Period: ${now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`, 14, (y += 5))

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.line(14, (y += 4), 196, y)
  y += 8

  // ── KPI Summary ─────────────────────────────────────────────────────────────
  doc.setFontSize(11)
  doc.setTextColor(...BRAND)
  doc.text('Key Performance Indicators', 14, y)
  y += 6

  const kpis = [
    { label: 'Total Products', value: String(metrics.total_products), change: null },
    { label: 'Inventory Value', value: php(metrics.total_inventory_value), change: null },
    {
      label: 'Sales This Month', value: php(metrics.total_sales_revenue),
      change: metrics.last_month_revenue !== undefined
        ? pct(metrics.total_sales_revenue, metrics.last_month_revenue) : null
    },
    { label: 'Low Stock Items', value: String(metrics.low_stock_count), change: null },
  ]

  const colW = 45
  kpis.forEach((kpi, i) => {
    const x = 14 + i * colW
    doc.setFillColor(253, 246, 240)
    doc.roundedRect(x, y, colW - 2, 20, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(kpi.label, x + 3, y + 6)
    doc.setFontSize(10)
    doc.setTextColor(...BRAND)
    doc.text(kpi.value, x + 3, y + 14)
    if (kpi.change) {
      doc.setFontSize(7)
      doc.setTextColor(...ACCENT)
      doc.text(kpi.change + ' vs last month', x + 3, y + 19)
    }
  })
  y += 28

  // ── Sales Trend (text table) ─────────────────────────────────────────────────
  doc.setFontSize(11)
  doc.setTextColor(...BRAND)
  doc.text('Sales Trend', 14, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('Date', 14, y)
  doc.text('Sales', 80, y)
  doc.line(14, y + 2, 120, y + 2)
  y += 6

  doc.setTextColor(...BRAND)
  salesChart.slice(-7).forEach(d => {
    doc.text(d.date, 14, y)
    doc.text(php(d.sales), 80, y)
    y += 5
  })
  y += 4

  // ── Top Products ─────────────────────────────────────────────────────────────
  doc.setFontSize(11)
  doc.setTextColor(...BRAND)
  doc.text('Top Products', 14, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('Product', 14, y)
  doc.text('Units Sold', 90, y)
  doc.text('Revenue', 140, y)
  doc.line(14, y + 2, 196, y + 2)
  y += 6

  doc.setTextColor(...BRAND)
  topProducts.forEach((p, i) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.text(`${i + 1}. ${p.product}`, 14, y)
    doc.text(String(p.sales), 90, y)
    doc.text(p.revenue !== undefined ? php(p.revenue) : '—', 140, y)
    y += 5
  })
  y += 4

  // ── Recent Transactions ──────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20 }

  doc.setFontSize(11)
  doc.setTextColor(...BRAND)
  doc.text('Recent Transactions', 14, y)
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('Date', 14, y)
  doc.text('Items', 80, y)
  doc.text('Total', 150, y)
  doc.line(14, y + 2, 196, y + 2)
  y += 6

  doc.setTextColor(...BRAND)
  recentSales.forEach(sale => {
    if (y > 270) { doc.addPage(); y = 20 }
    const dateStr = new Date(sale.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const items = sale.sale_items?.length ?? 0
    doc.text(dateStr, 14, y)
    doc.text(`${items} item${items !== 1 ? 's' : ''}`, 80, y)
    doc.text(php(sale.total_amount), 150, y)
    y += 5
  })

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(`Talastock Dashboard Report — Page ${i} of ${pageCount}`, 14, 290)
  }

  doc.save(`talastock-dashboard-${now.toISOString().slice(0, 10)}.pdf`)
}
