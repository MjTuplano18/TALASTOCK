import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Sale } from '@/types'

// Export all transactions to PDF
export function exportTransactionsPDF(sales: Sale[], startDate: string, endDate: string) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(122, 62, 46) // #7A3E2E
  doc.text('Talastock', 14, 20)
  
  doc.setFontSize(16)
  doc.text('Transaction Report', 14, 30)
  
  doc.setFontSize(10)
  doc.setTextColor(184, 144, 128) // #B89080
  const startDateFormatted = new Date(startDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const endDateFormatted = new Date(endDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  doc.text(`Period: ${startDateFormatted} - ${endDateFormatted}`, 14, 38)
  doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 14, 44)
  
  // Summary
  const totalTransactions = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  
  doc.setFontSize(10)
  doc.setTextColor(122, 62, 46)
  doc.text(`Total Transactions: ${totalTransactions}`, 14, 54)
  doc.text(`Total Revenue: PHP ${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 60)
  doc.text(`Average Transaction: PHP ${avgTransaction.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 66)
  
  // Table
  const tableData = sales.map(sale => {
    const itemCount = sale.sale_items?.length ?? 0
    const firstProduct = sale.sale_items?.[0]?.products?.name ?? 'Unknown'
    const items = itemCount > 1 ? `${firstProduct} +${itemCount - 1} more` : firstProduct
    
    return [
      `#${sale.id.slice(0, 8).toUpperCase()}`,
      new Date(sale.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      new Date(sale.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      items,
      `PHP ${sale.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]
  })
  
  autoTable(doc, {
    startY: 74,
    head: [['Transaction ID', 'Date', 'Time', 'Items', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [232, 137, 106], // #E8896A
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [122, 62, 46],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [253, 246, 240] // #FDF6F0
    },
    margin: { top: 74 }
  })
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(184, 144, 128)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  doc.save(`transactions_${startDateFormatted}_to_${endDateFormatted}.pdf`)
}

// Export single transaction receipt to PDF
export function exportSingleTransactionPDF(sale: Sale) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(122, 62, 46)
  doc.text('Talastock', 14, 20)
  
  doc.setFontSize(14)
  doc.text('Sales Receipt', 14, 30)
  
  // Transaction Info
  doc.setFontSize(10)
  doc.setTextColor(184, 144, 128)
  doc.text('Transaction Details', 14, 42)
  
  doc.setTextColor(122, 62, 46)
  doc.setFontSize(9)
  doc.text(`Transaction ID: #${sale.id.slice(0, 8).toUpperCase()}`, 14, 50)
  doc.text(`Date: ${new Date(sale.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 56)
  doc.text(`Time: ${new Date(sale.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`, 14, 62)
  
  // Items Table
  const itemsData = sale.sale_items?.map(item => {
    const product = item.products
    return [
      product?.name ?? 'Unknown',
      item.quantity.toString(),
      `PHP ${item.unit_price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `PHP ${(item.quantity * item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]
  }) ?? []
  
  autoTable(doc, {
    startY: 72,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: itemsData,
    theme: 'grid',
    headStyles: {
      fillColor: [232, 137, 106],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [122, 62, 46],
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  })
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setTextColor(122, 62, 46)
  doc.text('Total:', 120, finalY)
  doc.setTextColor(232, 137, 106)
  doc.setFontSize(14)
  doc.text(
    `PHP ${sale.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    180,
    finalY,
    { align: 'right' }
  )
  
  // Notes
  if (sale.notes) {
    doc.setFontSize(9)
    doc.setTextColor(184, 144, 128)
    doc.text('Notes:', 14, finalY + 15)
    doc.setTextColor(122, 62, 46)
    doc.text(sale.notes, 14, finalY + 21)
  }
  
  // Footer
  doc.setFontSize(8)
  doc.setTextColor(184, 144, 128)
  doc.text(
    'Thank you for your business!',
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: 'center' }
  )
  doc.text(
    `Generated: ${new Date().toLocaleString('en-PH')}`,
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 14,
    { align: 'center' }
  )
  
  doc.save(`receipt_${sale.id.slice(0, 8)}.pdf`)
}

// Export transactions to Excel
export function exportTransactionsExcel(sales: Sale[], startDate: string, endDate: string) {
  const startDateFormatted = new Date(startDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const endDateFormatted = new Date(endDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  // Prepare data
  const data = sales.map(sale => {
    const itemCount = sale.sale_items?.length ?? 0
    const items = sale.sale_items?.map(item => item.products?.name ?? 'Unknown').join(', ') ?? ''
    
    return {
      'Transaction ID': sale.id,
      'Date': new Date(sale.created_at).toLocaleDateString('en-PH'),
      'Time': new Date(sale.created_at).toLocaleTimeString('en-PH'),
      'Items Count': itemCount,
      'Items': items,
      'Total Amount': sale.total_amount,
      'Notes': sale.notes ?? ''
    }
  })
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 36 }, // Transaction ID
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 10 }, // Items Count
    { wch: 50 }, // Items
    { wch: 15 }, // Total Amount
    { wch: 30 }  // Notes
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
  
  // Add summary sheet
  const totalTransactions = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  
  const summaryData = [
    { Metric: 'Period', Value: `${startDateFormatted} - ${endDateFormatted}` },
    { Metric: 'Total Transactions', Value: totalTransactions },
    { Metric: 'Total Revenue', Value: totalRevenue },
    { Metric: 'Average Transaction', Value: avgTransaction },
    { Metric: 'Generated', Value: new Date().toLocaleString('en-PH') }
  ]
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  
  // Save file
  XLSX.writeFile(wb, `transactions_${startDateFormatted}_to_${endDateFormatted}.xlsx`)
}

// Export transactions to CSV
export function exportTransactionsCSV(sales: Sale[], startDate: string, endDate: string) {
  const startDateFormatted = new Date(startDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const endDateFormatted = new Date(endDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  // Prepare data
  const data = sales.map(sale => {
    const itemCount = sale.sale_items?.length ?? 0
    const items = sale.sale_items?.map(item => item.products?.name ?? 'Unknown').join('; ') ?? ''
    
    return {
      'Transaction ID': sale.id,
      'Date': new Date(sale.created_at).toLocaleDateString('en-PH'),
      'Time': new Date(sale.created_at).toLocaleTimeString('en-PH'),
      'Items Count': itemCount,
      'Items': items,
      'Total Amount': sale.total_amount,
      'Notes': sale.notes ?? ''
    }
  })
  
  // Create workbook and convert to CSV
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
  
  // Save as CSV
  XLSX.writeFile(wb, `transactions_${startDateFormatted}_to_${endDateFormatted}.csv`, { bookType: 'csv' })
}
