'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Minus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types'

type Mode = 'restock' | 'deduct'

const REASONS: Record<Mode, string[]> = {
  restock: ['New stock received', 'Return from customer', 'Stock correction', 'Other'],
  deduct: ['Damaged / expired', 'Lost / stolen', 'Internal use', 'Stock correction', 'Other'],
}

const schema = z.object({
  amount: z.coerce.number().int().min(1, 'Amount must be at least 1'),
  reason: z.string().min(1, 'Please select a reason'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface InventoryAdjustmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem
  onSubmit: (quantity: number, note: string) => Promise<void>
}

export function InventoryAdjustmentForm({ open, onOpenChange, item, onSubmit }: InventoryAdjustmentFormProps) {
  const [mode, setMode] = useState<Mode>('restock')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 1, reason: '', note: '' },
  })

  const amount = watch('amount') || 0
  const reason = watch('reason')
  const newQty = mode === 'restock'
    ? item.quantity + Number(amount)
    : Math.max(0, item.quantity - Number(amount))

  useEffect(() => {
    if (open) reset({ amount: 1, reason: '', note: '' })
  }, [open, reset])

  useEffect(() => {
    setValue('reason', '')
  }, [mode, setValue])

  async function onFormSubmit(values: FormValues) {
    const fullNote = values.note ? `${values.reason} — ${values.note}` : values.reason
    await onSubmit(newQty, fullNote)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">Adjust Stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-3 mt-1">
          {/* Product info */}
          <div className="bg-[#FDF6F0] rounded-xl p-3 border border-[#F2C4B0]">
            <p className="text-sm font-medium text-[#7A3E2E]">{item.products?.name ?? '—'}</p>
            <p className="text-xs text-[#B89080] font-mono mt-0.5">{item.products?.sku ?? ''}</p>
            <p className="text-xs text-[#B89080] mt-1">Current stock: <span className="font-medium text-[#7A3E2E]">{item.quantity}</span></p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('restock')}
              className={cn('flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors',
                mode === 'restock'
                  ? 'bg-[#FDE8DF] border-[#E8896A] text-[#C1614A]'
                  : 'border-[#F2C4B0] text-[#B89080] hover:bg-[#FDF6F0]')}>
              <Plus className="w-4 h-4" />Restock
            </button>
            <button type="button" onClick={() => setMode('deduct')}
              className={cn('flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors',
                mode === 'deduct'
                  ? 'bg-[#FDECEA] border-[#C05050] text-[#C05050]'
                  : 'border-[#F2C4B0] text-[#B89080] hover:bg-[#FDF6F0]')}>
              <Minus className="w-4 h-4" />Deduct
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">
              {mode === 'restock' ? 'Units to add' : 'Units to remove'}
            </label>
            <Input type="text" inputMode="numeric" placeholder="0"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('amount')} />
            {errors.amount && <p className="text-xs text-[#C05050] mt-1">{errors.amount.message}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Reason</label>
            <div className="flex flex-wrap gap-1.5">
              {REASONS[mode].map(r => (
                <button key={r} type="button" onClick={() => setValue('reason', r)}
                  className={cn('px-2.5 py-1 text-xs rounded-lg border transition-colors',
                    reason === r
                      ? 'bg-[#FDE8DF] border-[#E8896A] text-[#C1614A]'
                      : 'border-[#F2C4B0] text-[#B89080] hover:bg-[#FDF6F0]')}>
                  {r}
                </button>
              ))}
            </div>
            {errors.reason && <p className="text-xs text-[#C05050] mt-1">{errors.reason.message}</p>}
          </div>

          {/* Optional note */}
          <div>
            <label className="text-xs text-[#B89080] mb-1 block">Additional note <span className="text-[#B89080]">(optional)</span></label>
            <Input placeholder="e.g. Batch #123, supplier name…"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E]"
              {...register('note')} />
          </div>

          {/* Preview */}
          <div className={cn('flex items-center justify-between rounded-xl px-3 py-2 text-sm',
            mode === 'restock' ? 'bg-[#FDE8DF]' : 'bg-[#FDECEA]')}>
            <span className="text-[#B89080]">New quantity:</span>
            <span className={cn('font-medium', mode === 'restock' ? 'text-[#C1614A]' : 'text-[#C05050]')}>
              {item.quantity} → {newQty}
            </span>
          </div>

          <div className="flex gap-2">
            <button type="button"
              className="flex-1 h-8 px-3 text-xs border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] rounded-lg transition-colors disabled:opacity-50"
              onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !reason}
              className={cn('flex-1 h-8 px-3 text-xs text-white rounded-lg transition-colors disabled:opacity-50',
                mode === 'restock' ? 'bg-[#E8896A] hover:bg-[#C1614A]' : 'bg-[#C05050] hover:bg-[#A03030]')}>
              {isSubmitting ? 'Saving…' : mode === 'restock' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
