'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { PageErrorBoundary } from '@/components/shared/ErrorBoundary'
import { PageTransition } from '@/components/shared/PageTransition'
import { SkipNavigation } from '@/components/shared/SkipNavigation'
import { OfflineIndicator } from '@/components/shared/OfflineIndicator'
// import { useOfflineSupport } from '@/hooks/useOfflineSupport' // Disabled - causing redirect issues
import { DateRangeProvider } from '@/context/DateRangeContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Initialize offline support - DISABLED temporarily
  // useOfflineSupport()

  return (
    <DateRangeProvider>
      <div className="flex h-screen bg-[#FDF6F0]">
        <SkipNavigation />
        <OfflineIndicator />
        <Sidebar />
        <main 
          id="main-content"
          className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 pt-16 md:pt-6"
          role="main"
        >
          <PageErrorBoundary>
            <PageTransition>
              {children}
            </PageTransition>
          </PageErrorBoundary>
        </main>
      </div>
    </DateRangeProvider>
  )
}
