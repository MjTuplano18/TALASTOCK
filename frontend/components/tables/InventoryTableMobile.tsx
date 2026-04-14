'use client'

import { MoreVertical, Package } from 'lucide-react'
import { StockBadge } from '@/components/shared/StockBadge'
import { formatCurrency } from '@/lib/utils'
import { getStockStatus } from '@/types'
import type { InventoryItem } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InventoryTableMobileProps {
  items: InventoryItem[]
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
}

export function InventoryTableMobile({
  items,
  onAdjust,
  onViewHistory,
}: InventoryTableMobileProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {items.map(item => {
        const product = item.products
        if (!product) return null

        const status = getStockStatus(item.quantity, item.low_stock_threshold)
        const value = item.quantity * (product.cost_price || product.price)

        return (
          <div
            key={item.id}
            className="bg-white border border-[#F2C4B0] rounded-lg p-3"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#E8896A]" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-medium text-[#7A3E2E] truncate">
                    {product.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="h-7 w-7 p-0 rounded-md text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors shrink-0 flex items-center justify-center border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8896A]"
                      aria-label="Open menu"
                    >
                      <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-[#F2C4B0]">
                      <DropdownMenuItem
                        onClick={() => onAdjust(item)}
                        className="text-[#7A3E2E]"
                      >
                        Adjust Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onViewHistory(item)}
                        className="text-[#7A3E2E]"
                      >
                        View History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-xs text-[#B89080] mb-2">{product.sku}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-[#B89080]">Stock: </span>
                    <span className="text-[#7A3E2E] font-medium">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[#B89080]">Threshold: </span>
                    <span className="text-[#7A3E2E] font-medium">{item.low_stock_threshold}</span>
                  </div>
                  <div>
                    <span className="text-[#B89080]">Value: </span>
                    <span className="text-[#7A3E2E] font-medium">{formatCurrency(value)}</span>
                  </div>
                  <div className="flex justify-end">
                    <StockBadge status={status} />
                  </div>
                </div>

                {product.categories?.name && (
                  <div className="pt-2 border-t border-[#FDE8DF]">
                    <span className="text-xs text-[#B89080]">
                      {product.categories.name}
                    </span>
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
