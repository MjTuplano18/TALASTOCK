'use client'

import { useEffect, useState } from 'react'
import { X, Package, Tag, DollarSign, Boxes, Clock } from 'lucide-react'
import { StockBadge } from '@/components/shared/StockBadge'
import { StockMovementTable } from '@/components/tables/StockMovementTable'
import { useStockMovements } from '@/hooks/useStockMovements'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStockStatus } from '@/types'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductDrawerProps {
  product: Product | null
  onClose: () => void
  onEdit: (product: Product) => void
}

export function ProductDrawer({ product, onClose, onEdit }: ProductDrawerProps) {
  const { movements, loading } = useStockMovements(product?.id)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (product) {
      setTimeout(() => setMounted(true), 10)
    } else {
      setMounted(false)
    }
  }, [product])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!product) return null

  const qty = product.inventory?.quantity ?? 0
  const threshold = product.inventory?.low_stock_threshold ?? 10
  const status = getStockStatus(qty, threshold)

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0 z-40 bg-black/30 transition-opacity duration-200',
          mounted ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-[#F2C4B0] flex flex-col',
        'transition-transform duration-300',
        mounted ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2C4B0]">
          <h2 className="text-sm font-medium text-[#7A3E2E]">Product Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(product)}
              className="px-3 py-1.5 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors"
            >
              Edit
            </button>
            <button onClick={onClose} className="text-[#B89080] hover:text-[#7A3E2E] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Product header */}
          <div className="px-5 py-4 border-b border-[#F2C4B0]">
            <div className="flex items-start gap-3">
              {/* Image or placeholder */}
              <div className="w-14 h-14 rounded-xl bg-[#FDE8DF] border border-[#F2C4B0] flex items-center justify-center shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <Package className="w-6 h-6 text-[#E8896A]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-[#7A3E2E] truncate">{product.name}</h3>
                <p className="text-xs text-[#B89080] font-mono mt-0.5">{product.sku}</p>
                <div className="mt-1.5">
                  <StockBadge status={status} />
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-[#F2C4B0]">
            <div className="bg-[#FDF6F0] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-[#E8896A]" />
                <span className="text-[10px] text-[#B89080]">Selling Price</span>
              </div>
              <p className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(product.price)}</p>
            </div>
            <div className="bg-[#FDF6F0] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-[#E8896A]" />
                <span className="text-[10px] text-[#B89080]">Cost Price</span>
              </div>
              <p className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(product.cost_price)}</p>
            </div>
            <div className="bg-[#FDF6F0] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Boxes className="w-3 h-3 text-[#E8896A]" />
                <span className="text-[10px] text-[#B89080]">Current Stock</span>
              </div>
              <p className={cn('text-sm font-medium', status === 'out_of_stock' ? 'text-[#C05050]' : 'text-[#7A3E2E]')}>
                {qty} units
              </p>
            </div>
            <div className="bg-[#FDF6F0] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Tag className="w-3 h-3 text-[#E8896A]" />
                <span className="text-[10px] text-[#B89080]">Category</span>
              </div>
              <p className="text-sm font-medium text-[#7A3E2E]">
                {product.categories?.name ?? '—'}
              </p>
            </div>
          </div>

          {/* Margin */}
          <div className="px-5 py-3 border-b border-[#F2C4B0]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#B89080]">Profit Margin</span>
              <span className="text-xs font-medium text-[#7A3E2E]">
                {product.cost_price > 0
                  ? `${(((product.price - product.cost_price) / product.price) * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[#B89080]">Profit per unit</span>
              <span className="text-xs font-medium text-[#7A3E2E]">
                {formatCurrency(product.price - product.cost_price)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[#B89080]">Added</span>
              <span className="text-xs text-[#B89080]">{formatDateTime(product.created_at)}</span>
            </div>
          </div>

          {/* Stock movement history */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#E8896A]" />
              <h4 className="text-xs font-medium text-[#7A3E2E]">Stock Movement History</h4>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 bg-[#FDE8DF] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <p className="text-xs text-[#B89080] text-center py-4">No stock movements yet</p>
            ) : (
              <StockMovementTable movements={movements.slice(0, 20)} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
