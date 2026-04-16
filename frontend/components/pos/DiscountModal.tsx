'use client'

import { useState, useEffect } from 'react'
import { Percent, DollarSign, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { DiscountType } from '@/types'
import { calculateDiscountAmount } from '@/types'

interface DiscountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalAmount: number
  onApplyDiscount: (discountType: DiscountType, discountValue: number, discountAmount: number) => void
  currentDiscount?: {
    type: DiscountType
    value: number
    amount: number
  }
}

export function DiscountModal({
  open,
  onOpenChange,
  totalAmount,
  onApplyDiscount,
  currentDiscount,
}: DiscountModalProps) {
  const [selectedType, setSelectedType] = useState<DiscountType>('percentage')
  const [discountValue, setDiscountValue] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Initialize with current discount if editing
  useEffect(() => {
    if (open && currentDiscount && currentDiscount.type !== 'none') {
      setSelectedType(currentDiscount.type)
      setDiscountValue(currentDiscount.value.toString())
      setError('')
    } else if (open) {
      // Reset when opening fresh
      setSelectedType('percentage')
      setDiscountValue('')
      setError('')
    }
  }, [open, currentDiscount])

  // Auto-set value for Senior/PWD
  useEffect(() => {
    if (selectedType === 'senior_pwd') {
      setDiscountValue('20')
      setError('')
    }
  }, [selectedType])

  // Calculate preview discount amount
  const previewDiscountAmount = (() => {
    const value = parseFloat(discountValue) || 0
    if (value <= 0) return 0
    return calculateDiscountAmount(selectedType, value, totalAmount)
  })()

  const finalTotal = totalAmount - previewDiscountAmount

  // Validate discount
  const validateDiscount = (): boolean => {
    const value = parseFloat(discountValue)

    if (!discountValue || isNaN(value)) {
      setError('Please enter a discount value')
      return false
    }

    if (value <= 0) {
      setError('Discount value must be greater than 0')
      return false
    }

    if (selectedType === 'percentage' || selectedType === 'senior_pwd') {
      if (value > 100) {
        setError('Percentage cannot exceed 100%')
        return false
      }
    }

    if (selectedType === 'fixed') {
      if (value > totalAmount) {
        setError('Discount cannot exceed total amount')
        return false
      }
    }

    if (selectedType === 'senior_pwd' && value !== 20) {
      setError('Senior/PWD discount must be exactly 20%')
      return false
    }

    setError('')
    return true
  }

  const handleApply = () => {
    if (!validateDiscount()) return

    const value = parseFloat(discountValue)
    const amount = calculateDiscountAmount(selectedType, value, totalAmount)

    onApplyDiscount(selectedType, value, amount)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const discountTypes = [
    {
      type: 'percentage' as DiscountType,
      label: 'Percentage',
      icon: Percent,
      description: 'Discount by percentage',
    },
    {
      type: 'fixed' as DiscountType,
      label: 'Fixed Amount',
      icon: DollarSign,
      description: 'Discount by fixed amount',
    },
    {
      type: 'senior_pwd' as DiscountType,
      label: 'Senior/PWD',
      icon: Users,
      description: 'Automatic 20% discount',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Discount Type Selector */}
          <div>
            <label className="text-xs text-[#B89080] mb-2 block">
              Discount Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {discountTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.type
                return (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      isSelected
                        ? 'border-[#E8896A] bg-[#FDE8DF]'
                        : 'border-[#F2C4B0] bg-white hover:bg-[#FDF6F0]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-[#E8896A]' : 'bg-[#FDE8DF]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          isSelected ? 'text-white' : 'text-[#E8896A]'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isSelected ? 'text-[#7A3E2E]' : 'text-[#B89080]'
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Discount Value Input */}
          <div>
            <label className="text-xs text-[#B89080] mb-2 block">
              {selectedType === 'percentage' || selectedType === 'senior_pwd'
                ? 'Percentage (%)'
                : 'Amount (₱)'}
            </label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => {
                setDiscountValue(e.target.value)
                setError('')
              }}
              placeholder={
                selectedType === 'percentage' || selectedType === 'senior_pwd'
                  ? 'Enter percentage'
                  : 'Enter amount'
              }
              disabled={selectedType === 'senior_pwd'}
              className="border-[#F2C4B0] focus:border-[#E8896A] focus:ring-[#E8896A] text-[#7A3E2E]"
              min="0"
              step={selectedType === 'fixed' ? '0.01' : '1'}
            />
            {selectedType === 'senior_pwd' && (
              <p className="text-xs text-[#B89080] mt-1">
                Senior Citizen/PWD discount is fixed at 20%
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#FDECEA] border border-[#C05050] rounded-lg p-3">
              <p className="text-xs text-[#C05050]">{error}</p>
            </div>
          )}

          {/* Preview */}
          {discountValue && !error && previewDiscountAmount > 0 && (
            <div className="bg-[#FDF6F0] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#B89080]">Original Total</span>
                <span className="text-[#7A3E2E] font-medium">
                  ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#B89080]">
                  Discount (
                  {selectedType === 'percentage' || selectedType === 'senior_pwd'
                    ? `${discountValue}%`
                    : `₱${parseFloat(discountValue).toFixed(2)}`}
                  )
                </span>
                <span className="text-[#E8896A] font-medium">
                  -₱{previewDiscountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-[#F2C4B0] pt-2 flex justify-between">
                <span className="text-sm font-medium text-[#7A3E2E]">
                  Final Total
                </span>
                <span className="text-lg font-medium text-[#7A3E2E]">
                  ₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          >
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
