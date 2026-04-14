import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Sale } from '@/types'

interface RecentTransactionsProps {
  sales: Sale[]
  loading?: boolean
}

export function RecentTransactions({ sales, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex flex-col gap-1">
              <div className="h-3 w-32 bg-[#FDE8DF] rounded animate-pulse" />
              <div className="h-2.5 w-20 bg-[#FDE8DF] rounded animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-[#FDE8DF] rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!sales.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#B89080]">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-[#FDE8DF]">
      {sales.map(sale => {
        const itemCount = sale.sale_items?.length ?? 0
        const firstProduct = sale.sale_items?.[0]?.products?.name

        return (
          <div key={sale.id} className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm text-[#7A3E2E] truncate">
                {firstProduct
                  ? itemCount > 1
                    ? `${firstProduct} +${itemCount - 1} more`
                    : firstProduct
                  : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              </span>
              <span className="text-xs text-[#B89080]">{formatDateTime(sale.created_at)}</span>
            </div>
            <span className="text-sm font-medium text-[#7A3E2E] shrink-0 ml-4">
              {formatCurrency(sale.total_amount)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
