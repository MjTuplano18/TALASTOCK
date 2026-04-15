'use client'

import { useState, useMemo, useEffect } from 'react'
import { AlertTriangle, Plus, Minus, History } from 'lucide-react'
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory'
import { useInventory } from '@/hooks/useInventory'
import { useDebounce } from '@/hooks/useDebounce'
import { InventoryAdjustmentForm } from '@/components/forms/InventoryAdjustmentForm'
import { StockHistoryDrawer } from '@/components/inventory/StockHistoryDrawer'
import { CategoryFilter } from '@/components/inventory/CategoryFilter'
import { ImportModal } from '@/components/inventory/ImportModal'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { ImportButton } from '@/components/shared/ImportButton'
import { StockBadge } from '@/components/shared/StockBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { Pagination } from '@/components/shared/Pagination'
import { BulkActionToolbar } from '@/components/shared/BulkActionToolbar'
import { HighlightText } from '@/components/shared/HighlightText'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { exportInventoryToExcel, exportInventoryToCSV } from '@/lib/export-inventory'
import { getStockStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { InventoryItem, Category, Product } from '@/types'

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
  const { adjustInventory, bulkImportInventory } = useInventory()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  
  // Fetch categories and products for import
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchData() {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*, categories(*)').eq('is_active', true),
      ])
      
      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (productsRes.data) setProducts(productsRes.data as any)
    }
    fetchData()
  }, [])

  // Debounce search to reduce re-renders
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    setPage(1)
    return inventory.filter(item => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        const name = item.products?.name?.toLowerCase() ?? ''
        const sku = item.products?.sku?.toLowerCase() ?? ''
        if (!name.includes(q) && !sku.includes(q)) return false
      }
      if (statusFilter) {
        const status = getStockStatus(item.quantity, item.low_stock_threshold)
        if (status !== statusFilter) return false
      }
      if (categoryFilter) {
        if (item.products?.category_id !== categoryFilter) return false
      }
      return true
    })
  }, [inventory, debouncedSearch, statusFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const lowStockItems = inventory.filter(i => getStockStatus(i.quantity, i.low_stock_threshold) !== 'in_stock')
  const hasFilters = search || statusFilter || categoryFilter

  async function handleThresholdSave(productId: string, threshold: number) {
    const { error } = await supabase
      .from('inventory')
      .update({ low_stock_threshold: threshold })
      .eq('product_id', productId)
    if (error) toast.error('Failed to update threshold')
    else toast.success('Threshold updated')
  }

  function toggleSelection(id: string) {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map(item => item.id)))
    }
  }

  async function handleBulkDelete() {
    setBulkLoading(true)
    try {
      const productIds = Array.from(selectedIds).map(id => {
        const item = inventory.find(i => i.id === id)
        return item?.product_id
      }).filter(Boolean)

      // Delete inventory records
      const { error } = await supabase
        .from('inventory')
        .delete()
        .in('id', Array.from(selectedIds))

      if (error) throw error

      toast.success(`${selectedIds.size} inventory ${selectedIds.size === 1 ? 'record' : 'records'} deleted`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
    } catch (error) {
      toast.error('Failed to delete inventory records')
      console.error(error)
    } finally {
      setBulkLoading(false)
    }
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
        <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} categories={categories} />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter('') }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">Clear filters</button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#B89080]">{filtered.length} of {inventory.length} items</span>
          <ImportButton onClick={() => setImportModalOpen(true)} />
          <ExportDropdown 
            onExportExcel={() => exportInventoryToExcel(filtered)}
            onExportCSV={() => exportInventoryToCSV(filtered)}
            disabled={filtered.length === 0}
            itemCount={filtered.length}
            isFiltered={hasFilters}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#F2C4B0]">
              {['Product', 'SKU', 'Category', 'Qty', 'Threshold', 'Status', 'Last Updated', ''].map((h, i) => (
                <th key={i} className="text-left py-3 px-4 text-[#B89080] font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody><TableSkeleton rows={PAGE_SIZE} cols={8} /></tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState title={hasFilters ? 'No items match your filters' : 'No inventory records'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Add products to see inventory here.'} />
        ) : (
          <>
            <BulkActionToolbar
              selectedCount={selectedIds.size}
              onClearSelection={() => setSelectedIds(new Set())}
              onBulkDelete={() => setBulkDeleteOpen(true)}
              deleteLabel="Delete"
            />
            
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 accent-[#E8896A] cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Category</th>
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
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="w-3.5 h-3.5 accent-[#E8896A] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-[#7A3E2E]">
                      <HighlightText text={item.products?.name ?? '—'} highlight={debouncedSearch} />
                    </td>
                    <td className="py-3 px-4 text-[#B89080] font-mono text-xs">
                      <HighlightText text={item.products?.sku ?? '—'} highlight={debouncedSearch} />
                    </td>
                    <td className="py-3 px-4 text-[#7A3E2E]">{item.products?.categories?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-[#7A3E2E]">{item.quantity}</td>
                    <td className="py-3 px-4">
                      <ThresholdCell item={item} onSave={handleThresholdSave} />
                    </td>
                    <td className="py-3 px-4">
                      <StockBadge status={getStockStatus(item.quantity, item.low_stock_threshold)} />
                    </td>
                    <td className="py-3 px-4 text-[#B89080] text-xs">
                      <RelativeTime date={item.updated_at} />
                    </td>
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
      
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false)
          // Inventory will auto-refresh via realtime
        }}
        products={products}
        inventory={inventory}
        onImport={bulkImportInventory}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.size} inventory ${selectedIds.size === 1 ? 'record' : 'records'}`}
        description="This will permanently delete the selected inventory records. This cannot be undone."
        confirmLabel={`Delete ${selectedIds.size} ${selectedIds.size === 1 ? 'record' : 'records'}`}
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
        danger
      />
    </div>
  )
}
