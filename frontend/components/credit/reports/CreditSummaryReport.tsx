'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, formatCurrencyForPDF, formatDate } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CustomerSummary {
  id: string
  name: string
  contact_number?: string
  current_balance: number
  credit_limit: number
  available_credit: number
  overdue_balance: number
  is_overdue: boolean
  last_payment_date?: string
  payment_terms_days: number
}

export function CreditSummaryReport() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCreditSummary()
  }, [])

  async function fetchCreditSummary() {
    setLoading(true)
    try {
      const response = await apiFetch('/api/v1/reports/credit-summary?per_page=100')
      if (!response.ok) throw new Error('Failed to fetch credit summary')
      const result = await response.json()
      // Backend returns { success, data: [...], meta }
      const list: any[] = Array.isArray(result) ? result : (result.data ?? [])

      const summaries: CustomerSummary[] = list.map((item: any) => ({
        id: item.customer_id ?? item.id,
        name: item.name,
        contact_number: item.contact_number,
        current_balance: item.current_balance ?? 0,
        credit_limit: item.credit_limit ?? 0,
        available_credit: item.available_credit ?? Math.max(0, (item.credit_limit ?? 0) - (item.current_balance ?? 0)),
        overdue_balance: item.overdue_amount ?? item.overdue_balance ?? 0,
        is_overdue: (item.overdue_amount ?? item.overdue_balance ?? 0) > 0,
        last_payment_date: item.last_payment_date,
        payment_terms_days: item.payment_terms_days ?? 30,
      }))

      setCustomers(summaries)
    } catch (error) {
      toast.error('Failed to load credit summary')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Status filter
      if (statusFilter === 'active' && customer.current_balance === 0) return false
      if (statusFilter === 'overdue' && !customer.is_overdue) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return customer.name.toLowerCase().includes(query) ||
               customer.contact_number?.toLowerCase().includes(query)
      }
      
      return true
    })
  }, [customers, statusFilter, searchQuery])

  const totalOutstanding = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => sum + c.current_balance, 0)
  }, [filteredCustomers])

  const totalOverdue = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => sum + c.overdue_balance, 0)
  }, [filteredCustomers])

  const totalCreditLimit = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => sum + c.credit_limit, 0)
  }, [filteredCustomers])

  const overdueCount = useMemo(() => {
    return filteredCustomers.filter(c => c.is_overdue).length
  }, [filteredCustomers])

  async function handleExportPDF() {
    if (filteredCustomers.length === 0) {
      toast.error('No data to export')
      return
    }

    setExporting(true)
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(18)
      doc.setTextColor(122, 62, 46) // ts-text
      doc.text('Talastock', 14, 20)
      
      doc.setFontSize(14)
      doc.text('Credit Summary Report', 14, 30)
      
      // Report date
      doc.setFontSize(10)
      doc.setTextColor(120, 120, 120)
      doc.text(`Generated: ${formatDate(new Date())}`, 14, 40)
      
      // Summary
      doc.setFontSize(11)
      doc.setTextColor(122, 62, 46)
      doc.text('Summary', 14, 52)
      
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(`Total Customers: ${filteredCustomers.length}`, 14, 60)
      doc.text(`Total Outstanding: ${formatCurrencyForPDF(totalOutstanding)}`, 14, 66)
      doc.text(`Total Overdue: ${formatCurrencyForPDF(totalOverdue)}`, 14, 72)
      doc.text(`Total Credit Limit: ${formatCurrencyForPDF(totalCreditLimit)}`, 14, 78)
      
      // Customer table
      autoTable(doc, {
        startY: 86,
        head: [['Customer', 'Balance', 'Credit Limit', 'Available', 'Overdue', 'Status']],
        body: filteredCustomers.map(c => [
          c.name,
          formatCurrencyForPDF(c.current_balance),
          formatCurrencyForPDF(c.credit_limit),
          formatCurrencyForPDF(c.available_credit),
          formatCurrencyForPDF(c.overdue_balance),
          c.is_overdue ? 'OVERDUE' : c.current_balance > 0 ? 'Active' : 'Clear'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [232, 137, 106], textColor: 255 }, // ts-accent
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 20, halign: 'center' }
        }
      })
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(184, 144, 128) // ts-muted
        doc.text(
          `Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`,
          14,
          doc.internal.pageSize.height - 10
        )
      }
      
      doc.save(`credit-summary-${Date.now()}.pdf`)
      toast.success('Credit summary exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FDE8DF] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-[#E8896A]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#7A3E2E]">Credit Summary</h3>
              <p className="text-xs text-[#B89080] leading-relaxed">
                Overview of all customers with credit accounts
              </p>
            </div>
          </div>
          
          {filteredCustomers.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating...' : 'Export PDF'}
            </button>
          )}
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Customers</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{filteredCustomers.length}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Outstanding</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="bg-[#FDECEA] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Overdue</p>
            <p className="text-lg font-medium text-[#C05050]">{formatCurrency(totalOverdue)}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Credit Limit</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{formatCurrency(totalCreditLimit)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-[#F2C4B0] flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] text-[#7A3E2E]"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#E8896A] text-white'
                  : 'bg-[#FDF6F0] text-[#7A3E2E] hover:bg-[#FDE8DF]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[#E8896A] text-white'
                  : 'bg-[#FDF6F0] text-[#7A3E2E] hover:bg-[#FDE8DF]'
              }`}
            >
              Active Balance
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'overdue'
                  ? 'bg-[#E8896A] text-white'
                  : 'bg-[#FDF6F0] text-[#7A3E2E] hover:bg-[#FDE8DF]'
              }`}
            >
              Overdue ({overdueCount})
            </button>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#B89080] mt-3">Loading credit summary...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-[#E8896A]" />
          </div>
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">No Customers Found</h3>
          <p className="text-xs text-[#B89080]">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No customers with credit accounts yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0] bg-[#FDF6F0]">
                  <th className="text-left py-3 px-4 text-[#B89080] font-medium">Customer</th>
                  <th className="text-right py-3 px-4 text-[#B89080] font-medium">Balance</th>
                  <th className="text-right py-3 px-4 text-[#B89080] font-medium">Credit Limit</th>
                  <th className="text-right py-3 px-4 text-[#B89080] font-medium">Available</th>
                  <th className="text-right py-3 px-4 text-[#B89080] font-medium">Overdue</th>
                  <th className="text-center py-3 px-4 text-[#B89080] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const utilizationPercent = customer.credit_limit > 0
                    ? (customer.current_balance / customer.credit_limit) * 100
                    : 0
                  const isNearLimit = utilizationPercent > 80
                  
                  return (
                    <tr key={customer.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-[#7A3E2E] font-medium">{customer.name}</p>
                          {customer.contact_number && (
                            <p className="text-xs text-[#B89080]">{customer.contact_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className={`font-medium ${
                          customer.current_balance > 0 ? 'text-[#7A3E2E]' : 'text-[#B89080]'
                        }`}>
                          {formatCurrency(customer.current_balance)}
                        </p>
                        {isNearLimit && (
                          <p className="text-xs text-[#C05050]">{utilizationPercent.toFixed(0)}% used</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-[#7A3E2E]">
                        {formatCurrency(customer.credit_limit)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#7A3E2E]">
                        {formatCurrency(customer.available_credit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className={customer.overdue_balance > 0 ? 'text-[#C05050] font-medium' : 'text-[#B89080]'}>
                          {customer.overdue_balance > 0 ? formatCurrency(customer.overdue_balance) : '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {customer.is_overdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-[#FDECEA] text-[#C05050]">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : customer.current_balance > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-[#FDE8DF] text-[#C1614A]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-[#E8F5E9] text-[#4A9D5F]">
                            <CheckCircle className="w-3 h-3" />
                            Clear
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-[#FDF6F0] rounded-xl border border-[#F2C4B0] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#F2C4B0] flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-medium text-[#7A3E2E] mb-2">About Credit Summary</h3>
            <p className="text-xs text-[#B89080] leading-relaxed">
              This report provides a comprehensive overview of all customers with credit accounts. 
              Use it to monitor credit utilization, identify high-risk accounts, and track overall credit exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
