import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  compact?: boolean
}

export function ErrorState({ 
  title = "Failed to load data",
  message = "Something went wrong. Please try again.",
  onRetry,
  compact = false
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#C05050] bg-[#FDECEA] rounded px-2 py-1">
        <AlertTriangle className="w-3 h-3" />
        <span>Failed to load</span>
        {onRetry && (
          <button onClick={onRetry} className="text-[#E8896A] hover:underline ml-1">
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#FDECEA] flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-[#C05050]" />
      </div>
      <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">{title}</h3>
      <p className="text-xs text-[#B89080] mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 h-8 px-3 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Try Again
        </button>
      )}
    </div>
  )
}
