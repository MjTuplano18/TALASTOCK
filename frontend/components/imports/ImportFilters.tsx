'use client'

import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { FilterSelect } from '@/components/shared/FilterSelect'

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
  // Convert string dates to Date objects for DateRangePicker
  const dateRangeValue: DateRange = {
    from: dateRange.start ? new Date(dateRange.start) : null,
    to: dateRange.end ? new Date(dateRange.end) : null,
  }

  function handleDateRangeChange(range: DateRange) {
    onDateRangeChange({
      start: range.from ? range.from.toISOString() : '',
      end: range.to ? range.to.toISOString() : '',
    })
  }

  return (
    <>
      {/* Entity Type Filter */}
      <FilterSelect
        value={entityType}
        onChange={onEntityTypeChange}
        placeholder="All Types"
        options={[
          { label: 'Products', value: 'products' },
          { label: 'Sales', value: 'sales' },
          { label: 'Inventory', value: 'inventory' },
          { label: 'Customers', value: 'customers' },
        ]}
      />

      {/* Status Filter */}
      <FilterSelect
        value={status}
        onChange={onStatusChange}
        placeholder="All Statuses"
        options={[
          { label: 'Success', value: 'success' },
          { label: 'Failed', value: 'failed' },
          { label: 'Partial', value: 'partial' },
        ]}
      />

      {/* Date Range Filter with Calendar */}
      <DateRangePicker
        value={dateRangeValue}
        onChange={handleDateRangeChange}
      />
    </>
  )
}
