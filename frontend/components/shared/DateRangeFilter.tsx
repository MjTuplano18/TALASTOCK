'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, subMonths, isSameDay, isWithinInterval, isBefore } from 'date-fns'
import { useDateRange, type DatePreset } from '@/context/DateRangeContext'
import { cn } from '@/lib/utils'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'Last 30 days', value: 'last_30_days' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This year', value: 'this_year' },
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

export function DateRangeFilter() {
  const { startDate, endDate, preset, setPreset, setDateRange } = useDateRange()
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [hovered, setHovered] = useState<Date | null>(null)
  const [tempStart, setTempStart] = useState<Date | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const picking = tempStart && !open // We're picking the end date

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setTempStart(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const dropdownWidth = Math.min(320, window.innerWidth - 16)
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let left: number
      let top = rect.bottom + 8
      
      // On mobile/small screens (< 640px), always center in viewport
      if (viewportWidth < 640) {
        left = (viewportWidth - dropdownWidth) / 2
        
        // If calendar would go off bottom of screen, position it above the button
        if (top + 400 > viewportHeight) {
          top = Math.max(8, rect.top - 400 - 8)
        }
      } else {
        // Desktop: center below the button
        left = rect.left + (rect.width / 2) - (dropdownWidth / 2)
        
        // Ensure minimum 8px margin from left edge
        if (left < 8) {
          left = 8
        }
        
        // Ensure minimum 8px margin from right edge
        if (left + dropdownWidth > viewportWidth - 8) {
          left = viewportWidth - dropdownWidth - 8
        }
      }
      
      setPosition({
        top,
        left
      })
    }
  }, [open])

  const hasValue = preset !== 'last_30_days' // Show as active if not default
  const label = preset === 'today' ? 'Today'
    : preset === 'yesterday' ? 'Yesterday'
    : preset === 'last_7_days' ? 'Last 7 days'
    : preset === 'last_30_days' ? 'Last 30 days'
    : preset === 'this_month' ? 'This month'
    : preset === 'last_month' ? 'Last month'
    : preset === 'this_year' ? 'This year'
    : preset === 'custom' && startDate && endDate
    ? `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`
    : 'Filter by date'

  function handlePresetClick(value: DatePreset) {
    setPreset(value)
    setTempStart(null)
    setOpen(false)
  }

  function handleDayClick(date: Date) {
    if (!tempStart) {
      // Start fresh
      setTempStart(startOfDay(date))
    } else {
      // Set end
      if (isBefore(date, tempStart)) {
        setDateRange(startOfDay(date), endOfDay(tempStart), 'custom')
      } else {
        setDateRange(tempStart, endOfDay(date), 'custom')
      }
      setTempStart(null)
      setOpen(false)
    }
  }

  function isInRange(date: Date) {
    const end = hovered ?? null
    if (!tempStart || !end) return false
    const from = isBefore(tempStart, end) ? tempStart : end
    const to = isBefore(tempStart, end) ? end : tempStart
    return isWithinInterval(date, { start: from, end: to })
  }

  function isRangeStart(date: Date) {
    return tempStart ? isSameDay(date, tempStart) : false
  }

  function isRangeEnd(date: Date) {
    const end = hovered ?? null
    return end ? isSameDay(date, end) : false
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    setPreset('last_30_days') // Reset to default
    setTempStart(null)
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
          <span onClick={handleClear}
            className="ml-1 text-[#B89080] hover:text-[#7A3E2E] cursor-pointer">
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronRight className={cn('w-3 h-3 text-[#B89080] transition-transform', open && 'rotate-90')} />
        )}
      </button>

      {open && (
        <div 
          className="fixed z-[100] bg-white border border-[#F2C4B0] rounded-xl shadow-xl p-4 w-[320px] max-w-[calc(100vw-16px)]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePresetClick(p.value)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-colors',
                  preset === p.value
                    ? 'bg-[#E8896A] text-white border-[#E8896A]'
                    : 'bg-white text-[#7A3E2E] border-[#F2C4B0] hover:bg-[#FDE8DF] hover:border-[#E8896A]'
                )}
              >
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
              {tempStart ? 'Now select end date' : 'Select start date'}
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
                    onMouseEnter={() => tempStart && setHovered(date)}
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
