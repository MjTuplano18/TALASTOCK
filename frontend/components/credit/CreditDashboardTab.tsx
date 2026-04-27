'use client'

import { useState, useEffect } from 'react'
import { CreditCard, AlertCircle, TrendingUp } from 'lucide-react'
import { HydrationSafeMetricCard } from '@/components/shared/HydrationSafeMetricCard'
import { MetricCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ChartCard } from '@/components/charts/ChartCard'
import { CreditSalesTrendChart } from '@/components/credit/CreditSalesTrendChart'
import { PaymentCollectionChart } from '@/components/credit/PaymentCollectionChart'
import { OverdueCustomersTable } from '@/components/credit/OverdueCustomersTable'
import { formatCurrency } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'

type DateRange = '7d' | '30d' | '3m' | '6m'

interface CreditMetrics {
  total_credit_outstanding: number
  overdue_balance: number
  customers_near_limit: number
}

interface CreditDashboardTabProps {
  dateRange: DateRange
}

export function CreditDashboardTab({ dateRange }: CreditDashboardTabProps) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<CreditMetrics>({
    total_credit_outstanding: 0,
    overdue_balance: 0,
    customers_near_limit: 0,
  })

  useEffect(() => {
    fetchCreditMetrics()
  }, [dateRange])

  async function fetchCreditMetrics() {
    setLoading(true)
    try {
      const response = await apiFetch(`/api/v1/reports/credit-kpis?range=${dateRange}`)
      if (response.ok) {
        const result = await response.json()
        const data = result.data ?? result
        setMetrics({
          total_credit_outstanding: data.total_outstanding ?? 0,
          overdue_balance: data.overdue_balance ?? 0,
          customers_near_limit: data.customers_near_limit ?? 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch credit metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <HydrationSafeMetricCard
              label="Total Credit Outstanding"
              value={formatCurrency(metrics.total_credit_outstanding)}
              icon={<CreditCard className="w-4 h-4 text-[#E8896A]" />}
            />
            <HydrationSafeMetricCard
              label="Overdue Balance"
              value={formatCurrency(metrics.overdue_balance)}
              icon={<AlertCircle className="w-4 h-4 text-[#E8896A]" />}
              danger={metrics.overdue_balance > 0}
            />
            <HydrationSafeMetricCard
              label="Customers Near Limit"
              value={metrics.customers_near_limit}
              icon={<TrendingUp className="w-4 h-4 text-[#E8896A]" />}
              sub={`>80% credit utilized`}
              danger={metrics.customers_near_limit > 0}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <ChartCard title="Credit Sales Trend">
          <CreditSalesTrendChart dateRange={dateRange} />
        </ChartCard>
        <ChartCard title="Payment Collection">
          <PaymentCollectionChart dateRange={dateRange} />
        </ChartCard>
      </div>

      {/* Overdue Customers Table */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <h3 className="text-sm font-medium text-[#7A3E2E] mb-4">Overdue Customers</h3>
        <OverdueCustomersTable />
      </div>
    </div>
  )
}
