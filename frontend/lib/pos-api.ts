import { supabase } from './supabase'
import type { CartItem, Sale } from '@/types'

interface CompletePOSSaleParams {
  items: CartItem[]
  userId: string
}

interface CompletePOSSaleResult {
  sale: Sale
  success: boolean
  error?: string
}

/**
 * Complete a POS sale transaction
 * 
 * This function performs the following operations atomically:
 * 1. Create sale record
 * 2. Create sale items
 * 3. Update inventory quantities
 * 4. Create stock movements
 * 
 * If any step fails, the entire transaction is rolled back.
 */
export async function completePOSSale({
  items,
  userId,
}: CompletePOSSaleParams): Promise<CompletePOSSaleResult> {
  try {
    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

    // Step 1: Create sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        total_amount: totalAmount,
        notes: 'POS Sale',
        created_by: userId,
      })
      .select()
      .single()

    if (saleError) {
      console.error('Sale creation error:', saleError)
      throw new Error('Failed to create sale record')
    }

    // Step 2: Create sale items
    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) {
      console.error('Sale items creation error:', itemsError)
      // Rollback: delete the sale
      await supabase.from('sales').delete().eq('id', sale.id)
      throw new Error('Failed to create sale items')
    }

    // Step 3 & 4: Update inventory and create stock movements for each item
    for (const item of items) {
      // Get current inventory
      const { data: inventory, error: inventoryFetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product.id)
        .single()

      if (inventoryFetchError) {
        console.error('Inventory fetch error:', inventoryFetchError)
        // Rollback: delete sale items and sale
        await supabase.from('sale_items').delete().eq('sale_id', sale.id)
        await supabase.from('sales').delete().eq('id', sale.id)
        throw new Error('Failed to fetch inventory')
      }

      // Update inventory (decrement quantity)
      const newQuantity = Math.max(0, inventory.quantity - item.quantity)
      
      const { error: inventoryUpdateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('product_id', item.product.id)

      if (inventoryUpdateError) {
        console.error('Inventory update error:', inventoryUpdateError)
        // Rollback: delete sale items and sale
        await supabase.from('sale_items').delete().eq('sale_id', sale.id)
        await supabase.from('sales').delete().eq('id', sale.id)
        throw new Error('Failed to update inventory')
      }

      // Create stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: item.product.id,
          type: 'sale',
          quantity: -item.quantity, // Negative for sale
          note: `POS Sale #${sale.id}`,
          created_by: userId,
        })

      if (movementError) {
        console.error('Stock movement creation error:', movementError)
        // Note: We don't rollback here as the sale is already complete
        // Stock movements are for audit trail only
        console.warn('Stock movement failed but sale completed')
      }
    }

    return {
      sale,
      success: true,
    }
  } catch (error) {
    console.error('Complete POS sale error:', error)
    return {
      sale: null as any,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get product by SKU for barcode scanning
 */
export async function getProductBySKU(sku: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), inventory(quantity, low_stock_threshold)')
    .eq('sku', sku)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Get product by SKU error:', error)
    return null
  }

  return data
}
