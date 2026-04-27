'use client'

import { MoreHorizontal, Pencil, Trash2, Phone, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/types'

interface CustomersTableMobileProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (id: string) => void
  onRowClick: (customer: Customer) => void
}

export function CustomersTableMobile({ customers, onEdit, onDelete, onRowClick }: CustomersTableMobileProps) {
  return (
    <div className="divide-y divide-[#FDE8DF]">
      {customers.map((customer) => {
        const availableCredit = customer.credit_limit - customer.current_balance
        const isNearLimit = customer.current_balance / customer.credit_limit > 0.8

        return (
          <div
            key={customer.id}
            onClick={() => onRowClick(customer)}
            className="p-4 hover:bg-[#FDF6F0] cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-[#7A3E2E] text-sm">{customer.name}</h3>
                {customer.business_name && (
                  <div className="flex items-center gap-1 text-xs text-[#B89080] mt-0.5">
                    <Building2 className="w-3 h-3" />
                    {customer.business_name}
                  </div>
                )}
                {customer.contact_number && (
                  <div className="flex items-center gap-1 text-xs text-[#B89080] mt-0.5">
                    <Phone className="w-3 h-3" />
                    {customer.contact_number}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-[#FDE8DF]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4 text-[#7A3E2E]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#F2C4B0]">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(customer)
                    }}
                    className="text-[#7A3E2E] hover:bg-[#FDE8DF] cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(customer.id)
                    }}
                    className="text-[#C05050] hover:bg-[#FDECEA] cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#B89080]">Balance:</span>
                <span className={`ml-1 font-medium ${customer.current_balance > 0 ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
                  ₱{customer.current_balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[#B89080]">Limit:</span>
                <span className="ml-1 text-[#7A3E2E]">
                  ₱{customer.credit_limit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[#B89080]">Available:</span>
                <span className={`ml-1 ${isNearLimit ? 'text-[#C05050] font-medium' : 'text-[#7A3E2E]'}`}>
                  ₱{availableCredit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[#B89080]">Terms:</span>
                <span className="ml-1 text-[#7A3E2E]">{customer.payment_terms_days} days</span>
              </div>
            </div>

            <div className="mt-2">
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  background: customer.is_active ? '#FDE8DF' : '#F5E0DF',
                  color: customer.is_active ? '#C1614A' : '#A03030',
                }}
              >
                {customer.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
