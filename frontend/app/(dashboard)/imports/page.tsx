'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { getImportHistory, getImportStatistics } from '@/lib/api-imports'
import type { ImportHistory, ImportStatistics } from '@/types'
import { ImportHistoryTable } from '@/components/imports/ImportHistoryTable'
import { ImportFilters } from '@/components/imports/ImportFilters'
import { ImportStatisticsCards } from '@/components/imports/ImportStatisticsCards'
import { ImportDetailsModal } from '@/components/imports/ImportDetailsModal'
import { SearchInput } from '@/components/shared/SearchInput'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { useDebounce } from '@/hooks/useDebounce'
import { exportImportHistoryToExcel, exportImportHistoryToCSV } from '@/lib/export-import-history'
import { cn } from '@/lib/utils'

export default function ImportsPage() {
  const [allImports, setAllImports] = useState<ImportHistory[]>([])
  const [statistics, setStatistics] = useState<ImportStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Search
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Filters
  const [entityType, setEntityType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Sorting
  const [sortColumn, setSortColumn] = useState<'created_at' | 'quality_score' | 'total_rows' | 'file_name'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const limit = 20

  // Fetch data once on mount
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch imports with max allowed limit (100)
      const historyResult = await getImportHistory({
        limit: 100, // Backend max limit
        offset: 0,
      })
      setAllImports(historyResult.imports)

      // Fetch statistics
      const statsResult = await getImportStatistics(30)
      setStatistics(statsResult.statistics)
    } catch (error: any) {
      console.error('Failed to fetch import data:', error)
      setAllImports([])
      setStatistics({
        total_imports: 0,
        successful_imports: 0,
        failed_imports: 0,
        partial_imports: 0,
        success_rate: 0,
        total_rows_processed: 0,
        avg_processing_time_ms: 0,
        avg_quality_score: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering and sorting
  const filtered = useMemo(() => {
    setPage(1) // Reset to page 1 when filters change
    
    let result = allImports.filter(imp => {
      // Search filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        if (!imp.file_name.toLowerCase().includes(q)) return false
      }
      
      // Entity type filter
      if (entityType && imp.entity_type !== entityType) return false
      
      // Status filter
      if (status && imp.status !== status) return false
      
      // Date range filter
      if (dateRange.start) {
        const importDate = new Date(imp.created_at)
        const startDate = new Date(dateRange.start)
        if (importDate < startDate) return false
      }
      if (dateRange.end) {
        const importDate = new Date(imp.created_at)
        const endDate = new Date(dateRange.end)
        if (importDate > endDate) return false
      }
      
      return true
    })

    // Sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortColumn) {
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'quality_score':
          aVal = a.quality_score || 0
          bVal = b.quality_score || 0
          break
        case 'total_rows':
          aVal = a.total_rows
          bVal = b.total_rows
          break
        case 'file_name':
          aVal = a.file_name.toLowerCase()
          bVal = b.file_name.toLowerCase()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return result
  }, [allImports, debouncedSearch, entityType, status, dateRange, sortColumn, sortDirection])

  // Paginate filtered results
  const total = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  // Quick date filters
  function setQuickDateRange(days: number) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDateRange({
      start: start.toISOString(),
      end: end.toISOString(),
    })
  }

  function handleViewDetails(importRecord: ImportHistory) {
    setSelectedImport(importRecord)
    setShowDetailsModal(true)
  }

  function handleRollbackSuccess() {
    fetchData()
    setShowDetailsModal(false)
  }

  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  function clearFilters() {
    setSearch('')
    setEntityType('')
    setStatus('')
    setDateRange({ start: '', end: '' })
    setPage(1)
  }

  const hasFilters = search || entityType || status || dateRange.start || dateRange.end

  // Export functions
  async function handleExportExcel() {
    exportImportHistoryToExcel(filtered, hasFilters ? 'talastock-imports-filtered' : 'talastock-imports')
  }

  async function handleExportCSV() {
    exportImportHistoryToCSV(filtered, hasFilters ? 'talastock-imports-filtered' : 'talastock-imports')
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4">
        <h1 className="text-lg font-bold text-[#7A3E2E]">Import History</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Bar */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by filename..."
        />

        {/* Filters */}
        <ImportFilters
          entityType={entityType}
          status={status}
          dateRange={dateRange}
          onEntityTypeChange={setEntityType}
          onStatusChange={setStatus}
          onDateRangeChange={setDateRange}
          onReset={clearFilters}
        />

        {/* Quick Date Filters */}
        <button
          onClick={() => setQuickDateRange(7)}
          className="px-3 py-2 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
        >
          Last 7 days
        </button>
        <button
          onClick={() => setQuickDateRange(30)}
          className="px-3 py-2 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
        >
          Last 30 days
        </button>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline"
          >
            Clear filters
          </button>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#B89080]" suppressHydrationWarning>
            {filtered.length} of {allImports.length} imports
          </span>
          <ExportDropdown 
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            disabled={filtered.length === 0}
            itemCount={filtered.length}
            isFiltered={!!hasFilters}
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#F2C4B0] text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards - With skeleton loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[#F2C4B0] p-4">
              <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] animate-pulse mb-3" />
              <div className="h-3 bg-[#FDE8DF] rounded animate-pulse mb-2 w-20" />
              <div className="h-6 bg-[#FDE8DF] rounded animate-pulse mb-1 w-16" />
              <div className="h-3 bg-[#FDE8DF] rounded animate-pulse w-24" />
            </div>
          ))}
        </div>
      ) : (
        statistics && <ImportStatisticsCards statistics={statistics} />
      )}

      {/* Import History Table */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <ImportHistoryTable
          imports={paginated}
          loading={loading && allImports.length === 0}
          onViewDetails={handleViewDetails}
          onRefresh={fetchData}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchQuery={debouncedSearch}
        />

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#FDE8DF]">
            <p className="text-xs text-[#B89080]">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} imports
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Details Modal */}
      {showDetailsModal && selectedImport && (
        <ImportDetailsModal
          importRecord={selectedImport}
          onClose={() => setShowDetailsModal(false)}
          onRollbackSuccess={handleRollbackSuccess}
        />
      )}
    </div>
  )
}
