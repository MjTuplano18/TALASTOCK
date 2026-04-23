'use client'

import { useState, useEffect } from 'react'

interface FilterSelectProps {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

export function FilterSelect({ value, onChange, options, placeholder = 'All' }: FilterSelectProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="relative inline-block">
        <div className="appearance-none w-full pl-3 pr-8 py-1.5 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] cursor-pointer">
          {placeholder}
        </div>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#B89080]"
          viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-1.5 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#B89080]"
        viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
