'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
import { CustomersTable } from '@/components/tables/CustomersTable'
import { CustomersTableMobile } from '@/components/tables/CustomersTableMobile'
import { AddCustomerModal } from '@/components/customers/AddCustomerModal'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { FilterSelect } from '@/components/shared/FilterSelect'
import { Pagination } from '@/components/shared/Pagination'
import { useCustomers } from '@/hooks/useCustomers'
import { useDebounce } from '@/hooks/useDebounce'
import { useRouter } from 'next/navigation'
import type { Customer, CustomerCreate, CustomerUpdate } from '@/types'

const PAGE_SIZE = 15

export default function CustomersPage() {
  const router = useRouter()
  const { allCustomers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()

  const [mounted, setMounted] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debounce search to reduce re-renders (300ms delay)
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    setPage(1)
    return allCustomers.filter((c) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !(c.contact_number?.toLowerCase().includes(q)) &&
          !(c.business_name?.toLowerCase().includes(q))
        ) {
          return false
        }
      }
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'inactive' && c.is_active) return false
      return true
    })
  }, [allCustomers, debouncedSearch, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || statusFilter

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
  }

  async function handleSubmit(data: CustomerCreate | CustomerUpdate) {
    setFormLoading(true)
    if (editTarget) {
      await updateCustomer(editTarget.id, data as CustomerUpdate)
    } else {
      await createCustomer(data as CustomerCreate)
    }
    setFormLoading(false)
  }

  function openEdit(customer: Customer) {
    setEditTarget(customer)
    setFormOpen(true)
  }

  function handleRowClick(customer: Customer) {
    router.push(`/customers/${customer.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-lg font-bold text-[#7A3E2E]">Customers</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, contact, or business…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#B89080] hover:text-[#7A3E2E] underline"
          >
            Clear filters
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#B89080]" suppressHydrationWarning>
            {filtered.length} of {allCustomers.length} customers
          </span>
          <button
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {!mounted || loading ? (
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  {[
                    'Customer Name',
                    'Contact',
                    'Business',
                    'Balance',
                    'Credit Limit',
                    'Available',
                    'Terms',
                    'Status',
                    '',
                  ].map((h, i) => (
                    <th key={i} className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableSkeleton rows={PAGE_SIZE} cols={9} />
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No customers match your filters' : 'No customers yet'}
            description={
              hasFilters
                ? 'Try adjusting your filters.'
                : 'Add your first customer to start tracking credit accounts.'
            }
            action={
              !hasFilters ? (
                <button
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#E8896A] hover:bg-[#C1614A] text-white text-xs transition-colors"
                  onClick={() => {
                    setEditTarget(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Customer
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden md:block">
              <CustomersTable
                customers={paginated}
                onEdit={openEdit}
                onDelete={deleteCustomer}
                onRowClick={handleRowClick}
              />
            </div>

            {/* Mobile card view */}
            <div className="md:hidden">
              <CustomersTableMobile
                customers={paginated}
                onEdit={openEdit}
                onDelete={deleteCustomer}
                onRowClick={handleRowClick}
              />
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AddCustomerModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditTarget(null)
        }}
        customer={editTarget}
        onSubmit={handleSubmit}
        loading={formLoading}
      />
    </div>
  )
}
