'use client'

/**
 * RecordPaymentTrigger
 *
 * Self-contained wrapper that:
 * - If customerId is provided: fetches that customer and opens RecordPaymentModal
 * - If customerId is null: shows a customer picker first, then opens RecordPaymentModal
 * - Calls the backend POST /api/v1/payments
 * - Calls onSuccess() so the parent can refresh
 */

import { useState, useEffect } from 'react'
import { RecordPaymentModal } from '@/components/customers/RecordPaymentModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getCustomer, getCustomers } from '@/lib/supabase-queries'
import { apiFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Customer } from '@/types'

interface RecordPaymentTriggerProps {
  /** Pre-selected customer. Pass null to show a customer picker first. */
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RecordPaymentTrigger({
  customerId,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentTriggerProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [step, setStep] = useState<'pick' | 'form'>('form')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setCustomer(null)
      setSelectedId('')
      setStep('form')
      return
    }

    if (customerId) {
      // Pre-selected customer — fetch and go straight to form
      setStep('form')
      setLoading(true)
      getCustomer(customerId)
        .then(setCustomer)
        .catch(() => { toast.error('Failed to load customer'); onOpenChange(false) })
        .finally(() => setLoading(false))
    } else {
      // No customer — show picker
      setStep('pick')
      setLoading(true)
      getCustomers()
        .then(list => setCustomers(list.filter(c => c.is_active)))
        .catch(() => toast.error('Failed to load customers'))
        .finally(() => setLoading(false))
    }
  }, [open, customerId])

  async function handlePickCustomer() {
    if (!selectedId) return
    setLoading(true)
    try {
      const data = await getCustomer(selectedId)
      setCustomer(data)
      setStep('form')
    } catch {
      toast.error('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    const cid = customerId ?? customer?.id
    if (!cid) return
    setSubmitting(true)
    try {
      const response = await apiFetch('/api/v1/credit-sales/payments', {
        method: 'POST',
        body: JSON.stringify({ customer_id: cid, ...data }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to record payment')
      }
      toast.success('Payment recorded successfully')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  // Customer picker dialog (when no customerId provided)
  if (step === 'pick') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-[#F2C4B0] w-[calc(100vw-2rem)] max-w-sm sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-[#7A3E2E]">Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-[#B89080] mb-1.5 block">Select Customer</label>
              {loading ? (
                <div className="h-9 bg-[#FDE8DF] rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]"
                >
                  <option value="">Choose a customer…</option>
                  {customers.map(c => {
                    // Very short text to fit on all devices including mobile
                    // Max 15 characters for name
                    const displayName = c.name.length > 15 
                      ? c.name.substring(0, 15) + '...' 
                      : c.name
                    // Shorter balance format
                    const balance = `₱${(c.current_balance / 1000).toFixed(1)}k`
                    return (
                      <option key={c.id} value={c.id} title={`${c.name}${c.business_name ? ` (${c.business_name})` : ''} — ${formatCurrency(c.current_balance)}`}>
                        {displayName} — {balance}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="h-8 px-3 text-xs border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePickCustomer}
                disabled={!selectedId || loading}
                className="h-8 px-3 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Payment form (customer already selected)
  if (!customer) return null

  return (
    <RecordPaymentModal
      open={open}
      onOpenChange={onOpenChange}
      customer={customer}
      onSubmit={handleSubmit}
      loading={submitting || loading}
    />
  )
}
