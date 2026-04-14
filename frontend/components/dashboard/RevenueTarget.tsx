'use client'

import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'talastock_revenue_target'
const DEFAULT_TARGET = 50000

function getStoredTarget(): number {
  if (typeof window === 'undefined') return DEFAULT_TARGET
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? Number(stored) : DEFAULT_TARGET
}

interface RevenueTargetProps {
  current: number
  loading?: boolean
}

export function RevenueTarget({ current, loading }: RevenueTargetProps) {
  const [target, setTarget] = useState<number>(getStoredTarget)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const pct = Math.min(Math.round((current / target) * 100), 100)
  const remaining = Math.max(target - current, 0)

  function startEdit() {
    setInputVal(String(target))
    setEditing(true)
  }

  function saveEdit() {
    const val = Number(inputVal.replace(/[^0-9.]/g, ''))
    if (val > 0) {
      setTarget(val)
      localStorage.setItem(STORAGE_KEY, String(val))
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-3 w-40 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="h-2 w-full bg-[#FDE8DF] rounded animate-pulse" />
        <div className="h-3 w-24 bg-[#FDE8DF] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#7A3E2E]">
            <span className="font-medium">{formatCurrency(current)}</span>
            <span className="text-[#B89080]"> of </span>
            {editing ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-[#B89080]">₱</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  className="w-24 border-b border-[#E8896A] bg-transparent text-sm text-[#7A3E2E] focus:outline-none"
                />
              </span>
            ) : (
              <span className="font-medium">{formatCurrency(target)}</span>
            )}
            <span className="text-[#B89080]"> monthly goal</span>
          </span>
        </div>
        <button
          onClick={editing ? saveEdit : startEdit}
          className="text-[#B89080] hover:text-[#7A3E2E] transition-colors"
          aria-label={editing ? 'Save target' : 'Edit target'}
        >
          {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#FDE8DF] rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            pct >= 100 ? 'bg-[#C1614A]' : 'bg-[#E8896A]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#B89080]">
          {pct >= 100
            ? 'Monthly goal reached!'
            : `${formatCurrency(remaining)} remaining`}
        </span>
        <span className={cn(
          'text-xs font-medium',
          pct >= 100 ? 'text-[#C1614A]' : 'text-[#7A3E2E]'
        )}>
          {pct}%
        </span>
      </div>
    </div>
  )
}
