'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type DatePreset = 
  | 'today' 
  | 'yesterday' 
  | 'last_7_days' 
  | 'last_30_days' 
  | 'this_month' 
  | 'last_month' 
  | 'this_year'
  | 'custom'

export interface DateRange {
  startDate: Date
  endDate: Date
  preset: DatePreset
}

interface DateRangeContextType extends DateRange {
  setDateRange: (startDate: Date, endDate: Date, preset: DatePreset) => void
  setPreset: (preset: DatePreset) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

// Helper functions to calculate date ranges
function getDateRangeForPreset(preset: DatePreset): { startDate: Date; endDate: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1), // End of today
      }
    
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'last_7_days':
      const last7Days = new Date(today)
      last7Days.setDate(last7Days.getDate() - 6) // Include today
      return {
        startDate: last7Days,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'last_30_days':
      const last30Days = new Date(today)
      last30Days.setDate(last30Days.getDate() - 29) // Include today
      return {
        startDate: last30Days,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'this_month':
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: firstDayOfMonth,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'last_month':
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return {
        startDate: firstDayOfLastMonth,
        endDate: lastDayOfLastMonth,
      }
    
    case 'this_year':
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
      return {
        startDate: firstDayOfYear,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
    
    case 'custom':
    default:
      // Default to last 30 days
      const defaultStart = new Date(today)
      defaultStart.setDate(defaultStart.getDate() - 29)
      return {
        startDate: defaultStart,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
  }
}

// Load saved preference from localStorage
function loadSavedPreset(): DatePreset {
  if (typeof window === 'undefined') return 'last_30_days'
  
  try {
    const saved = localStorage.getItem('dashboard_date_preset')
    if (saved && ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year'].includes(saved)) {
      return saved as DatePreset
    }
  } catch (err) {
    console.error('Failed to load saved date preset:', err)
  }
  
  return 'last_30_days' // Default
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<DatePreset>(loadSavedPreset)
  const [dateRange, setDateRangeState] = useState<{ startDate: Date; endDate: Date }>(() => 
    getDateRangeForPreset(loadSavedPreset())
  )

  // Save preset to localStorage whenever it changes
  useEffect(() => {
    if (preset !== 'custom') {
      try {
        localStorage.setItem('dashboard_date_preset', preset)
      } catch (err) {
        console.error('Failed to save date preset:', err)
      }
    }
  }, [preset])

  const setDateRange = (startDate: Date, endDate: Date, newPreset: DatePreset) => {
    setDateRangeState({ startDate, endDate })
    setPresetState(newPreset)
  }

  const setPreset = (newPreset: DatePreset) => {
    const range = getDateRangeForPreset(newPreset)
    setDateRangeState(range)
    setPresetState(newPreset)
  }

  return (
    <DateRangeContext.Provider
      value={{
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        preset,
        setDateRange,
        setPreset,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (!context) {
    throw new Error('useDateRange must be used within DateRangeProvider')
  }
  return context
}

// Helper hook to get formatted date strings for queries
export function useDateRangeQuery() {
  const { startDate, endDate } = useDateRange()
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateLocal: startDate,
    endDateLocal: endDate,
  }
}
