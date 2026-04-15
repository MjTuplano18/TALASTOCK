import * as XLSX from 'xlsx'
import type { InventoryItem } from '@/types'
import { getStockStatus } from '@/types'
import { formatDate } from '@/lib/utils'

export async function exportInventoryToExcel(inventory: InventoryItem[]): Promise<void> {
  const data = prepareExportData(inventory)
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Product Name
    { wch: 15 }, // SKU
    { wch: 20 }, // Category
    { wch: 12 }, // Quantity
    { wch: 18 }, // Threshold
    { wch: 12 }, // Price
    { wch: 12 }, // Cost Price
    { wch: 15 }, // Status
    { wch: 20 }, // Last Updated
  ]
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = `inventory-export-${timestamp}.xlsx`
  
  // Download file
  XLSX.writeFile(workbook, filename)
}

export async function exportInventoryToCSV(inventory: InventoryItem[]): Promise<void> {
  const data = prepareExportData(inventory)
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Convert to CSV
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = `inventory-export-${timestamp}.csv`
  
  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function prepareExportData(inventory: InventoryItem[]) {
  return inventory.map(item => ({
    'Product Name': item.products?.name || '',
    'SKU': item.products?.sku || '',
    'Category': item.products?.categories?.name || '',
    'Quantity': item.quantity,
    'Low Stock Threshold': item.low_stock_threshold,
    'Price': item.products?.price || 0,
    'Cost Price': item.products?.cost_price || 0,
    'Status': getStatusLabel(getStockStatus(item.quantity, item.low_stock_threshold)),
    'Last Updated': formatDate(item.updated_at),
  }))
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'in_stock': return 'In Stock'
    case 'low_stock': return 'Low Stock'
    case 'out_of_stock': return 'Out of Stock'
    default: return status
  }
}
