'use client'

import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useRevenueGoal } from '@/hooks/useRevenueGoal'
import { toast } from 'sonner'

const SIZE = 180
const STROKE = 14
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

interface RevenueRadialProps {
  current: number
  loading?: boolean
}

export function RevenueRadial({ current, loading: dataLoading }: RevenueRadialProps) {
  const { goal, loading: goalLoading, updateGoal } = useRevenueGoal()
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [saving, setSaving] = useState(false)

  const pct = Math.min(current / goal, 1)
  const dashOffset = CIRCUMFERENCE * (1 - pct)
  const remaining = Math.max(goal - current, 0)
  const isComplete = pct >= 1

  function startEdit() {
    setInputVal(String(goal))
    setEditing(true)
  }

  async function saveEdit() {
    const val = Number(inputVal.replace(/[^0-9.]/g, ''))
    if (val <= 0) {
      toast.error('Please enter a valid goal amount')
      return
    }

    setSaving(true)
    const success = await updateGoal(val)
    setSaving(false)

    if (success) {
      toast.success('Revenue goal updated successfully')
      setEditing(false)
    } else {
      toast.error('Failed to update revenue goal')
    }
  }

  if (dataLoading || goalLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
        <div className="w-[180px] h-[180px] rounded-full bg-[#FDE8DF] animate-pulse" />
        <div className="h-3 w-32 bg-[#FDE8DF] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Radial chart */}
      <div className="relative">
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#FDE8DF"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={isComplete ? '#C1614A' : '#E8896A'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'text-2xl font-medium',
            isComplete ? 'text-[#C1614A]' : 'text-[#7A3E2E]'
          )}>
            {Math.round(pct * 100)}%
          </span>
          <span className="text-xs text-[#B89080] mt-0.5">of goal</span>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-3 text-center w-full">
        <p className="text-sm text-[#7A3E2E]">
          <span className="font-medium">{formatCurrency(current)}</span>
          <span className="text-[#B89080]"> earned</span>
        </p>

        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-xs text-[#B89080]">Goal: </span>
          {editing ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-xs text-[#B89080]">₱</span>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                disabled={saving}
                className="w-20 border-b border-[#E8896A] bg-transparent text-xs text-[#7A3E2E] focus:outline-none text-center disabled:opacity-50"
              />
            </span>
          ) : (
            <span className="text-xs font-medium text-[#7A3E2E]">{formatCurrency(goal)}</span>
          )}
          <button
            onClick={editing ? saveEdit : startEdit}
            disabled={saving}
            className="text-[#B89080] hover:text-[#7A3E2E] transition-colors ml-0.5 disabled:opacity-50"
          >
            {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          </button>
        </div>

        <p className="text-xs text-[#B89080] mt-1">
          {isComplete
            ? 'Monthly goal reached!'
            : `${formatCurrency(remaining)} to go`}
        </p>
      </div>
    </div>
  )
}
