'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { InventoryItem } from '@/types'

const adjustmentSchema = z.object({
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or greater'),
  note: z.string().min(1, 'Note is required'),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

interface InventoryAdjustmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  onSubmit: (quantity: number, note: string) => Promise<void>
}

export function InventoryAdjustmentForm({
  open,
  onOpenChange,
  item,
  onSubmit,
}: InventoryAdjustmentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { quantity: item.quantity, note: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ quantity: item.quantity, note: '' })
    }
  }, [open, item.quantity, reset])

  async function onFormSubmit(values: AdjustmentFormValues) {
    await onSubmit(values.quantity, values.note)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#F2C4B0] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">Adjust Inventory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-3 mt-2">
          {/* Product name (read-only) */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Product</label>
            <div className="text-sm text-[#7A3E2E] font-medium px-3 py-2 bg-[#FDF6F0] rounded-md border border-[#F2C4B0]">
              {item.products?.name ?? '—'}
            </div>
          </div>

          {/* Current quantity (read-only) */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Current Quantity</label>
            <div className="text-sm text-[#B89080] px-3 py-2 bg-[#FDF6F0] rounded-md border border-[#F2C4B0]">
              {item.quantity}
            </div>
          </div>

          {/* New quantity */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">New Quantity</label>
            <Input
              type="text"
              inputMode="numeric"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('quantity')}
            />
            {errors.quantity && (
              <p className="text-xs text-[#C05050] mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Note</label>
            <Input
              placeholder="Reason for adjustment"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('note')}
            />
            {errors.note && (
              <p className="text-xs text-[#C05050] mt-1">{errors.note.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
            >
              {isSubmitting ? 'Saving…' : 'Save adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
