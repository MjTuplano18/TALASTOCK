import { Package } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#FDE8DF] flex items-center justify-center mb-4">
        <Package className="w-6 h-6 text-[#E8896A]" />
      </div>
      <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">{title}</h3>
      <p className="text-xs text-[#B89080] mb-4">{description}</p>
      {action}
    </div>
  )
}
