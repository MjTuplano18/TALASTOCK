'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CategoryPerformance } from '@/types'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as CategoryPerformance
  return (
    <div className="bg-white border border-[#F2C4B0] rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-[#7A3E2E] mb-1">{d.category}</p>
      <p className="text-[#B89080]">Revenue: <span className="text-[#7A3E2E] font-medium">{formatCurrency(d.revenue)}</span></p>
      <p className="text-[#B89080]">Units: <span className="text-[#7A3E2E] font-medium">{d.units}</span></p>
    </div>
  )
}

const COLORS = ['#E8896A', '#C1614A', '#B89080', '#F2C4B0', '#D4A090']

export function CategoryPerformanceChart({ data }: { data: CategoryPerformance[] }) {
  if (!data.length) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <p className="text-sm text-[#B89080]">No category data yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          width={90}
          tick={{ fontSize: 10, fill: '#B89080' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FDE8DF' }} />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
