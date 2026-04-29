'use client'

import { Filter, X } from 'lucide-react'

interface ImportFiltersProps {
  entityType: string
  status: string
  dateRange: { start: string; end: string }
  onEntityTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDateRangeChange: (range: { start: string; end: string }) => void
  onReset: () => void
}

export function ImportFilters({
  entityType,
  status,
  dateRange,
  onEntityTypeChange,
  onStatusChange,
  onDateRangeChange,
  onReset,
}: ImportFiltersProps) {
  const hasFilters = entityType || status || dateRange.start || dateRange.end

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-[#E8896A]" />
        <h3 className="text-sm font-medium text-[#7A3E2E]">Filters</h3>
        {hasFilters && (
          <button
            onClick={onReset}
            className="ml-auto text-xs text-[#E8896A] hover:text-[#C1614A] flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Entity Type Filter */}
        <div>
          <label className="block text-xs text-[#B89080] mb-1">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => onEntityTypeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] outline-none"
          >
            <option value="">All Types</option>
            <option value="products">Products</option>
            <option value="sales">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="customers">Customers</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs text-[#B89080] mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] outline-none"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label className="block text-xs text-[#B89080] mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] outline-none"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label className="block text-xs text-[#B89080] mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] outline-none"
          />
        </div>
      </div>
    </div>
  )
}
