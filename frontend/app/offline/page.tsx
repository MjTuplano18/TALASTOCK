'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FDF6F0] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="relative mb-6 inline-block">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FDE8DF] to-[#FDF6F0] border-2 border-[#F2C4B0] flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-[#C05050]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-medium text-[#7A3E2E] mb-3">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-sm text-[#B89080] mb-6">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, your changes are saved locally and will sync when you&apos;re back online.
        </p>

        {/* Tips */}
        <div className="bg-white border border-[#F2C4B0] rounded-lg p-4 mb-6 text-left">
          <p className="text-xs font-medium text-[#7A3E2E] mb-2">💡 While offline:</p>
          <ul className="text-xs text-[#B89080] space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-[#E8896A] mt-0.5">•</span>
              <span>You can still view cached data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#E8896A] mt-0.5">•</span>
              <span>Changes will be queued and synced later</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#E8896A] mt-0.5">•</span>
              <span>Check your WiFi or mobile data connection</span>
            </li>
          </ul>
        </div>

        {/* Action */}
        <Button
          onClick={() => window.location.reload()}
          className="bg-[#E8896A] hover:bg-[#C1614A] text-white border-0"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
