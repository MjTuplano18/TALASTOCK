'use client'

import { useState, useMemo } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Sale, 
  RefundItem, 
  calculateRefundAmount,
  isFullRefund 
} from '@/types'
import { AlertTriangle } from 'lucide-react'

interface RefundModalProps {
  open: boolean
  onClose: () => void
  sale: Sale
  onConfirm: (refundItems: RefundItem[], refundReason?: string) => Promise<void>
}

export function RefundModal({ open, onClose, sale, onConfirm }: RefundModalProps) {
  // State for selected items and their refund quantities
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({})
  const [refundReason, setRefundReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate total refund amount
  const totalRefundAmount = useMemo(() => {
    if (!sale.sale_items) return 0
    
    return sale.sale_items.reduce((total, item) => {
      if (selectedItems[item.id]) {
        const quantity = refundQuantities[item.id] || 0
        return total + calculateRefundAmount(quantity, item.unit_price)
      }
      return total
    }, 0)
  }, [sale.sale_items, selectedItems, refundQuantities])

  // Handle checkbox toggle
  const handleToggleItem = (itemId: string, originalQuantity: number) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev, [itemId]: !prev[itemId] }
      
      // If selecting, initialize quantity to original quantity
      if (newSelected[itemId]) {
        setRefundQuantities(prevQty => ({
          ...prevQty,
          [itemId]: originalQuantity
        }))
      } else {
        // If deselecting, clear quantity
        setRefundQuantities(prevQty => {
          const newQty = { ...prevQty }
          delete newQty[itemId]
          return newQty
        })
      }
      
      // Clear error for this item
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[itemId]
        return newErrors
      })
      
      return newSelected
    })
  }

  // Handle quantity change
  const handleQuantityChange = (itemId: string, value: string, maxQuantity: number) => {
    const quantity = parseInt(value) || 0
    
    // Validate quantity
    if (quantity < 1) {
      setErrors(prev => ({ ...prev, [itemId]: 'Quantity must be at least 1' }))
    } else if (quantity > maxQuantity) {
      setErrors(prev => ({ ...prev, [itemId]: `Cannot exceed original quantity (${maxQuantity})` }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[itemId]
        return newErrors
      })
    }
    
    setRefundQuantities(prev => ({ ...prev, [itemId]: quantity }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Check if at least one item is selected
    const hasSelectedItems = Object.values(selectedItems).some(selected => selected)
    if (!hasSelectedItems) {
      newErrors.general = 'Please select at least one item to refund'
      setErrors(newErrors)
      return false
    }
    
    // Validate each selected item
    if (sale.sale_items) {
      for (const item of sale.sale_items) {
        if (selectedItems[item.id]) {
          const quantity = refundQuantities[item.id]
          
          if (!quantity || quantity < 1) {
            newErrors[item.id] = 'Quantity must be at least 1'
          } else if (quantity > item.quantity) {
            newErrors[item.id] = `Cannot exceed original quantity (${item.quantity})`
          }
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle confirm
  const handleConfirm = async () => {
    if (!validateForm()) return
    if (!sale.sale_items) return
    
    setIsSubmitting(true)
    
    try {
      // Build refund items array
      const refundItems: RefundItem[] = sale.sale_items
        .filter(item => selectedItems[item.id])
        .map(item => ({
          sale_item_id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown Product',
          original_quantity: item.quantity,
          refund_quantity: refundQuantities[item.id],
          unit_price: item.unit_price,
          refund_amount: calculateRefundAmount(refundQuantities[item.id], item.unit_price)
        }))
      
      await onConfirm(refundItems, refundReason || undefined)
      
      // Reset form
      setSelectedItems({})
      setRefundQuantities({})
      setRefundReason('')
      setErrors({})
    } catch (error) {
      console.error('Refund error:', error)
      setErrors({ general: 'Failed to process refund. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setSelectedItems({})
    setRefundQuantities({})
    setRefundReason('')
    setErrors({})
    onClose()
  }

  // Check if this would be a full refund
  const wouldBeFullRefund = useMemo(() => {
    if (!sale.sale_items) return false
    
    const refundItems: RefundItem[] = sale.sale_items
      .filter(item => selectedItems[item.id])
      .map(item => ({
        sale_item_id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Unknown Product',
        original_quantity: item.quantity,
        refund_quantity: refundQuantities[item.id] || 0,
        unit_price: item.unit_price,
        refund_amount: 0
      }))
    
    return isFullRefund(refundItems, sale.sale_items)
  }, [sale.sale_items, selectedItems, refundQuantities])

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Select items to refund and specify quantities. Inventory will be restored automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sale Information */}
          <div className="bg-[#FDF6F0] rounded-lg p-3 border border-[#F2C4B0]">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-[#B89080]">Sale ID:</span>
                <span className="ml-2 text-[#7A3E2E] font-medium">
                  {sale.id.slice(0, 8)}...
                </span>
              </div>
              <div>
                <span className="text-[#B89080]">Original Total:</span>
                <span className="ml-2 text-[#7A3E2E] font-medium">
                  ₱{sale.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[#B89080]">Payment Method:</span>
                <span className="ml-2 text-[#7A3E2E] font-medium capitalize">
                  {sale.payment_method.replace('_', ' ')}
                </span>
              </div>
              {sale.refunded_amount > 0 && (
                <div>
                  <span className="text-[#B89080]">Already Refunded:</span>
                  <span className="ml-2 text-[#C05050] font-medium">
                    ₱{sale.refunded_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="border border-[#F2C4B0] rounded-lg overflow-hidden">
            <div className="bg-[#FDF6F0] px-4 py-2 border-b border-[#F2C4B0]">
              <h4 className="text-sm font-medium text-[#7A3E2E]">Sale Items</h4>
            </div>
            
            <div className="divide-y divide-[#FDE8DF]">
              {sale.sale_items && sale.sale_items.length > 0 ? (
                sale.sale_items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-[#FDF6F0] transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.id] || false}
                          onChange={() => handleToggleItem(item.id, item.quantity)}
                          className="w-4 h-4 rounded border-[#F2C4B0] text-[#E8896A] focus:ring-[#E8896A] focus:ring-offset-0 cursor-pointer"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#7A3E2E]">
                              {item.products?.name || 'Unknown Product'}
                            </p>
                            <p className="text-xs text-[#B89080] mt-0.5">
                              SKU: {item.products?.sku || 'N/A'}
                            </p>
                            <p className="text-xs text-[#B89080] mt-1">
                              Unit Price: ₱{item.unit_price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {item.quantity} = ₱{item.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>

                          {/* Quantity Input */}
                          {selectedItems[item.id] && (
                            <div className="w-24">
                              <label className="text-xs text-[#B89080] block mb-1">
                                Qty to Refund
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={refundQuantities[item.id] || ''}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value, item.quantity)}
                                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E] text-sm h-8"
                                placeholder="0"
                              />
                              {errors[item.id] && (
                                <p className="text-xs text-[#C05050] mt-1">{errors[item.id]}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Refund Amount for this item */}
                        {selectedItems[item.id] && refundQuantities[item.id] > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#FDE8DF]">
                            <p className="text-xs text-[#B89080]">
                              Refund Amount: 
                              <span className="ml-1 text-[#7A3E2E] font-medium">
                                ₱{calculateRefundAmount(refundQuantities[item.id], item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-[#B89080]">
                  No items found in this sale
                </div>
              )}
            </div>
          </div>

          {/* Refund Reason */}
          <div>
            <label className="text-sm text-[#7A3E2E] block mb-2">
              Refund Reason <span className="text-[#B89080]">(Optional)</span>
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund (e.g., defective product, customer request)"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-[#F2C4B0] focus:border-[#E8896A] focus:ring-2 focus:ring-[#E8896A]/50 text-[#7A3E2E] text-sm p-3 resize-none outline-none transition-colors"
            />
            <p className="text-xs text-[#B89080] mt-1">
              {refundReason.length}/500 characters
            </p>
          </div>

          {/* Total Refund Amount */}
          {totalRefundAmount > 0 && (
            <div className="bg-[#FDE8DF] rounded-lg p-4 border border-[#F2C4B0]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#7A3E2E]">
                  Total Refund Amount:
                </span>
                <span className="text-lg font-medium text-[#C1614A]">
                  ₱{totalRefundAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {wouldBeFullRefund && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#F2C4B0]">
                  <AlertTriangle className="w-4 h-4 text-[#E8896A]" />
                  <p className="text-xs text-[#7A3E2E]">
                    This will be a <strong>full refund</strong>. Sale status will be changed to "Refunded".
                  </p>
                </div>
              )}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="bg-[#FDECEA] border border-[#C05050] rounded-lg p-3">
              <p className="text-sm text-[#C05050]">{errors.general}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || totalRefundAmount === 0}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          >
            {isSubmitting ? 'Processing...' : `Confirm Refund (₱${totalRefundAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
