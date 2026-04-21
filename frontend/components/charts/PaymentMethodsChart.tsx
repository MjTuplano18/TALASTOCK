'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { Sale, PaymentMethod } from '@/types'

interface PaymentMethodsChartProps {
  data: Sale[]
}

interface PaymentMethodData {
  method: PaymentMethod
  label: string
  count: number
  total: number
  percentage: number
  color: string
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  gcash: 'GCash',
  paymaya: 'PayMaya',
  bank_transfer: 'Bank Transfer',
}

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: '#E8896A',      // ts-accent
  card: '#C1614A',      // ts-accent-dark
  gcash: '#B89080',     // ts-muted
  paymaya: '#F2C4B0',   // ts-border
  bank_transfer: '#7A3E2E', // ts-text
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Count payment methods
    const methodStats: Record<PaymentMethod, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      gcash: { count: 0, total: 0 },
      paymaya: { count: 0, total: 0 },
      bank_transfer: { count: 0, total: 0 },
    }

    let totalRevenue = 0

    data.forEach(sale => {
      // Ensure we have valid sale data
      if (!sale || typeof sale.total_amount !== 'number') return
      
      const method = (sale.payment_method || 'cash') as PaymentMethod
      
      // Validate payment method
      if (!methodStats[method]) {
        console.warn('Unknown payment method:', method, 'defaulting to cash')
        methodStats.cash.count++
        methodStats.cash.total += sale.total_amount
      } else {
        methodStats[method].count++
        methodStats[method].total += sale.total_amount
      }
      
      totalRevenue += sale.total_amount
    })

    // Convert to chart data, only include methods that have transactions
    const result: PaymentMethodData[] = Object.entries(methodStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([method, stats]) => ({
        method: method as PaymentMethod,
        label: PAYMENT_METHOD_LABELS[method as PaymentMethod],
        count: stats.count,
        total: stats.total,
        percentage: totalRevenue > 0 ? (stats.total / totalRevenue) * 100 : 0,
        color: PAYMENT_METHOD_COLORS[method as PaymentMethod],
      }))
      .sort((a, b) => b.total - a.total)

    return result
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#E8896A]" />
          </div>
          <p className="text-sm text-[#7A3E2E] font-medium mb-1">No Payment Data</p>
          <p className="text-xs text-[#B89080]">Payment methods will appear here once you have sales</p>
        </div>
      </div>
    )
  }

  // If only one payment method, show it as 100%
  if (chartData.length === 1) {
    const singleMethod = chartData[0]
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-sm"
            style={{ backgroundColor: singleMethod.color }}
          >
            <span className="text-white font-medium text-sm">100%</span>
          </div>
          <p className="text-sm text-[#7A3E2E] font-medium mb-1">{singleMethod.label}</p>
          <p className="text-xs text-[#B89080]">{singleMethod.count} transactions</p>
          <p className="text-xs text-[#7A3E2E] font-medium">{formatCurrency(singleMethod.total)}</p>
        </div>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PaymentMethodData
      return (
        <div className="bg-white border border-[#F2C4B0] rounded-lg shadow-lg p-3">
          <p className="text-xs font-medium text-[#7A3E2E] mb-1">{data.label}</p>
          <p className="text-xs text-[#B89080]">{data.count} transactions</p>
          <p className="text-xs text-[#7A3E2E] font-medium">{formatCurrency(data.total)}</p>
          <p className="text-xs text-[#B89080]">{data.percentage.toFixed(1)}% of revenue</p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#7A3E2E]">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="40%"
            innerRadius={0}
            outerRadius={75}
            paddingAngle={2}
            dataKey="total"
            nameKey="label"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}