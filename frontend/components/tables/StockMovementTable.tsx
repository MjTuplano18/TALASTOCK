'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatDateTime } from '@/lib/utils'
import type { StockMovement, StockMovementType } from '@/types'

const movementTypeConfig: Record<StockMovementType, { label: string; bg: string; color: string }> = {
  restock:    { label: 'Restock',    bg: '#FDE8DF', color: '#C1614A' },
  sale:       { label: 'Sale',       bg: '#FDECEA', color: '#C05050' },
  adjustment: { label: 'Adjustment', bg: '#F2C4B0', color: '#B89080' },
  return:     { label: 'Return',     bg: '#FDE8DF', color: '#C1614A' },
}

interface StockMovementTableProps {
  movements: StockMovement[]
  loading?: boolean
}

export function StockMovementTable({ movements, loading }: StockMovementTableProps) {
  const columns: ColumnDef<StockMovement>[] = [
    {
      id: 'type',
      header: () => <span className="text-[#B89080] font-medium">Type</span>,
      cell: ({ row }) => {
        const config = movementTypeConfig[row.original.type]
        return (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: config.bg, color: config.color }}
          >
            {config.label}
          </span>
        )
      },
    },
    {
      id: 'product',
      header: () => <span className="text-[#B89080] font-medium">Product</span>,
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-[#7A3E2E]">{row.original.products?.name ?? '—'}</p>
          {row.original.products?.sku && (
            <p className="text-xs text-[#B89080] font-mono">{row.original.products.sku}</p>
          )}
        </div>
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
      accessorKey: 'note',
      header: () => <span className="text-[#B89080] font-medium">Note</span>,
      cell: ({ row }) => (
        <span className="text-[#B89080] text-xs">{row.original.note ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: () => <span className="text-[#B89080] font-medium">Date</span>,
      cell: ({ row }) => (
        <span className="text-[#B89080] text-xs">{formatDateTime(row.original.created_at)}</span>
      ),
    },
  ]

  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!loading && movements.length === 0) {
    return (
      <EmptyState
        title="No stock movements"
        description="Stock movements will appear here as inventory changes."
      />
    )
  }

  return (
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
  )
}
