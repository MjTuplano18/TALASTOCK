'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, Plus, Minus, History } from 'lucide-react'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { useInventory } from '@/hooks/useInventory'
import { InventoryAdjustmentForm } from '@/components/forms/InventoryAdjustmentForm'
import { StockHistoryDrawer } from '@/components/inventory/StockHistoryDrawer'
import { StockBadge } from '@/components/shared/StockBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { Pagination } from '@/components/shared/Pagination'
import { formatDate } from '@/lib/utils'
import { getStockStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { InventoryItem } from '@/types'

const PAGE_SIZE = 15

// Inline editable threshold cell
function ThresholdCell({ item, onSave }: { item: InventoryItem; onSave: (id: string, val: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(item.low_stock_threshold))
  const [saving, setSaving] = useState(false)

  async function save() {
    const n = parseInt(val)
    if (isNaN(n) || n < 0) { setVal(String(item.low_stock_threshold)); setEditing(false); return }
    setSaving(true)
    await onSave(item.product_id, n)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(String(item.low_stock_threshold)); setEditing(false) } }}
        disabled={saving}
        className="w-16 border-b border-[#E8896A] bg-transparent text-sm text-[#7A3E2E] focus:outline-none text-center"
      />
    )
  }

  return (
    <button onClick={() => setEditing(true)}
      className="text-[#B89080] hover:text-[#7A3E2E] hover:underline text-sm transition-colors"
      title="Click to edit threshold">
      {item.low_stock_threshold}
    </button>
  )
}

export default function InventoryPage() {
  const { inventory, loading, error } = useRealtimeInventory()
  const { adjustInventory } = useInventory()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)

  const filtered = useMemo(() => {
    setPage(1)
    return inventory.filter(item => {
      if (search) {
        const q = search.toLowerCase()
        const name = item.products?.name?.toLowerCase() ?? ''
        const sku = item.products?.sku?.toLowerCase() ?? ''
        if (!name.includes(q) && !sku.includes(q)) return false
      }
      if (statusFilter) {
        const status = getStockStatus(item.quantity, item.low_stock_threshold)
        if (status !== statusFilter) return false
      }
      return true
    })
  }, [inventory, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const lowStockItems = inventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) !== 'in_stock')
  const hasFilters = search || statusFilter

  async function handleThresholdSave(productId: string, threshold: number) {
    const { error } = await supabase
      .from('inventory')
      .update({ low_stock_threshold: threshold })
      .eq('product_id', productId)
    if (error) toast.error('Failed to update threshold')
    else toast.success('Threshold updated')
  }

  return (
    <div>
      <h1 className="text-lg font-medium text-[#7A3E2E] mb-4">Inventory</h1>

      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-2 bg-[#FDECEA] border border-[#F2C4B0] rounded-xl px-4 py-3 mb-3">
          <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0" />
          <p className="text-sm text-[#C05050]">
            <span className="font-medium">{lowStockItems.length} {lowStockItems.length === 1 ? 'product' : 'products'}</span>
            {' '}low on stock or out of stock — restock soon.
          </p>
        </div>
      )}

      {error && <div className="text-sm text-[#C05050] mb-3">{error}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or SKU…" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} placeholder="All Status"
          options={[
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Low Stock', value: 'low_stock' },
            { label: 'Out of Stock', value: 'out_of_stock' },
          ]} />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setStatusFilter('') }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">Clear filters</button>
        )}
        <span className="text-xs text-[#B89080] ml-auto">{filtered.length} of {inventory.length} items</span>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#F2C4B0]">
              {['Product', 'SKU', 'Qty', 'Threshold', 'Status', 'Last Updated', ''].map((h, i) => (
                <th key={i} className="text-left py-3 px-4 text-[#B89080] font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody><TableSkeleton rows={PAGE_SIZE} cols={7} /></tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState title={hasFilters ? 'No items match your filters' : 'No inventory records'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Add products to see inventory here.'} />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Qty</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium" title="Click to edit">
                    Threshold ✎
                  </th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Last Updated</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                    <td className="py-3 px-4 font-medium text-[#7A3E2E]">{item.products?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-[#B89080] font-mono text-xs">{item.products?.sku ?? '—'}</td>
                    <td className="py-3 px-4 text-[#7A3E2E]">{item.quantity}</td>
                    <td className="py-3 px-4">
                      <ThresholdCell item={item} onSave={handleThresholdSave} />
                    </td>
                    <td className="py-3 px-4">
                      <StockBadge status={getStockStatus(item.quantity, item.low_stock_threshold)} />
                    </td>
                    <td className="py-3 px-4 text-[#B89080] text-xs">{formatDate(item.updated_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setHistoryItem(item)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors"
                          title="View stock history">
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setAdjustTarget(item)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs border border-[#F2C4B0] text-[#7A3E2E] rounded-lg hover:bg-[#FDE8DF] transition-colors">
                          <Plus className="w-3 h-3" /><Minus className="w-3 h-3" />
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      {adjustTarget && (
        <InventoryAdjustmentForm
          open={!!adjustTarget}
          onOpenChange={open => { if (!open) setAdjustTarget(null) }}
          item={adjustTarget}
          onSubmit={async (quantity, note) => {
            await adjustInventory(adjustTarget.product_id, quantity, note)
            setAdjustTarget(null)
          }}
        />
      )}

      <StockHistoryDrawer item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  )
}
