'use client'

import { useState, useEffect } from 'react'
import { Banknote, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { calculateChange } from '@/types'

interface CashCalculatorProps {
  totalAmount: number
  cashReceived: number
  onChange: (amount: number) => void
}

export function CashCalculator({
  totalAmount,
  cashReceived,
  onChange,
}: CashCalculatorProps) {
  const [inputValue, setInputValue] = useState<string>(cashReceived.toString())
  const [hasError, setHasError] = useState(false)

  // Calculate change
  const changeAmount = calculateChange(cashReceived, totalAmount)
  const isInsufficientCash = cashReceived > 0 && cashReceived < totalAmount

  // Update input value when cashReceived prop changes
  useEffect(() => {
    setInputValue(cashReceived.toString())
  }, [cashReceived])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Parse the value
    const numericValue = parseFloat(value) || 0
    
    // Validate
    if (numericValue < 0) {
      setHasError(true)
      return
    }

    setHasError(false)
    onChange(numericValue)
  }

  // Quick amount buttons
  const quickAmounts = [100, 200, 500, 1000]
  const suggestedAmount = Math.ceil(totalAmount / 100) * 100 // Round up to nearest 100

  return (
    <div className="space-y-4">
      {/* Total Amount Due */}
      <div className="p-4 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0]">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="w-4 h-4 text-[#E8896A]" />
          <span className="text-xs font-medium text-[#B89080]">Total Amount Due</span>
        </div>
        <p className="text-2xl font-medium text-[#7A3E2E]">
          {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Cash Received Input */}
      <div className="space-y-2">
        <label htmlFor="cash-received" className="text-sm font-medium text-[#7A3E2E]">
          Cash Received
        </label>
        <input
          id="cash-received"
          type="number"
          min="0"
          step="0.01"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="0.00"
          className={`
            w-full h-12 px-4 text-lg font-medium rounded-lg border-2 transition-colors
            focus:outline-none focus:ring-2 focus:ring-[#E8896A] focus:border-transparent
            ${
              hasError || isInsufficientCash
                ? 'border-[#C05050] bg-[#FDECEA] text-[#C05050]'
                : 'border-[#F2C4B0] bg-white text-[#7A3E2E]'
            }
          `}
          autoFocus
        />
        
        {/* Error Message */}
        {isInsufficientCash && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-[#FDECEA]">
            <AlertCircle className="w-4 h-4 text-[#C05050] shrink-0 mt-0.5" />
            <p className="text-xs text-[#C05050]">
              Cash received must be greater than or equal to total amount
            </p>
          </div>
        )}
      </div>

      {/* Quick Amount Buttons */}
      <div className="space-y-2">
        <label className="text-xs text-[#B89080]">Quick Amounts</label>
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setInputValue(amount.toString())
                setHasError(false)
                onChange(amount)
              }}
              className="h-10 rounded-lg border border-[#F2C4B0] bg-white text-sm font-medium text-[#7A3E2E] hover:bg-[#FDE8DF] hover:border-[#E8896A] transition-colors"
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
        
        {/* Suggested Exact Amount */}
        {suggestedAmount !== totalAmount && suggestedAmount <= 1000 && (
          <button
            type="button"
            onClick={() => {
              setInputValue(suggestedAmount.toString())
              setHasError(false)
              onChange(suggestedAmount)
            }}
            className="w-full h-10 rounded-lg border-2 border-[#E8896A] bg-[#FDE8DF] text-sm font-medium text-[#7A3E2E] hover:bg-[#E8896A] hover:text-white transition-colors"
          >
            Suggested: {formatCurrency(suggestedAmount)}
          </button>
        )}
      </div>

      {/* Change Amount Display */}
      {cashReceived >= totalAmount && cashReceived > 0 && (
        <div className="p-4 rounded-lg bg-[#E8896A] border-2 border-[#C1614A]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Change</span>
            <span className="text-3xl font-medium text-white">
              {formatCurrency(changeAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Exact Amount Notice */}
      {cashReceived === totalAmount && cashReceived > 0 && (
        <div className="p-2 rounded-lg bg-[#FDE8DF] border border-[#F2C4B0]">
          <p className="text-xs text-center text-[#7A3E2E] font-medium">
            ✓ Exact amount received
          </p>
        </div>
      )}
    </div>
  )
}
