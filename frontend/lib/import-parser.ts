import * as XLSX from 'xlsx'

export interface ParsedRow {
  rowNumber: number
  sku: string
  productName: string
  category: string
  quantity: number | null
  threshold: number | null
  price: number | null
  costPrice: number | null
  raw: any
}

export async function parseImportFile(file: File): Promise<ParsedRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file)
  } else if (extension === 'csv') {
    return parseCSV(file)
  } else {
    throw new Error('Unsupported file format. Please use .xlsx or .csv files.')
  }
}

async function parseExcel(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
  
  return normalizeData(jsonData as any[][])
}

async function parseCSV(file: File): Promise<ParsedRow[]> {
  const text = await file.text()
  
  // Detect delimiter
  const firstLine = text.split('\n')[0]
  let delimiter = ','
  if (firstLine.includes(';')) delimiter = ';'
  else if (firstLine.includes('\t')) delimiter = '\t'
  
  const lines = text.split('\n').filter(line => line.trim())
  const data = lines.map(line => {
    // Handle quoted values with delimiters inside
    const regex = new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`)
    return line.split(regex).map(cell => cell.replace(/^"|"$/g, '').trim())
  })
  
  return normalizeData(data)
}

function normalizeData(data: any[][]): ParsedRow[] {
  if (data.length === 0) {
    throw new Error('File is empty')
  }
  
  if (data.length === 1) {
    throw new Error('File contains only headers, no data rows')
  }
  
  const headers = data[0].map((h: string) => String(h).trim().toLowerCase())
  const rows = data.slice(1)
  
  return rows
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map((row, index) => ({
      rowNumber: index + 2, // +2 because: 0-indexed + header row
      sku: getCellValue(row, headers, ['sku', 'product code', 'code']),
      productName: getCellValue(row, headers, ['product name', 'name', 'product', 'item name', 'item']),
      category: getCellValue(row, headers, ['category', 'cat']),
      quantity: parseNumber(getCellValue(row, headers, ['quantity', 'qty', 'stock', 'amount'])),
      threshold: parseNumber(getCellValue(row, headers, ['threshold', 'low stock threshold', 'min stock', 'minimum', 'reorder point'])),
      price: parseNumber(getCellValue(row, headers, ['price', 'selling price', 'unit price'])),
      costPrice: parseNumber(getCellValue(row, headers, ['cost price', 'cost', 'purchase price', 'cost_price'])),
      raw: row,
    }))
}

function getCellValue(row: any[], headers: string[], possibleNames: string[]): string {
  for (const name of possibleNames) {
    const index = headers.indexOf(name)
    if (index !== -1 && row[index] !== undefined && row[index] !== null) {
      return String(row[index]).trim()
    }
  }
  return ''
}

function parseNumber(value: string): number | null {
  if (!value || value === '') return null
  
  // Remove common formatting
  const cleaned = value.replace(/[,\s]/g, '')
  const num = parseFloat(cleaned)
  
  if (isNaN(num)) return null
  return num
}
