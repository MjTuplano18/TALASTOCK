'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Customer } from '@/types'

interface CustomersTableProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (id: string) => void
  onRowClick: (customer: Customer) => void
}

export function CustomersTable({ customers, onEdit, onDelete, onRowClick }: CustomersTableProps) {
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Customer Name',
      cell: ({ row }) => (
        <div className="font-medium text-[#7A3E2E]">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'contact_number',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="text-[#7A3E2E]">{row.original.contact_number || '—'}</div>
      ),
    },
    {
      accessorKey: 'business_name',
      header: 'Business',
      cell: ({ row }) => (
        <div className="text-[#7A3E2E]">{row.original.business_name || '—'}</div>
      ),
    },
    {
      accessorKey: 'current_balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = row.original.current_balance
        return (
          <div className={balance > 0 ? 'text-[#C05050] font-medium' : 'text-[#7A3E2E]'}>
            ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )
      },
    },
    {
      accessorKey: 'credit_limit',
      header: 'Credit Limit',
      cell: ({ row }) => (
        <div className="text-[#7A3E2E]">
          ₱{row.original.credit_limit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      id: 'available_credit',
      header: 'Available',
      cell: ({ row }) => {
        const available = row.original.credit_limit - row.original.current_balance
        return (
          <div className="text-[#7A3E2E]">
            ₱{available.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )
      },
    },
    {
      accessorKey: 'payment_terms_days',
      header: 'Terms',
      cell: ({ row }) => (
        <div className="text-[#7A3E2E]">{row.original.payment_terms_days} days</div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.is_active
        return (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: isActive ? '#FDE8DF' : '#F5E0DF',
              color: isActive ? '#C1614A' : '#A03030',
            }}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        // Stop row click from firing when interacting with the menu
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-[#FDE8DF] rounded-lg inline-flex items-center justify-center transition-colors focus:outline-none">
              <MoreHorizontal className="h-4 w-4 text-[#7A3E2E]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#F2C4B0]">
              <DropdownMenuItem
                onClick={() => onEdit(row.original)}
                className="text-[#7A3E2E] hover:bg-[#FDE8DF] cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original.id)}
                className="text-[#C05050] hover:bg-[#FDECEA] cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table className="w-full text-sm">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-[#F2C4B0]">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="text-left py-3 px-3 text-[#B89080] font-medium text-xs"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowClick(row.original)}
            className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0] cursor-pointer transition-colors"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="py-3 px-3">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
