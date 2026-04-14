'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RangeValue {
  min: string
  max: string
}

interface RangeInputProps {
  value: RangeValue
  onChange: (v: RangeValue) => void
  label: string
  prefix?: string
  placeholder?: string
}

export function RangeInput({ value, onChange, label, prefix = '', placeholder }: RangeInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasValue = value.min || value.max
  const displayLabel = hasValue
    ? [value.min && `${prefix}${value.min}`, value.max && `${prefix}${value.max}`]
        .filter(Boolean).join(' – ')
    : placeholder ?? label

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-sm border rounded-lg bg-white transition-colors whitespace-nowrap',
          hasValue ? 'border-[#E8896A] text-[#7A3E2E]' : 'border-[#F2C4B0] text-[#B89080] hover:border-[#E8896A]'
        )}
      >
        <span>{displayLabel}</span>
        {hasValue ? (
          <span onClick={e => { e.stopPropagation(); onChange({ min: '', max: '' }) }}
            className="text-[#B89080] hover:text-[#7A3E2E] cursor-pointer">
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className="w-3 h-3 text-[#B89080]" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-[#F2C4B0] rounded-xl shadow-lg p-3 w-52">
          <p className="text-xs text-[#B89080] mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[#B89080] mb-1 block">Min {prefix && `(${prefix})`}</label>
              <input
                type="text"
                inputMode="numeric"
                value={value.min}
                onChange={e => onChange({ ...value, min: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-1.5 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] bg-white"
              />
            </div>
            <span className="text-[#B89080] text-xs mt-4">–</span>
            <div className="flex-1">
              <label className="text-[10px] text-[#B89080] mb-1 block">Max {prefix && `(${prefix})`}</label>
              <input
                type="text"
                inputMode="numeric"
                value={value.max}
                onChange={e => onChange({ ...value, max: e.target.value })}
                placeholder="Any"
                className="w-full px-2 py-1.5 text-xs border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] bg-white"
              />
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full py-1.5 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
