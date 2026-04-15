/**
 * Sales Import Parser
 * Parses Excel/CSV files for sales import
 */

import * as XLSX from 'xlsx'

export interface ParsedSaleItem {
  date: string
  time?: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalAmount: number
  notes?: string
  _rowNumber: number
}

export interface SalesParseResult {
  sales: ParsedSaleItem[]
  errors: Array<{ row: number; field: string; message: string }>
  warnings: Array<{ row: number; message: string }>
}

const ACCEPTED_HEADERS = {
  date: ['date', 'sale date', 'transaction date', 'day'],
  time: ['time', 'sale time', 'transaction time', 'hour'],
  productName: ['product name', 'product', 'item', 'item name', 'name'],
  sku: ['sku', 'product code', 'code', 'item code'],
  quantity: ['quantity', 'qty', 'amount', 'units', 'count'],
  unitPrice: ['unit price', 'price', 'selling price', 'sale price', 'unit cost'],
  totalAmount: ['total amount', 'total', 'amount', 'total price', 'subtotal'],
  notes: ['notes', 'note', 'remarks', 'comment', 'comments', 'description']
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_\s]+/g, ' ')
}

function findColumn(headers: string[], acceptedNames: string[]): number {
  const normalizedHeaders = headers.map(h => normalizeHeader(h))
  for (const accepted of acceptedNames) {
    const index = normalizedHeaders.indexOf(accepted)
    if (index !== -1) return index
  }
  return -1
}

function parseDate(value: any): string | null {
  if (!value) return null
  
  // Handle Excel date serial number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  
  // Handle string dates
  const str = String(value).trim()
  
  // Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }
  
  // Try MM/DD/YYYY or DD/MM/YYYY
  const parts = str.split(/[/-]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(p => parseInt(p))
    // Assume YYYY-MM-DD if first part is 4 digits
    if (a > 1000) {
      return `${a}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`
    }
    // Assume MM/DD/YYYY
    return `${c}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`
  }
  
  return null
}

function parseTime(value: any): string | null {
  if (!value) return null
  
  const str = String(value).trim().toUpperCase()
  
  // Handle HH:MM AM/PM format
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/)
  if (match) {
    let [, hours, minutes, period] = match
    let h = parseInt(hours)
    
    if (period === 'PM' && h < 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    
    return `${String(h).padStart(2, '0')}:${minutes}:00`
  }
  
  return null
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  
  // Remove currency symbols and commas
  const cleaned = String(value).replace(/[₱$,\s]/g, '')
  const num = parseFloat(cleaned)
  
  return isNaN(num) ? null : num
}

export function parseSalesFile(file: File): Promise<SalesParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Find the data sheet (skip Instructions sheet)
        let sheetName = workbook.SheetNames.find(name => 
          !name.toLowerCase().includes('instruction')
        ) || workbook.SheetNames[0]
        
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
        
        if (jsonData.length < 2) {
          return resolve({ sales: [], errors: [{ row: 0, field: 'file', message: 'File is empty or has no data rows' }], warnings: [] })
        }
        
        const headers = jsonData[0].map(h => String(h))
        const rows = jsonData.slice(1)
        
        // Find column indices
        const colIndices = {
          date: findColumn(headers, ACCEPTED_HEADERS.date),
          time: findColumn(headers, ACCEPTED_HEADERS.time),
          productName: findColumn(headers, ACCEPTED_HEADERS.productName),
          sku: findColumn(headers, ACCEPTED_HEADERS.sku),
          quantity: findColumn(headers, ACCEPTED_HEADERS.quantity),
          unitPrice: findColumn(headers, ACCEPTED_HEADERS.unitPrice),
          totalAmount: findColumn(headers, ACCEPTED_HEADERS.totalAmount),
          notes: findColumn(headers, ACCEPTED_HEADERS.notes)
        }
        
        // Validate required columns
        const missingColumns: string[] = []
        if (colIndices.date === -1) missingColumns.push('Date')
        if (colIndices.productName === -1 && colIndices.sku === -1) missingColumns.push('Product Name or SKU')
        if (colIndices.quantity === -1) missingColumns.push('Quantity')
        if (colIndices.unitPrice === -1) missingColumns.push('Unit Price')
        
        if (missingColumns.length > 0) {
          return resolve({
            sales: [],
            errors: [{ row: 0, field: 'headers', message: `Missing required columns: ${missingColumns.join(', ')}` }],
            warnings: []
          })
        }
        
        const sales: ParsedSaleItem[] = []
        const errors: Array<{ row: number; field: string; message: string }> = []
        const warnings: Array<{ row: number; message: string }> = []
        
        rows.forEach((row, index) => {
          const rowNumber = index + 2 // +2 because: 0-indexed + header row
          
          // Skip empty rows
          if (row.every(cell => !cell || String(cell).trim() === '')) return
          
          const date = parseDate(row[colIndices.date])
          const time = colIndices.time !== -1 ? parseTime(row[colIndices.time]) : null
          const productName = colIndices.productName !== -1 ? String(row[colIndices.productName] || '').trim() : ''
          const sku = colIndices.sku !== -1 ? String(row[colIndices.sku] || '').trim() : ''
          const quantity = parseNumber(row[colIndices.quantity])
          const unitPrice = parseNumber(row[colIndices.unitPrice])
          const totalAmount = colIndices.totalAmount !== -1 ? parseNumber(row[colIndices.totalAmount]) : null
          const notes = colIndices.notes !== -1 ? String(row[colIndices.notes] || '').trim() : ''
          
          // Validation
          let hasError = false
          
          if (!date) {
            errors.push({ row: rowNumber, field: 'Date', message: 'Invalid or missing date' })
            hasError = true
          }
          
          if (!productName && !sku) {
            errors.push({ row: rowNumber, field: 'Product', message: 'Product Name or SKU is required' })
            hasError = true
          }
          
          if (quantity === null || quantity <= 0) {
            errors.push({ row: rowNumber, field: 'Quantity', message: 'Quantity must be a positive number' })
            hasError = true
          }
          
          if (unitPrice === null || unitPrice < 0) {
            errors.push({ row: rowNumber, field: 'Unit Price', message: 'Unit Price must be a non-negative number' })
            hasError = true
          }
          
          // Calculate total if not provided
          const calculatedTotal = (quantity || 0) * (unitPrice || 0)
          const finalTotal = totalAmount !== null ? totalAmount : calculatedTotal
          
          // Warn if provided total doesn't match calculated
          if (totalAmount !== null && Math.abs(totalAmount - calculatedTotal) > 0.01) {
            warnings.push({ 
              row: rowNumber, 
              message: `Total Amount (${totalAmount}) doesn't match Quantity × Unit Price (${calculatedTotal.toFixed(2)})` 
            })
          }
          
          if (!hasError) {
            sales.push({
              date: date!,
              time: time || undefined,
              productName,
              sku,
              quantity: quantity!,
              unitPrice: unitPrice!,
              totalAmount: finalTotal,
              notes: notes || undefined,
              _rowNumber: rowNumber
            })
          }
        })
        
        resolve({ sales, errors, warnings })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
