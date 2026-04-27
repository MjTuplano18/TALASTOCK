'use client'

import { useState, useEffect } from 'react'
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import type { ChartConfig } from '@/components/ui/chart'

type DateRange = '7d' | '30d' | '3m' | '6m'

interface CreditSalesTrendChartProps {
  dateRange: DateRange
}

interface ChartData {
  date: string
  amount: number
}

const chartConfig = {
  amount: {
    label: 'Credit Sales',
    color: '#E8896A',
  },
} satisfies ChartConfig

export function CreditSalesTrendChart({ dateRange }: CreditSalesTrendChartProps) {
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
        <p className="text-xs text-[#B89080]">No credit sales data available</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis dataKey="date" stroke="#B89080" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#B89080" fontSize={12} tickLine={false} axisLine={false}
          tickFormatter={(value) => `₱${value.toLocaleString()}`} />
        <ChartTooltip content={<ChartTooltipContent />}
          formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Credit Sales']} />
        <Line type="monotone" dataKey="amount" stroke="#E8896A" strokeWidth={2}
          dot={{ fill: '#E8896A', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ChartContainer>
  )
}

// Remove mock data generator — charts show empty state when no real data exists
