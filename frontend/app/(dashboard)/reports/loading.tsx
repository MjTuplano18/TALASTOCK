import { ChartSkeleton } from '@/components/charts/ChartSkeleton'
import { MetricCardSkeleton } from '@/components/shared/LoadingSkeleton'

export default function ReportsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-24 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-48 bg-[#FDE8DF] rounded-lg animate-pulse" />
          <div className="h-8 w-28 bg-[#FDE8DF] rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <div className="h-5 w-32 bg-[#FDE8DF] rounded mb-4 animate-pulse" />
          <ChartSkeleton />
        </div>
        <div className="bg-white rounded-xl border border-[#F2C4B0] p-5">
          <div className="h-5 w-40 bg-[#FDE8DF] rounded mb-4 animate-pulse" />
          <ChartSkeleton />
        </div>
      </div>
    </div>
  )
}
