'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, FileText, User } from 'lucide-react'
import { DateRangePicker, type DateRange } from '@/components/shared/DateRangePicker'
import { formatCurrency, formatDate } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Customer {
  id: string
  name: string
  contact_number?: string
  current_balance: number
  credit_limit: number
}

interface Transaction {
  id: string
  date: string
  type: 'credit_sale' | 'payment'
  description: string
  debit: number
  credit: number
  balance: number
}

export function CustomerStatementReport() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers()
  }, [])

  // Fetch statement when customer or date range changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchStatement()
    }
  }, [selectedCustomerId, dateRange])

  async function fetchCustomers() {
    try {
      const response = await apiFetch('/api/v1/customers/?per_page=100')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const result = await response.json()
      // Backend returns { success, data: [...], meta }
      const list = Array.isArray(result) ? result : (result.data ?? [])
      setCustomers(list)
    } catch (error) {
      toast.error('Failed to load customers')
      console.error(error)
    }
  }

  async function fetchStatement() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('start_date', dateRange.from.toISOString().split('T')[0])
      if (dateRange.to) params.append('end_date', dateRange.to.toISOString().split('T')[0])

      const response = await apiFetch(`/api/v1/customers/${selectedCustomerId}/statement?${params}`)
      if (!response.ok) throw new Error('Failed to fetch statement')
      const result = await response.json()
      // Backend returns { success, data: { customer, transactions, ... } }
      const data = result.data ?? result

      const txns: Transaction[] = []
      let runningBalance = 0

      const allTxns = [
        ...(data.transactions ?? []).filter((t: any) => t.type === 'credit_sale'),
        ...(data.transactions ?? []).filter((t: any) => t.type === 'payment'),
      ]

      // Use pre-sorted transactions array from backend if available
      const sorted = (data.transactions ?? []).sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      sorted.forEach((txn: any) => {
        if (txn.type === 'credit_sale') {
          runningBalance += txn.debit ?? txn.amount ?? 0
          txns.push({
            id: txn.id,
            date: txn.date ?? txn.created_at,
            type: 'credit_sale',
            description: txn.description ?? `Credit Sale`,
            debit: txn.debit ?? txn.amount ?? 0,
            credit: 0,
            balance: runningBalance,
          })
        } else {
          runningBalance -= txn.credit ?? txn.amount ?? 0
          txns.push({
            id: txn.id,
            date: txn.date ?? txn.payment_date ?? txn.created_at,
            type: 'payment',
            description: txn.description ?? `Payment`,
            debit: 0,
            credit: txn.credit ?? txn.amount ?? 0,
            balance: runningBalance,
          })
        }
      })

      setTransactions(txns)
    } catch (error) {
      toast.error('Failed to load statement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId)
  }, [customers, selectedCustomerId])

  const totalDebits = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.debit, 0)
  }, [transactions])

  const totalCredits = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.credit, 0)
  }, [transactions])

  const currentBalance = useMemo(() => {
    return transactions.length > 0 ? transactions[transactions.length - 1].balance : 0
  }, [transactions])

  async function handleExportPDF() {
    if (!selectedCustomer || transactions.length === 0) {
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
      doc.text('Customer Statement', 14, 30)
      
      // Customer info
      doc.setFontSize(10)
      doc.setTextColor(120, 120, 120)
      doc.text(`Customer: ${selectedCustomer.name}`, 14, 40)
      if (selectedCustomer.contact_number) {
        doc.text(`Contact: ${selectedCustomer.contact_number}`, 14, 46)
      }
      doc.text(`Credit Limit: ${formatCurrency(selectedCustomer.credit_limit)}`, 14, 52)
      doc.text(`Current Balance: ${formatCurrency(currentBalance)}`, 14, 58)
      
      // Date range
      if (dateRange.from) {
        doc.text(
          `Period: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to || new Date())}`,
          14,
          64
        )
      }
      
      // Transactions table
      autoTable(doc, {
        startY: 72,
        head: [['Date', 'Description', 'Debit', 'Credit', 'Balance']],
        body: transactions.map(t => [
          formatDate(new Date(t.date)),
          t.description,
          t.debit > 0 ? formatCurrency(t.debit) : '-',
          t.credit > 0 ? formatCurrency(t.credit) : '-',
          formatCurrency(t.balance)
        ]),
        foot: [['', 'Total', formatCurrency(totalDebits), formatCurrency(totalCredits), formatCurrency(currentBalance)]],
        theme: 'striped',
        headStyles: { fillColor: [232, 137, 106], textColor: 255 }, // ts-accent
        footStyles: { fillColor: [253, 232, 223], textColor: [122, 62, 46], fontStyle: 'bold' }, // ts-soft, ts-text
        styles: { fontSize: 9, cellPadding: 3 }
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
      
      doc.save(`customer-statement-${selectedCustomer.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`)
      toast.success('Statement exported successfully')
    } catch (error) {
      toast.error('Failed to export statement')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#FDE8DF] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-[#7A3E2E]">Customer Statement</h3>
            <p className="text-xs text-[#B89080] leading-relaxed">
              View detailed transaction history for a specific customer
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#B89080] mb-1.5 block">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#F2C4B0] rounded-lg focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A] text-[#7A3E2E]"
            >
              <option value="">Select a customer</option>
              {customers.map(c => {
                // Format: "Name — ₱X,XXX"
                // Keep it concise to prevent overflow
                const displayText = `${c.name} — ${formatCurrency(c.current_balance)}`
                return (
                  <option key={c.id} value={c.id}>
                    {displayText}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#B89080] mb-1.5 block">Date Range</label>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Export Button */}
        {selectedCustomerId && transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#F2C4B0]">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating PDF...' : 'Export PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Customer Info Card */}
      {selectedCustomer && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#E8896A]" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[#7A3E2E]">{selectedCustomer.name}</h4>
              {selectedCustomer.contact_number && (
                <p className="text-xs text-[#B89080]">{selectedCustomer.contact_number}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
              <p className="text-xs text-[#B89080] mb-1">Credit Limit</p>
              <p className="text-sm font-medium text-[#7A3E2E]">
                {formatCurrency(selectedCustomer.credit_limit)}
              </p>
            </div>
            <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
              <p className="text-xs text-[#B89080] mb-1">Current Balance</p>
              <p className={`text-sm font-medium ${currentBalance > 0 ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
              <p className="text-xs text-[#B89080] mb-1">Available Credit</p>
              <p className="text-sm font-medium text-[#7A3E2E]">
                {formatCurrency(Math.max(0, selectedCustomer.credit_limit - currentBalance))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {selectedCustomerId && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#B89080] mt-3">Loading statement...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-[#E8896A]" />
              </div>
              <p className="text-sm font-medium text-[#7A3E2E] mb-1">No transactions found</p>
              <p className="text-xs text-[#B89080]">
                {dateRange.from ? 'Try adjusting the date range' : 'No transactions for this customer'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F2C4B0] bg-[#FDF6F0]">
                      <th className="text-left py-3 px-4 text-[#B89080] font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-[#B89080] font-medium">Description</th>
                      <th className="text-right py-3 px-4 text-[#B89080] font-medium">Debit</th>
                      <th className="text-right py-3 px-4 text-[#B89080] font-medium">Credit</th>
                      <th className="text-right py-3 px-4 text-[#B89080] font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                        <td className="py-3 px-4 text-[#7A3E2E]">{formatDate(new Date(txn.date))}</td>
                        <td className="py-3 px-4 text-[#7A3E2E]">{txn.description}</td>
                        <td className="py-3 px-4 text-right text-[#C05050]">
                          {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-[#4A9D5F]">
                          {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#7A3E2E]">
                          {formatCurrency(txn.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#F2C4B0] bg-[#FDE8DF]">
                      <td colSpan={2} className="py-3 px-4 text-[#7A3E2E] font-medium">Total</td>
                      <td className="py-3 px-4 text-right font-medium text-[#C05050]">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#4A9D5F]">
                        {formatCurrency(totalCredits)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#7A3E2E]">
                        {formatCurrency(currentBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedCustomerId && (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-[#E8896A]" />
          </div>
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">Select a Customer</h3>
          <p className="text-xs text-[#B89080]">Choose a customer to view their statement</p>
        </div>
      )}
    </div>
  )
}
