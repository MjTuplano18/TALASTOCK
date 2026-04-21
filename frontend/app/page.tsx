'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-[#FDF6F0] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#E8896A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-[#B89080]">Loading...</p>
      </div>
    </div>
  )
}
