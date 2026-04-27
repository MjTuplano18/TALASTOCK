'use client'

import { useState, useEffect, useMemo } from 'react'
import { CreditCard, AlertCircle, TrendingUp, Info } from 'lucide-react'
import { HydrationSafeMetricCard } from '@/components/shared/HydrationSafeMetricCard'
import { MetricCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ChartCard } from '@/components/charts/ChartCard'
import { CreditSalesTrendChart } from '@/components/credit/CreditSalesTrendChart'
import { PaymentCollectionChart } from '@/components/credit/PaymentCollectionChart'
import { CreditUtilizationChart } from '@/components/credit/CreditUtilizationChart'
import { PaymentMethodsChart } from '@/components/credit/PaymentMethodsChart'
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
  refreshTrigger?: number
  startDate?: Date
  endDate?: Date
}

export function CreditDashboardTab({ dateRange, refreshTrigger, startDate, endDate }: CreditDashboardTabProps) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<CreditMetrics>({
    total_credit_outstanding: 0,
    overdue_balance: 0,
    customers_near_limit: 0,
  })

  useEffect(() => {
    fetchCreditMetrics()
  }, [dateRange, refreshTrigger])

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
      {/* Info Banner */}
      <div className="bg-[#FDF6F0] border border-[#F2C4B0] rounded-lg px-3 py-2 flex items-start gap-2">
        <Info className="w-4 h-4 text-[#E8896A] shrink-0 mt-0.5" />
        <p className="text-xs text-[#7A3E2E]">
          <span className="font-medium">Note:</span> KPI metrics show current balances (not filtered by date). 
          Charts below show data for the selected date range.
        </p>
      </div>

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
              sub="Current balance"
            />
            <HydrationSafeMetricCard
              label="Overdue Balance"
              value={formatCurrency(metrics.overdue_balance)}
              icon={<AlertCircle className="w-4 h-4 text-[#E8896A]" />}
              danger={metrics.overdue_balance > 0}
              sub="Past due date"
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

      {/* Charts Row 1 - Trends (Coming Soon) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <ChartCard title="Credit Sales Trend">
          <CreditSalesTrendChart dateRange={dateRange} />
        </ChartCard>
        <ChartCard title="Payment Collection">
          <PaymentCollectionChart dateRange={dateRange} />
        </ChartCard>
      </div>

      {/* Charts Row 2 - Analytics (Working) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <ChartCard title="Credit Utilization by Customer">
          <CreditUtilizationChart />
        </ChartCard>
        <ChartCard title="Payment Methods">
          <PaymentMethodsChart startDate={startDate} endDate={endDate} />
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
