import { AlertCircle, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DeadStockItem } from '@/types'

export function DeadStockWidget({ items, loading }: { items: DeadStockItem[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-[#FDE8DF] rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-3">
          <Package className="w-6 h-6 text-[#E8896A]" />
        </div>
        <p className="text-sm text-[#7A3E2E] font-medium mb-1">No dead stock!</p>
        <p className="text-xs text-[#B89080]">All products are moving well</p>
      </div>
    )
  }

  const totalValue = items.reduce((s, i) => s + i.value, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#C05050]" />
          <span className="text-xs text-[#C05050] font-medium">{items.length} products with no sales in 30 days</span>
        </div>
        <span className="text-xs text-[#B89080]">Tied up: {formatCurrency(totalValue)}</span>
      </div>
      <div className="flex flex-col divide-y divide-[#FDE8DF]">
        {items.slice(0, 5).map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#7A3E2E] truncate">{item.product}</p>
              <p className="text-[10px] text-[#B89080] font-mono">{item.sku} · {item.quantity} units</p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-xs text-[#C05050] font-medium">{formatCurrency(item.value)}</p>
              <p className="text-[10px] text-[#B89080]">
                {item.days_since_last_sale !== null
                  ? `${item.days_since_last_sale}d ago`
                  : 'Never sold'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
