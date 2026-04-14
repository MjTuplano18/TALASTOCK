import * as XLSX from 'xlsx'
import type { Product } from '@/types'
import { getStockStatus } from '@/types'

/**
 * Export filtered products to an Excel file (.xlsx)
 */
export function exportProductsToExcel(products: Product[], filename = 'talastock-products') {
  const rows = products.map(p => {
    const qty = p.inventory?.quantity ?? 0
    const threshold = p.inventory?.low_stock_threshold ?? 10
    const status = getStockStatus(qty, threshold)
    const statusLabel = status === 'in_stock' ? 'In Stock' : status === 'low_stock' ? 'Low Stock' : 'Out of Stock'

    return {
      'Product Name': p.name,
      'SKU': p.sku,
      'Category': p.categories?.name ?? '',
      'Price (₱)': p.price,
      'Cost Price (₱)': p.cost_price,
      'Stock Quantity': qty,
      'Low Stock Threshold': threshold,
      'Status': statusLabel,
      'Image URL': p.image_url ?? '',
      'Created At': new Date(p.created_at).toLocaleDateString('en-PH'),
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, // Product Name
    { wch: 15 }, // SKU
    { wch: 15 }, // Category
    { wch: 12 }, // Price
    { wch: 14 }, // Cost Price
    { wch: 14 }, // Stock
    { wch: 18 }, // Threshold
    { wch: 12 }, // Status
    { wch: 30 }, // Image URL
    { wch: 14 }, // Created At
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/**
 * Parse an uploaded Excel or CSV file into product rows.
 * Returns { rows, categoryNames } where categoryNames is a deduplicated list
 * of category names found in the file (for auto-creation).
 */
export interface ImportRow {
  name: string
  sku: string
  price: number
  cost_price: number
  categoryName?: string   // raw string from file
  category_id?: string | null  // resolved after category creation
  initial_quantity: number
  low_stock_threshold: number
  image_url?: string | null
}

export interface ParseResult {
  rows: ImportRow[]
  categoryNames: string[]
  errors: { row: number; message: string }[]
}

export function parseImportFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        const rows: ImportRow[] = []
        const errors: { row: number; message: string }[] = []
        const categorySet = new Set<string>()

        raw.forEach((r, i) => {
          const rowNum = i + 2 // 1-indexed + header row

          // Normalize keys (case-insensitive, handle spaces/underscores)
          const norm: Record<string, string> = {}
          Object.entries(r).forEach(([k, v]) => {
            norm[k.toLowerCase().replace(/[\s_]+/g, '_')] = String(v).trim()
          })

          const name = norm.name || norm.product_name || norm['product name'] || ''
          const sku = norm.sku || ''

          if (!name) { errors.push({ row: rowNum, message: 'Missing product name' }); return }
          if (!sku) { errors.push({ row: rowNum, message: 'Missing SKU' }); return }

          const price = parseFloat(norm.price || norm['price_(₱)'] || norm['price_(p)'] || '0')
          const cost_price = parseFloat(norm.cost_price || norm['cost_price_(₱)'] || norm['cost_price_(p)'] || '0')

          if (isNaN(price)) { errors.push({ row: rowNum, message: 'Invalid price' }); return }

          const categoryName = (norm.category || '').trim()
          if (categoryName) categorySet.add(categoryName)

          rows.push({
            name,
            sku,
            price,
            cost_price: isNaN(cost_price) ? 0 : cost_price,
            categoryName: categoryName || undefined,
            initial_quantity: parseInt(norm.initial_quantity || norm.stock_quantity || norm.quantity || '0') || 0,
            low_stock_threshold: parseInt(norm.low_stock_threshold || norm.threshold || '10') || 10,
            image_url: norm.image_url || null,
          })
        })

        resolve({ rows, categoryNames: Array.from(categorySet), errors })
      } catch (err) {
        reject(new Error('Failed to parse file. Make sure it is a valid Excel or CSV file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
