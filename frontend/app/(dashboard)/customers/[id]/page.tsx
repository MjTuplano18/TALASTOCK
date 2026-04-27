'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Wallet, AlertCircle, CreditCard, Calendar, Phone, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddCustomerModal } from '@/components/customers/AddCustomerModal'
import { RecordPaymentModal } from '@/components/customers/RecordPaymentModal'
import { getCustomer, getCreditSales, getPayments } from '@/lib/supabase-queries'
import { useCustomers } from '@/hooks/useCustomers'
import type { Customer, CustomerUpdate, CreditSale, Payment } from '@/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const { updateCustomer } = useCustomers()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [creditSales, setCreditSales] = useState<CreditSale[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [customerData, creditSalesData, paymentsData] = await Promise.all([
          getCustomer(customerId),
          getCreditSales(customerId),
          getPayments(customerId),
        ])
        setCustomer(customerData)
        setCreditSales(creditSalesData)
        setPayments(paymentsData)
      } catch (err) {
        toast.error('Failed to load customer details')
        router.push('/customers')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [customerId, router])

  async function handleUpdate(data: CustomerUpdate) {
    setFormLoading(true)
    const updated = await updateCustomer(customerId, data)
    if (updated) {
      setCustomer(updated)
    }
    setFormLoading(false)
  }

  async function handlePaymentSubmit(data: any) {
    setFormLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to record payment')
      }

      toast.success('Payment recorded successfully')
      
      // Refresh data
      const [customerData, creditSalesData, paymentsData] = await Promise.all([
        getCustomer(customerId),
        getCreditSales(customerId),
        getPayments(customerId),
      ])
      setCustomer(customerData)
      setCreditSales(creditSalesData)
      setPayments(paymentsData)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-[#FDE8DF] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-[#FDE8DF] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!customer) {
    return null
  }

  const availableCredit = customer.credit_limit - customer.current_balance
  const creditUtilization = customer.credit_limit > 0 ? (customer.current_balance / customer.credit_limit) * 100 : 0
  const isNearLimit = creditUtilization > 80
  const overdueAmount = creditSales
    .filter((cs) => cs.status === 'overdue')
    .reduce((sum, cs) => sum + cs.amount, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/customers')}
            className="p-2 hover:bg-[#FDE8DF] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#7A3E2E]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#7A3E2E]">{customer.name}</h1>
            {customer.business_name && (
              <p className="text-xs text-[#B89080]">{customer.business_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setEditOpen(true)}
            variant="outline"
            className="border-[#F2C4B0] text-[#7A3E2E] hover:bg-[#FDE8DF]"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            onClick={() => setPaymentOpen(true)}
            className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h2 className="text-sm font-medium text-[#7A3E2E] mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customer.contact_number && (
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-[#B89080] mt-0.5" />
              <div>
                <p className="text-xs text-[#B89080]">Contact</p>
                <p className="text-sm text-[#7A3E2E]">{customer.contact_number}</p>
              </div>
            </div>
          )}
          {customer.business_name && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-[#B89080] mt-0.5" />
              <div>
                <p className="text-xs text-[#B89080]">Business</p>
                <p className="text-sm text-[#7A3E2E]">{customer.business_name}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#B89080] mt-0.5" />
              <div>
                <p className="text-xs text-[#B89080]">Address</p>
                <p className="text-sm text-[#7A3E2E]">{customer.address}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#B89080] mt-0.5" />
            <div>
              <p className="text-xs text-[#B89080]">Payment Terms</p>
              <p className="text-sm text-[#7A3E2E]">{customer.payment_terms_days} days</p>
            </div>
          </div>
        </div>
        {customer.notes && (
          <div className="mt-4 pt-4 border-t border-[#FDE8DF]">
            <p className="text-xs text-[#B89080] mb-1">Notes</p>
            <p className="text-sm text-[#7A3E2E]">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
          <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
            <CreditCard className="w-4 h-4 text-[#E8896A]" />
          </div>
          <p className="text-xs text-[#B89080] mb-1">Current Balance</p>
          <p className={`text-2xl font-medium ${customer.current_balance > 0 ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
            ₱{customer.current_balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#B89080] mt-1">
            of ₱{customer.credit_limit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} limit
          </p>
        </div>

        {/* Available Credit */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
          <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
            <Wallet className="w-4 h-4 text-[#E8896A]" />
          </div>
          <p className="text-xs text-[#B89080] mb-1">Available Credit</p>
          <p className={`text-2xl font-medium ${isNearLimit ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
            ₱{availableCredit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#B89080] mt-1">
            {creditUtilization.toFixed(0)}% utilized
          </p>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
          <div className="w-8 h-8 rounded-lg bg-[#FDECEA] flex items-center justify-center mb-3">
            <AlertCircle className="w-4 h-4 text-[#C05050]" />
          </div>
          <p className="text-xs text-[#B89080] mb-1">Overdue Amount</p>
          <p className={`text-2xl font-medium ${overdueAmount > 0 ? 'text-[#C05050]' : 'text-[#7A3E2E]'}`}>
            ₱{overdueAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#B89080] mt-1">
            {creditSales.filter((cs) => cs.status === 'overdue').length} overdue sales
          </p>
        </div>
      </div>

      {/* Credit Sales History */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        <div className="p-5 border-b border-[#F2C4B0]">
          <h2 className="text-sm font-medium text-[#7A3E2E]">Credit Sales History</h2>
        </div>
        <div className="overflow-x-auto">
          {creditSales.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#B89080]">No credit sales yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Date</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Amount</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Due Date</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Status</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Notes</th>
                </tr>
              </thead>
              <tbody>
                {creditSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                    <td className="py-3 px-3 text-[#7A3E2E]">
                      {new Date(sale.created_at).toLocaleDateString('en-PH')}
                    </td>
                    <td className="py-3 px-3 text-[#7A3E2E] font-medium">
                      ₱{sale.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-[#7A3E2E]">
                      {new Date(sale.due_date).toLocaleDateString('en-PH')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          background:
                            sale.status === 'paid'
                              ? '#FDE8DF'
                              : sale.status === 'overdue'
                              ? '#FDECEA'
                              : '#F5E0DF',
                          color:
                            sale.status === 'paid'
                              ? '#C1614A'
                              : sale.status === 'overdue'
                              ? '#C05050'
                              : '#B89080',
                        }}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#7A3E2E]">{sale.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        <div className="p-5 border-b border-[#F2C4B0]">
          <h2 className="text-sm font-medium text-[#7A3E2E]">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#B89080]">No payments yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F2C4B0]">
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Date</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Amount</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Method</th>
                  <th className="text-left py-3 px-3 text-[#B89080] font-medium text-xs">Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-[#FDE8DF] hover:bg-[#FDF6F0]">
                    <td className="py-3 px-3 text-[#7A3E2E]">
                      {new Date(payment.payment_date).toLocaleDateString('en-PH')}
                    </td>
                    <td className="py-3 px-3 text-[#7A3E2E] font-medium">
                      ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-[#7A3E2E] capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-[#7A3E2E]">{payment.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddCustomerModal
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSubmit={handleUpdate}
        loading={formLoading}
      />

      {customer && (
        <RecordPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          customer={customer}
          onSubmit={handlePaymentSubmit}
          loading={formLoading}
        />
      )}
    </div>
  )
}
