import { Skeleton } from '@/components/ui/skeleton'

export default function CreditSalesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-[#FDE8DF]" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 bg-[#FDE8DF]" />
        <Skeleton className="h-9 w-48 bg-[#FDE8DF]" />
        <Skeleton className="h-9 w-32 bg-[#FDE8DF]" />
      </div>
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-3 bg-[#FDE8DF]" />
        ))}
      </div>
    </div>
  )
}
