'use client'

import { Banknote, CreditCard, Smartphone, Building2 } from 'lucide-react'
import type { PaymentMethod } from '@/types'

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

const paymentMethods: Array<{
  value: PaymentMethod
  label: string
  icon: React.ReactNode
}> = [
  {
    value: 'cash',
    label: 'Cash',
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    value: 'card',
    label: 'Card',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    value: 'gcash',
    label: 'GCash',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: 'paymaya',
    label: 'PayMaya',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    icon: <Building2 className="w-5 h-5" />,
  },
]

export function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#7A3E2E]">Payment Method</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {paymentMethods.map((method) => {
          const isSelected = value === method.value

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange(method.value)}
              disabled={disabled}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isSelected
                    ? 'border-[#E8896A] bg-[#FDE8DF] text-[#7A3E2E]'
                    : 'border-[#F2C4B0] bg-white text-[#B89080] hover:border-[#E8896A] hover:bg-[#FDF6F0]'
                }
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-[#E8896A] text-white' : 'bg-[#FDE8DF] text-[#E8896A]'}
                `}
              >
                {method.icon}
              </div>
              <span
                className={`text-xs font-medium ${
                  isSelected ? 'text-[#7A3E2E]' : 'text-[#B89080]'
                }`}
              >
                {method.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
