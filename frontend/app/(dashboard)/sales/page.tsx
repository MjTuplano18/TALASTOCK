'use client'

import React, { useState, useMemo } from 'react'
import { ShoppingCart, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { RangeInput, type RangeValue } from '@/components/shared/RangeInput'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SaleForm } from '@/components/forms/SaleForm'
import { useSales } from '@/hooks/useSales'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Sale } from '@/types'

const PAGE_SIZE = 15

// Expanded row showing sale line items
function SaleExpandedRow({ sale }: { sale: Sale }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 pb-3 pt-0">
        <div className="bg-[#FDF6F0] rounded-xl border border-[#F2C4B0] p-3">
          <p className="text-xs font-medium text-[#7A3E2E] mb-2">Items in this sale</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F2C4B0]">
                <th className="text-left py-1.5 text-[#B89080] font-medium">Product</th>
                <th className="text-left py-1.5 text-[#B89080] font-medium">SKU</th>
                <th className="text-left py-1.5 text-[#B89080] font-medium">Qty</th>
                <th className="text-left py-1.5 text-[#B89080] font-medium">Unit Price</th>
                <th className="text-right py-1.5 text-[#B89080] font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items?.map(item => (
                <tr key={item.id} className="border-b border-[#FDE8DF]">
                  <td className="py-1.5 text-[#7A3E2E]">{item.products?.name ?? '—'}</td>
                  <td className="py-1.5 text-[#B89080] font-mono">{item.products?.sku ?? '—'}</td>
                  <td className="py-1.5 text-[#7A3E2E]">{item.quantity}</td>
                  <td className="py-1.5 text-[#7A3E2E]">{formatCurrency(item.unit_price)}</td>
                  <td className="py-1.5 text-[#7A3E2E] font-medium text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sale.notes && (
            <p className="text-xs text-[#B89080] mt-2">Note: {sale.notes}</p>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function SalesPage() {
  const { allSales, loading, error, createSale, refetch } = useSales()
  const { allProducts } = useProducts()
  const [saleFormOpen, setSaleFormOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null)
  const [voiding, setVoiding] = useState(false)

  const [search, setSearch] = useState('')
  const [amountRange, setAmountRange] = useState<RangeValue>({ min: '', max: '' })
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  // Debounce search to reduce re-renders
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    setPage(1)
    return allSales.filter(sale => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
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
  }, [allSales, debouncedSearch, amountRange, dateRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || amountRange.min || amountRange.max || dateRange.from
  const totalFiltered = filtered.reduce((sum, s) => sum + s.total_amount, 0)

  async function handleVoid() {
    if (!voidTarget) return
    setVoiding(true)
    try {
      // Delete sale items first, then the sale
      await supabase.from('sale_items').delete().eq('sale_id', voidTarget.id)
      const { error } = await supabase.from('sales').delete().eq('id', voidTarget.id)
      if (error) throw error
      toast.success('Sale voided successfully')
      await refetch()
    } catch {
      toast.error('Failed to void sale')
    } finally {
      setVoiding(false)
      setVoidTarget(null)
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

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

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or notes…" />
        <RangeInput value={amountRange} onChange={setAmountRange} label="Amount Range" prefix="₱" placeholder="Amount" />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setAmountRange({ min: '', max: '' }); setDateRange({ from: null, to: null }) }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">Clear filters</button>
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
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="w-8 py-3 px-4" />
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Date & Time</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Products</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Total Amount</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(sale => {
                  const isExpanded = expandedId === sale.id
                  const itemCount = sale.sale_items?.length ?? 0
                  const firstProduct = sale.sale_items?.[0]?.products?.name
                  const productSummary = firstProduct
                    ? itemCount > 1 ? `${firstProduct} +${itemCount - 1} more` : firstProduct
                    : `${itemCount} item${itemCount !== 1 ? 's' : ''}`

                  return (
                    <React.Fragment key={sale.id}>
                      <tr
                        className={`border-b border-[#FDE8DF] hover:bg-[#FDF6F0] cursor-pointer ${isExpanded ? 'bg-[#FDF6F0]' : ''}`}
                        onClick={() => toggleExpand(sale.id)}>
                        <td className="py-3 px-4 text-[#B89080]">
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />}
                        </td>
                        <td className="py-3 px-4 text-[#B89080] text-xs">{formatDateTime(sale.created_at)}</td>
                        <td className="py-3 px-4 text-[#7A3E2E]">{productSummary}</td>
                        <td className="py-3 px-4 font-medium text-[#7A3E2E]">{formatCurrency(sale.total_amount)}</td>
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setVoidTarget(sale)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA] transition-colors"
                            title="Void this sale">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && <SaleExpandedRow sale={sale} />}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <SaleForm open={saleFormOpen} onOpenChange={setSaleFormOpen}
        products={allProducts} onSubmit={createSale} />

      <ConfirmDialog
        open={!!voidTarget}
        onOpenChange={open => { if (!open) setVoidTarget(null) }}
        title="Void this sale?"
        description={`This will permanently delete the sale of ${voidTarget ? formatCurrency(voidTarget.total_amount) : ''}. Note: inventory quantities will NOT be automatically restored — adjust manually if needed.`}
        confirmLabel="Void Sale"
        onConfirm={handleVoid}
        loading={voiding}
        danger
      />
    </div>
  )
}
