import { Skeleton } from '@/components/ui/skeleton'

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <Skeleton className="w-8 h-8 rounded-lg mb-3" />
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-7 w-20" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#FDE8DF]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  )
}

export function ChartSkeleton() {
  return <div className="h-[300px] w-full bg-[#FDF6F0] rounded-lg animate-pulse" />
}
