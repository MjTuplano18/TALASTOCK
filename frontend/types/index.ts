// TypeScript type definitions for Talastock
import { z } from 'zod'

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category_id: string | null
  price: number
  cost_price: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  categories?: Category
  inventory?: InventoryItem
}

export interface InventoryItem {
  id: string
  product_id: string
  quantity: number
  low_stock_threshold: number
  updated_at: string
  products?: Product
}

export type StockMovementType = 'restock' | 'sale' | 'adjustment' | 'return' | 'import' | 'rollback'

export interface StockMovement {
  id: string
  product_id: string
  type: StockMovementType
  quantity: number
  note: string | null
  created_by: string
  created_at: string
  products?: Product
}

export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'paymaya' | 'bank_transfer'
export type DiscountType = 'none' | 'percentage' | 'fixed' | 'senior_pwd'
export type SaleStatus = 'completed' | 'refunded' | 'partially_refunded'

export interface Sale {
  id: string
  total_amount: number
  notes: string | null
  created_by: string
  created_at: string
  sale_items?: SaleItem[]
  // Payment method fields
  payment_method: PaymentMethod
  cash_received?: number
  change_given?: number
  // Discount fields
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  // Refund tracking fields
  status: SaleStatus
  refunded_amount: number
  refund_reason?: string
  refunded_at?: string
  refunded_by?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  products?: Product
}

export interface ProductCreate {
  name: string
  sku: string
  category_id: string | null
  price: number
  cost_price: number
  image_url?: string | null
}

export interface ProductUpdate extends Partial<ProductCreate> {
  is_active?: boolean
}

export interface SaleCreate {
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
  notes?: string | null
  // Payment method fields
  payment_method?: PaymentMethod
  cash_received?: number
  change_given?: number
  // Discount fields
  discount_type?: DiscountType
  discount_value?: number
  discount_amount?: number
}

export interface InventoryAdjustment {
  product_id: string
  quantity: number
  note: string
}

export interface DashboardMetrics {
  total_products: number
  total_inventory_value: number
  total_sales_revenue: number
  low_stock_count: number
  last_month_revenue?: number
  last_month_products?: number
  // New metrics
  gross_profit?: number
  avg_order_value?: number
  total_sales_count?: number
  dead_stock_count?: number
}

export interface CategoryPerformance {
  category: string
  revenue: number
  units: number
}

export interface DeadStockItem {
  product: string
  sku: string
  quantity: number
  value: number
  days_since_last_sale: number | null
}

export interface SalesChartData {
  date: string
  sales: number
}

export interface TopProductData {
  product: string
  sales: number
  revenue?: number
  image_url?: string | null
}

export interface RevenueChartData {
  month: string
  revenue: number
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'out_of_stock'
  if (quantity <= threshold) return 'low_stock'
  return 'in_stock'
}

export interface APIResponse<T> {
  success: boolean
  data: T | null
  message: string
  error_code?: string
}

// POS-specific types
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  subtotal: number
  stockWarning?: boolean
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Payment Method Validation
export const paymentMethodSchema = z.enum(['cash', 'card', 'gcash', 'paymaya', 'bank_transfer'], {
  errorMap: () => ({ message: 'Please select a valid payment method' })
})

export const cashPaymentSchema = z.object({
  payment_method: z.literal('cash'),
  cash_received: z.number().positive('Cash received must be greater than 0'),
  total_amount: z.number().positive(),
}).refine((data) => data.cash_received >= data.total_amount, {
  message: 'Cash received must be greater than or equal to total amount',
  path: ['cash_received'],
})

export const nonCashPaymentSchema = z.object({
  payment_method: z.enum(['card', 'gcash', 'paymaya', 'bank_transfer']),
  total_amount: z.number().positive(),
})

// Discount Validation
export const discountSchema = z.object({
  discount_type: z.enum(['none', 'percentage', 'fixed', 'senior_pwd']),
  discount_value: z.number().min(0, 'Discount value cannot be negative'),
  total_amount: z.number().positive(),
}).superRefine((data, ctx) => {
  // Validate percentage discount
  if (data.discount_type === 'percentage') {
    if (data.discount_value < 0 || data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage must be between 0 and 100',
        path: ['discount_value'],
      })
    }
  }
  
  // Validate fixed discount
  if (data.discount_type === 'fixed') {
    if (data.discount_value > data.total_amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount cannot exceed total amount',
        path: ['discount_value'],
      })
    }
  }
  
  // Senior/PWD discount is always 20%
  if (data.discount_type === 'senior_pwd' && data.discount_value !== 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Senior/PWD discount must be exactly 20%',
      path: ['discount_value'],
    })
  }
})

// Sale Creation with Payment and Discount
export const saleCreateSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    unit_price: z.number().positive('Unit price must be greater than 0'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional().nullable(),
  payment_method: paymentMethodSchema.default('cash'),
  cash_received: z.number().positive().optional(),
  change_given: z.number().optional(),
  discount_type: z.enum(['none', 'percentage', 'fixed', 'senior_pwd']).default('none'),
  discount_value: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
})

// Helper function to calculate discount amount
export function calculateDiscountAmount(
  discountType: DiscountType,
  discountValue: number,
  totalAmount: number
): number {
  if (discountType === 'none') return 0
  if (discountType === 'percentage' || discountType === 'senior_pwd') {
    return (totalAmount * discountValue) / 100
  }
  if (discountType === 'fixed') {
    return Math.min(discountValue, totalAmount)
  }
  return 0
}

// Helper function to calculate change
export function calculateChange(cashReceived: number, totalAmount: number): number {
  return Math.max(0, cashReceived - totalAmount)
}

// ============================================================================
// REFUND TYPES AND SCHEMAS
// ============================================================================

// Refund item - represents a single item being refunded
export interface RefundItem {
  sale_item_id: string
  product_id: string
  product_name: string
  original_quantity: number
  refund_quantity: number
  unit_price: number
  refund_amount: number
}

// Refund request - payload for processing a refund
export interface RefundRequest {
  sale_id: string
  items: RefundItem[]
  refund_reason?: string
  total_refund_amount: number
  is_full_refund: boolean
}

// Refund response - returned after processing
export interface RefundResponse {
  success: boolean
  sale_id: string
  refunded_amount: number
  new_status: SaleStatus
  message: string
}

// Zod schema for refund item validation
export const refundItemSchema = z.object({
  sale_item_id: z.string().uuid('Invalid sale item ID'),
  product_id: z.string().uuid('Invalid product ID'),
  product_name: z.string().min(1, 'Product name is required'),
  original_quantity: z.number().int().positive('Original quantity must be positive'),
  refund_quantity: z.number().int().positive('Refund quantity must be at least 1'),
  unit_price: z.number().positive('Unit price must be greater than 0'),
  refund_amount: z.number().positive('Refund amount must be greater than 0'),
}).refine((data) => data.refund_quantity <= data.original_quantity, {
  message: 'Refund quantity cannot exceed original quantity',
  path: ['refund_quantity'],
})

// Zod schema for refund request validation
export const refundRequestSchema = z.object({
  sale_id: z.string().uuid('Invalid sale ID'),
  items: z.array(refundItemSchema).min(1, 'At least one item must be refunded'),
  refund_reason: z.string().max(500, 'Refund reason must be 500 characters or less').optional(),
  total_refund_amount: z.number().positive('Total refund amount must be greater than 0'),
  is_full_refund: z.boolean(),
}).refine((data) => {
  // Validate that total_refund_amount matches sum of item refund amounts
  const calculatedTotal = data.items.reduce((sum, item) => sum + item.refund_amount, 0)
  return Math.abs(calculatedTotal - data.total_refund_amount) < 0.01 // Allow for floating point precision
}, {
  message: 'Total refund amount must match sum of item refund amounts',
  path: ['total_refund_amount'],
})

// Helper function to calculate refund amount for an item
export function calculateRefundAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

// Helper function to determine if refund is full or partial
export function isFullRefund(
  refundItems: RefundItem[],
  originalItems: SaleItem[]
): boolean {
  // Full refund if all items are being refunded with their full quantities
  if (refundItems.length !== originalItems.length) return false
  
  return refundItems.every(refundItem => {
    const originalItem = originalItems.find(item => item.id === refundItem.sale_item_id)
    return originalItem && refundItem.refund_quantity === originalItem.quantity
  })
}

// Helper function to validate refund against original sale
export function validateRefund(
  refundRequest: RefundRequest,
  originalSale: Sale
): { valid: boolean; error?: string } {
  // Check if sale is already fully refunded
  if (originalSale.status === 'refunded') {
    return { valid: false, error: 'Sale has already been fully refunded' }
  }
  
  // Check if refund amount exceeds remaining refundable amount
  const alreadyRefunded = originalSale.refunded_amount || 0
  const remainingRefundable = originalSale.total_amount - alreadyRefunded
  
  if (refundRequest.total_refund_amount > remainingRefundable) {
    return { 
      valid: false, 
      error: `Refund amount (₱${refundRequest.total_refund_amount.toFixed(2)}) exceeds remaining refundable amount (₱${remainingRefundable.toFixed(2)})` 
    }
  }
  
  // Validate each item against original sale items
  if (!originalSale.sale_items) {
    return { valid: false, error: 'Original sale items not found' }
  }
  
  for (const refundItem of refundRequest.items) {
    const originalItem = originalSale.sale_items.find(item => item.id === refundItem.sale_item_id)
    
    if (!originalItem) {
      return { valid: false, error: `Sale item ${refundItem.sale_item_id} not found in original sale` }
    }
    
    if (refundItem.refund_quantity > originalItem.quantity) {
      return { 
        valid: false, 
        error: `Refund quantity (${refundItem.refund_quantity}) exceeds original quantity (${originalItem.quantity}) for ${refundItem.product_name}` 
      }
    }
  }
  
  return { valid: true }
}

// ============================================================================
// REPORT TYPES AND INTERFACES
// ============================================================================

// Report grouping options
export type ReportGrouping = 'day' | 'week' | 'month'

// Sales Report Data (Requirement 5.2)
export interface SalesReportData {
  // Date range
  start_date: string
  end_date: string
  grouping: ReportGrouping
  
  // Summary totals
  total_sales_count: number
  total_revenue: number
  average_order_value: number
  
  // Payment method breakdown
  payment_breakdown: PaymentMethodBreakdown[]
  
  // Discount breakdown
  discount_breakdown: DiscountBreakdown
  
  // Top products by revenue
  top_products_by_revenue: TopProductReport[]
  
  // Top products by quantity
  top_products_by_quantity: TopProductReport[]
  
  // Sales over time (grouped by day/week/month)
  sales_over_time: SalesTimeSeriesData[]
}

export interface PaymentMethodBreakdown {
  payment_method: PaymentMethod
  count: number
  total_amount: number
  percentage: number
}

export interface DiscountBreakdown {
  total_discounts_given: number
  discount_by_type: {
    percentage: number
    fixed: number
    senior_pwd: number
  }
  percentage_of_revenue: number
}

export interface TopProductReport {
  product_id: string
  product_name: string
  sku: string
  quantity_sold?: number
  revenue?: number
  sales_count: number
}

export interface SalesTimeSeriesData {
  period: string // Date string (YYYY-MM-DD, YYYY-WW, or YYYY-MM depending on grouping)
  sales_count: number
  revenue: number
  average_order_value: number
}

// Inventory Report Data (Requirement 5.3)
export interface InventoryReportData {
  // Report metadata
  report_date: string
  
  // Summary metrics
  total_products: number
  total_inventory_value: number
  low_stock_count: number
  out_of_stock_count: number
  dead_stock_count: number
  
  // Detailed inventory items
  inventory_items: InventoryReportItem[]
  
  // Category breakdown
  category_breakdown: CategoryInventoryBreakdown[]
}

export interface InventoryReportItem {
  product_id: string
  product_name: string
  sku: string
  category_name: string | null
  quantity: number
  cost_price: number
  total_value: number
  low_stock_threshold: number
  stock_status: StockStatus
  is_dead_stock: boolean
  days_since_last_sale: number | null
}

export interface CategoryInventoryBreakdown {
  category_name: string
  product_count: number
  total_quantity: number
  total_value: number
}

// Profit & Loss Report Data (Requirement 5.4)
export interface ProfitLossReportData {
  // Date range
  start_date: string
  end_date: string
  
  // Revenue metrics
  total_revenue: number
  total_discounts: number
  net_revenue: number
  
  // Cost metrics
  cost_of_goods_sold: number
  
  // Profit metrics
  gross_profit: number
  gross_margin_percentage: number
  net_profit: number
  net_margin_percentage: number
  
  // Breakdown by category
  category_breakdown: CategoryProfitBreakdown[]
  
  // Breakdown by month (if date range > 1 month)
  monthly_breakdown?: MonthlyProfitBreakdown[]
}

export interface CategoryProfitBreakdown {
  category_name: string
  revenue: number
  cogs: number
  gross_profit: number
  gross_margin_percentage: number
  units_sold: number
}

export interface MonthlyProfitBreakdown {
  month: string // YYYY-MM format
  revenue: number
  cogs: number
  gross_profit: number
  gross_margin_percentage: number
  discounts: number
  net_profit: number
}

// Report export options
export type ReportExportFormat = 'pdf' | 'excel'

export interface ReportExportOptions {
  format: ReportExportFormat
  filename?: string
  include_charts?: boolean
}

// Report generation request
export interface ReportGenerationRequest {
  report_type: 'sales' | 'inventory' | 'profit_loss'
  start_date?: string
  end_date?: string
  grouping?: ReportGrouping
  category_filter?: string
}

// Zod schema for report generation request
export const reportGenerationSchema = z.object({
  report_type: z.enum(['sales', 'inventory', 'profit_loss'], {
    errorMap: () => ({ message: 'Please select a valid report type' })
  }),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  grouping: z.enum(['day', 'week', 'month']).default('day'),
  category_filter: z.string().uuid().optional(),
}).refine((data) => {
  // For sales and profit_loss reports, date range is required
  if (data.report_type === 'sales' || data.report_type === 'profit_loss') {
    return data.start_date && data.end_date
  }
  return true
}, {
  message: 'Start date and end date are required for sales and profit & loss reports',
  path: ['start_date'],
})
