'use client'

import { useState, useEffect } from 'react'
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { getImportHistory, getImportStatistics } from '@/lib/api-imports'
import type { ImportHistory, ImportStatistics } from '@/types'
import { ImportHistoryTable } from '@/components/imports/ImportHistoryTable'
import { ImportFilters } from '@/components/imports/ImportFilters'
import { ImportStatisticsCards } from '@/components/imports/ImportStatisticsCards'
import { ImportDetailsModal } from '@/components/imports/ImportDetailsModal'

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportHistory[]>([])
  const [statistics, setStatistics] = useState<ImportStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filters
  const [entityType, setEntityType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchData()
  }, [entityType, status, dateRange, page])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch import history
      const historyResult = await getImportHistory({
        entity_type: entityType || undefined,
        status: status || undefined,
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
        limit,
        offset: (page - 1) * limit,
      })
      setImports(historyResult.imports)
      setTotal(historyResult.total)

      // Fetch statistics
      const statsResult = await getImportStatistics(30)
      setStatistics(statsResult.statistics)
    } catch (error) {
      console.error('Failed to fetch import data:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleViewDetails(importRecord: ImportHistory) {
    setSelectedImport(importRecord)
    setShowDetailsModal(true)
  }

  function handleRollbackSuccess() {
    fetchData()
    setShowDetailsModal(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium text-[#7A3E2E] mb-1">Import History</h1>
        <p className="text-xs text-[#B89080]">
          Track all data imports, view quality metrics, and rollback if needed
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && <ImportStatisticsCards statistics={statistics} />}

      {/* Filters */}
      <ImportFilters
        entityType={entityType}
        status={status}
        dateRange={dateRange}
        onEntityTypeChange={setEntityType}
        onStatusChange={setStatus}
        onDateRangeChange={setDateRange}
        onReset={() => {
          setEntityType('')
          setStatus('')
          setDateRange({ start: '', end: '' })
          setPage(1)
        }}
      />

      {/* Import History Table */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <ImportHistoryTable
          imports={imports}
          loading={loading}
          onViewDetails={handleViewDetails}
          onRefresh={fetchData}
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
                className="px-3 py-1 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] hover:bg-[#FDE8DF] disabled:opacity-50 disabled:cursor-not-allowed"
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
