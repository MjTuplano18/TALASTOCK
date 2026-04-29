'use client'

import { Eye, RotateCcw, RefreshCw } from 'lucide-react'
import type { ImportHistory } from '@/types'
import { getImportStatusColor, getQualityScoreColor } from '@/types'

interface ImportHistoryTableProps {
  imports: ImportHistory[]
  loading: boolean
  onViewDetails: (importRecord: ImportHistory) => void
  onRefresh: () => void
}

export function ImportHistoryTable({
  imports,
  loading,
  onViewDetails,
  onRefresh,
}: ImportHistoryTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8896A]"></div>
      </div>
    )
  }

  if (imports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#B89080] mb-2">No imports found</p>
        <p className="text-xs text-[#B89080]">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#7A3E2E]">Import History</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-[#E8896A] hover:text-[#C1614A]"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F2C4B0]">
              <th className="text-left py-3 text-xs text-[#B89080] font-medium">File Name</th>
              <th className="text-left py-3 text-xs text-[#B89080] font-medium">Type</th>
              <th className="text-left py-3 text-xs text-[#B89080] font-medium">Status</th>
              <th className="text-right py-3 text-xs text-[#B89080] font-medium">Rows</th>
              <th className="text-right py-3 text-xs text-[#B89080] font-medium">Quality</th>
              <th className="text-left py-3 text-xs text-[#B89080] font-medium">Date</th>
              <th className="text-right py-3 text-xs text-[#B89080] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((imp) => (
              <tr key={imp.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                <td className="py-3 text-[#7A3E2E]">
                  <div className="flex flex-col">
                    <span className="font-medium">{imp.file_name}</span>
                    {imp.errors.length > 0 && (
                      <span className="text-xs text-[#C05050]">
                        {imp.errors.length} error{imp.errors.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-[#FDE8DF] text-[#C1614A]">
                    {imp.entity_type}
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status={imp.status} />
                </td>
                <td className="py-3 text-right text-[#7A3E2E]">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{imp.successful_rows}/{imp.total_rows}</span>
                    {imp.failed_rows > 0 && (
                      <span className="text-xs text-[#C05050]">
                        {imp.failed_rows} failed
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 text-right">
                  <QualityScoreBadge score={imp.quality_score || 0} />
                </td>
                <td className="py-3 text-[#7A3E2E]">
                  <div className="flex flex-col">
                    <span>{new Date(imp.created_at).toLocaleDateString()}</span>
                    <span className="text-xs text-[#B89080]">
                      {new Date(imp.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(imp)}
                      className="p-1 text-[#E8896A] hover:text-[#C1614A] hover:bg-[#FDE8DF] rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {imp.can_rollback && !imp.rolled_back_at && (
                      <button
                        onClick={() => onViewDetails(imp)}
                        className="p-1 text-[#C05050] hover:bg-[#FDECEA] rounded"
                        title="Rollback"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  
  return (
    <span className={`font-medium ${colorClass}`}>
      {score.toFixed(0)}%
    </span>
  )
}
