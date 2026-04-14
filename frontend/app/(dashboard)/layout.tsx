import { Sidebar } from '@/components/layout/Sidebar'
import { PageErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FDF6F0]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
      </main>
    </div>
  )
}
