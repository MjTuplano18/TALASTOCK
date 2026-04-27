'use client'

import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SelectNative } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useCustomers } from '@/hooks/useCustomers'
import type { Product, SaleCreate, Customer } from '@/types'

const saleItemSchema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
})

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
  payment_type: z.enum(['cash', 'credit']).default('cash'),
  payment_method: z.enum(['cash', 'card', 'gcash', 'paymaya', 'bank_transfer']).default('cash'),
  cash_received: z.coerce.number().optional(),
  customer_id: z.string().optional(),
  override_credit_limit: z.boolean().default(false),
})

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onSubmit: (data: SaleCreate) => Promise<unknown>
}

export function SaleForm({ open, onOpenChange, products, onSubmit }: SaleFormProps) {
  const { allCustomers, refetch: refetchCustomers } = useCustomers()
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ product_id: '', quantity: 1, unit_price: 0 }],
      notes: '',
      payment_type: 'cash' as const,
      payment_method: 'cash' as const,
      cash_received: undefined,
      customer_id: '',
      override_credit_limit: false,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const watchedPaymentType = watch('payment_type')
  const watchedPaymentMethod = watch('payment_method')
  const watchedCashReceived = watch('cash_received')
  const watchedCustomerId = watch('customer_id')
  const watchedOverride = watch('override_credit_limit')

  const total = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  const changeAmount = watchedPaymentMethod === 'cash' && watchedCashReceived 
    ? Math.max(0, Number(watchedCashReceived) - total) 
    : 0

  // Get selected customer and calculate credit info
  const selectedCustomer = allCustomers.find(c => c.id === watchedCustomerId)
  const availableCredit = selectedCustomer 
    ? selectedCustomer.credit_limit - selectedCustomer.current_balance 
    : 0
  const newBalance = selectedCustomer 
    ? selectedCustomer.current_balance + total 
    : 0
  const creditUtilization = selectedCustomer && selectedCustomer.credit_limit > 0
    ? (newBalance / selectedCustomer.credit_limit) * 100
    : 0
  const isNearLimit = creditUtilization > 80 && creditUtilization <= 100
  const isOverLimit = creditUtilization > 100
  
  // Calculate due date
  const getDueDate = () => {
    if (!selectedCustomer) return null
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + selectedCustomer.payment_terms_days)
    return dueDate.toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  function handleProductChange(index: number, productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setValue(`items.${index}.unit_price`, product.price)
    }
  }

  async function onFormSubmit(values: SaleFormValues) {
    // For credit sales, validate customer selection
    if (values.payment_type === 'credit') {
      if (!values.customer_id) {
        return // Form validation should catch this
      }
      
      // Check credit limit (unless override is enabled)
      if (isOverLimit && !values.override_credit_limit) {
        return // User needs to enable override
      }
    }

    const saleData: SaleCreate = {
      items: values.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      notes: values.notes || null,
      // For credit sales, payment_method should be 'credit', otherwise use the selected method
      payment_method: values.payment_type === 'credit' ? 'credit' : values.payment_method,
    }

    // Add cash handling for cash payments
    if (values.payment_method === 'cash' && values.cash_received) {
      saleData.cash_received = values.cash_received
      saleData.change_given = Math.max(0, values.cash_received - total)
    }

    // For credit sales, add customer_id and override flag
    if (values.payment_type === 'credit' && values.customer_id) {
      saleData.customer_id = values.customer_id
      saleData.override_credit_limit = values.override_credit_limit
    }

    await onSubmit(saleData)
    
    // Refetch customers if it was a credit sale to update balances
    if (values.payment_type === 'credit' && values.customer_id) {
      await refetchCustomers()
    }
    
    reset()
    onOpenChange(false)
  }

  const anyZeroQuantity = watchedItems.some(item => Number(item.quantity) === 0)
  const insufficientCash = watchedPaymentType === 'cash' && watchedPaymentMethod === 'cash' && 
    (!watchedCashReceived || Number(watchedCashReceived) < total)
  const missingCustomer = watchedPaymentType === 'credit' && !watchedCustomerId
  const creditLimitExceeded = watchedPaymentType === 'credit' && isOverLimit && !watchedOverride
  const canSubmit = !anyZeroQuantity && !insufficientCash && !missingCustomer && !creditLimitExceeded

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) reset(); onOpenChange(open) }}>
      <DialogContent className="border-[#F2C4B0] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">Record Sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Line items */}
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const qty = Number(watchedItems[index]?.quantity) || 0
              const price = Number(watchedItems[index]?.unit_price) || 0
              const subtotal = qty * price
              
              // Get selected product and stock info
              const selectedProduct = products.find(p => p.id === watchedItems[index]?.product_id)
              const currentStock = selectedProduct?.inventory?.quantity ?? 0
              const lowStockThreshold = selectedProduct?.inventory?.low_stock_threshold ?? 10
              const stockAfterSale = currentStock - qty
              
              // Determine stock status
              const isOutOfStock = currentStock === 0
              const isLowStock = currentStock > 0 && currentStock <= lowStockThreshold
              const willBeOutOfStock = stockAfterSale <= 0
              const willBeLowStock = stockAfterSale > 0 && stockAfterSale <= lowStockThreshold
              const isOverSelling = qty > currentStock

              return (
                <div key={field.id} className="bg-[#FDF6F0] rounded-lg border border-[#F2C4B0] p-3">
                  <div className="flex items-start gap-2">
                    {/* Product select */}
                    <div className="flex-1">
                      <label className="text-xs text-[#B89080] mb-1 block">Product</label>
                      <Controller
                        control={control}
                        name={`items.${index}.product_id`}
                        render={({ field: f }) => (
                          <SelectNative
                            value={f.value}
                            onValueChange={val => {
                              f.onChange(val)
                              handleProductChange(index, val)
                            }}
                            className="h-8 text-xs"
                          >
                            <option value="" disabled>Select product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </SelectNative>
                        )}
                      />
                      {errors.items?.[index]?.product_id && (
                        <p className="text-xs text-[#C05050] mt-1">
                          {errors.items[index]?.product_id?.message}
                        </p>
                      )}
                      
                      {/* Real-time Stock Information */}
                      {selectedProduct && (
                        <div className="mt-2 text-xs">
                          <span className="text-[#B89080]">Stock: </span>
                          <span className={`font-medium ${
                            isOutOfStock ? 'text-[#C05050]' : 
                            isLowStock ? 'text-[#E8896A]' : 
                            'text-[#7A3E2E]'
                          }`}>
                            {currentStock} {currentStock === 1 ? 'unit' : 'units'}
                          </span>
                          
                          {/* Warning for overselling */}
                          {isOverSelling && (
                            <span className="ml-2 text-[#C05050] font-medium">
                              ⚠️ Only {currentStock} available
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <label className="text-xs text-[#B89080] mb-1 block">Qty</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] h-8 text-xs"
                        {...register(`items.${index}.quantity`)}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-[#C05050] mt-1">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    {/* Unit price */}
                    <div className="w-24">
                      <label className="text-xs text-[#B89080] mb-1 block">Unit Price</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] h-8 text-xs"
                        {...register(`items.${index}.unit_price`)}
                      />
                      {errors.items?.[index]?.unit_price && (
                        <p className="text-xs text-[#C05050] mt-1">
                          {errors.items[index]?.unit_price?.message}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    {fields.length > 1 && (
                      <div className="pt-5">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA]"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-[#B89080]">
                      Subtotal: <span className="text-[#7A3E2E] font-medium">{formatCurrency(subtotal)}</span>
                    </span>
                  </div>
                </div>
              )
            })}

            {errors.items?.root && (
              <p className="text-xs text-[#C05050]">{errors.items.root.message}</p>
            )}

            <button
              type="button"
              className="flex items-center gap-1.5 h-8 px-3 text-xs border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] rounded-lg transition-colors self-start"
              onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center border-t border-[#F2C4B0] pt-3">
            <span className="text-sm text-[#B89080]">Total</span>
            <span className="text-lg font-medium text-[#7A3E2E]">{formatCurrency(total)}</span>
          </div>

          {/* Payment Type Selector */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Payment Type</label>
            <Controller
              control={control}
              name="payment_type"
              render={({ field }) => (
                <SelectNative
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val)
                    // Reset customer selection when switching to cash
                    if (val === 'cash') {
                      setValue('customer_id', '')
                      setValue('override_credit_limit', false)
                    }
                  }}
                  className="h-8 text-xs"
                >
                  <option value="cash">Cash Sale</option>
                  <option value="credit">Credit Sale</option>
                </SelectNative>
              )}
            />
          </div>

          {/* Credit Sale Section */}
          {watchedPaymentType === 'credit' && (
            <div className="bg-[#FDF6F0] rounded-lg border border-[#F2C4B0] p-3 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#E8896A]" />
                </div>
                <span className="text-xs font-medium text-[#7A3E2E]">Credit Sale Information</span>
              </div>

              {/* Customer Selector */}
              <div>
                <label className="text-xs text-[#B89080] mb-1 block">Customer *</label>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <SelectNative
                      value={field.value}
                      onValueChange={field.onChange}
                      className="h-8 text-xs"
                    >
                      <option value="" disabled>Select customer</option>
                      {allCustomers
                        .filter(c => c.is_active)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.business_name ? `(${c.business_name})` : ''}
                          </option>
                        ))}
                    </SelectNative>
                  )}
                />
                {missingCustomer && (
                  <p className="text-xs text-[#C05050] mt-1">Please select a customer for credit sale</p>
                )}
              </div>

              {/* Customer Credit Info */}
              {selectedCustomer && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B89080]">Credit Limit:</span>
                    <span className="text-[#7A3E2E] font-medium">{formatCurrency(selectedCustomer.credit_limit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B89080]">Current Balance:</span>
                    <span className="text-[#7A3E2E] font-medium">{formatCurrency(selectedCustomer.current_balance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B89080]">Available Credit:</span>
                    <span className={`font-medium ${availableCredit < 0 ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
                      {formatCurrency(availableCredit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-[#F2C4B0] pt-2">
                    <span className="text-[#B89080]">New Balance:</span>
                    <span className={`font-medium ${isOverLimit ? 'text-[#C05050]' : isNearLimit ? 'text-[#E8896A]' : 'text-[#7A3E2E]'}`}>
                      {formatCurrency(newBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B89080]">Credit Utilization:</span>
                    <span className={`font-medium ${isOverLimit ? 'text-[#C05050]' : isNearLimit ? 'text-[#E8896A]' : 'text-[#7A3E2E]'}`}>
                      {creditUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B89080]">Payment Terms:</span>
                    <span className="text-[#7A3E2E] font-medium">{selectedCustomer.payment_terms_days} days</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#B89080]">Due Date:</span>
                    <span className="text-[#7A3E2E] font-medium">{getDueDate()}</span>
                  </div>

                  {/* Warning Messages */}
                  {isNearLimit && !isOverLimit && (
                    <div className="bg-[#FFF3E0] border border-[#E8896A] rounded-lg p-2 mt-2">
                      <p className="text-xs text-[#E8896A] font-medium">
                        ⚠️ Customer is near credit limit ({creditUtilization.toFixed(1)}% utilized)
                      </p>
                    </div>
                  )}

                  {isOverLimit && (
                    <div className="bg-[#FDECEA] border border-[#C05050] rounded-lg p-2 mt-2">
                      <p className="text-xs text-[#C05050] font-medium mb-2">
                        ⚠️ Credit limit exceeded! New balance would be {formatCurrency(newBalance)} (limit: {formatCurrency(selectedCustomer.credit_limit)})
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-[#C05050] text-[#E8896A] focus:ring-[#E8896A]"
                          {...register('override_credit_limit')}
                        />
                        <span className="text-xs text-[#7A3E2E]">Override credit limit (requires approval)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Method - Only show for cash sales */}
          {watchedPaymentType === 'cash' && (
            <div>
              <label className="text-xs text-[#B89080] mb-1 block">Payment Method</label>
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <SelectNative
                    value={field.value}
                    onValueChange={field.onChange}
                    className="h-8 text-xs"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="gcash">GCash</option>
                    <option value="paymaya">PayMaya</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </SelectNative>
                )}
              />
            </div>
          )}

          {/* Cash Calculator (only for cash payments) */}
          {watchedPaymentType === 'cash' && watchedPaymentMethod === 'cash' && (
            <div className="bg-[#FDF6F0] rounded-lg border border-[#F2C4B0] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#B89080]">Amount Due:</span>
                <span className="text-sm font-medium text-[#7A3E2E]">{formatCurrency(total)}</span>
              </div>
              
              <div className="mb-2">
                <label className="text-xs text-[#B89080] mb-1 block">Cash Received</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] h-8 text-xs"
                  {...register('cash_received')}
                />
              </div>

              {watchedCashReceived && Number(watchedCashReceived) >= total && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#B89080]">Change:</span>
                  <span className="text-sm font-medium text-[#E8896A]">{formatCurrency(changeAmount)}</span>
                </div>
              )}

              {watchedCashReceived && Number(watchedCashReceived) < total && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#C05050]">Insufficient amount</span>
                  <span className="text-xs text-[#C05050]">
                    Need {formatCurrency(total - Number(watchedCashReceived))} more
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Add any notes about this sale..."
              className="w-full text-sm text-[#7A3E2E] border border-[#F2C4B0] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E8896A] resize-none bg-white"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="h-8 px-3 text-xs border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] rounded-lg transition-colors disabled:opacity-50"
              onClick={() => { reset(); onOpenChange(false) }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="h-8 px-3 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Recording…' : 'Record Sale'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
