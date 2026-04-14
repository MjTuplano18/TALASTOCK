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
 * Sanitize user input to prevent XSS attacks
 */
function sanitizeString(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // Remove HTML/script injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
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
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File too large. Maximum size is 5MB.'))
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        // Limit number of rows (prevent DoS)
        if (raw.length > 1000) {
          reject(new Error('Too many rows. Maximum is 1000 products per import.'))
          return
        }

        const rows: ImportRow[] = []
        const errors: { row: number; message: string }[] = []
        const categorySet = new Set<string>()

        raw.forEach((r, i) => {
          const rowNum = i + 2 // 1-indexed + header row

          // Normalize keys (case-insensitive, handle spaces/underscores)
          const norm: Record<string, string> = {}
          Object.entries(r).forEach(([k, v]) => {
            norm[k.toLowerCase().replace(/[\s_]+/g, '_')] = sanitizeString(String(v))
          })

          const name = norm.name || norm.product_name || norm['product name'] || ''
          const sku = norm.sku || ''

          if (!name) { errors.push({ row: rowNum, message: 'Missing product name' }); return }
          if (!sku) { errors.push({ row: rowNum, message: 'Missing SKU' }); return }

          // Validate name and SKU length
          if (name.length > 200) { errors.push({ row: rowNum, message: 'Product name too long (max 200 chars)' }); return }
          if (sku.length > 50) { errors.push({ row: rowNum, message: 'SKU too long (max 50 chars)' }); return }

          const price = parseFloat(norm.price || norm['price_(₱)'] || norm['price_(p)'] || '0')
          const cost_price = parseFloat(norm.cost_price || norm['cost_price_(₱)'] || norm['cost_price_(p)'] || '0')

          if (isNaN(price) || price < 0) { errors.push({ row: rowNum, message: 'Invalid price' }); return }
          if (isNaN(cost_price) || cost_price < 0) { errors.push({ row: rowNum, message: 'Invalid cost price' }); return }

          const categoryName = (norm.category || '').trim()
          if (categoryName) {
            if (categoryName.length > 100) {
              errors.push({ row: rowNum, message: 'Category name too long (max 100 chars)' })
              return
            }
            categorySet.add(categoryName)
          }

          // Validate image URL if provided
          const imageUrl = norm.image_url || null
          if (imageUrl) {
            try {
              const url = new URL(imageUrl)
              if (url.protocol !== 'https:') {
                errors.push({ row: rowNum, message: 'Image URL must use HTTPS' })
                return
              }
            } catch {
              errors.push({ row: rowNum, message: 'Invalid image URL' })
              return
            }
          }

          const initialQty = parseInt(norm.initial_quantity || norm.stock_quantity || norm.quantity || '0') || 0
          const threshold = parseInt(norm.low_stock_threshold || norm.threshold || '10') || 10

          if (initialQty < 0 || initialQty > 1000000) {
            errors.push({ row: rowNum, message: 'Invalid quantity (must be 0-1,000,000)' })
            return
          }

          rows.push({
            name: sanitizeString(name),
            sku: sanitizeString(sku),
            price,
            cost_price,
            categoryName: categoryName || undefined,
            initial_quantity: initialQty,
            low_stock_threshold: threshold,
            image_url: imageUrl,
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
