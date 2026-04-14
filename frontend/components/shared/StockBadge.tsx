import type { StockStatus } from '@/types'

const statusConfig: Record<StockStatus, { label: string; bg: string; color: string }> = {
  in_stock:     { label: 'In stock',     bg: '#FDE8DF', color: '#C1614A' },
  low_stock:    { label: 'Low stock',    bg: '#FDECEA', color: '#C05050' },
  out_of_stock: { label: 'Out of stock', bg: '#F5E0DF', color: '#A03030' },
}

interface StockBadgeProps {
  status: StockStatus
}

export function StockBadge({ status }: StockBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
