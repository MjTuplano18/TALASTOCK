import { supabase } from './supabase'
import type { Category, Product, ProductCreate, ProductUpdate, InventoryItem, StockMovement, Sale, SaleCreate, Customer, CustomerCreate, CustomerUpdate, CreditSale, Payment } from '@/types'

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select('id, name, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select('id, name, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, category_id, price, cost_price, image_url, is_active, created_at, updated_at, categories(id, name, created_at), inventory(id, product_id, quantity, low_stock_threshold, updated_at)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

export async function createProduct(data: ProductCreate): Promise<Product> {
  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select('id, name, sku, category_id, price, cost_price, image_url, is_active, created_at, updated_at, categories(id, name, created_at), inventory(id, product_id, quantity, low_stock_threshold, updated_at)')
    .single()

  if (error) throw new Error(error.message)
  return product as unknown as Product
}

export async function updateProduct(id: string, data: ProductUpdate): Promise<Product> {
  const { data: product, error } = await supabase
    .from('products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, sku, category_id, price, cost_price, image_url, is_active, created_at, updated_at, categories(id, name, created_at), inventory(id, product_id, quantity, low_stock_threshold, updated_at)')
    .single()

  if (error) throw new Error(error.message)
  return product as unknown as Product
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('id, product_id, quantity, low_stock_threshold, updated_at, products(id, name, sku, cost_price, category_id, categories(id, name))')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as InventoryItem[]
}

export async function getLowStockProducts(): Promise<InventoryItem[]> {
  // Supabase doesn't support column-to-column comparisons, so fetch all and filter client-side
  const { data, error } = await supabase
    .from('inventory')
    .select('id, product_id, quantity, low_stock_threshold, updated_at, products(id, name, sku, cost_price, category_id, categories(id, name))')

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as InventoryItem[]).filter(
    item => item.quantity <= item.low_stock_threshold
  )
}

export async function adjustInventory(
  productId: string,
  quantity: number,
  note: string,
  userId: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('inventory')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('product_id', productId)

  if (updateError) throw new Error(updateError.message)

  const { error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      product_id: productId,
      type: 'adjustment',
      quantity,
      note,
      created_by: userId,
    })

  if (movementError) throw new Error(movementError.message)
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  let query = supabase
    .from('stock_movements')
    .select('id, product_id, type, quantity, note, created_by, created_at, products(id, name, sku)')
    .order('created_at', { ascending: false })

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as StockMovement[]
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total_amount, notes, created_by, created_at, payment_method, cash_received, change_given, discount_type, discount_value, discount_amount, status, refunded_amount, refund_reason, refunded_at, refunded_by, sale_items(id, sale_id, product_id, quantity, unit_price, subtotal, products(id, name, sku))')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Sale[]
}

export async function createSale(data: SaleCreate, userId: string): Promise<Sale> {
  // For credit sales, call the backend API instead
  if (data.customer_id) {
    return await createCreditSale(data, userId)
  }

  // 1. Check inventory for each item
  for (const item of data.items) {
    const { data: inv, error: invError } = await supabase
      .from('inventory')
      .select('quantity, products(name)')
      .eq('product_id', item.product_id)
      .single()

    if (invError) throw new Error(invError.message)

    const inventoryRow = inv as unknown as { quantity: number; products: { name: string } | null }
    if (inventoryRow.quantity < item.quantity) {
      const productName = inventoryRow.products?.name ?? item.product_id
      throw new Error(`Insufficient stock for: ${productName}`)
    }
  }

  // 2. Calculate total
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  // 3. Insert sale record
  const saleData: any = {
    total_amount: totalAmount,
    notes: data.notes ?? null,
    created_by: userId,
    payment_method: data.payment_method || 'cash',
  }

  // Add cash handling fields if it's a cash payment
  if (data.payment_method === 'cash' && data.cash_received) {
    saleData.cash_received = data.cash_received
    saleData.change_given = data.change_given || 0
  }

  // Add discount fields if present
  if (data.discount_type && data.discount_type !== 'none') {
    saleData.discount_type = data.discount_type
    saleData.discount_value = data.discount_value || 0
    saleData.discount_amount = data.discount_amount || 0
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(saleData)
    .select('id, total_amount, notes, created_by, created_at, payment_method, cash_received, change_given, discount_type, discount_value, discount_amount')
    .single()

  if (saleError) throw new Error(saleError.message)

  // 4. Insert sale items
  const saleItems = data.items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) throw new Error(itemsError.message)

  // 5. Insert stock movements and decrease inventory for each item
  for (const item of data.items) {
    const { error: movError } = await supabase.from('stock_movements').insert({
      product_id: item.product_id,
      type: 'sale',
      quantity: item.quantity,
      note: `Sale ${sale.id}`,
      created_by: userId,
    })
    if (movError) throw new Error(movError.message)

    const { error: decError } = await supabase.rpc('decrement_inventory', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })

    // Fallback if RPC not available: manual decrement
    if (decError) {
      const { data: current, error: fetchErr } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product_id)
        .single()

      if (fetchErr) throw new Error(fetchErr.message)

      const { error: updateErr } = await supabase
        .from('inventory')
        .update({
          quantity: (current as { quantity: number }).quantity - item.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', item.product_id)

      if (updateErr) throw new Error(updateErr.message)
    }
  }

  return sale as Sale
}

// Helper function to create credit sale via backend API
async function createCreditSale(data: SaleCreate, userId: string): Promise<Sale> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  // 1. Check inventory for each item
  for (const item of data.items) {
    const { data: inv, error: invError } = await supabase
      .from('inventory')
      .select('quantity, products(name)')
      .eq('product_id', item.product_id)
      .single()

    if (invError) throw new Error(invError.message)

    const inventoryRow = inv as unknown as { quantity: number; products: { name: string } | null }
    if (inventoryRow.quantity < item.quantity) {
      const productName = inventoryRow.products?.name ?? item.product_id
      throw new Error(`Insufficient stock for: ${productName}`)
    }
  }

  // 2. Calculate total
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  // 3. Create regular sale first
  const saleData: any = {
    total_amount: totalAmount,
    notes: data.notes ?? null,
    created_by: userId,
    payment_method: 'credit',
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(saleData)
    .select('id, total_amount, notes, created_by, created_at, payment_method')
    .single()

  if (saleError) throw new Error(saleError.message)

  // 4. Insert sale items
  const saleItems = data.items.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) throw new Error(itemsError.message)

  // 5. Insert stock movements and decrease inventory for each item
  for (const item of data.items) {
    const { error: movError } = await supabase.from('stock_movements').insert({
      product_id: item.product_id,
      type: 'sale',
      quantity: item.quantity,
      note: `Credit Sale ${sale.id}`,
      created_by: userId,
    })
    if (movError) throw new Error(movError.message)

    const { error: decError } = await supabase.rpc('decrement_inventory', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })

    // Fallback if RPC not available: manual decrement
    if (decError) {
      const { data: current, error: fetchErr } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product_id)
        .single()

      if (fetchErr) throw new Error(fetchErr.message)

      const { error: updateErr } = await supabase
        .from('inventory')
        .update({
          quantity: (current as { quantity: number }).quantity - item.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', item.product_id)

      if (updateErr) throw new Error(updateErr.message)
    }
  }

  // 6. Create credit sale record via backend API with timeout
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  console.log('[Credit Sale] Calling backend API:', `${apiUrl}/api/v1/credit-sales`)
  
  try {
    // Create abort controller for timeout (30 seconds for cold start)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const response = await fetch(`${apiUrl}/api/v1/credit-sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        customer_id: data.customer_id,
        sale_id: sale.id,
        amount: totalAmount,
        notes: data.notes,
        override_credit_limit: data.override_credit_limit || false,
      }),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Credit Sale] Error response:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.detail || 'Failed to create credit sale record')
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    }

    const creditSaleResponse = await response.json()
    console.log('[Credit Sale] Success:', creditSaleResponse)
    
    // Show warning if present
    if (creditSaleResponse.warning) {
      console.warn('[Credit Sale] Warning:', creditSaleResponse.warning)
    }
    
    // Invalidate customer cache so balance updates are reflected
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talastock_cache_customers')
    }
  } catch (error) {
    console.error('[Credit Sale] Failed to create credit sale record:', error)
    
    // If it's a timeout or network error, the sale was still created successfully
    // Just the credit_sales record wasn't created
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.warn('[Credit Sale] Backend timeout or network error - sale was created but credit record may be missing')
      // Don't throw - sale was created successfully, just the backend was slow
      // The sale will show in the UI, user can manually check customer balance
      return sale as Sale
    }
    
    // For other errors (validation, credit limit), throw so user sees the error
    throw error
  }

  return sale as Sale
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export async function getDashboardMetrics(startDate?: string, endDate?: string): Promise<import('@/types').DashboardMetrics> {
  const now = new Date()
  // Use provided dates or default to current month
  const periodStart = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const periodEnd = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const { count: total_products } = await supabase
    .from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)

  const { data: invData } = await supabase
    .from('inventory').select('quantity, products!inner(cost_price, is_active)').eq('products.is_active', true)

  const total_inventory_value = (invData ?? []).reduce((sum, item) => {
    const row = item as unknown as { quantity: number; products: { cost_price: number } }
    return sum + row.quantity * row.products.cost_price
  }, 0)

  // Sales for selected period (subtract refunded amounts)
  const { data: salesData } = await supabase.from('sales').select('total_amount, refunded_amount, status')
    .gte('created_at', periodStart).lte('created_at', periodEnd)
  
  // Calculate net revenue (total_amount - refunded_amount for each sale)
  const total_sales_revenue = (salesData ?? []).reduce((sum, s) => {
    const sale = s as any
    const netAmount = sale.total_amount - (sale.refunded_amount || 0)
    return sum + netAmount
  }, 0)
  
  // Count only non-refunded sales (completed or partially_refunded)
  const total_sales_count = (salesData ?? []).filter((s: any) => s.status !== 'refunded').length

  // Last month sales (for comparison) - subtract refunded amounts
  const { data: lastSalesData } = await supabase.from('sales').select('total_amount, refunded_amount')
    .gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd)
  const last_month_revenue = (lastSalesData ?? []).reduce((sum, s) => {
    const sale = s as any
    const netAmount = sale.total_amount - (sale.refunded_amount || 0)
    return sum + netAmount
  }, 0)

  // Gross profit for selected period (exclude refunded sales)
  const { data: periodSales } = await supabase
    .from('sales')
    .select('id, status')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
    .neq('status', 'refunded') // Exclude fully refunded sales
  const periodSaleIds = (periodSales ?? []).map((s: any) => s.id)

  let gross_profit = 0
  if (periodSaleIds.length > 0) {
    const { data: saleItemsData } = await supabase
      .from('sale_items')
      .select('quantity, unit_price, products(cost_price)')
      .in('sale_id', periodSaleIds)
    gross_profit = (saleItemsData ?? []).reduce((sum, item) => {
      const row = item as unknown as { quantity: number; unit_price: number; products: { cost_price: number } | null }
      const revenue = row.quantity * row.unit_price
      const cost = row.quantity * (row.products?.cost_price ?? 0)
      return sum + (revenue - cost)
    }, 0)
  }

  // Average order value
  const avg_order_value = total_sales_count > 0 ? total_sales_revenue / total_sales_count : 0

  // Low stock count (always current)
  const { data: allInv } = await supabase.from('inventory').select('quantity, low_stock_threshold')
  const low_stock_count = (allInv ?? []).filter((item: any) => item.quantity <= item.low_stock_threshold).length

  // Dead stock: products with no sales in selected period
  let recentProductIds = new Set<string>()
  if (periodSaleIds.length > 0) {
    const { data: recentSaleItems } = await supabase
      .from('sale_items')
      .select('product_id')
      .in('sale_id', periodSaleIds)
    recentProductIds = new Set((recentSaleItems ?? []).map((i: any) => i.product_id))
  }

  const { data: allProducts } = await supabase.from('products').select('id').eq('is_active', true)
  const dead_stock_count = (allProducts ?? []).filter((p: any) => !recentProductIds.has(p.id)).length

  return {
    total_products: total_products ?? 0,
    total_inventory_value,
    total_sales_revenue,
    low_stock_count,
    last_month_revenue,
    last_month_products: total_products ?? 0,
    gross_profit,
    avg_order_value,
    total_sales_count,
    dead_stock_count,
  }
}

export async function getSalesChartData(range: '7d' | '30d' | '3m' | '6m' = '7d', startDate?: string, endDate?: string): Promise<import('@/types').SalesChartData[]> {
  // If custom date range provided, use it; otherwise use the range parameter
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    
    // Don't include future dates - cap end date to today
    const actualEnd = end > today ? today : end
    
    const days: import('@/types').SalesChartData[] = []
    
    // Calculate number of days in range (inclusive of start, exclusive of end if future)
    const daysDiff = Math.ceil((actualEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i <= daysDiff; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      
      // Skip if this date is in the future
      if (d > today) break
      
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, refunded_amount')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)

      if (error) throw new Error(error.message)

      const sales = (data ?? []).reduce(
        (sum, s) => {
          const sale = s as { total_amount: number; refunded_amount: number | null }
          return sum + (sale.total_amount - (sale.refunded_amount || 0))
        }, 0
      )

      days.push({
        date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        sales
      })
    }
    
    return days
  }
  
  // Original logic for preset ranges
  const now = new Date()
  const days: import('@/types').SalesChartData[] = []

  // Determine number of days and grouping
  const dayCount = range === '7d' ? 7 : range === '30d' ? 30 : range === '3m' ? 90 : 180

  // For 3m/6m, group by week; for 7d/30d, group by day
  const groupByWeek = range === '3m' || range === '6m'

  if (!groupByWeek) {
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, refunded_amount')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)

      if (error) throw new Error(error.message)

      const sales = (data ?? []).reduce(
        (sum, s) => {
          const sale = s as { total_amount: number; refunded_amount: number | null }
          return sum + (sale.total_amount - (sale.refunded_amount || 0))
        }, 0
      )

      const label = range === '7d'
        ? d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

      days.push({ date: label, sales })
    }
  } else {
    // Group by week
    const weeks = range === '3m' ? 12 : 24
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - i * 7)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 6)

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, refunded_amount')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())

      if (error) throw new Error(error.message)

      const sales = (data ?? []).reduce(
        (sum, s) => {
          const sale = s as { total_amount: number; refunded_amount: number | null }
          return sum + (sale.total_amount - (sale.refunded_amount || 0))
        }, 0
      )

      days.push({
        date: weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        sales,
      })
    }
  }

  return days
}

export async function getTopProductsData(startDate?: string, endDate?: string): Promise<import('@/types').TopProductData[]> {
  // Get sales in the date range
  let saleIds: string[] = []
  
  if (startDate && endDate) {
    const { data: salesInRange } = await supabase
      .from('sales')
      .select('id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
    saleIds = (salesInRange ?? []).map((s: any) => s.id)
    
    if (saleIds.length === 0) return [] // No sales in this period
  }

  // Get sale items (filtered by date if provided)
  let query = supabase
    .from('sale_items')
    .select('quantity, unit_price, products(name, image_url)')
  
  if (saleIds.length > 0) {
    query = query.in('sale_id', saleIds)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  const totals: Record<string, { units: number; revenue: number; image_url: string | null }> = {}
  for (const item of data ?? []) {
    const row = item as unknown as { quantity: number; unit_price: number; products: { name: string; image_url: string | null } | null }
    const name = row.products?.name ?? 'Unknown'
    if (!totals[name]) totals[name] = { units: 0, revenue: 0, image_url: row.products?.image_url ?? null }
    totals[name].units += row.quantity
    totals[name].revenue += row.quantity * row.unit_price
  }

  return Object.entries(totals)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 15)
    .map(([product, data]) => ({ product, sales: data.units, revenue: data.revenue, image_url: data.image_url }))
}

export async function getRecentSales(limit = 5, startDate?: string, endDate?: string): Promise<Sale[]> {
  let query = supabase
    .from('sales')
    .select('id, total_amount, notes, created_by, created_at, sale_items(id, sale_id, product_id, quantity, unit_price, subtotal, products(id, name, sku))')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Sale[]
}

export async function getRevenueChartData(startDate?: string, endDate?: string): Promise<import('@/types').RevenueChartData[]> {
  const months: import('@/types').RevenueChartData[] = []
  const now = new Date()

  // If custom date range provided, group by months within that range
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Calculate months between start and end
    const monthsInRange: Date[] = []
    let current = new Date(start.getFullYear(), start.getMonth(), 1)
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
    
    while (current <= endMonth) {
      monthsInRange.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }
    
    // Fetch data for each month in range
    for (const monthDate of monthsInRange) {
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString()
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, refunded_amount')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)

      if (error) throw new Error(error.message)

      const revenue = (data ?? []).reduce(
        (sum, s) => {
          const sale = s as { total_amount: number; refunded_amount: number | null }
          return sum + (sale.total_amount - (sale.refunded_amount || 0))
        },
        0
      )

      months.push({
        month: monthDate.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
        revenue,
      })
    }
    
    return months
  }

  // Default: last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('sales')
      .select('total_amount, refunded_amount')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    if (error) throw new Error(error.message)

    const revenue = (data ?? []).reduce(
      (sum, s) => {
        const sale = s as { total_amount: number; refunded_amount: number | null }
        return sum + (sale.total_amount - (sale.refunded_amount || 0))
      },
      0
    )

    months.push({
      month: d.toLocaleDateString('en-PH', { month: 'short' }),
      revenue,
    })
  }

  return months
}

export async function getCategoryPerformance(startDate?: string, endDate?: string): Promise<import('@/types').CategoryPerformance[]> {
  // Get sales in the date range
  let saleIds: string[] = []
  
  if (startDate && endDate) {
    const { data: salesInRange } = await supabase
      .from('sales')
      .select('id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
    saleIds = (salesInRange ?? []).map((s: any) => s.id)
    
    if (saleIds.length === 0) return [] // No sales in this period
  }

  // Get sale items (filtered by date if provided)
  let query = supabase
    .from('sale_items')
    .select('quantity, unit_price, products(name, category_id, categories(name))')
  
  if (saleIds.length > 0) {
    query = query.in('sale_id', saleIds)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  const map: Record<string, { revenue: number; units: number }> = {}
  for (const item of data ?? []) {
    const row = item as unknown as {
      quantity: number
      unit_price: number
      products: { categories: { name: string } | null } | null
    }
    const cat = row.products?.categories?.name ?? 'Uncategorized'
    if (!map[cat]) map[cat] = { revenue: 0, units: 0 }
    map[cat].revenue += row.quantity * row.unit_price
    map[cat].units += row.quantity
  }

  return Object.entries(map)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([category, d]) => ({ category, revenue: d.revenue, units: d.units }))
}

export async function getDeadStock(startDate?: string, endDate?: string): Promise<import('@/types').DeadStockItem[]> {
  const now = new Date()
  const periodStart = startDate ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const periodEnd = endDate ?? now.toISOString()

  // Get all products with inventory
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, cost_price, inventory(quantity)')
    .eq('is_active', true)

  // Get sales in the period, then their product IDs via sale_items
  const { data: recentSalesData } = await supabase
    .from('sales')
    .select('id')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)
  const recentSaleIds = (recentSalesData ?? []).map((s: any) => s.id)

  const recentMap: Record<string, boolean> = {}
  if (recentSaleIds.length > 0) {
    const { data: recentItemsData } = await supabase
      .from('sale_items').select('product_id').in('sale_id', recentSaleIds)
    for (const item of recentItemsData ?? []) recentMap[(item as any).product_id] = true
  }

  // Get last sale date per product: join sales (has created_at) with sale_items
  const { data: allSalesOrdered } = await supabase
    .from('sales').select('id, created_at').order('created_at', { ascending: false })
  const { data: allSaleItemsData } = await supabase
    .from('sale_items').select('product_id, sale_id')

  const saleCreatedAt: Record<string, string> = {}
  for (const s of allSalesOrdered ?? []) saleCreatedAt[(s as any).id] = (s as any).created_at

  const lastSaleMap: Record<string, string> = {}
  for (const item of allSaleItemsData ?? []) {
    const row = item as any
    const saleDate = saleCreatedAt[row.sale_id]
    const existingDate = lastSaleMap[row.product_id]
    if (saleDate && (!existingDate || saleDate > existingDate)) {
      lastSaleMap[row.product_id] = saleDate
    }
  }

  const dead: import('@/types').DeadStockItem[] = []
  for (const p of products ?? []) {
    const row = p as unknown as { id: string; name: string; sku: string; cost_price: number; inventory: { quantity: number }[] }
    const qty = row.inventory?.[0]?.quantity ?? 0
    if (qty === 0) continue
    if (recentMap[row.id]) continue

    const lastSale = lastSaleMap[row.id]
    const daysSince = lastSale
      ? Math.floor((now.getTime() - new Date(lastSale).getTime()) / (1000 * 60 * 60 * 24))
      : null

    dead.push({
      product: row.name,
      sku: row.sku,
      quantity: qty,
      value: qty * row.cost_price,
      days_since_last_sale: daysSince,
    })
  }

  return dead.sort((a, b) => (b.days_since_last_sale ?? 999) - (a.days_since_last_sale ?? 999))
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createCustomer(customer: CustomerCreate): Promise<Customer> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('customers')
    .insert({ ...customer, created_by: session.user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCustomer(id: string, customer: CustomerUpdate): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  // Soft delete - mark as inactive
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getCreditSales(customerId?: string): Promise<CreditSale[]> {
  let query = supabase
    .from('credit_sales')
    .select('*, customers(id, name, business_name), sales(id, total_amount, created_at)')
    .order('created_at', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPayments(customerId?: string): Promise<Payment[]> {
  let query = supabase
    .from('payments')
    .select('*, customers(id, name), credit_sales(id, amount)')
    .order('payment_date', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data ?? []
}
