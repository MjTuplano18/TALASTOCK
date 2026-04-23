export default function RootLoading() {
  return (
    <div className="flex min-h-screen bg-[#FDF6F0] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Talastock Logo Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-[#F2C4B0] border-t-[#E8896A] rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-[#7A3E2E]">Loading Talastock...</p>
      </div>
    </div>
  )
}
