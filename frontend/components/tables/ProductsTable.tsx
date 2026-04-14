'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Package, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StockBadge } from '@/components/shared/StockBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { formatCurrency } from '@/lib/utils'
import { getStockStatus } from '@/types'
import type { Product } from '@/types'
import type { Category } from '@/types'

interface ProductsTableProps {
  products: Product[]
  categories?: Category[]
  loading?: boolean
  onEdit: (product: Product) => void
  onDelete: (id: string) => Promise<unknown>
  onRowClick?: (product: Product) => void
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkChangeCategory?: (ids: string[], categoryId: string) => Promise<void>
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="w-3 h-3 ml-1 inline" />
  if (sorted === 'desc') return <ArrowDown className="w-3 h-3 ml-1 inline" />
  return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />
}

export function ProductsTable({
  products, categories = [], loading, onEdit, onDelete, onRowClick,
  onBulkDelete, onBulkChangeCategory,
}: ProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
  const hasSelection = selectedIds.length > 0

  const columns: ColumnDef<Product>[] = [
    // Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-3.5 h-3.5 accent-[#E8896A] cursor-pointer" />
      ),
      cell: ({ row }) => (
        <input type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 accent-[#E8896A] cursor-pointer" />
      ),
      size: 32,
    },
    // Thumbnail
    {
      id: 'image',
      header: () => null,
      cell: ({ row }) => {
        const p = row.original
        const initials = p.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0] flex items-center justify-center overflow-hidden shrink-0">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <span className="text-[9px] font-medium text-[#C1614A]">{initials}</span>
            )}
          </div>
        )
      },
      size: 40,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button className="flex items-center text-[#B89080] font-medium hover:text-[#7A3E2E]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Product Name <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => <span className="font-medium text-[#7A3E2E]">{row.original.name}</span>,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => (
        <button className="flex items-center text-[#B89080] font-medium hover:text-[#7A3E2E]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          SKU <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => <span className="text-[#B89080] font-mono text-xs">{row.original.sku}</span>,
    },
    {
      id: 'category',
      header: () => <span className="text-[#B89080] font-medium">Category</span>,
      cell: ({ row }) => (
        <span className="text-[#7A3E2E]">{row.original.categories?.name ?? <span className="text-[#B89080]">—</span>}</span>
      ),
    },
    {
      id: 'stock',
      header: () => <span className="text-[#B89080] font-medium">Stock</span>,
      cell: ({ row }) => <span className="text-[#7A3E2E]">{row.original.inventory?.quantity ?? 0}</span>,
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <button className="flex items-center text-[#B89080] font-medium hover:text-[#7A3E2E]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Price <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => <span className="text-[#7A3E2E]">{formatCurrency(row.original.price)}</span>,
    },
    {
      id: 'status',
      header: () => <span className="text-[#B89080] font-medium">Status</span>,
      cell: ({ row }) => {
        const qty = row.original.inventory?.quantity ?? 0
        const threshold = row.original.inventory?.low_stock_threshold ?? 10
        return <StockBadge status={getStockStatus(qty, threshold)} />
      },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost"
            className="h-8 w-8 p-0 text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF]"
            onClick={() => onEdit(row.original)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost"
            className="h-8 w-8 p-0 text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA]"
            onClick={() => setDeleteTarget(row.original)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: row => row.id,
  })

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await onDelete(deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  async function handleBulkDelete() {
    if (!onBulkDelete) return
    setBulkLoading(true)
    await onBulkDelete(selectedIds)
    setRowSelection({})
    setBulkLoading(false)
    setBulkDeleteOpen(false)
  }

  async function handleBulkCategory() {
    if (!onBulkChangeCategory || !bulkCategoryId) return
    setBulkLoading(true)
    await onBulkChangeCategory(selectedIds, bulkCategoryId)
    setRowSelection({})
    setBulkCategoryId('')
    setBulkLoading(false)
  }

  if (!loading && products.length === 0) {
    return <EmptyState title="No products yet" description="Add your first product to get started." />
  }

  return (
    <>
      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FDE8DF] border-b border-[#F2C4B0]">
          <span className="text-xs font-medium text-[#7A3E2E]">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5 ml-2">
            {/* Change category */}
            {categories.length > 0 && onBulkChangeCategory && (
              <div className="flex items-center gap-1">
                <select value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value)}
                  className="text-xs border border-[#F2C4B0] rounded-lg px-2 py-1 bg-white text-[#7A3E2E] focus:outline-none focus:border-[#E8896A]">
                  <option value="">Change category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {bulkCategoryId && (
                  <button onClick={handleBulkCategory} disabled={bulkLoading}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50">
                    <Tag className="w-3 h-3" />Apply
                  </button>
                )}
              </div>
            )}
            <button onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs border border-[#FDECEA] text-[#C05050] hover:bg-[#FDECEA] rounded-lg transition-colors">
              <Trash2 className="w-3 h-3" />Delete {selectedIds.length}
            </button>
          </div>
          <button onClick={() => setRowSelection({})}
            className="ml-auto text-xs text-[#B89080] hover:text-[#7A3E2E]">
            Clear selection
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b border-[#F2C4B0]">
              {hg.headers.map(h => (
                <th key={h.id} className="text-left py-3 px-3">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton rows={5} cols={columns.length} />
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id}
                className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0] cursor-pointer"
                onClick={() => onRowClick?.(row.original)}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-2.5 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Single delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
        danger
      />

      {/* Bulk delete */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} products`}
        description="This will permanently delete all selected products. This cannot be undone."
        confirmLabel={`Delete ${selectedIds.length} products`}
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
        danger
      />
    </>
  )
}
