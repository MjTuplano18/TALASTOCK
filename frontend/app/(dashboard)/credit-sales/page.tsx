'use client'

import React, { useState, useMemo } from 'react'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { Pagination } from '@/components/shared/Pagination'
import { useCreditSales } from '@/hooks/useCreditSales'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { CreditSale } from '@/types'

const PAGE_SIZE = 15

// Status badge component
function StatusBadge({ status }: { status: CreditSale['status'] }) {
  const config = {
    pending: { label: 'Pending', bg: '#FFF3E0', color: '#E65100' },
    paid: { label: 'Paid', bg: '#E8F5E9', color: '#2E7D32' },
    overdue: { label: 'Overdue', bg: '#FDECEA', color: '#C05050' },
    partially_paid: { label: 'Partially Paid', bg: '#FDE8DF', color: '#E8896A' },
  }
  
  const style = config[status] || config.pending
  
  return (
    <span 
      className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}

// Expanded row showing credit sale details
function CreditSaleExpandedRow({ creditSale }: { creditSale: CreditSale }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 pb-3 pt-0">
        <div className="bg-[#FDF6F0] rounded-xl border border-[#F2C4B0] p-3">
          <p className="text-xs font-medium text-[#7A3E2E] mb-2">Credit Sale Details</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#B89080]">Customer:</span>
              <p className="text-[#7A3E2E] font-medium">{creditSale.customers?.name ?? '—'}</p>
              {creditSale.customers?.business_name && (
                <p className="text-[#B89080] text-xs">({creditSale.customers.business_name})</p>
              )}
            </div>
            <div>
              <span className="text-[#B89080]">Amount:</span>
              <p className="text-[#7A3E2E] font-medium">{formatCurrency(creditSale.amount)}</p>
            </div>
            <div>
              <span className="text-[#B89080]">Due Date:</span>
              <p className="text-[#7A3E2E] font-medium">{formatDate(creditSale.due_date)}</p>
            </div>
            <div>
              <span className="text-[#B89080]">Status:</span>
              <div className="mt-1">
                <StatusBadge status={creditSale.status} />
              </div>
            </div>
          </div>
          {creditSale.notes && (
            <p className="text-xs text-[#B89080] mt-2">Note: {creditSale.notes}</p>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function CreditSalesPage() {
  const { allCreditSales, loading, error } = useCreditSales()
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [statusFilter, setStatusFilter] = useState('')

  // Debounce search to reduce re-renders
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    setPage(1)
    return allCreditSales.filter(creditSale => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        const inCustomer = creditSale.customers?.name?.toLowerCase().includes(q)
        const inBusiness = creditSale.customers?.business_name?.toLowerCase().includes(q)
        const inNotes = creditSale.notes?.toLowerCase().includes(q)
        if (!inCustomer && !inBusiness && !inNotes) return false
      }
      if (dateRange.from) {
        const d = new Date(creditSale.created_at)
        if (d < dateRange.from) return false
        if (dateRange.to && d > dateRange.to) return false
      }
      if (statusFilter && creditSale.status !== statusFilter) return false
      return true
    })
  }, [allCreditSales, debouncedSearch, dateRange, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || dateRange.from || statusFilter
  const totalFiltered = filtered.reduce((sum, cs) => sum + cs.amount, 0)

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Calculate days overdue
  function getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-lg font-bold text-[#7A3E2E]">Credit Sales</h1>
      </div>

      {error && <div className="text-sm text-[#C05050]">{error}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer or notes…" />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <FilterSelect 
          value={statusFilter} 
          onChange={setStatusFilter} 
          placeholder="All Statuses"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Partially Paid', value: 'partially_paid' },
          ]} 
        />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setDateRange({ from: null, to: null }); setStatusFilter('') }}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline">Clear filters</button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#B89080]">
            {filtered.length} credit sales · {formatCurrency(totalFiltered)}
          </span>
        </div>
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
            title={hasFilters ? 'No credit sales match your filters' : 'No credit sales yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Credit sales will appear here when customers purchase on credit.'}
          />
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F2C4B0]">
                    <th className="w-8 py-3 px-4" />
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Customer</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Due Date</th>
                    <th className="text-left py-3 px-4 text-[#B89080] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(creditSale => {
                    const isExpanded = expandedId === creditSale.id
                    const isOverdue = creditSale.status === 'overdue'
                    const daysOverdue = isOverdue ? getDaysOverdue(creditSale.due_date) : 0

                    return (
                      <React.Fragment key={creditSale.id}>
                        <tr
                          className={`border-b border-[#FDE8DF] hover:bg-[#FDF6F0] cursor-pointer ${isExpanded ? 'bg-[#FDF6F0]' : ''} ${isOverdue ? 'bg-[#FDECEA]' : ''}`}
                          onClick={() => toggleExpand(creditSale.id)}>
                          <td className="py-3 px-4 text-[#B89080]">
                            {isExpanded
                              ? <ChevronUp className="w-3.5 h-3.5" />
                              : <ChevronDown className="w-3.5 h-3.5" />}
                          </td>
                          <td className="py-3 px-4 text-[#B89080] text-xs">{formatDate(creditSale.created_at)}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-[#7A3E2E] font-medium">{creditSale.customers?.name ?? '—'}</span>
                              {creditSale.customers?.business_name && (
                                <span className="text-xs text-[#B89080]">{creditSale.customers.business_name}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-[#7A3E2E]">{formatCurrency(creditSale.amount)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className={`text-xs ${isOverdue ? 'text-[#C05050] font-medium' : 'text-[#7A3E2E]'}`}>
                                {formatDate(creditSale.due_date)}
                              </span>
                              {isOverdue && daysOverdue > 0 && (
                                <span className="text-xs text-[#C05050]">
                                  {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={creditSale.status} />
                          </td>
                        </tr>
                        {isExpanded && <CreditSaleExpandedRow creditSale={creditSale} />}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="lg:hidden space-y-3 p-4">
              {paginated.map(creditSale => {
                const isExpanded = expandedId === creditSale.id
                const isOverdue = creditSale.status === 'overdue'
                const daysOverdue = isOverdue ? getDaysOverdue(creditSale.due_date) : 0

                return (
                  <div 
                    key={creditSale.id} 
                    className={`border border-[#F2C4B0] rounded-lg bg-white ${isOverdue ? 'bg-[#FDECEA]' : ''}`}
                  >
                    <div 
                      className="p-3 cursor-pointer"
                      onClick={() => toggleExpand(creditSale.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-[#7A3E2E] text-sm truncate">
                              {creditSale.customers?.name ?? '—'}
                            </h3>
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-[#B89080] shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-[#B89080] shrink-0" />}
                          </div>
                          {creditSale.customers?.business_name && (
                            <p className="text-xs text-[#B89080]">{creditSale.customers.business_name}</p>
                          )}
                          <p className="text-xs text-[#B89080] mt-1">{formatDate(creditSale.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[#7A3E2E] text-sm">{formatCurrency(creditSale.amount)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs ${isOverdue ? 'text-[#C05050] font-medium' : 'text-[#B89080]'}`}>
                            Due: {formatDate(creditSale.due_date)}
                          </span>
                          {isOverdue && daysOverdue > 0 && (
                            <span className="text-xs text-[#C05050]">
                              {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                            </span>
                          )}
                        </div>
                        <StatusBadge status={creditSale.status} />
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-[#F2C4B0] p-3 bg-[#FDF6F0]">
                        <p className="text-xs font-medium text-[#7A3E2E] mb-2">Credit Sale Details</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#B89080]">Amount:</span>
                            <span className="text-[#7A3E2E] font-medium">{formatCurrency(creditSale.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#B89080]">Due Date:</span>
                            <span className="text-[#7A3E2E] font-medium">{formatDate(creditSale.due_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#B89080]">Status:</span>
                            <StatusBadge status={creditSale.status} />
                          </div>
                        </div>
                        {creditSale.notes && (
                          <p className="text-xs text-[#B89080] mt-2">Note: {creditSale.notes}</p>
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
    </div>
  )
}
