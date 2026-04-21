'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from './MetricCard'

interface HydrationSafeMetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  danger?: boolean
  change?: number | null
}

export function HydrationSafeMetricCard(props: HydrationSafeMetricCardProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    // Return skeleton during hydration
    return (
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            {props.icon}
          </div>
        </div>
        <p className="text-xs text-[#B89080] mb-0.5">{props.label}</p>
        <div className="h-6 sm:h-8 bg-[#FDE8DF] rounded animate-pulse mb-1"></div>
        {props.sub && <div className="h-3 bg-[#FDE8DF] rounded animate-pulse w-16"></div>}
      </div>
    )
  }

  return <MetricCard {...props} />
}