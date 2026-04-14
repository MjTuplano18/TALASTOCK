'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { TopProductData } from '@/types'

// Custom rounded bar with avatar above
function CustomBar(props: any) {
  const { x, y, width, height, payload, fill } = props
  if (!height || height <= 0) return null

  const radius = 8
  const initials = (payload.product as string)
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  const avatarR = 13
  const avatarCX = x + width / 2
  const avatarCY = y - avatarR - 5

  return (
    <g>
      {/* Rounded bar — only top corners rounded */}
      <path
        d={`
          M ${x + radius},${y}
          L ${x + width - radius},${y}
          Q ${x + width},${y} ${x + width},${y + radius}
          L ${x + width},${y + height}
          L ${x},${y + height}
          L ${x},${y + radius}
          Q ${x},${y} ${x + radius},${y}
          Z
        `}
        fill={fill}
      />

      {/* Avatar circle */}
      <circle cx={avatarCX} cy={avatarCY} r={avatarR}
        fill="#FDE8DF" stroke="#F2C4B0" strokeWidth={1.5} />
      <text x={avatarCX} y={avatarCY + 4}
        textAnchor="middle" fontSize={8} fontWeight="600" fill="#C1614A">
        {initials}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as TopProductData
  return (
    <div className="bg-white border border-[#F2C4B0] rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-[#7A3E2E] mb-1">{d.product}</p>
      <p className="text-[#B89080]">Revenue: <span className="text-[#7A3E2E] font-medium">{formatCurrency(d.revenue ?? 0)}</span></p>
      <p className="text-[#B89080]">Units sold: <span className="text-[#7A3E2E] font-medium">{d.sales}</span></p>
    </div>
  )
}

export function TopProductsChart({ data }: { data: TopProductData[] }) {
  if (!data.length) {
    return (
      <div className="h-[240px] flex items-center justify-center">
        <p className="text-sm text-[#B89080]">No sales data yet</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={sorted}
        margin={{ top: 40, right: 8, left: 8, bottom: 8 }}
        barCategoryGap="20%"
        barSize={52}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" vertical={false} />
        <XAxis
          dataKey="product"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: '#B89080' }}
          tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
          interval={0}
        />
        <YAxis
          tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
          tick={{ fontSize: 10, fill: '#B89080' }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FDE8DF', radius: 8 }} />
        <Bar dataKey="revenue" shape={<CustomBar />} isAnimationActive={false}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#C1614A' : '#E8896A'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
