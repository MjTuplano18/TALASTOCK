'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportInventoryToExcel, exportInventoryToCSV } from '@/lib/export-inventory'
import { toast } from 'sonner'
import type { InventoryItem } from '@/types'

interface ExportButtonsProps {
  inventory: InventoryItem[]
  filteredCount: number
  totalCount: number
}

export function ExportButtons({ inventory, filteredCount, totalCount }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false)
  const hasFilters = filteredCount < totalCount

  async function handleExport(format: 'xlsx' | 'csv') {
    setExporting(true)
    try {
      if (format === 'xlsx') {
        await exportInventoryToExcel(inventory)
      } else {
        await exportInventoryToCSV(inventory)
      }
      toast.success(`Exported ${filteredCount} items to ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {hasFilters && (
        <span className="text-xs text-[#B89080]">
          Exporting {filteredCount} of {totalCount} items
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('xlsx')}
        disabled={exporting}
        className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] h-9"
      >
        <Download className="w-4 h-4 mr-2" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={exporting}
        className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] h-9"
      >
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
    </div>
  )
}
