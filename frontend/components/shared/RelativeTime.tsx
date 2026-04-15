'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatDateTime } from '@/lib/utils'

/**
 * RelativeTime Component
 * Displays relative time ("2 hours ago") with tooltip showing exact timestamp
 * Auto-updates every minute for accuracy
 * 
 * Usage:
 * <RelativeTime date="2024-01-15T10:30:00Z" />
 * <RelativeTime date={new Date()} showTooltip={false} />
 */

interface RelativeTimeProps {
  date: string | Date
  showTooltip?: boolean
  className?: string
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
  if (diffWeek < 4) return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`
  if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`
  return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`
}

export function RelativeTime({ date, showTooltip = true, className = '' }: RelativeTimeProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const [relativeTime, setRelativeTime] = useState(getRelativeTime(dateObj))

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(dateObj))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dateObj])

  const exactTime = formatDateTime(dateObj.toISOString())

  if (showTooltip) {
    return (
      <span className={className} title={exactTime}>
        {relativeTime}
      </span>
    )
  }

  return <span className={className}>{relativeTime}</span>
}
