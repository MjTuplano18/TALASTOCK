'use client'

import { useState } from 'react'
import { X, AlertCircle, AlertTriangle, RotateCcw, CheckCircle } from 'lucide-react'
import type { ImportHistory } from '@/types'
import { rollbackImport } from '@/lib/api-imports'
import { toast } from 'sonner'

interface ImportDetailsModalProps {
  importRecord: ImportHistory
  onClose: () => void
  onRollbackSuccess: () => void
}

export function ImportDetailsModal({
  importRecord,
  onClose,
  onRollbackSuccess,
}: ImportDetailsModalProps) {
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false)
  const [rollbackReason, setRollbackReason] = useState('')
  const [rolling, setRolling] = useState(false)

  async function handleRollback() {
    if (!rollbackReason.trim()) {
      toast.error('Please provide a reason for rollback')
      return
    }

    setRolling(true)
    try {
      const result = await rollbackImport({
        import_id: importRecord.id,
        reason: rollbackReason,
      })

      toast.success(`Successfully rolled back ${result.rollback_count} changes`)
      onRollbackSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to rollback import')
    } finally {
      setRolling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#F2C4B0] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F2C4B0]">
          <div>
            <h2 className="text-lg font-medium text-[#7A3E2E]">Import Details</h2>
            <p className="text-xs text-[#B89080] mt-1">{importRecord.file_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#FDE8DF] rounded-lg text-[#7A3E2E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[#B89080] mb-1">Entity Type</p>
              <p className="text-sm font-medium text-[#7A3E2E] capitalize">
                {importRecord.entity_type}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#B89080] mb-1">Status</p>
              <p className="text-sm font-medium text-[#7A3E2E] capitalize">
                {importRecord.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#B89080] mb-1">Total Rows</p>
              <p className="text-sm font-medium text-[#7A3E2E]">
                {importRecord.total_rows}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#B89080] mb-1">Quality Score</p>
              <p className="text-sm font-medium text-[#7A3E2E]">
                {importRecord.quality_score?.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Success/Failure Breakdown */}
          <div className="bg-[#FDF6F0] rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-[#B89080]">Successful</p>
                  <p className="text-sm font-medium text-[#7A3E2E]">
                    {importRecord.successful_rows}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#C05050]" />
                <div>
                  <p className="text-xs text-[#B89080]">Failed</p>
                  <p className="text-sm font-medium text-[#7A3E2E]">
                    {importRecord.failed_rows}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-[#B89080]">Warnings</p>
                  <p className="text-sm font-medium text-[#7A3E2E]">
                    {importRecord.warnings.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors */}
          {importRecord.errors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#7A3E2E] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#C05050]" />
                Errors ({importRecord.errors.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importRecord.errors.map((error, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-red-900 font-medium">
                          Row {error.row} - {error.field}
                        </p>
                        <p className="text-xs text-red-700 mt-1">{error.message}</p>
                        {error.value && (
                          <p className="text-xs text-red-600 mt-1">
                            Value: {JSON.stringify(error.value)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {importRecord.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#7A3E2E] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Warnings ({importRecord.warnings.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importRecord.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                  >
                    <p className="text-xs text-yellow-900 font-medium">
                      Row {warning.row}
                      {warning.field && ` - ${warning.field}`}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">{warning.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rollback Status */}
          {importRecord.rolled_back_at && (
            <div className="bg-[#FDECEA] border border-[#F2C4B0] rounded-lg p-4">
              <p className="text-sm font-medium text-[#C05050] mb-1">
                This import has been rolled back
              </p>
              <p className="text-xs text-[#B89080]">
                Rolled back on {new Date(importRecord.rolled_back_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Rollback Confirmation */}
          {showRollbackConfirm && !importRecord.rolled_back_at && (
            <div className="bg-[#FDECEA] border border-[#F2C4B0] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#C05050] mb-2">
                Confirm Rollback
              </h3>
              <p className="text-xs text-[#7A3E2E] mb-3">
                This will revert all changes made by this import. This action cannot be undone.
              </p>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="Reason for rollback (required)"
                className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] outline-none mb-3"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRollback}
                  disabled={rolling}
                  className="px-4 py-2 bg-[#C05050] text-white rounded-lg text-sm hover:bg-[#A03030] disabled:opacity-50"
                >
                  {rolling ? 'Rolling back...' : 'Confirm Rollback'}
                </button>
                <button
                  onClick={() => setShowRollbackConfirm(false)}
                  className="px-4 py-2 border border-[#F2C4B0] text-[#7A3E2E] rounded-lg text-sm hover:bg-[#FDE8DF]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#F2C4B0]">
          <div className="text-xs text-[#B89080]">
            Imported on {new Date(importRecord.created_at).toLocaleString()}
            {importRecord.processing_time_ms && (
              <> • Processed in {importRecord.processing_time_ms}ms</>
            )}
          </div>
          <div className="flex gap-2">
            {importRecord.can_rollback && !importRecord.rolled_back_at && !showRollbackConfirm && (
              <button
                onClick={() => setShowRollbackConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[#F2C4B0] text-[#C05050] rounded-lg text-sm hover:bg-[#FDECEA]"
              >
                <RotateCcw className="w-4 h-4" />
                Rollback Import
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#E8896A] text-white rounded-lg text-sm hover:bg-[#C1614A]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
