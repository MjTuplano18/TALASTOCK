'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StockBadge } from '@/components/shared/StockBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { getStockStatus } from '@/types'
import type { Product } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProductsTableMobileProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => Promise<unknown>
  onRowClick?: (product: Product) => void
}

export function ProductsTableMobile({
  products,
  onEdit,
  onDelete,
  onRowClick,
}: ProductsTableMobileProps) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await onDelete(deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="flex flex-col gap-2 p-3">
        {products.map(product => {
          const qty = product.inventory?.quantity ?? 0
          const threshold = product.inventory?.low_stock_threshold ?? 10
          const status = getStockStatus(qty, threshold)
          const initials = product.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

          return (
            <div
              key={product.id}
              className="bg-white border border-[#F2C4B0] rounded-lg p-3 active:bg-[#FDF6F0] transition-colors"
              onClick={() => onRowClick?.(product)}
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0] flex items-center justify-center overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-xs font-medium text-[#C1614A]">{initials}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[#7A3E2E] truncate">
                      {product.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={e => e.stopPropagation()}
                        className="h-7 w-7 p-0 rounded-md text-[#B89080] hover:text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors shrink-0 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-[#F2C4B0]">
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            onEdit(product)
                          }}
                          className="text-[#7A3E2E]"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            setDeleteTarget(product)
                          }}
                          className="text-[#C05050]"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-[#B89080] font-mono mb-2">{product.sku}</p>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-[#B89080]">Stock: </span>
                        <span className="text-[#7A3E2E] font-medium">{qty}</span>
                      </div>
                      <div>
                        <span className="text-[#B89080]">Price: </span>
                        <span className="text-[#7A3E2E] font-medium">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    </div>
                    <StockBadge status={status} />
                  </div>

                  {product.categories?.name && (
                    <div className="mt-2 pt-2 border-t border-[#FDE8DF]">
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
        danger
      />
    </>
  )
}
