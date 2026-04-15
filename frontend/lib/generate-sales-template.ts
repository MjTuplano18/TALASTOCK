/**
 * Generate Sales Import Template
 * Creates an Excel template for importing historical sales data
 */

import * as XLSX from 'xlsx'

export function generateSalesTemplate() {
  // Template headers
  const headers = [
    'Date',
    'Time',
    'Product Name',
    'SKU',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'Notes'
  ]

  // Sample data to guide users
  const sampleData = [
    {
      'Date': '2024-01-15',
      'Time': '10:30 AM',
      'Product Name': 'Canned Corn 150g',
      'SKU': 'FOD-CAN-002',
      'Quantity': 5,
      'Unit Price': 60.00,
      'Total Amount': 300.00,
      'Notes': 'Regular customer purchase'
    },
    {
      'Date': '2024-01-15',
      'Time': '02:45 PM',
      'Product Name': 'Salt 500g',
      'SKU': 'FOD-SAL-001',
      'Quantity': 10,
      'Unit Price': 25.00,
      'Total Amount': 250.00,
      'Notes': 'Bulk order'
    },
    {
      'Date': '2024-01-16',
      'Time': '09:15 AM',
      'Product Name': 'KitKat 35g',
      'SKU': 'SNC-KIT-001',
      'Quantity': 3,
      'Unit Price': 45.00,
      'Total Amount': 135.00,
      'Notes': ''
    }
  ]

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Create Instructions sheet
  const instructions = [
    ['SALES IMPORT TEMPLATE - INSTRUCTIONS'],
    [''],
    ['HOW TO USE THIS TEMPLATE:'],
    ['1. Fill in the "Sales Data" sheet with your historical sales'],
    ['2. Date format: YYYY-MM-DD (e.g., 2024-01-15)'],
    ['3. Time format: HH:MM AM/PM (e.g., 10:30 AM) - Optional'],
    ['4. Product Name and SKU must match existing products in your inventory'],
    ['5. Quantity must be a positive number'],
    ['6. Unit Price should be the selling price at the time of sale'],
    ['7. Total Amount will be calculated automatically (Quantity × Unit Price)'],
    ['8. Notes are optional'],
    [''],
    ['IMPORTANT NOTES:'],
    ['• Products must exist in your inventory before importing sales'],
    ['• Sales will be recorded with the date/time you specify'],
    ['• Inventory will NOT be adjusted - this is for historical data only'],
    ['• If you want inventory to be adjusted, use the regular "Record Sale" feature'],
    ['• Delete the sample rows before importing your actual data'],
    [''],
    ['TIPS:'],
    ['• You can import multiple sales at once'],
    ['• Group sales by date for better organization'],
    ['• Use the Notes field to add context (customer name, payment method, etc.)'],
    ['• If Time is not provided, it will default to 12:00 PM'],
    [''],
    ['EXAMPLE FORMAT:'],
    ['Date', 'Time', 'Product Name', 'SKU', 'Quantity', 'Unit Price', 'Total Amount', 'Notes'],
    ['2024-01-15', '10:30 AM', 'Canned Corn 150g', 'FOD-CAN-002', '5', '60.00', '300.00', 'Regular customer'],
    ['2024-01-15', '02:45 PM', 'Salt 500g', 'FOD-SAL-001', '10', '25.00', '250.00', 'Bulk order'],
  ]

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions)
  
  // Set column widths for instructions
  wsInstructions['!cols'] = [
    { wch: 80 }
  ]

  // Style the title row
  if (wsInstructions['A1']) {
    wsInstructions['A1'].s = {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: 'E8896A' } }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')

  // Create Sales Data sheet with sample data
  const wsSales = XLSX.utils.json_to_sheet(sampleData)
  
  // Set column widths
  wsSales['!cols'] = [
    { wch: 12 },  // Date
    { wch: 10 },  // Time
    { wch: 25 },  // Product Name
    { wch: 15 },  // SKU
    { wch: 10 },  // Quantity
    { wch: 12 },  // Unit Price
    { wch: 14 },  // Total Amount
    { wch: 30 }   // Notes
  ]

  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Data')

  // Generate and download
  XLSX.writeFile(wb, 'talastock-sales-import-template.xlsx')
}
