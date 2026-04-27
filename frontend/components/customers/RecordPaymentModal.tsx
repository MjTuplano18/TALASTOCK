'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import type { Customer, CreditSale } from '@/types'
import { getCreditSales } from '@/lib/supabase-queries'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

const paymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),  payment_method: z.enum(['cash', 'bank_transfer', 'gcash', 'other'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  payment_date: z.string().min(1, 'Payment date is required'),
  credit_sale_id: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

type FormData = z.infer<typeof paymentSchema>

interface RecordPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer
  onSubmit: (data: FormData) => Promise<void>
  loading?: boolean
}

// Shared field label
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-[#B89080] mb-1.5">{children}</label>
}

// Native select styled consistently with the rest of the app
function NativeSelect({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-9 pl-3 pr-8 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] appearance-none focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] disabled:opacity-50"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#B89080]"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function RecordPaymentModal({
  open,
  onOpenChange,
  customer,
  onSubmit,
  loading,
}: RecordPaymentModalProps) {
  const [outstandingInvoices, setOutstandingInvoices] = useState<CreditSale[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      payment_method: 'cash',
      payment_date: today,
      credit_sale_id: null,
      notes: '',
    },
  })

  const selectedInvoiceId = watch('credit_sale_id')
  const paymentMethod = watch('payment_method')

  useEffect(() => {
    if (!open || !customer) return
    setLoadingInvoices(true)
    getCreditSales(customer.id)
      .then(sales =>
        setOutstandingInvoices(
          sales.filter(s => s.status === 'pending' || s.status === 'partially_paid' || s.status === 'overdue')
        )
      )
      .catch(() => toast.error('Failed to load outstanding invoices'))
      .finally(() => setLoadingInvoices(false))
  }, [open, customer])

  useEffect(() => {
    if (open) {
      reset({
        amount: undefined as unknown as number,
        payment_method: 'cash',
        payment_date: today,
        credit_sale_id: null,
        notes: '',
      })
    }
  }, [open, reset])

  async function handleFormSubmit(data: FormData) {
    await onSubmit(data)
    onOpenChange(false)
    reset()
  }

  function handleInvoiceSelect(invoiceId: string) {
    setValue('credit_sale_id', invoiceId || null)
    const invoice = outstandingInvoices.find(inv => inv.id === invoiceId)
    if (invoice) setValue('amount', invoice.amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#F2C4B0] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">Record Payment</DialogTitle>
        </DialogHeader>

        {/* Customer summary */}
        <div className="bg-[#FDF6F0] rounded-lg p-4 border border-[#F2C4B0]">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-[#B89080]">Customer</p>
            <p className="text-sm font-medium text-[#7A3E2E]">{customer.name}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#B89080]">Current Balance</p>
            <p className={`text-lg font-medium ${customer.current_balance > 0 ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
              {formatCurrency(customer.current_balance)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

          {/* Link to invoice (optional) */}
          {outstandingInvoices.length > 0 && (
            <div>
              <Label>Link to Invoice (Optional)</Label>
              <NativeSelect
                value={selectedInvoiceId || ''}
                onChange={handleInvoiceSelect}
                disabled={loadingInvoices}
              >
                <option value="">No specific invoice (FIFO)</option>
                {outstandingInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {new Date(inv.created_at).toLocaleDateString('en-PH')} — {formatCurrency(inv.amount)} ({inv.status})
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-[#B89080] mt-1">
                If not linked, payment applies to oldest invoice first.
              </p>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label>Payment Amount (₱) <span className="text-[#C05050]">*</span></Label>
            <Input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="border-[#F2C4B0] focus-visible:ring-[#E8896A] text-[#7A3E2E] h-9 text-sm"
            />
            {errors.amount && <p className="text-xs text-[#C05050] mt-1">{errors.amount.message}</p>}
          </div>

          {/* Payment method — native select, no portal issues */}
          <div>
            <Label>Payment Method <span className="text-[#C05050]">*</span></Label>
            <NativeSelect
              value={paymentMethod}
              onChange={v => setValue('payment_method', v as FormData['payment_method'])}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="gcash">GCash</option>
              <option value="other">Other</option>
            </NativeSelect>
            {errors.payment_method && <p className="text-xs text-[#C05050] mt-1">{errors.payment_method.message}</p>}
          </div>

          {/* Payment date — plain text input, no OS calendar popup */}
          <div>
            <Label>Payment Date <span className="text-[#C05050]">*</span></Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B89080] pointer-events-none" />
              <input
                {...register('payment_date')}
                type="text"
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className="w-full h-9 pl-9 pr-3 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] placeholder:text-[#B89080] focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]"
              />
            </div>
            <p className="text-xs text-[#B89080] mt-1">Format: YYYY-MM-DD (e.g. {today})</p>
            {errors.payment_date && <p className="text-xs text-[#C05050] mt-1">{errors.payment_date.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Optional notes about this payment…"
              className="w-full text-sm text-[#7A3E2E] border border-[#F2C4B0] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E8896A] focus:border-[#E8896A] resize-none bg-white placeholder:text-[#B89080]"
            />
            {errors.notes && <p className="text-xs text-[#C05050] mt-1">{errors.notes.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
