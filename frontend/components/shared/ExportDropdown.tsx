'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportDropdownProps {
  onExportExcel: () => void | Promise<void>
  onExportCSV: () => void | Promise<void>
  disabled?: boolean
  itemCount?: number
  isFiltered?: boolean
}

export function ExportDropdown({ 
  onExportExcel, 
  onExportCSV, 
  disabled = false,
  itemCount,
  isFiltered = false
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleExport(type: 'excel' | 'csv') {
    setExporting(true)
    setOpen(false)
    try {
      if (type === 'excel') {
        await onExportExcel()
      } else {
        await onExportCSV()
      }
    } finally {
      setExporting(false)
    }
  }

  const label = isFiltered && itemCount !== undefined 
    ? `Export (${itemCount})`
    : 'Export'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled || exporting}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 text-xs border rounded-lg transition-colors",
          "border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">{exporting ? 'Exporting...' : label}</span>
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#F2C4B0] rounded-lg shadow-lg py-1 min-w-[140px]">
          <button
            onClick={() => handleExport('excel')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E8896A]" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
          >
            <FileText className="w-4 h-4 text-[#E8896A]" />
            <span>Export CSV</span>
          </button>
        </div>
      )}
    </div>
  )
}
