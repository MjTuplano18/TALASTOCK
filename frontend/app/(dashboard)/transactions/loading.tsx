export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-32 bg-[#FDE8DF] rounded animate-pulse" />
          <div className="h-4 w-48 bg-[#FDE8DF] rounded animate-pulse mt-1" />
        </div>
      </div>

      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#F2C4B0] p-4">
            <div className="h-3 w-24 bg-[#FDE8DF] rounded animate-pulse mb-2" />
            <div className="h-8 w-32 bg-[#FDE8DF] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-[#FDE8DF] rounded-lg animate-pulse" />
        <div className="h-9 w-32 bg-[#FDE8DF] rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-[#FDE8DF] rounded-lg animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-24 bg-[#FDE8DF] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[#FDE8DF] rounded animate-pulse" />
              <div className="h-4 flex-1 bg-[#FDE8DF] rounded animate-pulse" />
              <div className="h-4 w-24 bg-[#FDE8DF] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
