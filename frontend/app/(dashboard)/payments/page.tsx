'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { getPayments } from '@/lib/supabase-queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import type { Payment } from '@/types'
import { toast } from 'sonner'

const PAYMENT_METHOD_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'GCash', value: 'gcash' },
  { label: 'Other', value: 'other' },
]

function PaymentMethodBadge({ method }: { method: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    cash:          { label: 'Cash',          bg: '#E8F5E9', color: '#2E7D32' },
    bank_transfer: { label: 'Bank Transfer', bg: '#FDE8DF', color: '#E8896A' },
    gcash:         { label: 'GCash',         bg: '#EDE7F6', color: '#5E35B1' },
    paymaya:       { label: 'PayMaya',       bg: '#E3F2FD', color: '#1565C0' },
    other:         { label: 'Other',         bg: '#FDF6F0', color: '#B89080' },
  }
  const style = config[method] ?? config.other
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true)
        const data = await getPayments()
        setPayments(data)
      } catch {
        toast.error('Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        if (!payment.customers?.name?.toLowerCase().includes(q)) return false
      }
      if (methodFilter && payment.payment_method !== methodFilter) return false
      if (dateRange.from) {
        const d = new Date(payment.payment_date)
        if (d < dateRange.from) return false
        if (dateRange.to && d > dateRange.to) return false
      }
      return true
    })
  }, [payments, debouncedSearch, methodFilter, dateRange])

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0)
  const hasFilters = search || methodFilter || dateRange.from

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="h-24 bg-[#FDE8DF] rounded-xl animate-pulse" />
        <div className="h-96 bg-[#FDE8DF] rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#7A3E2E]">Payments</h1>
        <Button
          onClick={() => toast.info('Export feature coming soon')}
          variant="outline"
          className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FDE8DF] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#E8896A]" />
          </div>
          <div>
            <p className="text-xs text-[#B89080]">Total Payments</p>
            <p className="text-2xl font-medium text-[#7A3E2E]">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-[#B89080]" suppressHydrationWarning>{filtered.length} payment(s)</p>
          </div>
        </div>
      </div>

      {/* Filters — same pattern as credit-sales page */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer…" />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <FilterSelect
          value={methodFilter}
          onChange={setMethodFilter}
          placeholder="All Methods"
          options={PAYMENT_METHOD_OPTIONS}
        />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setMethodFilter(''); setDateRange({ from: null, to: null }) }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline"
          >
            Clear filters
          </button>
        )}
        <div className="ml-auto">
          <span className="text-xs text-[#B89080]">
            {filtered.length} payments · {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-[#E8896A]" />
              </div>
              <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">No payments found</h3>
              <p className="text-xs text-[#B89080]">
                {payments.length === 0 ? 'No payments have been recorded yet.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium text-xs">Date</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium text-xs">Customer</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium text-xs">Amount</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium text-xs">Method</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium text-xs">Notes</th>
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                    <td className="py-3 px-4 text-[#B89080] text-xs">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => router.push(`/customers/${payment.customer_id}`)}
                        className="text-[#E8896A] hover:text-[#C1614A] font-medium text-sm"
                      >
                        {payment.customers?.name || 'Unknown'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#7A3E2E] font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <PaymentMethodBadge method={payment.payment_method} />
                    </td>
                    <td className="py-3 px-4 text-[#7A3E2E] text-xs">{payment.notes || '—'}</td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/customers/${payment.customer_id}`)}
                        className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
                      >
                        View Customer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
