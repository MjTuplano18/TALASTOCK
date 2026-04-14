'use client'

import { MoreVertical, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Sale } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SalesTableMobileProps {
  sales: Sale[]
  onView: (sale: Sale) => void
  onDelete: (id: string) => Promise<unknown>
}

export function SalesTableMobile({
  sales,
  onView,
  onDelete,
}: SalesTableMobileProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {sales.map(sale => {
        const itemCount = sale.sale_items?.length || 0
        const date = new Date(sale.created_at)

        return (
          <div
            key={sale.id}
            className="bg-white border border-[#F2C4B0] rounded-lg p-3 active:bg-[#FDF6F0] transition-colors"
            onClick={() => onView(sale)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-[#E8896A]" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="text-sm font-medium text-[#7A3E2E]">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-[#B89080]">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={e => e.stopPropagation()}
                      className="h-7 w-7 p-0 rounded-md text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors shrink-0 flex items-center justify-center border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8896A]"
                      aria-label="Open menu"
                    >
                      <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-[#F2C4B0]">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          onView(sale)
                        }}
                        className="text-[#7A3E2E]"
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          onDelete(sale.id)
                        }}
                        className="text-[#C05050]"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-[#B89080] mb-2">
                  {date.toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {sale.notes && (
                  <div className="pt-2 border-t border-[#FDE8DF]">
                    <p className="text-xs text-[#7A3E2E] line-clamp-2">{sale.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
