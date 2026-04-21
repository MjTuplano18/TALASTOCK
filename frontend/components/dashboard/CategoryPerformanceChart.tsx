'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CategoryPerformance } from '@/types'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-[#F2C4B0] rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-[#7A3E2E] mb-1">{d.category}</p>
      <p className="text-[#B89080]">Revenue: <span className="text-[#7A3E2E] font-medium">{formatCurrency(d.revenue)}</span></p>
      <p className="text-[#B89080]">Units: <span className="text-[#7A3E2E] font-medium">{d.units}</span></p>
    </div>
  )
}

// Custom dot with label above
function CustomDot(props: any) {
  const { cx, cy, payload, index } = props
  if (!payload || !payload.category) return null
  
  // Adjust text anchor based on position to prevent cutoff
  let textAnchor: 'start' | 'middle' | 'end' = 'middle'
  if (index === 0) textAnchor = 'start' // First item align left
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#E8896A" />
      <text
        x={cx}
        y={cy - 12}
        fill="#7A3E2E"
        fontSize={10}
        fontWeight="500"
        textAnchor={textAnchor}
        className="hidden sm:block"
      >
        {payload.category}
      </text>
      {/* Mobile: show only first 3 chars */}
      <text
        x={cx}
        y={cy - 12}
        fill="#7A3E2E"
        fontSize={9}
        fontWeight="500"
        textAnchor={textAnchor}
        className="sm:hidden"
      >
        {payload.category.slice(0, 3)}
      </text>
    </g>
  )
}

export function CategoryPerformanceChart({ data }: { data: CategoryPerformance[] }) {
  if (!data.length) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-[#B89080]">No category data yet</p>
      </div>
    )
  }

  // Sort by revenue descending and take top 5
  const sortedData = [...data]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedData}
          margin={{ top: 35, right: 10, left: 5, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" vertical={false} />
          <XAxis dataKey="category" hide />
          <YAxis 
            tick={{ fontSize: 9, fill: '#B89080' }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#E8896A"
            strokeWidth={2}
            dot={<CustomDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
