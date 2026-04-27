'use client'

import { useState, useEffect } from 'react'
import { Pie, PieChart, Cell, Legend, ResponsiveContainer } from 'recharts'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
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
      if (startDate && startDate instanceof Date) {
        query = query.gte('payment_date', startDate.toISOString().split('T')[0])
      }
      if (endDate && endDate instanceof Date) {
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

  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#7A3E2E]">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="method"
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          label={({ amount }) => `₱${amount.toLocaleString()}`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}

