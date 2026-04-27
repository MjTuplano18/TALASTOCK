export default function CustomersLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-32 bg-[#FDE8DF] rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="h-9 w-64 bg-[#FDE8DF] rounded animate-pulse" />
        <div className="h-9 w-32 bg-[#FDE8DF] rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-6">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-[#FDF6F0] rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
