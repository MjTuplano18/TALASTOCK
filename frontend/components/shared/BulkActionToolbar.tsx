'use client'

import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * BulkActionToolbar Component
 * Displays when items are selected in a table
 * Shows count and provides bulk action buttons
 */

interface BulkActionToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkDelete?: () => void
  children?: React.ReactNode
  deleteLabel?: string
}

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  children,
  deleteLabel = 'Delete'
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FDE8DF] border-b border-[#F2C4B0]">
      <span className="text-sm font-medium text-[#7A3E2E]">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2">
        {children}

        {onBulkDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onBulkDelete}
            className="h-8 px-3 text-xs border border-[#FDECEA] text-[#C05050] hover:bg-[#FDECEA] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {deleteLabel} {selectedCount}
          </Button>
        )}
      </div>

      <button
        onClick={onClearSelection}
        className="ml-auto flex items-center gap-1.5 text-xs text-[#B89080] hover:text-[#7A3E2E] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        Clear selection
      </button>
    </div>
  )
}
