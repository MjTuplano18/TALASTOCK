import * as XLSX from 'xlsx'

export function generateProductsTemplate(): void {
  // Sample data
  const sampleData = [
    {
      'Product Name': 'Sample Product',
      'SKU': 'PROD-001',
      'Category': 'Electronics',
      'Price': 150,
      'Cost Price': 100,
      'Initial Quantity': 50,
      'Low Stock Threshold': 10,
      'Image URL': '',
    },
    {
      'Product Name': 'Another Product',
      'SKU': 'PROD-002',
      'Category': 'Chocolates',
      'Price': 250,
      'Cost Price': 180,
      'Initial Quantity': 100,
      'Low Stock Threshold': 20,
      'Image URL': '',
    },
    {
      'Product Name': 'Third Product',
      'SKU': 'PROD-003',
      'Category': 'Hardware',
      'Price': 320,
      'Cost Price': 220,
      'Initial Quantity': 75,
      'Low Stock Threshold': 15,
      'Image URL': '',
    },
  ]
  
  // Instructions sheet
  const instructions = [
    ['Talastock Products Import Template'],
    [''],
    ['Instructions:'],
    ['1. Fill in the data starting from row 2 (keep the header row)'],
    ['2. Product Name and SKU are required'],
    ['3. Price and Cost Price are required (must be numbers)'],
    ['4. Category is optional (will be created if it doesn\'t exist)'],
    ['5. Initial Quantity is optional (defaults to 0)'],
    ['6. Low Stock Threshold is optional (defaults to 10)'],
    ['7. Image URL is optional (leave blank if no image)'],
    ['8. Save the file and import it in Talastock'],
    [''],
    ['Column Descriptions:'],
    ['- Product Name: Name of the product (required)'],
    ['- SKU: Unique product code (required, must be unique)'],
    ['- Category: Product category (optional, will be created if new)'],
    ['- Price: Selling price (required, must be positive number)'],
    ['- Cost Price: Purchase/cost price (required, must be positive number)'],
    ['- Initial Quantity: Starting stock quantity (optional, defaults to 0)'],
    ['- Low Stock Threshold: Minimum stock level before alert (optional, defaults to 10)'],
    ['- Image URL: Product image URL (optional)'],
    [''],
    ['Important Notes:'],
    ['- SKU must be unique across all products'],
    ['- Price and Cost Price must be numbers (no currency symbols)'],
    ['- Initial Quantity is for NEW products only (use Inventory Import to update existing stock)'],
    ['- Categories will be automatically created if they don\'t exist'],
    ['- Maximum 1000 rows per import'],
    ['- File size limit: 5MB'],
    [''],
    ['Difference from Inventory Import:'],
    ['- Products Import: Creates NEW products with Initial Quantity'],
    ['- Inventory Import: Updates EXISTING products with Quantity (can add or replace)'],
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
    { wch: 30 }, // Product Name
    { wch: 15 }, // SKU
    { wch: 20 }, // Category
    { wch: 12 }, // Price
    { wch: 12 }, // Cost Price
    { wch: 16 }, // Initial Quantity
    { wch: 20 }, // Low Stock Threshold
    { wch: 40 }, // Image URL
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
  const filename = 'talastock-products-import-template.xlsx'
  XLSX.writeFile(workbook, filename)
}
