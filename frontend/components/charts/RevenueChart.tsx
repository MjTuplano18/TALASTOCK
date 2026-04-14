'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { RevenueChartData } from '@/types'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#F2C4B0] rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-[#7A3E2E] mb-1">{label}</p>
      <p className="text-xs text-[#B89080]">
        Revenue: <span className="text-[#7A3E2E] font-medium">{formatCurrency(payload[0].value)}</span>
      </p>
    </div>
  )
}

export function RevenueChart({ data }: { data: RevenueChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E8896A" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#E8896A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" vertical={false} />
        <XAxis
          dataKey="month"
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
          tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F2C4B0', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#E8896A"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ fill: '#C1614A', r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
