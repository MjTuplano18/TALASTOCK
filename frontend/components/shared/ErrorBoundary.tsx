'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to structured logger — goes to Sentry in production
    import('@/lib/monitoring').then(({ captureError }) => {
      captureError(error, {
        action: 'react_error_boundary',
        componentStack: info.componentStack ?? undefined,
      })
    })
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#FDECEA] flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-[#C05050]" />
          </div>
          <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">Something went wrong</h3>
          <p className="text-xs text-[#B89080] mb-4 max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred in this section.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience wrapper for page-level errors
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="w-12 h-12 rounded-xl bg-[#FDECEA] flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[#C05050]" />
          </div>
          <h2 className="text-base font-medium text-[#7A3E2E] mb-2">Page failed to load</h2>
          <p className="text-sm text-[#B89080] mb-4">Please refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
