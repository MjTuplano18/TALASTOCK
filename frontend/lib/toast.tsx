import { toast as sonnerToast, ExternalToast } from 'sonner'
import { Undo2, X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

/**
 * Enhanced Toast Utilities
 * Provides undo functionality, action buttons, and better positioning
 */

interface ToastAction {
  label: string
  onClick: () => void
}

interface EnhancedToastOptions extends ExternalToast {
  action?: ToastAction
  onUndo?: () => void
  duration?: number
}

// Default durations
const DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
  loading: Infinity,
}

/**
 * Success toast with optional undo
 */
export function success(message: string, options?: EnhancedToastOptions) {
  const { onUndo, action, duration = DURATIONS.success, ...rest } = options || {}

  return sonnerToast.success(message, {
    duration,
    icon: <CheckCircle2 className="w-4 h-4" />,
    action: onUndo
      ? {
          label: (
            <span className="flex items-center gap-1">
              <Undo2 className="w-3 h-3" />
              Undo
            </span>
          ),
          onClick: onUndo,
        }
      : action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    ...rest,
  })
}

/**
 * Error toast with optional retry action
 */
export function error(message: string, options?: EnhancedToastOptions) {
  const { action, duration = DURATIONS.error, ...rest } = options || {}

  return sonnerToast.error(message, {
    duration,
    icon: <AlertCircle className="w-4 h-4" />,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    ...rest,
  })
}

/**
 * Warning toast
 */
export function warning(message: string, options?: EnhancedToastOptions) {
  const { action, duration = DURATIONS.warning, ...rest } = options || {}

  return sonnerToast.warning(message, {
    duration,
    icon: <AlertTriangle className="w-4 h-4" />,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    ...rest,
  })
}

/**
 * Info toast
 */
export function info(message: string, options?: EnhancedToastOptions) {
  const { action, duration = DURATIONS.info, ...rest } = options || {}

  return sonnerToast.info(message, {
    duration,
    icon: <Info className="w-4 h-4" />,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    ...rest,
  })
}

/**
 * Loading toast
 */
export function loading(message: string, options?: ExternalToast) {
  return sonnerToast.loading(message, {
    duration: DURATIONS.loading,
    ...options,
  })
}

/**
 * Promise toast - shows loading, then success/error
 */
export function promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  },
  options?: EnhancedToastOptions
) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    ...options,
  })
}

/**
 * Dismiss a specific toast
 */
export function dismiss(toastId?: string | number) {
  sonnerToast.dismiss(toastId)
}

/**
 * Dismiss all toasts
 */
export function dismissAll() {
  sonnerToast.dismiss()
}

/**
 * Custom toast with full control
 */
export function custom(message: string, options?: EnhancedToastOptions) {
  return sonnerToast(message, options)
}

// Export the enhanced toast object
export const toast = {
  success,
  error,
  warning,
  info,
  loading,
  promise,
  dismiss,
  dismissAll,
  custom,
}

// Re-export sonner for direct access if needed
export { sonnerToast }
