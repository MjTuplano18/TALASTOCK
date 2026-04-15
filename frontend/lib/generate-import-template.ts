import * as XLSX from 'xlsx'

export function generateImportTemplate(): void {
  // Sample data
  const sampleData = [
    {
      'SKU': 'ABC123',
      'Product Name': 'Widget A',
      'Category': 'Electronics',
      'Quantity': 100,
      'Low Stock Threshold': 10,
      'Price': 150,
      'Cost Price': 100,
    },
    {
      'SKU': 'DEF456',
      'Product Name': 'Widget B',
      'Category': 'Hardware',
      'Quantity': 50,
      'Low Stock Threshold': 5,
      'Price': 250,
      'Cost Price': 180,
    },
    {
      'SKU': 'GHI789',
      'Product Name': 'Widget C',
      'Category': 'Electronics',
      'Quantity': 75,
      'Low Stock Threshold': 15,
      'Price': 320,
      'Cost Price': 220,
    },
  ]
  
  // Instructions sheet
  const instructions = [
    ['Talastock Inventory Import Template'],
    [''],
    ['Instructions:'],
    ['1. Fill in the data starting from row 2 (keep the header row)'],
    ['2. SKU or Product Name is required (SKU is preferred for accuracy)'],
    ['3. All columns except SKU/Product Name are optional (leave blank to skip update)'],
    ['4. Category is for reference only (used for validation)'],
    ['5. Save the file and import it in Talastock'],
    [''],
    ['Column Descriptions:'],
    ['- SKU: Unique product code (recommended for accurate matching)'],
    ['- Product Name: Name of the product (used if SKU is not provided)'],
    ['- Category: Product category (optional, for validation)'],
    ['- Quantity: Stock quantity to set or add'],
    ['- Low Stock Threshold: Minimum stock level before alert'],
    ['- Price: Selling price (will update product price if provided)'],
    ['- Cost Price: Purchase/cost price (will update if provided)'],
    [''],
    ['Import Modes:'],
    ['- Replace: Set quantity to the value in this file'],
    ['- Add: Add the value in this file to current quantity'],
    [''],
    ['Tips:'],
    ['- Use SKU for best accuracy (avoids name conflicts)'],
    ['- Leave Quantity blank if you only want to update Threshold/Price'],
    ['- Leave Price/Cost Price blank if you only want to update Quantity'],
    ['- Price and Cost Price will update the product record if provided'],
    ['- Maximum 1000 rows per import'],
    ['- File size limit: 5MB'],
  ]
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  
  // Add instructions sheet
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  instructionsSheet['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')
  
  // Add data sheet
  const dataSheet = XLSX.utils.json_to_sheet(sampleData)
  dataSheet['!cols'] = [
    { wch: 15 }, // SKU
    { wch: 30 }, // Product Name
    { wch: 20 }, // Category
    { wch: 12 }, // Quantity
    { wch: 20 }, // Threshold
    { wch: 12 }, // Price
    { wch: 12 }, // Cost Price
  ]
  
  // Style header row (bold)
  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!dataSheet[cellAddress]) continue
    dataSheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FDE8DF' } },
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Import Data')
  
  // Download file
  const filename = 'talastock-inventory-import-template.xlsx'
  XLSX.writeFile(workbook, filename)
}
