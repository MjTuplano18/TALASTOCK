'use client'

import { useEffect, useState } from 'react'
import { X, Clock, Upload, RotateCcw } from 'lucide-react'
import { useStockMovements } from '@/hooks/useStockMovements'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { InventoryItem, StockMovementType } from '@/types'

const TYPE_CONFIG: Record<StockMovementType, { label: string; bg: string; color: string }> = {
  restock:    { label: 'Restock',    bg: '#FDE8DF', color: '#C1614A' },
  sale:       { label: 'Sale',       bg: '#FDECEA', color: '#C05050' },
  adjustment: { label: 'Adjustment', bg: '#F2C4B0', color: '#B89080' },
  return:     { label: 'Return',     bg: '#FDE8DF', color: '#C1614A' },
  import:     { label: 'Import',     bg: '#E8F5E9', color: '#2E7D32' },
  rollback:   { label: 'Rollback',   bg: '#FFF3E0', color: '#E65100' },
}

interface StockHistoryDrawerProps {
  item: InventoryItem | null
  onClose: () => void
}

export function StockHistoryDrawer({ item, onClose }: StockHistoryDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [typeFilter, setTypeFilter] = useState<StockMovementType | ''>('')
  const { movements, loading } = useStockMovements(item?.product_id)

  useEffect(() => {
    if (item) setTimeout(() => setMounted(true), 10)
    else {
      setMounted(false)
      setTypeFilter('') // Reset filter when closing
    }
  }, [item])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!item) return null

  // Filter movements by type
  const filteredMovements = typeFilter 
    ? movements.filter(m => m.type === typeFilter)
    : movements

  return (
    <>
      <div className={cn('fixed inset-0 z-40 bg-black/30 transition-opacity duration-200',
        mounted ? 'opacity-100' : 'opacity-0')} onClick={onClose} />

      <div className={cn('fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white border-l border-[#F2C4B0] flex flex-col transition-transform duration-300',
        mounted ? 'translate-x-0' : 'translate-x-full')}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2C4B0]">
          <div>
            <h2 className="text-sm font-medium text-[#7A3E2E]">Stock History</h2>
            <p className="text-xs text-[#B89080] mt-0.5">{item.products?.name ?? '—'}</p>
          </div>
          <button onClick={onClose} className="text-[#B89080] hover:text-[#7A3E2E] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current stock summary */}
        <div className="px-5 py-3 border-b border-[#F2C4B0] bg-[#FDF6F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B89080]">Current Stock</span>
            <span className="text-sm font-medium text-[#7A3E2E]">{item.quantity} units</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#B89080]">Low Stock Threshold</span>
            <span className="text-xs text-[#B89080]">{item.low_stock_threshold} units</span>
          </div>
        </div>

        {/* Filter by movement type */}
        <div className="px-5 py-3 border-b border-[#F2C4B0]">
          <label className="text-xs text-[#B89080] mb-1.5 block">Filter by Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as StockMovementType | '')}
            className="w-full text-sm border border-[#F2C4B0] rounded-lg px-3 py-1.5 text-[#7A3E2E] focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] focus:outline-none bg-white"
          >
            <option value="">All Types</option>
            <option value="restock">Restock</option>
            <option value="sale">Sale</option>
            <option value="adjustment">Adjustment</option>
            <option value="return">Return</option>
            <option value="import">Import</option>
            <option value="rollback">Rollback</option>
          </select>
        </div>

        {/* Movement list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5 text-[#E8896A]" />
            <h3 className="text-xs font-medium text-[#7A3E2E]">Movement History</h3>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-[#FDE8DF] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#B89080]">
                {typeFilter ? `No ${TYPE_CONFIG[typeFilter]?.label.toLowerCase()} movements` : 'No stock movements yet'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredMovements.map(m => {
                const config = TYPE_CONFIG[m.type]
                const isPositive = m.type === 'restock' || m.type === 'return'
                return (
                  <div key={m.id} className="bg-white border border-[#F2C4B0] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      <span className={cn('text-sm font-medium',
                        isPositive ? 'text-[#C1614A]' : 'text-[#C05050]')}>
                        {isPositive ? '+' : '-'}{Math.abs(m.quantity)}
                      </span>
                    </div>
                    {m.note && <p className="text-xs text-[#B89080] mt-1">{m.note}</p>}
                    <p className="text-[10px] text-[#B89080] mt-1">{formatDateTime(m.created_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
