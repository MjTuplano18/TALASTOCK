'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, Clock, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatCurrencyForPDF, formatDate } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AgingBucket {
  label: string
  days: string
  customer_count: number
  total_amount: number
  customers: {
    id: string
    name: string
    amount: number
    oldest_invoice_date: string
  }[]
}

export function AgingReport() {
  const [agingData, setAgingData] = useState<AgingBucket[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null)

  useEffect(() => {
    fetchAgingReport()
  }, [])

  async function fetchAgingReport() {
    setLoading(true)
    try {
      const response = await apiFetch('/api/v1/reports/aging')
      if (!response.ok) throw new Error('Failed to fetch aging report')
      const result = await response.json()
      // Backend returns { success, data: { aging_buckets: [...], summary: {...} } }
      const agingBuckets: any[] = result.data?.aging_buckets ?? []

      // Map backend bucket labels to frontend structure
      const labelMap: Record<string, { label: string; days: string }> = {
        '0-7 days':   { label: 'Current',   days: '0-7 days' },
        '8-15 days':  { label: '8-15 Days', days: '8-15 days' },
        '16-30 days': { label: '16-30 Days', days: '16-30 days' },
        '31-60 days': { label: '31-60 Days', days: '31-60 days' },
        '60+ days':   { label: '60+ Days',  days: 'Over 60 days' },
      }

      const buckets: AgingBucket[] = agingBuckets.map((b: any) => {
        const meta = labelMap[b.bucket] ?? { label: b.bucket, days: b.bucket }
        // Group invoices by customer
        const customerMap = new Map<string, { id: string; name: string; amount: number; oldest_invoice_date: string }>()
        for (const inv of (b.invoices ?? [])) {
          const existing = customerMap.get(inv.customer_id)
          if (!existing) {
            customerMap.set(inv.customer_id, {
              id: inv.customer_id,
              name: inv.customer_name,
              amount: inv.amount,
              oldest_invoice_date: inv.due_date,
            })
          } else {
            existing.amount += inv.amount
            if (inv.due_date < existing.oldest_invoice_date) {
              existing.oldest_invoice_date = inv.due_date
            }
          }
        }
        return {
          label: meta.label,
          days: meta.days,
          customer_count: b.customer_count ?? 0,
          total_amount: b.total_amount ?? 0,
          customers: Array.from(customerMap.values()),
        }
      })

      setAgingData(buckets)
    } catch (error) {
      toast.error('Failed to load aging report')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalCustomers = useMemo(() => {
    return agingData.reduce((sum, bucket) => sum + bucket.customer_count, 0)
  }, [agingData])

  const totalAmount = useMemo(() => {
    return agingData.reduce((sum, bucket) => sum + bucket.total_amount, 0)
  }, [agingData])

  const overdueAmount = useMemo(() => {
    // Sum of 8-15, 16-30, 31-60, 60+ buckets
    return agingData.slice(1).reduce((sum, bucket) => sum + bucket.total_amount, 0)
  }, [agingData])

  async function handleExportPDF() {
    if (agingData.length === 0) {
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
      doc.text('Accounts Receivable Aging Report', 14, 30)
      
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
      doc.text(`Total Customers with Balance: ${totalCustomers}`, 14, 60)
      doc.text(`Total Outstanding: ${formatCurrencyForPDF(totalAmount)}`, 14, 66)
      doc.text(`Total Overdue (8+ days): ${formatCurrencyForPDF(overdueAmount)}`, 14, 72)
      
      // Aging buckets table
      autoTable(doc, {
        startY: 80,
        head: [['Aging Period', 'Customers', 'Total Amount', '% of Total']],
        body: agingData.map(bucket => [
          bucket.days,
          bucket.customer_count.toString(),
          formatCurrencyForPDF(bucket.total_amount),
          totalAmount > 0 ? `${((bucket.total_amount / totalAmount) * 100).toFixed(1)}%` : '0%'
        ]),
        foot: [['Total', totalCustomers.toString(), formatCurrencyForPDF(totalAmount), '100%']],
        theme: 'striped',
        headStyles: { fillColor: [232, 137, 106], textColor: 255 }, // ts-accent
        footStyles: { fillColor: [253, 232, 223], textColor: [122, 62, 46], fontStyle: 'bold' }, // ts-soft, ts-text
        styles: { fontSize: 9, cellPadding: 3 }
      })
      
      // Customer details for each bucket
      let currentY = (doc as any).lastAutoTable.finalY + 10
      
      agingData.forEach((bucket) => {
        if (bucket.customers.length > 0) {
          // Check if we need a new page
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }
          
          doc.setFontSize(11)
          doc.setTextColor(122, 62, 46)
          doc.text(`${bucket.label} (${bucket.days})`, 14, currentY)
          currentY += 8
          
          autoTable(doc, {
            startY: currentY,
            head: [['Customer', 'Amount', 'Oldest Invoice']],
            body: bucket.customers.map(c => [
              c.name,
              formatCurrencyForPDF(c.amount),
              formatDate(new Date(c.oldest_invoice_date))
            ]),
            theme: 'plain',
            headStyles: { fillColor: [253, 232, 223], textColor: [122, 62, 46] }, // ts-soft, ts-text
            styles: { fontSize: 8, cellPadding: 2 }
          })
          
          currentY = (doc as any).lastAutoTable.finalY + 10
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
      
      doc.save(`aging-report-${Date.now()}.pdf`)
      toast.success('Aging report exported successfully')
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
              <Clock className="w-4 h-4 text-[#E8896A]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#7A3E2E]">Aging Report</h3>
              <p className="text-xs text-[#B89080] leading-relaxed">
                Accounts receivable aging analysis by time period
              </p>
            </div>
          </div>
          
          {agingData.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating...' : 'Export (PDF)'}
            </button>
          )}
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Customers</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{totalCustomers}</p>
          </div>
          <div className="bg-[#FDF6F0] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Total Outstanding</p>
            <p className="text-lg font-medium text-[#7A3E2E]">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-[#FDECEA] rounded-lg p-3 text-center">
            <p className="text-xs text-[#B89080] mb-1">Overdue (8+ days)</p>
            <p className="text-lg font-medium text-[#C05050]">{formatCurrency(overdueAmount)}</p>
          </div>
        </div>
      </div>

      {/* Aging Buckets */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#B89080] mt-3">Loading aging report...</p>
        </div>
      ) : agingData.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[#E8896A]" />
          </div>
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">No Data Available</h3>
          <p className="text-xs text-[#B89080]">No outstanding balances to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agingData.map((bucket, index) => {
            const isExpanded = expandedBucket === bucket.label
            const isOverdue = index > 0 // All buckets except "Current" are overdue
            
            return (
              <div
                key={bucket.label}
                className={`bg-white rounded-xl border transition-colors ${
                  isOverdue && bucket.total_amount > 0
                    ? 'border-[#FDECEA]'
                    : 'border-[#F2C4B0]'
                }`}
              >
                {/* Bucket Header */}
                <button
                  onClick={() => setExpandedBucket(isExpanded ? null : bucket.label)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#FDF6F0] transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isOverdue && bucket.total_amount > 0
                        ? 'bg-[#FDECEA]'
                        : 'bg-[#FDE8DF]'
                    }`}>
                      {isOverdue && bucket.total_amount > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-[#C05050]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#E8896A]" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-[#7A3E2E]">{bucket.label}</h4>
                      <p className="text-xs text-[#B89080]">{bucket.days}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[#B89080]">{bucket.customer_count} customers</p>
                      <p className={`text-sm font-medium ${
                        isOverdue && bucket.total_amount > 0
                          ? 'text-[#C05050]'
                          : 'text-[#7A3E2E]'
                      }`}>
                        {formatCurrency(bucket.total_amount)}
                      </p>
                    </div>
                    
                    {bucket.customers.length > 0 && (
                      <svg
                        className={`w-5 h-5 text-[#B89080] transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Customer Details */}
                {isExpanded && bucket.customers.length > 0 && (
                  <div className="border-t border-[#F2C4B0] p-4">
                    <div className="space-y-2">
                      {bucket.customers.map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-[#FDF6F0] rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#7A3E2E]">{customer.name}</p>
                            <p className="text-xs text-[#B89080]">
                              Oldest invoice: {formatDate(new Date(customer.oldest_invoice_date))}
                            </p>
                          </div>
                          <p className={`text-sm font-medium ${
                            isOverdue ? 'text-[#C05050]' : 'text-[#7A3E2E]'
                          }`}>
                            {formatCurrency(customer.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-[#FDF6F0] rounded-xl border border-[#F2C4B0] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#F2C4B0] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-[#E8896A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-medium text-[#7A3E2E] mb-2">About Aging Reports</h3>
            <p className="text-xs text-[#B89080] leading-relaxed">
              This report categorizes outstanding customer balances by how long they've been overdue. 
              Use this to identify customers who need payment reminders and prioritize collection efforts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
