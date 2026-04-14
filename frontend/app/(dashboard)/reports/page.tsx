'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSales } from '@/hooks/useSales'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { generateSalesReport, generateInventoryReport } from '@/lib/reports'

export default function ReportsPage() {
  const { allSales } = useSales()
  const { inventory } = useRealtimeInventory()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exportingSales, setExportingSales] = useState(false)
  const [exportingInventory, setExportingInventory] = useState(false)

  async function handleSalesExport() {
    setExportingSales(true)
    try {
      const range = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
      generateSalesReport(allSales, range)
    } finally {
      setExportingSales(false)
    }
  }

  async function handleInventoryExport() {
    setExportingInventory(true)
    try {
      generateInventoryReport(inventory)
    } finally {
      setExportingInventory(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-medium text-[#7A3E2E] mb-6">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Report */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h2 className="text-sm font-medium text-[#7A3E2E] mb-1">Sales Report</h2>
          <p className="text-xs text-[#B89080] mb-4">Export sales history as PDF</p>

          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="text-xs text-[#B89080] mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full text-sm border border-[#F2C4B0] rounded-lg px-3 py-2 text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-[#B89080] mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full text-sm border border-[#F2C4B0] rounded-lg px-3 py-2 text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] bg-white"
              />
            </div>
          </div>

          <Button
            onClick={handleSalesExport}
            disabled={exportingSales}
            className="w-full bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          >
            <FileText className="w-4 h-4 mr-2" />
            {exportingSales ? 'Generating…' : 'Export Sales Report'}
          </Button>
        </div>

        {/* Inventory Report */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <h2 className="text-sm font-medium text-[#7A3E2E] mb-1">Inventory Report</h2>
          <p className="text-xs text-[#B89080] mb-4">Export current inventory as PDF</p>

          <Button
            onClick={handleInventoryExport}
            disabled={exportingInventory}
            className="w-full bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          >
            <FileText className="w-4 h-4 mr-2" />
            {exportingInventory ? 'Generating…' : 'Export Inventory Report'}
          </Button>
        </div>
      </div>
    </div>
  )
}
