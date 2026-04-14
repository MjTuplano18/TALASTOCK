'use client'

import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
import type { Product, SaleCreate } from '@/types'

const saleItemSchema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
})

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
})

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onSubmit: (data: SaleCreate) => Promise<unknown>
}

export function SaleForm({ open, onOpenChange, products, onSubmit }: SaleFormProps) {
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
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const total = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  function handleProductChange(index: number, productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setValue(`items.${index}.unit_price`, product.price)
    }
  }

  async function onFormSubmit(values: SaleFormValues) {
    await onSubmit({
      items: values.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      notes: values.notes || null,
    })
    reset()
    onOpenChange(false)
  }

  const anyZeroQuantity = watchedItems.some(item => Number(item.quantity) === 0)

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

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] self-start"
              onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center border-t border-[#F2C4B0] pt-3">
            <span className="text-sm text-[#B89080]">Total</span>
            <span className="text-lg font-medium text-[#7A3E2E]">{formatCurrency(total)}</span>
          </div>

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
            <Button
              type="button"
              variant="outline"
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              onClick={() => { reset(); onOpenChange(false) }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || anyZeroQuantity}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
            >
              {isSubmitting ? 'Recording…' : 'Record Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
