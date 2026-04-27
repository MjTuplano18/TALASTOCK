'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { customerCreateSchema } from '@/types'
import type { Customer, CustomerCreate, CustomerUpdate } from '@/types'
import { z } from 'zod'

interface AddCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSubmit: (data: CustomerCreate | CustomerUpdate) => Promise<void>
  loading?: boolean
}

type FormData = z.infer<typeof customerCreateSchema>

export function AddCustomerModal({ open, onOpenChange, customer, onSubmit, loading }: AddCustomerModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: {
      name: '',
      contact_number: '',
      address: '',
      business_name: '',
      credit_limit: 0,
      payment_terms_days: 30,
      notes: '',
    },
  })

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        contact_number: customer.contact_number ?? '',
        address: customer.address ?? '',
        business_name: customer.business_name ?? '',
        credit_limit: customer.credit_limit,
        payment_terms_days: customer.payment_terms_days,
        notes: customer.notes ?? '',
      })
    } else {
      reset({
        name: '',
        contact_number: '',
        address: '',
        business_name: '',
        credit_limit: 0,
        payment_terms_days: 30,
        notes: '',
      })
    }
  }, [customer, reset])

  async function handleFormSubmit(data: FormData) {
    await onSubmit(data)
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#F2C4B0] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#7A3E2E]">
            {customer ? 'Edit Customer' : 'Add Customer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Customer Name <span className="text-[#C05050]">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="Juan Dela Cruz"
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              />
              {errors.name && (
                <p className="text-xs text-[#C05050] mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Contact Number
              </label>
              <Input
                {...register('contact_number')}
                placeholder="09171234567"
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              />
              {errors.contact_number && (
                <p className="text-xs text-[#C05050] mt-1">{errors.contact_number.message}</p>
              )}
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Business Name
              </label>
              <Input
                {...register('business_name')}
                placeholder="Optional"
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              />
              {errors.business_name && (
                <p className="text-xs text-[#C05050] mt-1">{errors.business_name.message}</p>
              )}
            </div>

            {/* Credit Limit */}
            <div>
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Credit Limit (₱)
              </label>
              <Input
                {...register('credit_limit', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              />
              {errors.credit_limit && (
                <p className="text-xs text-[#C05050] mt-1">{errors.credit_limit.message}</p>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Payment Terms (days)
              </label>
              <Input
                {...register('payment_terms_days', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder="30"
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              />
              {errors.payment_terms_days && (
                <p className="text-xs text-[#C05050] mt-1">{errors.payment_terms_days.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Address
              </label>
              <Input
                {...register('address')}
                placeholder="Optional"
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              />
              {errors.address && (
                <p className="text-xs text-[#C05050] mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#7A3E2E] mb-1.5">
                Notes
              </label>
              <Textarea
                {...register('notes')}
                placeholder="Optional notes about this customer..."
                rows={3}
                className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E] resize-none"
              />
              {errors.notes && (
                <p className="text-xs text-[#C05050] mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
            >
              {loading ? 'Saving...' : customer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
