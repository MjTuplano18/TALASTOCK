'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StockBadge } from '@/components/shared/StockBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { getStockStatus } from '@/types'
import type { Product } from '@/types'

interface ProductsTableProps {
  products: Product[]
  loading?: boolean
  onEdit: (product: Product) => void
  onDelete: (id: string) => Promise<unknown>
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="w-3 h-3 ml-1 inline" />
  if (sorted === 'desc') return <ArrowDown className="w-3 h-3 ml-1 inline" />
  return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />
}

export function ProductsTable({ products, loading, onEdit, onDelete }: ProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center text-[#B89080] font-medium hover:text-[#7A3E2E]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Product Name
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-[#7A3E2E]">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => (
        <button
          className="flex items-center text-[#B89080] font-medium hover:text-[#7A3E2E]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          SKU
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-[#B89080] font-mono text-xs">{row.original.sku}</span>
      ),
    },
    {
      id: 'category',
      header: () => <span className="text-[#B89080] font-medium">Category</span>,
      cell: ({ row }) => (
        <span className="text-[#7A3E2E]">
          {row.original.categories?.name ?? <span className="text-[#B89080]">—</span>}
        </span>
      ),
    },
    {
      id: 'stock',
      header: () => <span className="text-[#B89080] font-medium">Stock</span>,
      cell: ({ row }) => {
        const qty = row.original.inventory?.quantity ?? 0
        return <span className="text-[#7A3E2E]">{qty}</span>
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <button
          className="flex items-center text-[#B89080] font-medium hover:text-[#7A3E2E]"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Price
          <SortIcon sorted={column.getIsSorted()} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-[#7A3E2E]">{formatCurrency(row.original.price)}</span>
      ),
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
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF]"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA]"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await onDelete(deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  if (!loading && products.length === 0) {
    return (
      <EmptyState
        title="No products yet"
        description="Add your first product to get started."
      />
    )
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="border-b border-[#F2C4B0]">
              {headerGroup.headers.map(header => (
                <th key={header.id} className="text-left py-3 px-4">
                  {flexRender(header.column.columnDef.header, header.getContext())}
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
              <tr key={row.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-3 px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
        danger
      />
    </>
  )
}
