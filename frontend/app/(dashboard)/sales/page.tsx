'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, ChevronDown, ChevronUp, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { ImportButton } from '@/components/shared/ImportButton'
import { RangeInput, type RangeValue } from '@/components/shared/RangeInput'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SaleForm } from '@/components/forms/SaleForm'
import { SalesImportModal } from '@/components/sales/SalesImportModal'
import { RefundModal } from '@/components/sales/RefundModal'
import { useSales } from '@/hooks/useSales'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { processSaleRefund } from '@/lib/refund-api'
import { toast } from 'sonner'
import type { Sale, Product, PaymentMethod, DiscountType, SaleStatus, RefundItem, RefundRequest } from '@/types'
import type { ParsedSaleItem } from '@/lib/import-sales-parser'

const PAGE_SIZE = 15

// Status badge component
function StatusBadge({ status }: { status: SaleStatus }) {
  const config = {
    completed: { label: 'Completed', bg: '#FDE8DF', color: '#C1614A' },
    refunded: { label: 'Refunded', bg: '#FDECEA', color: '#C05050' },
    partially_refunded: { label: 'Partially Refunded', bg: '#FDE8DF', color: '#B89080' },
  }
  
  const style = config[status] || config.completed
  
  return (
    <span 
      className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}

// Payment method badge component
function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const config = {
    cash: { label: 'Cash', bg: '#FDE8DF', color: '#C1614A' },
    card: { label: 'Card', bg: '#E8F5E9', color: '#2E7D32' },
    gcash: { label: 'GCash', bg: '#E3F2FD', color: '#1565C0' },
    paymaya: { label: 'PayMaya', bg: '#F3E5F5', color: '#6A1B9A' },
    bank_transfer: { label: 'Bank Transfer', bg: '#FFF3E0', color: '#E65100' },
    credit: { label: 'Credit', bg: '#FDECEA', color: '#C05050' },
  }
  
  const style = config[method] || config.cash
  
  return (
    <span 
      className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}

// Discount badge component
function DiscountBadge({ type, amount }: { type: DiscountType; amount: number }) {
  if (type === 'none' || amount === 0) {
    return <span className="text-xs text-[#B89080]">—</span>
  }
  
  const config = {
    percentage: { label: 'Percentage', bg: '#FFF3E0', color: '#E65100' },
    fixed: { label: 'Fixed', bg: '#F3E5F5', color: '#6A1B9A' },
    senior_pwd: { label: 'Senior/PWD', bg: '#E8F5E9', color: '#2E7D32' },
  }
  
  const style = config[type as keyof typeof config] || config.percentage
  
  return (
    <div className="flex flex-col gap-0.5">
      <span 
        className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
        style={{ background: style.bg, color: style.color }}
      >
        {style.label}
      </span>
      <span className="text-xs text-[#C05050] font-medium">
        -{formatCurrency(amount)}
      </span>
    </div>
  )
}

// Expanded row showing sale line items
function SaleExpandedRow({ sale }: { sale: Sale }) {
  return (
    <tr>
      <td colSpan={8} className="px-4 pb-3 pt-0">
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
          {/* Discount information */}
          {sale.discount_type && sale.discount_type !== 'none' && sale.discount_amount > 0 && (
            <div className="mt-2 pt-2 border-t border-[#F2C4B0] text-xs">
              <div className="flex justify-between">
                <span className="text-[#B89080]">
                  Discount ({sale.discount_type === 'senior_pwd' ? 'Senior/PWD 20%' : 
                            sale.discount_type === 'percentage' ? `${sale.discount_value}%` : 
                            'Fixed Amount'}):
                </span>
                <span className="text-[#C05050] font-medium">-{formatCurrency(sale.discount_amount)}</span>
              </div>
            </div>
          )}
          {/* Payment information */}
          {sale.payment_method === 'cash' && sale.cash_received && (
            <div className="mt-2 pt-2 border-t border-[#F2C4B0] text-xs">
              <div className="flex justify-between">
                <span className="text-[#B89080]">Cash Received:</span>
                <span className="text-[#7A3E2E] font-medium">{formatCurrency(sale.cash_received)}</span>
              </div>
              {sale.change_given !== undefined && sale.change_given > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#B89080]">Change Given:</span>
                  <span className="text-[#7A3E2E] font-medium">{formatCurrency(sale.change_given)}</span>
                </div>
              )}
            </div>
          )}
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
  const [mounted, setMounted] = useState(false)
  const [saleFormOpen, setSaleFormOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null)
  const [voiding, setVoiding] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  
  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundTarget, setRefundTarget] = useState<Sale | null>(null)
  const [refunding, setRefunding] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch products for import
  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
      if (data) setProducts(data)
    }
    fetchProducts()
  }, [])

  const [search, setSearch] = useState('')
  const [amountRange, setAmountRange] = useState<RangeValue>({ min: '', max: '' })
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [discountFilter, setDiscountFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
      if (paymentMethodFilter && sale.payment_method !== paymentMethodFilter) return false
      if (discountFilter && sale.discount_type !== discountFilter) return false
      if (statusFilter && sale.status !== statusFilter) return false
      return true
    })
  }, [allSales, debouncedSearch, amountRange, dateRange, paymentMethodFilter, discountFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || amountRange.min || amountRange.max || dateRange.from || paymentMethodFilter || discountFilter || statusFilter
  const totalFiltered = filtered.reduce((sum, s) => sum + s.total_amount, 0)

  async function handleVoid() {
    if (!voidTarget) return
    setVoiding(true)
    try {
      // Delete sale items first, then the sale
      const { error: itemsError } = await supabase.from('sale_items').delete().eq('sale_id', voidTarget.id)
      if (itemsError) {
        console.error('Failed to delete sale items:', itemsError)
        throw new Error('Failed to delete sale items')
      }
      
      const { error: saleError } = await supabase.from('sales').delete().eq('id', voidTarget.id)
      if (saleError) {
        console.error('Failed to delete sale:', saleError)
        throw new Error('Failed to delete sale')
      }
      
      // Invalidate all related caches
      if (typeof window !== 'undefined') {
        localStorage.removeItem('talastock_cache_sales')
        localStorage.removeItem('talastock_ai_talastock:ai:insight')
        localStorage.removeItem('talastock_ai_talastock:ai:anomalies')
      }
      
      // Show success toast
      toast.success('Sale voided successfully')
      
      // Close dialog
      setVoidTarget(null)
      
      // Force refetch to update UI
      await refetch()
    } catch (err) {
      console.error('Void error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to void sale')
    } finally {
      setVoiding(false)
    }
  }

  // Handle refund
  async function handleRefund(refundItems: RefundItem[], refundReason?: string) {
    if (!refundTarget) return
    
    setRefunding(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not authenticated')
        return
      }
      
      // Calculate total refund amount
      const totalRefundAmount = refundItems.reduce((sum, item) => sum + item.refund_amount, 0)
      
      // Determine if this is a full refund
      const isFullRefund = refundTarget.sale_items 
        ? refundItems.length === refundTarget.sale_items.length &&
          refundItems.every(refundItem => {
            const originalItem = refundTarget.sale_items?.find(item => item.id === refundItem.sale_item_id)
            return originalItem && refundItem.refund_quantity === originalItem.quantity
          })
        : false
      
      // Build refund request
      const refundRequest: RefundRequest = {
        sale_id: refundTarget.id,
        items: refundItems,
        refund_reason: refundReason,
        total_refund_amount: totalRefundAmount,
        is_full_refund: isFullRefund,
      }
      
      // Process refund
      const response = await processSaleRefund(refundRequest, user.id)
      
      if (response.success) {
        // Invalidate all related caches
        if (typeof window !== 'undefined') {
          localStorage.removeItem('talastock_cache_sales')
          localStorage.removeItem('talastock_cache_inventory')
          localStorage.removeItem('talastock_ai_talastock:ai:insight')
          localStorage.removeItem('talastock_ai_talastock:ai:anomalies')
        }
        
        toast.success(response.message)
        setRefundModalOpen(false)
        setRefundTarget(null)
        
        // Force refetch to update UI
        await refetch()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      console.error('Refund error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process refund')
    } finally {
      setRefunding(false)
    }
  }
  
  // Open refund modal
  function openRefundModal(sale: Sale) {
    setRefundTarget(sale)
    setRefundModalOpen(true)
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function handleImportSales(sales: ParsedSaleItem[]) {
    let successCount = 0
    let failCount = 0

    for (const sale of sales) {
      try {
        // Find product by SKU or name
        const product = products.find(p => 
          p.sku.toLowerCase() === sale.sku.toLowerCase() ||
          p.name.toLowerCase() === sale.productName.toLowerCase()
        )

        if (!product) {
          console.warn(`Product not found: ${sale.productName} (${sale.sku})`)
          failCount++
          continue
        }

        // Create timestamp
        const timestamp = sale.time 
          ? `${sale.date}T${sale.time}`
          : `${sale.date}T12:00:00`

        // Insert sale
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            total_amount: sale.totalAmount,
            notes: sale.notes || `Imported: ${sale.productName}`,
            created_at: timestamp
          })
          .select()
          .single()

        if (saleError) throw saleError

        // Insert sale item
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: saleData.id,
            product_id: product.id,
            quantity: sale.quantity,
            unit_price: sale.unitPrice
          })

        if (itemError) throw itemError

        // Note: We don't adjust inventory for historical imports
        // This is intentional - users should adjust inventory separately if needed

        successCount++
      } catch (error) {
        console.error('Failed to import sale:', error)
        failCount++
      }
    }

    if (successCount > 0) {
      await refetch()
    }

    if (failCount === 0) {
      toast.success(`Successfully imported ${successCount} sales`)
    } else {
      toast.warning(`Imported ${successCount} sales, ${failCount} failed`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-lg font-bold text-[#7A3E2E]">Sales</h1>
      </div>

      {error && <div className="text-sm text-[#C05050]">{error}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or notes…" />
        <RangeInput value={amountRange} onChange={setAmountRange} label="Amount Range" prefix="₱" placeholder="Amount" />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <FilterSelect 
          value={paymentMethodFilter} 
          onChange={setPaymentMethodFilter} 
          placeholder="All Payment Methods"
          options={[
            { label: 'Cash', value: 'cash' },
            { label: 'Card', value: 'card' },
            { label: 'GCash', value: 'gcash' },
            { label: 'PayMaya', value: 'paymaya' },
            { label: 'Bank Transfer', value: 'bank_transfer' },
            { label: 'Credit', value: 'credit' },
          ]} 
        />
        <FilterSelect 
          value={discountFilter} 
          onChange={setDiscountFilter} 
          placeholder="All Discounts"
          options={[
            { label: 'No Discount', value: 'none' },
            { label: 'Percentage', value: 'percentage' },
            { label: 'Fixed Amount', value: 'fixed' },
            { label: 'Senior/PWD', value: 'senior_pwd' },
          ]} 
        />
        <FilterSelect 
          value={statusFilter} 
          onChange={setStatusFilter} 
          placeholder="All Statuses"
          options={[
            { label: 'Completed', value: 'completed' },
            { label: 'Refunded', value: 'refunded' },
            { label: 'Partially Refunded', value: 'partially_refunded' },
          ]} 
        />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setAmountRange({ min: '', max: '' }); setDateRange({ from: null, to: null }); setPaymentMethodFilter(''); setDiscountFilter(''); setStatusFilter('') }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">Clear filters</button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#B89080]" suppressHydrationWarning>
            {filtered.length} sales · {formatCurrency(totalFiltered)}
          </span>
          <ImportButton onClick={() => setImportModalOpen(true)} />
          <button onClick={() => setSaleFormOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors whitespace-nowrap">
            <ShoppingCart className="w-3.5 h-3.5" />
            Record Sale
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {!mounted || loading ? (
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
              <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors"
                onClick={() => setSaleFormOpen(true)}>
                <ShoppingCart className="w-3.5 h-3.5" />Record Sale
              </button>
            ) : undefined}
          />
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F2C4B0]">
                    <th className="w-8 py-3 px-4" />
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Date & Time</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Products</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Payment Method</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Discount</th>
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
                          <td className="py-3 px-4">
                            <StatusBadge status={sale.status || 'completed'} />
                          </td>
                          <td className="py-3 px-4">
                            <PaymentMethodBadge method={sale.payment_method || 'cash'} />
                          </td>
                          <td className="py-3 px-4">
                            <DiscountBadge type={sale.discount_type || 'none'} amount={sale.discount_amount || 0} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-[#7A3E2E]">{formatCurrency(sale.total_amount)}</span>
                              {sale.refunded_amount > 0 && (
                                <span className="text-xs text-[#C05050]">
                                  Refunded: {formatCurrency(sale.refunded_amount)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {/* Refund button - only show for completed or partially refunded sales */}
                              {sale.status !== 'refunded' && (
                                <button
                                  onClick={() => openRefundModal(sale)}
                                  disabled={refunding}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#E8896A] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Process refund">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Void button */}
                              <button
                                onClick={() => setVoidTarget(sale)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA] transition-colors"
                                title="Void this sale">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && <SaleExpandedRow sale={sale} />}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="lg:hidden space-y-3 p-4">
              {paginated.map(sale => {
                const isExpanded = expandedId === sale.id
                const itemCount = sale.sale_items?.length ?? 0
                const firstProduct = sale.sale_items?.[0]?.products?.name
                const productSummary = firstProduct
                  ? itemCount > 1 ? `${firstProduct} +${itemCount - 1} more` : firstProduct
                  : `${itemCount} item${itemCount !== 1 ? 's' : ''}`

                return (
                  <div key={sale.id} className="border border-[#F2C4B0] rounded-lg bg-white">
                    <div 
                      className="p-3 cursor-pointer"
                      onClick={() => toggleExpand(sale.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-[#7A3E2E] text-sm truncate">{productSummary}</h3>
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-[#B89080] shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-[#B89080] shrink-0" />}
                          </div>
                          <p className="text-xs text-[#B89080]">{formatDateTime(sale.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[#7A3E2E] text-sm">{formatCurrency(sale.total_amount)}</p>
                          {sale.refunded_amount > 0 && (
                            <p className="text-xs text-[#C05050]">
                              Refunded: {formatCurrency(sale.refunded_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sale.status || 'completed'} />
                          <PaymentMethodBadge method={sale.payment_method || 'cash'} />
                        </div>
                        
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {sale.status !== 'refunded' && (
                            <button
                              onClick={() => openRefundModal(sale)}
                              disabled={refunding}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#E8896A] hover:bg-[#FDE8DF] transition-colors disabled:opacity-50"
                              title="Process refund">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setVoidTarget(sale)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#B89080] hover:text-[#C05050] hover:bg-[#FDECEA] transition-colors"
                            title="Void this sale">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-[#F2C4B0] p-3 bg-[#FDF6F0]">
                        <p className="text-xs font-medium text-[#7A3E2E] mb-2">Items in this sale</p>
                        <div className="space-y-2">
                          {sale.sale_items?.map(item => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="text-[#7A3E2E] truncate">{item.products?.name ?? '—'}</p>
                                <p className="text-[#B89080] font-mono">{item.products?.sku ?? '—'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#7A3E2E]">{item.quantity} × {formatCurrency(item.unit_price)}</p>
                                <p className="text-[#7A3E2E] font-medium">{formatCurrency(item.subtotal)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Discount and payment info */}
                        {sale.discount_type && sale.discount_type !== 'none' && sale.discount_amount > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#F2C4B0] text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#B89080]">
                                Discount ({sale.discount_type === 'senior_pwd' ? 'Senior/PWD 20%' : 
                                          sale.discount_type === 'percentage' ? `${sale.discount_value}%` : 
                                          'Fixed Amount'}):
                              </span>
                              <span className="text-[#C05050] font-medium">-{formatCurrency(sale.discount_amount)}</span>
                            </div>
                          </div>
                        )}
                        
                        {sale.payment_method === 'cash' && sale.cash_received && (
                          <div className="mt-2 pt-2 border-t border-[#F2C4B0] text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#B89080]">Cash Received:</span>
                              <span className="text-[#7A3E2E] font-medium">{formatCurrency(sale.cash_received)}</span>
                            </div>
                            {sale.change_given !== undefined && sale.change_given > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[#B89080]">Change Given:</span>
                                <span className="text-[#7A3E2E] font-medium">{formatCurrency(sale.change_given)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {sale.notes && (
                          <p className="text-xs text-[#B89080] mt-2">Note: {sale.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length}
              pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <SaleForm open={saleFormOpen} onOpenChange={setSaleFormOpen}
        products={allProducts} onSubmit={createSale} />

      <SalesImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportSales}
        products={products}
      />

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

      {/* Refund Modal */}
      {refundTarget && (
        <RefundModal
          open={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false)
            setRefundTarget(null)
          }}
          sale={refundTarget}
          onConfirm={handleRefund}
        />
      )}
    </div>
  )
}
