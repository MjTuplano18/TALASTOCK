'use client'

import { useState, useEffect } from 'react'
import { Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useSales } from '@/hooks/useSales'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { SearchInput } from '@/components/shared/SearchInput'
import { HighlightText } from '@/components/shared/HighlightText'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { useDateRangeQuery } from '@/context/DateRangeContext'
import { formatCurrency, cn } from '@/lib/utils'
import { TransactionDetailsDrawer } from '@/components/transactions/TransactionDetailsDrawer'
import { ExportDropdown } from '@/components/shared/ExportDropdown'
import { exportTransactionsExcel, exportTransactionsCSV } from '@/lib/export-transactions'
import type { Sale } from '@/types'

const ITEMS_PER_PAGE = 20

export default function TransactionsPage() {
  const { startDate, endDate } = useDateRangeQuery()
  const { sales, loading } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter sales by date range and search query
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at)
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const inDateRange = saleDate >= start && saleDate <= end
    
    if (!inDateRange) return false
    
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    const matchesId = sale.id.toLowerCase().includes(query)
    const matchesAmount = sale.total_amount.toString().includes(query)
    const matchesProduct = sale.sale_items?.some(item => 
      item.products?.name.toLowerCase().includes(query)
    )
    
    return matchesId || matchesAmount || matchesProduct
  })

  // Calculate summary stats
  const totalTransactions = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedSales = filteredSales.slice(startIndex, endIndex)

  function handleViewDetails(sale: Sale) {
    setSelectedTransaction(sale)
    setDrawerOpen(true)
  }

  function handleExportExcel() {
    exportTransactionsExcel(filteredSales, startDate, endDate)
  }

  function handleExportCSV() {
    exportTransactionsCSV(filteredSales, startDate, endDate)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#7A3E2E]">Transactions</h1>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
          <p className="text-xs text-[#B89080] mb-1">Total Transactions</p>
          <p className="text-2xl font-medium text-[#7A3E2E]">{mounted ? totalTransactions : 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
          <p className="text-xs text-[#B89080] mb-1">Total Revenue</p>
          <p className="text-2xl font-medium text-[#7A3E2E]">{mounted ? formatCurrency(totalRevenue) : formatCurrency(0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
          <p className="text-xs text-[#B89080] mb-1">Avg Transaction Value</p>
          <p className="text-2xl font-medium text-[#7A3E2E]">{mounted ? formatCurrency(avgTransactionValue) : formatCurrency(0)}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
        {/* Search */}
        <SearchInput 
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value)
            setCurrentPage(1) // Reset to first page on search
          }}
          placeholder="Search by transaction ID, product, or amount..."
        />

        {/* Date Filter and Export - Right side */}
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          {/* Date Filter */}
          <DateRangeFilter />

          {/* Export Dropdown */}
          {mounted && (
            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              disabled={filteredSales.length === 0}
              itemCount={filteredSales.length}
              isFiltered={!!searchQuery}
            />
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#B89080] mt-2">Loading transactions...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-[#E8896A]" />
            </div>
            <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">No transactions found</h3>
            <p className="text-xs text-[#B89080]">
              {searchQuery ? 'Try adjusting your search or filters' : 'No transactions in this date range'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F2C4B0] bg-[#FDF6F0]">
                    <th className="text-left py-3 px-4 font-medium text-[#B89080]">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-medium text-[#B89080]">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-[#B89080]">Items</th>
                    <th className="text-right py-3 px-4 font-medium text-[#B89080]">Total Amount</th>
                    <th className="text-center py-3 px-4 font-medium text-[#B89080]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale) => {
                    const itemCount = sale.sale_items?.length ?? 0
                    const firstProduct = sale.sale_items?.[0]?.products?.name ?? 'Unknown'
                    const moreItems = itemCount > 1 ? ` +${itemCount - 1} more` : ''
                    
                    return (
                      <tr key={sale.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0] transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-[#7A3E2E]">
                            #{sale.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <RelativeTime date={sale.created_at} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-[#7A3E2E]">
                            <HighlightText text={`${firstProduct}${moreItems}`} highlight={searchQuery} />
                          </div>
                          <div className="text-xs text-[#B89080]">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-medium text-[#7A3E2E]">
                            {formatCurrency(sale.total_amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewDetails(sale)}
                              className="p-1.5 rounded-lg hover:bg-[#FDE8DF] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-[#7A3E2E]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#FDE8DF]">
              {paginatedSales.map((sale) => {
                const itemCount = sale.sale_items?.length ?? 0
                const firstProduct = sale.sale_items?.[0]?.products?.name ?? 'Unknown'
                const moreItems = itemCount > 1 ? ` +${itemCount - 1} more` : ''
                
                return (
                  <div key={sale.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-medium text-[#7A3E2E]">
                          #{sale.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-[#B89080] mt-0.5">
                          <RelativeTime date={sale.created_at} />
                        </p>
                      </div>
                      <span className="text-sm font-medium text-[#7A3E2E]">
                        {formatCurrency(sale.total_amount)}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A3E2E] mb-2">
                      <HighlightText text={`${firstProduct}${moreItems}`} highlight={searchQuery} />
                    </p>
                    <button
                      onClick={() => handleViewDetails(sale)}
                      className="text-xs text-[#E8896A] hover:text-[#C1614A] font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F2C4B0]">
                <p className="text-xs text-[#B89080]">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredSales.length)} of {filteredSales.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#7A3E2E]" />
                  </button>
                  <span className="text-xs text-[#7A3E2E] px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-[#FDE8DF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-[#7A3E2E]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        sale={selectedTransaction}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedTransaction(null)
        }}
      />
    </div>
  )
}
