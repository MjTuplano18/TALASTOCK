'use client'

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { SalesChartData } from '@/types'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#F2C4B0] rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-[#7A3E2E] mb-1">{label}</p>
      <p className="text-xs text-[#B89080]">
        Sales: <span className="text-[#7A3E2E] font-medium">{formatCurrency(payload[0].value)}</span>
      </p>
    </div>
  )
}

export function SalesChart({ data }: { data: SalesChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#B89080"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#B89080"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `₱${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F2C4B0', strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#E8896A"
          strokeWidth={2}
          dot={{ fill: '#E8896A', r: 3, strokeWidth: 0 }}
          activeDot={{ fill: '#C1614A', r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
