# Chart Patterns

## Chart Library
Talastock uses shadcn/ui Charts exclusively for all data visualizations.
These are pre-styled, accessible chart components built on Recharts.

## Installation
```bash
npx shadcn-ui@latest add chart
```

## Chart Configuration
All charts use a shared config object that defines colors and labels:

```typescript
// components/charts/config.ts
import type { ChartConfig } from '@/components/ui/chart'

export const chartConfig = {
  sales: {
    label: 'Sales',
    color: '#E8896A', // ts-accent
  },
  revenue: {
    label: 'Revenue',
    color: '#C1614A', // ts-accent-dark
  },
  products: {
    label: 'Products',
    color: '#B89080', // ts-muted
  },
} satisfies ChartConfig
```

## Line Chart Pattern (Sales Trend)
```typescript
'use client'
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { chartConfig } from './config'

interface SalesChartProps {
  data: { date: string; sales: number }[]
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis 
          dataKey="date" 
          stroke="#B89080"
          fontSize={12}
        />
        <YAxis 
          stroke="#B89080"
          fontSize={12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line 
          type="monotone"
          dataKey="sales" 
          stroke="#E8896A"
          strokeWidth={2}
          dot={{ fill: '#E8896A', r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
```

## Bar Chart Pattern (Top Products)
```typescript
'use client'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { chartConfig } from './config'

interface TopProductsChartProps {
  data: { product: string; sales: number }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis 
          dataKey="product" 
          stroke="#B89080"
          fontSize={12}
        />
        <YAxis 
          stroke="#B89080"
          fontSize={12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar 
          dataKey="sales" 
          fill="#E8896A"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
```

## Area Chart Pattern (Revenue Over Time)
```typescript
'use client'
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { chartConfig } from './config'

export function RevenueChart({ data }: { data: any[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2C4B0" />
        <XAxis dataKey="month" stroke="#B89080" fontSize={12} />
        <YAxis stroke="#B89080" fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area 
          type="monotone"
          dataKey="revenue" 
          stroke="#E8896A"
          fill="#FDE8DF"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

## Chart Card Wrapper
Always wrap charts in a card with a title:

```typescript
export function ChartCard({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) {
  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
      <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">{title}</h3>
      {children}
    </div>
  )
}

// Usage
<ChartCard title="Sales Trend">
  <SalesChart data={salesData} />
</ChartCard>
```

## Color Palette for Charts
Use only Talastock colors in charts:
- Primary line/bar: `#E8896A` (ts-accent)
- Secondary line/bar: `#C1614A` (ts-accent-dark)
- Grid lines: `#F2C4B0` (ts-border)
- Axis labels: `#B89080` (ts-muted)
- Fill/background: `#FDE8DF` (ts-soft)

## Responsive Behavior
- Desktop: Charts at 300px height
- Mobile: Charts at 250px height, hide Y-axis labels if needed
- Always use `className="h-[300px] w-full"` on ChartContainer

## Loading State
```typescript
export function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full bg-[#FDF6F0] rounded-lg animate-pulse" />
  )
}
```

## What NOT to Do
- Never use default Recharts colors (blue, green, etc.)
- Never use 3D charts or pie charts (hard to read)
- Never show more than 3 lines on a single chart
- Never use animations (keep it fast and clean)
- Never use emoji icons in charts or legends
