// TypeScript type definitions for Talastock

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

export type StockMovementType = 'restock' | 'sale' | 'adjustment' | 'return'

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

export interface Sale {
  id: string
  total_amount: number
  notes: string | null
  created_by: string
  created_at: string
  sale_items?: SaleItem[]
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
