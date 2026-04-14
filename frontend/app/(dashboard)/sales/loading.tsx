import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

export default function SalesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-20 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="h-8 w-32 bg-[#FDE8DF] rounded animate-pulse" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="h-9 w-64 bg-[#FDE8DF] rounded-lg animate-pulse" />
        <div className="h-9 w-48 bg-[#FDE8DF] rounded-lg animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F2C4B0]">
              {['Date', 'Total', 'Items', 'Notes', ''].map((h, i) => (
                <th key={i} className="text-left py-3 px-4 text-[#B89080] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableSkeleton rows={15} cols={5} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
