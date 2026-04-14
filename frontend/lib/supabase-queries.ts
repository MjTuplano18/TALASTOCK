import { supabase } from './supabase'
import type { Category, Product, ProductCreate, ProductUpdate, InventoryItem, StockMovement, Sale, SaleCreate } from '@/types'

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
    .select('id, product_id, quantity, low_stock_threshold, updated_at, products(id, name, sku, cost_price)')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as InventoryItem[]
}

export async function getLowStockProducts(): Promise<InventoryItem[]> {
  // Supabase doesn't support column-to-column comparisons, so fetch all and filter client-side
  const { data, error } = await supabase
    .from('inventory')
    .select('id, product_id, quantity, low_stock_threshold, updated_at, products(id, name, sku, cost_price)')

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
    .select('id, total_amount, notes, created_by, created_at, sale_items(id, sale_id, product_id, quantity, unit_price, subtotal, products(id, name, sku))')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Sale[]
}

export async function createSale(data: SaleCreate, userId: string): Promise<Sale> {
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
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({ total_amount: totalAmount, notes: data.notes ?? null, created_by: userId })
    .select('id, total_amount, notes, created_by, created_at')
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

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<import('@/types').DashboardMetrics> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const { count: total_products, error: prodError } = await supabase
    .from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)
  if (prodError) throw new Error(prodError.message)

  const { data: invData, error: invError } = await supabase
    .from('inventory').select('quantity, products!inner(cost_price, is_active)').eq('products.is_active', true)
  if (invError) throw new Error(invError.message)

  const total_inventory_value = (invData ?? []).reduce((sum, item) => {
    const row = item as unknown as { quantity: number; products: { cost_price: number } }
    return sum + row.quantity * row.products.cost_price
  }, 0)

  const { data: salesData } = await supabase.from('sales').select('total_amount')
    .gte('created_at', monthStart).lte('created_at', monthEnd)
  const total_sales_revenue = (salesData ?? []).reduce((sum, s) => sum + (s as any).total_amount, 0)

  const { data: lastSalesData } = await supabase.from('sales').select('total_amount')
    .gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd)
  const last_month_revenue = (lastSalesData ?? []).reduce((sum, s) => sum + (s as any).total_amount, 0)

  const { data: allInv } = await supabase.from('inventory').select('quantity, low_stock_threshold')
  const low_stock_count = (allInv ?? []).filter((item: any) => item.quantity <= item.low_stock_threshold).length

  // Last month product count (approximate — use current as baseline)
  const last_month_products = total_products ?? 0

  return {
    total_products: total_products ?? 0,
    total_inventory_value,
    total_sales_revenue,
    low_stock_count,
    last_month_revenue,
    last_month_products,
  }
}

export async function getSalesChartData(range: '7d' | '30d' | '3m' | '6m' = '7d'): Promise<import('@/types').SalesChartData[]> {
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
        .select('total_amount')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)

      if (error) throw new Error(error.message)

      const sales = (data ?? []).reduce(
        (sum, s) => sum + (s as { total_amount: number }).total_amount, 0
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
        .select('total_amount')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())

      if (error) throw new Error(error.message)

      const sales = (data ?? []).reduce(
        (sum, s) => sum + (s as { total_amount: number }).total_amount, 0
      )

      days.push({
        date: weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        sales,
      })
    }
  }

  return days
}

export async function getTopProductsData(): Promise<import('@/types').TopProductData[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select('quantity, unit_price, products(name, image_url)')

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
    .sort((a, b) => b[1].units - a[1].units)
    .slice(0, 5)
    .map(([product, data]) => ({ product, sales: data.units, revenue: data.revenue, image_url: data.image_url }))
}

export async function getRecentSales(limit = 5): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total_amount, notes, created_by, created_at, sale_items(id, sale_id, product_id, quantity, unit_price, subtotal, products(id, name, sku))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Sale[]
}

export async function getRevenueChartData(): Promise<import('@/types').RevenueChartData[]> {
  const months: import('@/types').RevenueChartData[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    if (error) throw new Error(error.message)

    const revenue = (data ?? []).reduce(
      (sum, s) => sum + (s as { total_amount: number }).total_amount,
      0
    )

    months.push({
      month: d.toLocaleDateString('en-PH', { month: 'short' }),
      revenue,
    })
  }

  return months
}
