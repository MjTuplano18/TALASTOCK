'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Wallet, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'
import { RecordPaymentTrigger } from '@/components/credit/RecordPaymentTrigger'

interface OverdueCustomer {
  id: string
  name: string
  overdue_amount: number
  days_overdue: number
  contact_number?: string
}

export function OverdueCustomersTable() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<OverdueCustomer[]>([])
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    fetchOverdueCustomers()
  }, [])

  async function fetchOverdueCustomers() {
    setLoading(true)
    try {
      const response = await apiFetch('/api/v1/customers/overdue')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data || [])
      } else {
        setCustomers([])
      }
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  function openPayment(customerId: string) {
    setPaymentCustomerId(customerId)
    setPaymentOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#FDF6F0] rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#E8896A]" />
        </div>
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">No Overdue Customers</h3>
        <p className="text-xs text-[#B89080]">All customers are up to date with their payments</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F2C4B0]">
              <th className="text-left py-3 text-[#B89080] font-medium">Customer</th>
              <th className="text-right py-3 text-[#B89080] font-medium">Overdue Amount</th>
              <th className="text-center py-3 text-[#B89080] font-medium">Days Overdue</th>
              <th className="text-right py-3 text-[#B89080] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0] transition-colors"
              >
                <td className="py-3">
                  <div className="flex flex-col">
                    <span className="text-[#7A3E2E] font-medium">{customer.name}</span>
                    {customer.contact_number && (
                      <span className="text-xs text-[#B89080]">{customer.contact_number}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-[#C05050] font-medium">
                    {formatCurrency(customer.overdue_amount)}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      customer.days_overdue > 30
                        ? 'bg-[#FDECEA] text-[#C05050]'
                        : customer.days_overdue > 15
                        ? 'bg-[#FDE8DF] text-[#C1614A]'
                        : 'bg-[#FDF6F0] text-[#B89080]'
                    }`}
                  >
                    {customer.days_overdue} {customer.days_overdue === 1 ? 'day' : 'days'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[#7A3E2E] hover:bg-[#FDE8DF] rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => openPayment(customer.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded transition-colors"
                      title="Record Payment"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pay</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RecordPaymentTrigger
        customerId={paymentCustomerId}
        open={paymentOpen}
        onOpenChange={(open) => {
          setPaymentOpen(open)
          if (!open) setPaymentCustomerId(null)
        }}
        onSuccess={fetchOverdueCustomers}
      />
    </>
  )
}
