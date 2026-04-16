'use client'

import { ShoppingCart, Plus, Minus, Trash2, AlertTriangle, Tag, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CartItem, DiscountType } from '@/types'

interface POSCartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCompleteSale: () => void
  onClearCart: () => void
  isProcessing: boolean
  offlineMode: boolean
  discount?: {
    type: DiscountType
    value: number
    amount: number
  }
  onOpenDiscountModal?: () => void
  onRemoveDiscount?: () => void
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteSale,
  onClearCart,
  isProcessing,
  offlineMode,
  discount,
  onOpenDiscountModal,
  onRemoveDiscount,
}: POSCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = discount?.amount ?? 0
  const cartTotal = subtotal - discountAmount
  const hasStockWarnings = items.some(item => item.stockWarning)
  const isEmpty = items.length === 0

  // Helper function to format discount label
  const getDiscountLabel = () => {
    if (!discount || discount.type === 'none') return ''
    
    if (discount.type === 'percentage') {
      return `${discount.value}% off`
    } else if (discount.type === 'fixed') {
      return `${formatCurrency(discount.value)} off`
    } else if (discount.type === 'senior_pwd') {
      return 'Senior/PWD (20% off)'
    }
    return ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#E8896A]" />
          <h2 className="text-sm font-medium text-[#7A3E2E]">
            Cart {items.length > 0 && `(${items.length})`}
          </h2>
        </div>
        {!isEmpty && (
          <button
            onClick={onClearCart}
            disabled={isProcessing}
            className="text-xs text-[#B89080] hover:text-[#C05050] transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto mb-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 text-[#E8896A]" />
            </div>
            <p className="text-sm text-[#7A3E2E] font-medium mb-1">Cart is empty</p>
            <p className="text-xs text-[#B89080]">Search or scan products to add</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <CartItemComponent
                key={item.product.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
                disabled={isProcessing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stock Warnings */}
      {hasStockWarnings && (
        <div className="mb-3 p-2 rounded-lg bg-[#FDECEA] border border-[#F2C4B0]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C05050] shrink-0 mt-0.5" />
            <p className="text-xs text-[#C05050]">
              Some items have insufficient stock. Sale can still proceed.
            </p>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      <div className="border-t border-[#F2C4B0] pt-3 space-y-3">
        {/* Add Discount Button */}
        {!isEmpty && onOpenDiscountModal && (
          <button
            onClick={onOpenDiscountModal}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">
              {discount && discount.type !== 'none' ? 'Edit Discount' : 'Add Discount'}
            </span>
          </button>
        )}

        {/* Discount Breakdown */}
        {discount && discount.type !== 'none' && (
          <div className="space-y-2 p-3 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#B89080]">Subtotal</span>
              <span className="text-sm text-[#7A3E2E]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#E8896A] font-medium">Discount</span>
                <span className="text-xs text-[#B89080]">({getDiscountLabel()})</span>
                {onRemoveDiscount && (
                  <button
                    onClick={onRemoveDiscount}
                    disabled={isProcessing}
                    className="w-4 h-4 flex items-center justify-center rounded text-[#B89080] hover:text-[#C05050] hover:bg-white transition-colors disabled:opacity-50"
                    title="Remove discount"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-sm text-[#E8896A] font-medium">-{formatCurrency(discountAmount)}</span>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#B89080]">Total</span>
          <span className="text-lg font-medium text-[#7A3E2E]">{formatCurrency(cartTotal)}</span>
        </div>

        <button
          onClick={onCompleteSale}
          disabled={isEmpty || isProcessing || offlineMode}
          className="w-full h-11 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : offlineMode ? (
            'Offline'
          ) : (
            'Complete Sale'
          )}
        </button>
      </div>
    </div>
  )
}

interface CartItemComponentProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  disabled: boolean
}

function CartItemComponent({ item, onUpdateQuantity, onRemove, disabled }: CartItemComponentProps) {
  const { product, quantity, unitPrice, subtotal, stockWarning } = item

  function handleIncrement() {
    onUpdateQuantity(product.id, quantity + 1)
  }

  function handleDecrement() {
    if (quantity > 1) {
      onUpdateQuantity(product.id, quantity - 1)
    } else {
      onRemove(product.id)
    }
  }

  return (
    <div className="p-3 rounded-lg border border-[#F2C4B0] bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#7A3E2E] truncate">{product.name}</p>
          <p className="text-xs text-[#B89080] font-mono">{product.sku}</p>
        </div>
        <button
          onClick={() => onRemove(product.id)}
          disabled={disabled}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA] transition-colors disabled:opacity-50"
          title="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDecrement}
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 touch-manipulation"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => {
              const newQty = parseInt(e.target.value) || 1
              if (newQty > 0) {
                onUpdateQuantity(product.id, newQty)
              }
            }}
            disabled={disabled}
            className="w-14 h-8 text-center text-sm font-medium text-[#7A3E2E] border border-[#F2C4B0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8896A] focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleIncrement}
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Price Info */}
        <div className="text-right">
          <p className="text-xs text-[#B89080]">{formatCurrency(unitPrice)} each</p>
          <p className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(subtotal)}</p>
        </div>
      </div>

      {/* Stock Warning */}
      {stockWarning && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#C05050]">
          <AlertTriangle className="w-3 h-3" />
          <span>Exceeds available stock</span>
        </div>
      )}
    </div>
  )
}
