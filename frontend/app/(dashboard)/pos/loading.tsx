import { Skeleton } from '@/components/ui/skeleton'

export default function POSLoading() {
  return (
    <div>
      <div className="mb-4">
        <Skeleton className="h-6 w-32 bg-[#FDE8DF]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[600px] rounded-xl bg-[#FDE8DF]" />
        <Skeleton className="h-[600px] rounded-xl bg-[#FDE8DF]" />
      </div>
    </div>
  )
}
