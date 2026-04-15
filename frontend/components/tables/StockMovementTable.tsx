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
  import:     { label: 'Import',     bg: '#E8F5E9', color: '#2E7D32' },
  rollback:   { label: 'Rollback',   bg: '#FFF3E0', color: '#E65100' },
}

interface StockMovementTableProps {
  movements: StockMovement[]
  loading?: boolean
}

export function StockMovementTable({ movements, loading }: StockMovementTableProps) {
  const columns: ColumnDef<StockMovement>[] = [
    {
      id: 'type',
      header: () => <span className="text-[#B89080] font-medium text-xs">Type</span>,
      cell: ({ row }) => {
        const config = movementTypeConfig[row.original.type] || {
          label: row.original.type,
          bg: '#F5F5F5',
          color: '#666666'
        }
        return (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: config.bg, color: config.color }}
          >
            {config.label}
          </span>
        )
      },
      size: 80,
    },
    {
      id: 'product',
      header: () => <span className="text-[#B89080] font-medium text-xs">Product</span>,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-xs text-[#7A3E2E] truncate">{row.original.products?.name ?? '—'}</p>
          {row.original.products?.sku && (
            <p className="text-[10px] text-[#B89080] font-mono truncate">{row.original.products.sku}</p>
          )}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'quantity',
      header: () => <span className="text-[#B89080] font-medium text-xs">Qty</span>,
      cell: ({ row }) => (
        <span className="text-xs text-[#7A3E2E] font-medium">{row.original.quantity}</span>
      ),
      size: 50,
    },
    {
      accessorKey: 'note',
      header: () => <span className="text-[#B89080] font-medium text-xs">Note</span>,
      cell: ({ row }) => (
        <span className="text-[10px] text-[#B89080] line-clamp-2" title={row.original.note || undefined}>
          {row.original.note ?? '—'}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: 'created_at',
      header: () => <span className="text-[#B89080] font-medium text-xs">Date</span>,
      cell: ({ row }) => {
        const date = new Date(row.original.created_at)
        return (
          <div className="text-[10px] text-[#B89080] whitespace-nowrap">
            <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        )
      },
      size: 70,
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
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm border-collapse">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="border-b border-[#F2C4B0]">
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  className="text-left py-2 px-2 first:pl-0 last:pr-0"
                  style={{ width: header.column.columnDef.size }}
                >
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
                  <td 
                    key={cell.id} 
                    className="py-2 px-2 first:pl-0 last:pr-0"
                    style={{ width: cell.column.columnDef.size }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
