'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { useInventory } from '@/hooks/useInventory'
import { InventoryTable } from '@/components/tables/InventoryTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { getStockStatus } from '@/types'

export default function InventoryPage() {
  const { inventory, loading, error } = useRealtimeInventory()
  const { adjustInventory } = useInventory()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
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

  const lowStockItems = inventory.filter(
    item => getStockStatus(item.quantity, item.low_stock_threshold) !== 'in_stock'
  )

  const hasFilters = search || statusFilter

  return (
    <div>
      <h1 className="text-lg font-medium text-[#7A3E2E] mb-4">Inventory</h1>

      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-2 bg-[#FDECEA] border border-[#F2C4B0] rounded-xl px-4 py-3 mb-3">
          <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0" />
          <p className="text-sm text-[#C05050]">
            {lowStockItems.length} {lowStockItems.length === 1 ? 'product is' : 'products are'} low on stock or out of stock.
          </p>
        </div>
      )}

      {error && <div className="text-sm text-[#C05050] mb-3">{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or SKU…" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Low Stock', value: 'low_stock' },
            { label: 'Out of Stock', value: 'out_of_stock' },
          ]} />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setStatusFilter('') }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-[#B89080] ml-auto">
          {filtered.length} of {inventory.length} items
        </span>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <InventoryTable
          inventory={filtered}
          loading={loading}
          onAdjust={adjustInventory}
        />
      </div>
    </div>
  )
}
