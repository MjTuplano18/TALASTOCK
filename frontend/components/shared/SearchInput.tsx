'use client'

import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B89080] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] placeholder:text-[#B89080] focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B89080] hover:text-[#7A3E2E]"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
