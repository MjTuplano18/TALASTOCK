'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { useDateRange, type DatePreset } from '@/context/DateRangeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PresetOption {
  label: string
  value: DatePreset
  description?: string
}

const presets: PresetOption[] = [
  { label: 'Today', value: 'today', description: 'Today\'s data' },
  { label: 'Yesterday', value: 'yesterday', description: 'Yesterday\'s data' },
  { label: 'Last 7 days', value: 'last_7_days', description: 'Past week including today' },
  { label: 'Last 30 days', value: 'last_30_days', description: 'Past month including today' },
  { label: 'This month', value: 'this_month', description: 'Current month to date' },
  { label: 'Last month', value: 'last_month', description: 'Previous month' },
  { label: 'This year', value: 'this_year', description: 'Year to date' },
]

function formatDateRange(startDate: Date, endDate: Date, preset: DatePreset): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const optionsWithYear: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  
  const now = new Date()
  const isCurrentYear = startDate.getFullYear() === now.getFullYear() && endDate.getFullYear() === now.getFullYear()
  
  const formatOptions = isCurrentYear ? options : optionsWithYear
  
  // Special cases for single-day presets
  if (preset === 'today') return 'Today'
  if (preset === 'yesterday') return 'Yesterday'
  if (preset === 'this_month') return 'This Month'
  if (preset === 'last_month') return 'Last Month'
  if (preset === 'this_year') return 'This Year'
  
  // For ranges, show start - end
  const start = startDate.toLocaleDateString('en-US', formatOptions)
  const end = endDate.toLocaleDateString('en-US', formatOptions)
  
  // If same day, just show one date
  if (start === end) return start
  
  return `${start} - ${end}`
}

export function DateRangeFilter() {
  const { startDate, endDate, preset, setPreset, setDateRange } = useDateRange()
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const currentLabel = formatDateRange(startDate, endDate, preset)

  function handlePresetChange(newPreset: DatePreset) {
    if (newPreset === 'custom') {
      setCustomDialogOpen(true)
    } else {
      setPreset(newPreset)
    }
  }

  function handleCustomApply() {
    if (!customStart || !customEnd) return
    
    const start = new Date(customStart)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59, 999) // End of day
    
    if (start > end) {
      alert('Start date must be before end date')
      return
    }
    
    setDateRange(start, end, 'custom')
    setCustomDialogOpen(false)
    setCustomStart('')
    setCustomEnd('')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg bg-white text-[#7A3E2E] hover:bg-[#FDE8DF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8896A] focus:ring-offset-1"
            aria-label="Select date range"
          >
            <Calendar className="w-4 h-4 text-[#E8896A]" />
            <span className="font-medium">{currentLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#B89080]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-[#F2C4B0]">
          {presets.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handlePresetChange(option.value)}
              className={`cursor-pointer ${
                preset === option.value
                  ? 'bg-[#FDE8DF] text-[#7A3E2E] font-medium'
                  : 'text-[#7A3E2E]'
              }`}
            >
              <div className="flex flex-col">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-[#B89080]">{option.description}</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-[#F2C4B0]" />
          <DropdownMenuItem
            onClick={() => handlePresetChange('custom')}
            className="cursor-pointer text-[#7A3E2E]"
          >
            <div className="flex flex-col">
              <span>Custom range...</span>
              <span className="text-xs text-[#B89080]">Pick specific dates</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="border-[#F2C4B0]">
          <DialogHeader>
            <DialogTitle className="text-[#7A3E2E]">Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-[#7A3E2E] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7A3E2E] mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 border border-[#F2C4B0] rounded-lg text-[#7A3E2E] focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="flex-1 bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
              >
                Apply
              </Button>
              <Button
                onClick={() => {
                  setCustomDialogOpen(false)
                  setCustomStart('')
                  setCustomEnd('')
                }}
                variant="outline"
                className="flex-1 border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
