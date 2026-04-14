'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { RangeInput, type RangeValue } from '@/components/shared/RangeInput'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { SaleForm } from '@/components/forms/SaleForm'
import { useSales } from '@/hooks/useSales'
import { useProducts } from '@/hooks/useProducts'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default function SalesPage() {
  const { allSales, loading, error, createSale } = useSales()
  const { allProducts } = useProducts()
  const [saleFormOpen, setSaleFormOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [amountRange, setAmountRange] = useState<RangeValue>({ min: '', max: '' })
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  const filtered = useMemo(() => {
    return allSales.filter(sale => {
      if (search) {
        const q = search.toLowerCase()
        const inItems = sale.sale_items?.some(i => i.products?.name?.toLowerCase().includes(q))
        const inNotes = sale.notes?.toLowerCase().includes(q)
        if (!inItems && !inNotes) return false
      }
      if (amountRange.min && sale.total_amount < Number(amountRange.min)) return false
      if (amountRange.max && sale.total_amount > Number(amountRange.max)) return false
      if (dateRange.from) {
        const d = new Date(sale.created_at)
        if (d < dateRange.from) return false
        if (dateRange.to && d > dateRange.to) return false
      }
      return true
    })
  }, [allSales, search, amountRange, dateRange])

  const hasFilters = search || amountRange.min || amountRange.max || dateRange.from
  const totalFiltered = filtered.reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-[#7A3E2E]">Sales</h1>
        <Button className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          onClick={() => setSaleFormOpen(true)}>
          <ShoppingCart className="w-4 h-4 mr-2" />Record Sale
        </Button>
      </div>

      {error && <div className="text-sm text-[#C05050] mb-3">{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or notes…" />
        <RangeInput value={amountRange} onChange={setAmountRange}
          label="Amount Range" prefix="₱" placeholder="Amount" />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setAmountRange({ min: '', max: '' }); setDateRange({ from: null, to: null }) }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-[#B89080] ml-auto">
          {filtered.length} sales · {formatCurrency(totalFiltered)}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md bg-[#FDE8DF]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No sales match your filters' : 'No sales yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Record your first sale to get started.'}
            action={!hasFilters ? (
              <Button className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
                onClick={() => setSaleFormOpen(true)}>
                <ShoppingCart className="w-4 h-4 mr-2" />Record Sale
              </Button>
            ) : undefined}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-3 px-4 text-[#B89080] font-medium">Date</th>
                <th className="text-left py-3 px-4 text-[#B89080] font-medium">Items</th>
                <th className="text-left py-3 px-4 text-[#B89080] font-medium">Total Amount</th>
                <th className="text-left py-3 px-4 text-[#B89080] font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                  <td className="py-3 px-4 text-[#B89080] text-xs">{formatDateTime(sale.created_at)}</td>
                  <td className="py-3 px-4 text-[#7A3E2E]">
                    {sale.sale_items?.length ?? 0} {(sale.sale_items?.length ?? 0) === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#7A3E2E]">{formatCurrency(sale.total_amount)}</td>
                  <td className="py-3 px-4 text-[#B89080] text-xs">{sale.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SaleForm open={saleFormOpen} onOpenChange={setSaleFormOpen}
        products={allProducts} onSubmit={createSale} />
    </div>
  )
}
