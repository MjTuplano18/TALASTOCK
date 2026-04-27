export default function CustomerDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-[#FDE8DF] rounded-lg animate-pulse" />
        <div className="h-7 w-48 bg-[#FDE8DF] rounded animate-pulse" />
      </div>
      <div className="h-32 bg-[#FDE8DF] rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-[#FDE8DF] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-[#FDE8DF] rounded-xl animate-pulse" />
      <div className="h-96 bg-[#FDE8DF] rounded-xl animate-pulse" />
    </div>
  )
}
