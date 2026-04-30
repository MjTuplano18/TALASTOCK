'use client'

import React, { useState } from 'react'
import { Eye, RotateCcw, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'
import type { ImportHistory } from '@/types'
import { getImportStatusColor, getQualityScoreColor } from '@/types'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { HighlightText } from '@/components/shared/HighlightText'

interface ImportHistoryTableProps {
  imports: ImportHistory[]
  loading: boolean
  onViewDetails: (importRecord: ImportHistory) => void
  onRefresh: () => void
  sortColumn: 'created_at' | 'quality_score' | 'total_rows' | 'file_name'
  sortDirection: 'asc' | 'desc'
  onSort: (column: 'created_at' | 'quality_score' | 'total_rows' | 'file_name') => void
  searchQuery?: string
}

export function ImportHistoryTable({
  imports,
  loading,
  onViewDetails,
  onRefresh,
  sortColumn,
  sortDirection,
  onSort,
  searchQuery = '',
}: ImportHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function SortIcon({ column }: { column: typeof sortColumn }) {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-30" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    )
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#7A3E2E]">Import History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F2C4B0]">
              <th className="text-left py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">File Name</span>
              </th>
              <th className="text-left py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">Type</span>
              </th>
              <th className="text-left py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">Status</span>
              </th>
              <th className="text-right py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">Rows</span>
              </th>
              <th className="text-right py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">Quality</span>
              </th>
              <th className="text-left py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">Date</span>
              </th>
              <th className="text-right py-3 px-3">
                <span className="text-xs text-[#B89080] font-medium">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-[#FDE8DF]">
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[#FDE8DF] rounded animate-pulse w-48" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-6 bg-[#FDE8DF] rounded-full animate-pulse w-20" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-6 bg-[#FDE8DF] rounded-full animate-pulse w-20" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[#FDE8DF] rounded animate-pulse w-12 ml-auto" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[#FDE8DF] rounded animate-pulse w-12 ml-auto" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="h-4 bg-[#FDE8DF] rounded animate-pulse w-24" />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-6 w-6 bg-[#FDE8DF] rounded animate-pulse" />
                    <div className="h-6 w-6 bg-[#FDE8DF] rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (imports.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#7A3E2E]">Import History</h3>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs text-[#E8896A] hover:text-[#C1614A] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
        <div className="text-center py-12">
          <p className="text-sm text-[#B89080] mb-2">No imports found</p>
          <p className="text-xs text-[#B89080]">Try adjusting your filters or import some data</p>
        </div>
      </div>
    )
  }

  // Expanded row component
  function ExpandedRow({ imp }: { imp: ImportHistory }) {
    return (
      <tr>
        <td colSpan={8} className="px-3 pb-3 pt-0">
          <div className="bg-[#FDF6F0] rounded-xl border border-[#F2C4B0] p-3">
            {/* Success/Failure Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-[#B89080]">Successful</p>
                  <p className="text-sm font-medium text-[#7A3E2E]">{imp.successful_rows}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#C05050]" />
                <div>
                  <p className="text-xs text-[#B89080]">Failed</p>
                  <p className="text-sm font-medium text-[#7A3E2E]">{imp.failed_rows}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-[#B89080]">Warnings</p>
                  <p className="text-sm font-medium text-[#7A3E2E]">{imp.warnings.length}</p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {imp.errors.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-[#7A3E2E] mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#C05050]" />
                  Errors ({imp.errors.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {imp.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <p className="text-xs text-red-900 font-medium">
                        Row {error.row} - {error.field}
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">{error.message}</p>
                    </div>
                  ))}
                  {imp.errors.length > 5 && (
                    <p className="text-xs text-[#B89080] italic">
                      +{imp.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {imp.warnings.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-[#7A3E2E] mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                  Warnings ({imp.warnings.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {imp.warnings.slice(0, 3).map((warning, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs text-yellow-900 font-medium">
                        Row {warning.row}{warning.field && ` - ${warning.field}`}
                      </p>
                      <p className="text-xs text-yellow-700 mt-0.5">{warning.message}</p>
                    </div>
                  ))}
                  {imp.warnings.length > 3 && (
                    <p className="text-xs text-[#B89080] italic">
                      +{imp.warnings.length - 3} more warnings
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* View Full Details Button */}
            <button
              onClick={() => onViewDetails(imp)}
              className="mt-3 text-xs text-[#E8896A] hover:text-[#C1614A] font-medium"
            >
              View full details →
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#7A3E2E]">Import History</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-[#E8896A] hover:text-[#C1614A] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        {/* Desktop table view */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="w-8 py-3 px-3" />
                <th className="text-left py-3 px-3">
                  <button
                    onClick={() => onSort('file_name')}
                    className="flex items-center gap-1 text-xs text-[#B89080] font-medium hover:text-[#7A3E2E] transition-colors"
                  >
                    File Name
                    <SortIcon column="file_name" />
                  </button>
                </th>
                <th className="text-left py-3 px-3">
                  <span className="text-xs text-[#B89080] font-medium">Type</span>
                </th>
                <th className="text-left py-3 px-3">
                  <span className="text-xs text-[#B89080] font-medium">Status</span>
                </th>
                <th className="text-right py-3 px-3">
                  <button
                    onClick={() => onSort('total_rows')}
                    className="flex items-center gap-1 text-xs text-[#B89080] font-medium hover:text-[#7A3E2E] transition-colors ml-auto"
                  >
                    Rows
                    <SortIcon column="total_rows" />
                  </button>
                </th>
                <th className="text-right py-3 px-3">
                  <button
                    onClick={() => onSort('quality_score')}
                    className="flex items-center gap-1 text-xs text-[#B89080] font-medium hover:text-[#7A3E2E] transition-colors ml-auto"
                  >
                    Quality
                    <SortIcon column="quality_score" />
                  </button>
                </th>
                <th className="text-left py-3 px-3">
                  <button
                    onClick={() => onSort('created_at')}
                    className="flex items-center gap-1 text-xs text-[#B89080] font-medium hover:text-[#7A3E2E] transition-colors"
                  >
                    Date
                    <SortIcon column="created_at" />
                  </button>
                </th>
                <th className="text-right py-3 px-3">
                  <span className="text-xs text-[#B89080] font-medium">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {imports.map((imp) => {
                const isExpanded = expandedId === imp.id
                return (
                  <React.Fragment key={imp.id}>
                    <tr 
                      className={`border-b border-[#FDE8DF] hover:bg-[#FDF6F0] transition-colors cursor-pointer ${isExpanded ? 'bg-[#FDF6F0]' : ''}`}
                      onClick={() => toggleExpand(imp.id)}
                    >
                      <td className="py-2.5 px-3 text-[#B89080]">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#7A3E2E]">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            <HighlightText text={imp.file_name} highlight={searchQuery} />
                          </span>
                          {imp.errors.length > 0 && (
                            <span className="text-xs text-[#C05050]">
                              {imp.errors.length} error{imp.errors.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#FDE8DF] text-[#C1614A] capitalize">
                          {imp.entity_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={imp.status} />
                          {imp.rolled_back_at && (
                            <span className="text-xs px-2 py-1 rounded-full bg-[#FDECEA] text-[#C05050]">
                              Rolled Back
                            </span>
                          )}
                          {imp.has_conflicts && !imp.rolled_back_at && (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Conflicts
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#7A3E2E]">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-sm">{imp.successful_rows}/{imp.total_rows}</span>
                          {imp.failed_rows > 0 && (
                            <span className="text-xs text-[#C05050]">
                              {imp.failed_rows} failed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <QualityScoreBadge score={imp.quality_score || 0} />
                      </td>
                      <td className="py-2.5 px-3 text-[#7A3E2E] text-xs">
                        <RelativeTime date={imp.created_at} />
                      </td>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewDetails(imp)}
                            className="p-1 text-[#E8896A] hover:text-[#C1614A] hover:bg-[#FDE8DF] rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {imp.can_rollback && !imp.rolled_back_at && !imp.has_conflicts && (
                            <button
                              onClick={() => onViewDetails(imp)}
                              className="p-1 text-[#C05050] hover:bg-[#FDECEA] rounded transition-colors"
                              title="Rollback"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow imp={imp} />}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3 p-4">
          {imports.map((imp) => {
            const isExpanded = expandedId === imp.id
            return (
              <div key={imp.id} className="border border-[#F2C4B0] rounded-lg p-3 bg-white">
                <div 
                  className="flex items-start justify-between mb-2 cursor-pointer"
                  onClick={() => toggleExpand(imp.id)}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="text-[#B89080] mt-0.5">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#7A3E2E] text-sm truncate">
                        <HighlightText text={imp.file_name} highlight={searchQuery} />
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FDE8DF] text-[#C1614A] capitalize">
                          {imp.entity_type}
                        </span>
                        <StatusBadge status={imp.status} />
                      </div>
                    </div>
                  </div>
                  <QualityScoreBadge score={imp.quality_score || 0} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-[#B89080]">Rows:</span>
                    <span className="text-[#7A3E2E] ml-1 font-medium">
                      {imp.successful_rows}/{imp.total_rows}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#B89080]">Failed:</span>
                    <span className="text-[#C05050] ml-1 font-medium">{imp.failed_rows}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#B89080]">Date:</span>
                    <span className="text-[#7A3E2E] ml-1">
                      <RelativeTime date={imp.created_at} />
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-[#F2C4B0] mb-3">
                    <ExpandedRow imp={imp} />
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t border-[#F2C4B0]">
                  <button
                    onClick={() => onViewDetails(imp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                  {imp.can_rollback && !imp.rolled_back_at && !imp.has_conflicts && (
                    <button
                      onClick={() => onViewDetails(imp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#F2C4B0] text-[#C05050] rounded-lg hover:bg-[#FDECEA] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rollback
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ImportHistory['status'] }) {
  const colors = {
    success: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    partial: 'bg-yellow-50 text-yellow-700',
  }

  const labels = {
    success: 'Success',
    failed: 'Failed',
    partial: 'Partial',
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function QualityScoreBadge({ score }: { score: number }) {
  const colorClass = getQualityScoreColor(score)
  
  // Determine background color based on score
  let bgClass = 'bg-green-50'
  let textClass = 'text-green-700'
  
  if (score < 70) {
    bgClass = 'bg-red-50'
    textClass = 'text-red-700'
  } else if (score < 90) {
    bgClass = 'bg-yellow-50'
    textClass = 'text-yellow-700'
  }
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${bgClass} ${textClass}`}>
      {score.toFixed(0)}%
    </span>
  )
}
