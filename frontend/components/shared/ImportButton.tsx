'use client'

import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function ImportButton({ onClick, disabled = false, className }: ImportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 h-9 px-3 text-xs border rounded-lg transition-colors",
        "border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      <Upload className="w-3.5 h-3.5" />
      <span className="hidden md:inline">Import</span>
    </button>
  )
}
