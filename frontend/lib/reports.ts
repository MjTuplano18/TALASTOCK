import jsPDF from 'jspdf'
import type { Sale, InventoryItem } from '@/types'

const BRAND_COLOR: [number, number, number] = [122, 62, 46]   // #7A3E2E
const MUTED_COLOR: [number, number, number] = [184, 144, 128]  // #B89080
const BORDER_COLOR: [number, number, number] = [242, 196, 176] // #F2C4B0

function formatPHP(amount: number): string {
  return `\u20B1${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateStr(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function drawHeader(doc: jsPDF, subtitle: string) {
  doc.setFontSize(20)
  doc.setTextColor(...BRAND_COLOR)
  doc.text('Talastock', 14, 20)

  doc.setFontSize(12)
  doc.setTextColor(...MUTED_COLOR)
  doc.text(subtitle, 14, 28)

  doc.setDrawColor(...BORDER_COLOR)
  doc.setLineWidth(0.5)
  doc.line(14, 32, 196, 32)
}

function drawTimestamp(doc: jsPDF, y: number): number {
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_COLOR)
  doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 14, y)
  return y + 6
}

// ─── Sales Report ─────────────────────────────────────────────────────────────

export function generateSalesReport(
  sales: Sale[],
  dateRange?: { from: string; to: string }
): void {
  const doc = new jsPDF()

  drawHeader(doc, 'Sales Report')

  let y = 38

  if (dateRange?.from && dateRange?.to) {
    doc.setFontSize(9)
    doc.setTextColor(...MUTED_COLOR)
    doc.text(
      `Date range: ${formatDateStr(dateRange.from)} – ${formatDateStr(dateRange.to)}`,
      14,
      y
    )
    y += 6
  }

  y = drawTimestamp(doc, y)
  y += 4

  // Table header
  const colDate = 14
  const colItems = 80
  const colTotal = 150

  doc.setFontSize(9)
  doc.setTextColor(...MUTED_COLOR)
  doc.text('Date', colDate, y)
  doc.text('Items', colItems, y)
  doc.text('Total Amount', colTotal, y)

  doc.setDrawColor(...BORDER_COLOR)
  doc.line(14, y + 2, 196, y + 2)
  y += 8

  // Filter by date range if provided
  let filtered = sales
  if (dateRange?.from) {
    filtered = filtered.filter(s => s.created_at >= dateRange.from)
  }
  if (dateRange?.to) {
    filtered = filtered.filter(s => s.created_at <= dateRange.to + 'T23:59:59')
  }

  let grandTotal = 0

  doc.setTextColor(...BRAND_COLOR)
  for (const sale of filtered) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    const itemCount = sale.sale_items?.length ?? 0
    doc.setFontSize(9)
    doc.text(formatDateStr(sale.created_at), colDate, y)
    doc.text(String(itemCount), colItems, y)
    doc.text(formatPHP(sale.total_amount), colTotal, y)

    grandTotal += sale.total_amount
    y += 7
  }

  // Grand total
  doc.setDrawColor(...BORDER_COLOR)
  doc.line(14, y, 196, y)
  y += 6

  doc.setFontSize(10)
  doc.setTextColor(...BRAND_COLOR)
  doc.text('Grand Total', colItems, y)
  doc.text(formatPHP(grandTotal), colTotal, y)

  doc.save('talastock-sales-report.pdf')
}

// ─── Inventory Report ─────────────────────────────────────────────────────────

export function generateInventoryReport(inventory: InventoryItem[]): void {
  const doc = new jsPDF({ orientation: 'landscape' })

  drawHeader(doc, 'Inventory Report')

  let y = 38
  y = drawTimestamp(doc, y)
  y += 4

  // Column positions (landscape: 297mm wide, usable ~14–283)
  const colProduct = 14
  const colSKU = 80
  const colQty = 130
  const colThreshold = 155
  const colStatus = 185
  const colValue = 240

  // Table header
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_COLOR)
  doc.text('Product', colProduct, y)
  doc.text('SKU', colSKU, y)
  doc.text('Qty', colQty, y)
  doc.text('Threshold', colThreshold, y)
  doc.text('Status', colStatus, y)
  doc.text('Value', colValue, y)

  doc.setDrawColor(...BORDER_COLOR)
  doc.line(14, y + 2, 283, y + 2)
  y += 8

  let totalValue = 0

  doc.setTextColor(...BRAND_COLOR)
  for (const item of inventory) {
    if (y > 185) {
      doc.addPage()
      y = 20
    }

    const costPrice = item.products?.cost_price ?? 0
    const value = item.quantity * costPrice
    totalValue += value

    let status = 'In Stock'
    if (item.quantity === 0) status = 'Out of Stock'
    else if (item.quantity <= item.low_stock_threshold) status = 'Low Stock'

    doc.setFontSize(9)
    const productName = item.products?.name ?? item.product_id
    doc.text(productName.length > 30 ? productName.slice(0, 28) + '…' : productName, colProduct, y)
    doc.text(item.products?.sku ?? '—', colSKU, y)
    doc.text(String(item.quantity), colQty, y)
    doc.text(String(item.low_stock_threshold), colThreshold, y)
    doc.text(status, colStatus, y)
    doc.text(formatPHP(value), colValue, y)

    y += 7
  }

  // Total
  doc.setDrawColor(...BORDER_COLOR)
  doc.line(14, y, 283, y)
  y += 6

  doc.setFontSize(10)
  doc.setTextColor(...BRAND_COLOR)
  doc.text('Total Inventory Value', colStatus, y)
  doc.text(formatPHP(totalValue), colValue, y)

  doc.save('talastock-inventory-report.pdf')
}
