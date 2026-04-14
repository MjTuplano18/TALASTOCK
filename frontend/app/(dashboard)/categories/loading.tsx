import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

export default function CategoriesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-32 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="h-8 w-36 bg-[#FDE8DF] rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border border-[#F2C4B0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F2C4B0]">
              {['Category Name', 'Products', 'Created', ''].map((h, i) => (
                <th key={i} className="text-left py-3 px-4 text-[#B89080] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableSkeleton rows={10} cols={4} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
