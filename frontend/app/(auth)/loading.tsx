export default function AuthLoading() {
  return (
    <div className="flex min-h-screen bg-[#FDF6F0] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#F2C4B0] border-t-[#E8896A] rounded-full animate-spin" />
        <p className="text-sm text-[#B89080]">Loading...</p>
      </div>
    </div>
  )
}
