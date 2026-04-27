'use client'

import { useState, useEffect } from 'react'
import { Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import type { ChartConfig } from '@/components/ui/chart'
import { supabase } from '@/lib/supabase'

interface PaymentMethodsChartProps {
  startDate?: Date
  endDate?: Date
}

interface ChartData {
  method: string
  amount: number
  count: number
  fill: string
}

const COLORS: Record<string, string> = {
  cash: '#E8896A',
  bank_transfer: '#C1614A',
  check: '#B89080',
  gcash: '#F2C4B0',
  other: '#D4B8B0',
}

const LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  gcash: 'GCash',
  other: 'Other',
}

const chartConfig = {
  amount: {
    label: 'Amount',
  },
  cash: {
    label: 'Cash',
    color: COLORS.cash,
  },
  bank_transfer: {
    label: 'Bank Transfer',
    color: COLORS.bank_transfer,
  },
  check: {
    label: 'Check',
    color: COLORS.check,
  },
  gcash: {
    label: 'GCash',
    color: COLORS.gcash,
  },
  other: {
    label: 'Other',
    color: COLORS.other,
  },
} satisfies ChartConfig

export function PaymentMethodsChart({ startDate, endDate }: PaymentMethodsChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  async function fetchData() {
    setLoading(true)
    try {
      let query = supabase
        .from('payments')
        .select('payment_method, amount')

      // Apply date filters if provided
      if (startDate) {
        query = query.gte('payment_date', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        query = query.lte('payment_date', endDate.toISOString().split('T')[0])
      }

      const { data: payments, error } = await query

      if (error) throw error

      // Group by payment method
      const methodMap: Record<string, { amount: number; count: number }> = {}

      payments.forEach(p => {
        const method = p.payment_method || 'other'
        if (!methodMap[method]) {
          methodMap[method] = { amount: 0, count: 0 }
        }
        methodMap[method].amount += p.amount
        methodMap[method].count += 1
      })

      // Convert to chart data
      const chartData = Object.entries(methodMap).map(([method, stats]) => ({
        method: LABELS[method] || method,
        amount: stats.amount,
        count: stats.count,
        fill: COLORS[method] || COLORS.other,
      }))

      setData(chartData)
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

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
      <PieChart>
        <ChartTooltip 
          content={<ChartTooltipContent />}
          formatter={(value: number, name: string, props: any) => {
            const { count } = props.payload
            return [
              `₱${value.toLocaleString()} (${count} ${count === 1 ? 'payment' : 'payments'})`,
              name
            ]
          }}
        />
        <Pie
          data={data}
          dataKey="amount"
          nameKey="method"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  )
}
