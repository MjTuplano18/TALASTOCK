'use client'

import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ value, onChange, placeholder = 'Search…' }, ref) {
    return (
      <div className="relative w-full sm:w-64" role="search">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B89080] pointer-events-none" aria-hidden="true" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full h-9 pl-8 pr-7 text-xs border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] placeholder:text-[#B89080] focus:outline-none focus:border-[#E8896A] focus:ring-2 focus:ring-[#E8896A]/50"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B89080] hover:text-[#7A3E2E] focus:outline-none focus:ring-2 focus:ring-[#E8896A] rounded"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }
)
