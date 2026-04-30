/**
 * Export Import History to Excel/CSV
 */

import type { ImportHistory } from '@/types'
import { toast } from 'sonner'

/**
 * Export import history to Excel
 */
export function exportImportHistoryToExcel(imports: ImportHistory[], filename: string = 'talastock-imports') {
  try {
    // Create CSV content
    const headers = [
      'File Name',
      'Entity Type',
      'Status',
      'Total Rows',
      'Successful',
      'Failed',
      'Quality Score',
      'Processing Time (ms)',
      'Date',
      'Rolled Back',
      'Has Conflicts',
    ]

    const rows = imports.map(imp => [
      imp.file_name,
      imp.entity_type,
      imp.status,
      imp.total_rows,
      imp.successful_rows,
      imp.failed_rows,
      imp.quality_score?.toFixed(0) || '0',
      imp.processing_time_ms || '0',
      new Date(imp.created_at).toLocaleString(),
      imp.rolled_back_at ? 'Yes' : 'No',
      imp.has_conflicts ? 'Yes' : 'No',
    ])

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Exported ${imports.length} imports to Excel`)
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export imports')
  }
}

/**
 * Export import history to CSV
 */
export function exportImportHistoryToCSV(imports: ImportHistory[], filename: string = 'talastock-imports') {
  // Same as Excel for now (CSV format)
  exportImportHistoryToExcel(imports, filename)
}
