import { Package, AlertCircle, Search, Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
  icon?: 'package' | 'search' | 'inbox' | 'alert'
  tips?: string[]
}

const icons = {
  package: Package,
  search: Search,
  inbox: Inbox,
  alert: AlertCircle,
}

export function EmptyState({ 
  title, 
  description, 
  action,
  icon = 'package',
  tips 
}: EmptyStateProps) {
  const Icon = icons[icon]
  
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      {/* Icon with gradient background */}
      <div className="relative mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#FDE8DF] to-[#FDF6F0] border-2 border-[#F2C4B0] flex items-center justify-center">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#E8896A]" aria-hidden="true" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E8896A] opacity-60" aria-hidden="true" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#C1614A] opacity-40" aria-hidden="true" />
      </div>

      {/* Text content */}
      <h3 className="text-base sm:text-lg font-medium text-[#7A3E2E] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#B89080] mb-6 max-w-md">
        {description}
      </p>

      {/* Action button */}
      {action && <div className="mb-6">{action}</div>}

      {/* Tips section */}
      {tips && tips.length > 0 && (
        <div className="mt-4 p-4 bg-[#FDF6F0] border border-[#F2C4B0] rounded-lg max-w-md">
          <p className="text-xs font-medium text-[#7A3E2E] mb-2">💡 Quick Tips:</p>
          <ul className="text-xs text-[#B89080] space-y-1 text-left">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#E8896A] mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
