'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, subMonths, isSameDay, isWithinInterval, isBefore, isAfter } from 'date-fns'
import { cn } from '@/lib/utils'

export interface DateRange {
  from: Date | null
  to: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const PRESETS = [
  { label: 'Today', get: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Yesterday', get: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: 'This Month', get: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'This Year', get: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
]

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells: { date: Date; outside: boolean }[] = []

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), outside: true })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false })
  }
  // Next month padding
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), outside: true })
  }
  return cells
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [hovered, setHovered] = useState<Date | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // selecting: if from is set but to is not, we're picking the end
  const picking = value.from && !value.to

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasValue = value.from || value.to
  const label = value.from && value.to
    ? `${format(value.from, 'MMM d')} – ${format(value.to, 'MMM d, yyyy')}`
    : value.from
    ? `From ${format(value.from, 'MMM d')}`
    : 'Filter by date'

  function handleDayClick(date: Date) {
    if (!value.from || (value.from && value.to)) {
      // Start fresh
      onChange({ from: startOfDay(date), to: null })
    } else {
      // Set end
      if (isBefore(date, value.from)) {
        onChange({ from: startOfDay(date), to: endOfDay(value.from) })
      } else {
        onChange({ from: value.from, to: endOfDay(date) })
      }
      setOpen(false)
    }
  }

  function isInRange(date: Date) {
    const end = value.to ?? (picking && hovered ? hovered : null)
    if (!value.from || !end) return false
    const from = isBefore(value.from, end) ? value.from : end
    const to = isBefore(value.from, end) ? end : value.from
    return isWithinInterval(date, { start: from, end: to })
  }

  function isRangeStart(date: Date) {
    return value.from ? isSameDay(date, value.from) : false
  }

  function isRangeEnd(date: Date) {
    const end = value.to ?? (picking && hovered ? hovered : null)
    return end ? isSameDay(date, end) : false
  }

  const cells = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth())

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 h-9 pl-3 pr-2.5 text-xs border rounded-lg bg-white transition-colors whitespace-nowrap',
          hasValue ? 'border-[#E8896A] text-[#7A3E2E]' : 'border-[#F2C4B0] text-[#B89080] hover:border-[#E8896A]'
        )}
      >
        <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">{label}</span>
        {hasValue ? (
          <span onClick={e => { e.stopPropagation(); onChange({ from: null, to: null }) }}
            className="ml-1 text-[#B89080] hover:text-[#7A3E2E] cursor-pointer">
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronRight className={cn('w-3 h-3 text-[#B89080] transition-transform', open && 'rotate-90')} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-[#F2C4B0] rounded-xl shadow-lg p-4 w-[300px] max-w-[calc(100vw-2rem)]">

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { onChange(p.get()); setOpen(false) }}
                className="px-2.5 py-1 text-xs rounded-lg border border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF] hover:border-[#E8896A] transition-colors">
                {p.label}
              </button>
            ))}
          </div>

          <div className="border-t border-[#F2C4B0] pt-3">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#FDE8DF] text-[#7A3E2E] transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-[#7A3E2E]">
                {format(viewDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#FDE8DF] text-[#7A3E2E] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Hint */}
            <p className="text-[10px] text-[#B89080] mb-2 text-center">
              {picking ? 'Now select end date' : 'Select start date'}
            </p>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] text-[#B89080] font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map(({ date, outside }, i) => {
                const start = isRangeStart(date)
                const end = isRangeEnd(date)
                const inRange = isInRange(date)
                const isToday = isSameDay(date, new Date())

                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(date)}
                    onMouseEnter={() => picking && setHovered(date)}
                    onMouseLeave={() => setHovered(null)}
                    className={cn(
                      'relative h-8 w-full text-xs transition-colors',
                      outside ? 'text-[#D4B8B0]' : 'text-[#7A3E2E]',
                      inRange && !start && !end && 'bg-[#FDE8DF]',
                      start && 'bg-[#E8896A] text-white rounded-l-lg',
                      end && 'bg-[#E8896A] text-white rounded-r-lg',
                      start && end && 'rounded-lg',
                      !start && !end && !inRange && !outside && 'hover:bg-[#FDE8DF] rounded-lg',
                      isToday && !start && !end && 'font-medium underline decoration-[#E8896A]'
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
