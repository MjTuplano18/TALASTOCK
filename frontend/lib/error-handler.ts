/**
 * Enhanced Error Handling Utilities
 * Provides user-friendly error messages with context
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Convert Supabase/API errors to user-friendly messages
 */
export function getErrorMessage(error: unknown, operation: string): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    // Supabase specific errors
    if (error.message.includes('duplicate key')) {
      return `This ${operation} already exists. Please use a different name or SKU.`
    }
    if (error.message.includes('foreign key')) {
      return `Cannot ${operation} because it's being used by other records.`
    }
    if (error.message.includes('violates check constraint')) {
      return `Invalid data provided for ${operation}. Please check your input.`
    }
    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return `You don't have permission to ${operation}.`
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return `Network error. Please check your connection and try again.`
    }
    if (error.message.includes('timeout')) {
      return `Request timed out. Please try again.`
    }

    // Return the original message if it's already user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return `Failed to ${operation}: ${error.message}`
    }
  }

  // Generic fallback
  return `Failed to ${operation}. Please try again or contact support.`
}

/**
 * Operation-specific error messages
 */
export const ErrorMessages = {
  // Products
  PRODUCT_CREATE: 'create product',
  PRODUCT_UPDATE: 'update product',
  PRODUCT_DELETE: 'delete product',
  PRODUCT_FETCH: 'load products',

  // Inventory
  INVENTORY_ADJUST: 'adjust inventory',
  INVENTORY_UPDATE: 'update inventory',
  INVENTORY_FETCH: 'load inventory',
  INVENTORY_IMPORT: 'import inventory',

  // Sales
  SALE_CREATE: 'record sale',
  SALE_DELETE: 'delete sale',
  SALE_FETCH: 'load sales',

  // Categories
  CATEGORY_CREATE: 'create category',
  CATEGORY_UPDATE: 'update category',
  CATEGORY_DELETE: 'delete category',
  CATEGORY_FETCH: 'load categories',

  // Dashboard
  DASHBOARD_FETCH: 'load dashboard data',
  METRICS_FETCH: 'load metrics',

  // Auth
  AUTH_LOGIN: 'sign in',
  AUTH_LOGOUT: 'sign out',
  AUTH_VERIFY: 'verify authentication',
} as const

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  onError?: (message: string) => void
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    const message = getErrorMessage(error, operationName)
    console.error(`[${operationName}]`, error)
    onError?.(message)
    return null
  }
}

/**
 * Validation error helper
 */
export function createValidationError(field: string, message: string): AppError {
  return new AppError(
    `${field}: ${message}`,
    'VALIDATION_ERROR',
    { field }
  )
}
