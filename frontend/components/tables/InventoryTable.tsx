'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StockBadge } from '@/components/shared/StockBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { InventoryAdjustmentForm } from '@/components/forms/InventoryAdjustmentForm'
import { formatDate } from '@/lib/utils'
import { getStockStatus } from '@/types'
import type { InventoryItem } from '@/types'

interface InventoryTableProps {
  inventory: InventoryItem[]
  loading?: boolean
  onAdjust: (productId: string, quantity: number, note: string) => Promise<boolean>
}

export function InventoryTable({ inventory, loading, onAdjust }: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)

  const filtered = showLowOnly
    ? inventory.filter(item => item.quantity <= item.low_stock_threshold)
    : inventory

  const columns: ColumnDef<InventoryItem>[] = [
    {
      id: 'name',
      header: () => <span className="text-[#B89080] font-medium">Product Name</span>,
      accessorFn: row => row.products?.name ?? '',
      cell: ({ row }) => (
        <span className="font-medium text-[#7A3E2E]">
          {row.original.products?.name ?? '—'}
        </span>
      ),
    },
    {
      id: 'sku',
      header: () => <span className="text-[#B89080] font-medium">SKU</span>,
      accessorFn: row => row.products?.sku ?? '',
      cell: ({ row }) => (
        <span className="text-[#B89080] font-mono text-xs">
          {row.original.products?.sku ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: () => <span className="text-[#B89080] font-medium">Quantity</span>,
      cell: ({ row }) => (
        <span className="text-[#7A3E2E]">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: 'low_stock_threshold',
      header: () => <span className="text-[#B89080] font-medium">Threshold</span>,
      cell: ({ row }) => (
        <span className="text-[#B89080]">{row.original.low_stock_threshold}</span>
      ),
    },
    {
      id: 'status',
      header: () => <span className="text-[#B89080] font-medium">Status</span>,
      cell: ({ row }) => (
        <StockBadge
          status={getStockStatus(row.original.quantity, row.original.low_stock_threshold)}
        />
      ),
    },
    {
      accessorKey: 'updated_at',
      header: () => <span className="text-[#B89080] font-medium">Last Updated</span>,
      cell: ({ row }) => (
        <span className="text-[#B89080] text-xs">{formatDate(row.original.updated_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] h-7 text-xs"
          onClick={() => setAdjustTarget(row.original)}
        >
          Adjust
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <Button
          size="sm"
          variant="outline"
          className={
            showLowOnly
              ? 'border-[#E8896A] text-[#E8896A] bg-[#FDE8DF] h-8 text-xs'
              : 'border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] h-8 text-xs'
          }
          onClick={() => setShowLowOnly(prev => !prev)}
        >
          <SlidersHorizontal className="w-3 h-3 mr-1" />
          {showLowOnly ? 'Show all' : 'Low stock only'}
        </Button>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title={showLowOnly ? 'No low stock items' : 'No inventory records'}
          description={
            showLowOnly
              ? 'All products are sufficiently stocked.'
              : 'Inventory records will appear here once products are added.'
          }
        />
      ) : (
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
      )}

      {adjustTarget && (
        <InventoryAdjustmentForm
          open={!!adjustTarget}
          onOpenChange={open => { if (!open) setAdjustTarget(null) }}
          item={adjustTarget}
          onSubmit={async (quantity, note) => {
            const ok = await onAdjust(adjustTarget.product_id, quantity, note)
            if (ok) setAdjustTarget(null)
          }}
        />
      )}
    </>
  )
}
