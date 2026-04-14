import { MetricCardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ChartSkeleton } from '@/components/charts/ChartSkeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-3">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-[#FDE8DF] rounded animate-pulse" />
          <div className="h-8 w-20 bg-[#FDE8DF] rounded animate-pulse" />
          <div className="h-8 w-28 bg-[#FDE8DF] rounded animate-pulse" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
        <div className="h-5 w-32 bg-[#FDE8DF] rounded mb-4 animate-pulse" />
        <ChartSkeleton />
      </div>

      {/* Revenue + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#F2C4B0] p-4">
          <div className="h-5 w-40 bg-[#FDE8DF] rounded mb-3 animate-pulse" />
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#F2C4B0] p-5">
          <div className="h-5 w-48 bg-[#FDE8DF] rounded mb-4 animate-pulse" />
          <ChartSkeleton />
        </div>
      </div>
    </div>
  )
}
