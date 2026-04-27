'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import type { ChartConfig } from '@/components/ui/chart'

type DateRange = '7d' | '30d' | '3m' | '6m'

interface PaymentCollectionChartProps {
  dateRange: DateRange
}

interface ChartData {
  date: string
  amount: number
}

const chartConfig = {
  amount: {
    label: 'Payments',
    color: '#E8896A',
  },
} satisfies ChartConfig

export function PaymentCollectionChart({ dateRange }: PaymentCollectionChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    // The aggregate=daily endpoint is not yet implemented on the backend.
    // Show empty state until it's available.
    setLoading(false)
    setData([])
  }, [dateRange])

  if (loading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <p className="text-xs text-[#B89080]">No payment data available</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis dataKey="date" stroke="#B89080" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#B89080" fontSize={12} tickLine={false} axisLine={false}
          tickFormatter={(value) => `₱${value.toLocaleString()}`} />
        <ChartTooltip content={<ChartTooltipContent />}
          formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Payments']} />
        <Bar dataKey="amount" fill="#E8896A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

// Remove mock data generator — charts show empty state when no real data exists
