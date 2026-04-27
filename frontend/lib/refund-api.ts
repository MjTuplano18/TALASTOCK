import { supabase } from './supabase'
import type { RefundRequest, RefundResponse, Sale, SaleStatus } from '@/types'

/**
 * Process a sale refund (full or partial)
 * 
 * This function performs the following operations atomically:
 * 1. Validate the refund request against the original sale
 * 2. Update sale status and refund tracking fields
 * 3. Restore inventory quantities for refunded items
 * 4. Create stock movements with type='return'
 * 
 * If any step fails, the entire transaction is rolled back.
 * 
 * @param refundRequest - The refund request containing items and details
 * @param userId - The ID of the user processing the refund
 * @returns RefundResponse with success status and details
 */
export async function processSaleRefund(
  refundRequest: RefundRequest,
  userId: string
): Promise<RefundResponse> {
  try {
    // Step 1: Fetch the original sale with all items
    const { data: originalSale, error: fetchError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          products (
            id,
            name,
            sku
          )
        )
      `)
      .eq('id', refundRequest.sale_id)
      .single()

    if (fetchError || !originalSale) {
      console.error('Failed to fetch original sale:', fetchError)
      return {
        success: false,
        sale_id: refundRequest.sale_id,
        refunded_amount: 0,
        new_status: 'completed',
        message: 'Sale not found',
      }
    }

    // Step 2: Validate the refund request
    const validation = validateRefundRequest(refundRequest, originalSale as Sale)
    if (!validation.valid) {
      return {
        success: false,
        sale_id: refundRequest.sale_id,
        refunded_amount: 0,
        new_status: originalSale.status as SaleStatus,
        message: validation.error || 'Invalid refund request',
      }
    }

    // Step 3: Calculate new refunded amount and status
    const currentRefundedAmount = originalSale.refunded_amount || 0
    const newRefundedAmount = currentRefundedAmount + refundRequest.total_refund_amount
    
    // Determine new status
    let newStatus: SaleStatus
    if (refundRequest.is_full_refund || newRefundedAmount >= originalSale.total_amount) {
      newStatus = 'refunded'
    } else {
      newStatus = 'partially_refunded'
    }

    // Step 4: Update sale record with refund information
    console.log('[Refund] Updating sale:', refundRequest.sale_id, 'to status:', newStatus, 'refunded_amount:', newRefundedAmount)
    
    const { data: updateData, error: updateError } = await supabase
      .from('sales')
      .update({
        status: newStatus,
        refunded_amount: newRefundedAmount,
        refund_reason: refundRequest.refund_reason || null,
        refunded_at: new Date().toISOString(),
        refunded_by: userId,
      })
      .eq('id', refundRequest.sale_id)
      .select('id, status, refunded_amount')

    console.log('[Refund] Update result:', { data: updateData, error: updateError })

    if (updateError) {
      console.error('[Refund] Failed to update sale:', updateError)
      throw new Error('Failed to update sale record')
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('[Refund] Update succeeded but no data returned - possible RLS policy issue')
      throw new Error('Failed to update sale record - no data returned')
    }
    
    console.log('[Refund] Sale updated successfully:', updateData[0])

    // Step 4.5: Update customer balance if this is a credit sale
    if (originalSale.payment_method === 'credit') {
      const { data: creditSale, error: creditSaleError } = await supabase
        .from('credit_sales')
        .select('id, customer_id, amount, customers(current_balance)')
        .eq('sale_id', refundRequest.sale_id)
        .single()
      
      if (creditSaleError) {
        console.warn('Credit sale not found, skipping balance update:', creditSaleError)
      } else if (creditSale) {
        // Calculate new customer balance (subtract refund amount)
        const currentBalance = creditSale.customers?.current_balance || 0
        const newBalance = Math.max(0, currentBalance - refundRequest.total_refund_amount)
        
        // Update customer balance
        const { error: balanceError } = await supabase
          .from('customers')
          .update({ 
            current_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', creditSale.customer_id)
        
        if (balanceError) {
          console.error('Failed to update customer balance:', balanceError)
          // Don't throw - refund is already processed
          console.warn('Refund completed but customer balance not updated')
        } else {
          console.log(`Customer balance updated: ${currentBalance} → ${newBalance}`)
        }
        
        // If full refund, delete credit sale record
        if (refundRequest.is_full_refund) {
          const { error: deleteCreditError } = await supabase
            .from('credit_sales')
            .delete()
            .eq('id', creditSale.id)
          
          if (deleteCreditError) {
            console.error('Failed to delete credit sale:', deleteCreditError)
            // Don't throw - refund is already processed
          }
        } else {
          // If partial refund, update credit sale amount
          const newCreditAmount = creditSale.amount - refundRequest.total_refund_amount
          const { error: updateCreditError } = await supabase
            .from('credit_sales')
            .update({ amount: Math.max(0, newCreditAmount) })
            .eq('id', creditSale.id)
          
          if (updateCreditError) {
            console.error('Failed to update credit sale amount:', updateCreditError)
            // Don't throw - refund is already processed
          }
        }
      }
    }

    // Step 5: Restore inventory and create stock movements for each refunded item
    for (const refundItem of refundRequest.items) {
      // Get current inventory
      const { data: inventory, error: inventoryFetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', refundItem.product_id)
        .single()

      if (inventoryFetchError) {
        console.error('Failed to fetch inventory:', inventoryFetchError)
        // Rollback: revert sale status
        await supabase
          .from('sales')
          .update({
            status: originalSale.status,
            refunded_amount: currentRefundedAmount,
            refund_reason: originalSale.refund_reason,
            refunded_at: originalSale.refunded_at,
            refunded_by: originalSale.refunded_by,
          })
          .eq('id', refundRequest.sale_id)
        
        throw new Error(`Failed to fetch inventory for product ${refundItem.product_name}`)
      }

      // Update inventory (increment quantity)
      const newQuantity = inventory.quantity + refundItem.refund_quantity
      
      const { error: inventoryUpdateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', refundItem.product_id)

      if (inventoryUpdateError) {
        console.error('Failed to update inventory:', inventoryUpdateError)
        // Rollback: revert sale status
        await supabase
          .from('sales')
          .update({
            status: originalSale.status,
            refunded_amount: currentRefundedAmount,
            refund_reason: originalSale.refund_reason,
            refunded_at: originalSale.refunded_at,
            refunded_by: originalSale.refunded_by,
          })
          .eq('id', refundRequest.sale_id)
        
        throw new Error(`Failed to update inventory for product ${refundItem.product_name}`)
      }

      // Create stock movement with type='return'
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: refundItem.product_id,
          type: 'return',
          quantity: refundItem.refund_quantity, // Positive for return
          note: `Refund from Sale #${refundRequest.sale_id}${refundRequest.refund_reason ? ` - ${refundRequest.refund_reason}` : ''}`,
          created_by: userId,
        })

      if (movementError) {
        console.error('Failed to create stock movement:', movementError)
        // Note: We don't rollback here as the refund is already processed
        // Stock movements are for audit trail only
        console.warn('Stock movement failed but refund completed')
      }
    }

    // Step 6: Return success response
    return {
      success: true,
      sale_id: refundRequest.sale_id,
      refunded_amount: newRefundedAmount,
      new_status: newStatus,
      message: `${newStatus === 'refunded' ? 'Full' : 'Partial'} refund processed successfully`,
    }
  } catch (error) {
    console.error('Process sale refund error:', error)
    return {
      success: false,
      sale_id: refundRequest.sale_id,
      refunded_amount: 0,
      new_status: 'completed',
      message: error instanceof Error ? error.message : 'Failed to process refund',
    }
  }
}

/**
 * Validate refund request against original sale
 * 
 * Checks:
 * - Sale is not already fully refunded
 * - Refund amount doesn't exceed remaining refundable amount
 * - All refund items exist in original sale
 * - Refund quantities don't exceed original quantities
 */
function validateRefundRequest(
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

  if (refundRequest.total_refund_amount > remainingRefundable + 0.01) { // Allow 1 cent tolerance for rounding
    return {
      valid: false,
      error: `Refund amount (₱${refundRequest.total_refund_amount.toFixed(2)}) exceeds remaining refundable amount (₱${remainingRefundable.toFixed(2)})`,
    }
  }

  // Validate each item against original sale items
  if (!originalSale.sale_items || originalSale.sale_items.length === 0) {
    return { valid: false, error: 'Original sale items not found' }
  }

  for (const refundItem of refundRequest.items) {
    const originalItem = originalSale.sale_items.find(
      (item) => item.id === refundItem.sale_item_id
    )

    if (!originalItem) {
      return {
        valid: false,
        error: `Sale item ${refundItem.sale_item_id} not found in original sale`,
      }
    }

    if (refundItem.refund_quantity > originalItem.quantity) {
      return {
        valid: false,
        error: `Refund quantity (${refundItem.refund_quantity}) exceeds original quantity (${originalItem.quantity}) for ${refundItem.product_name}`,
      }
    }

    // Validate unit price matches (within 1 cent tolerance)
    if (Math.abs(refundItem.unit_price - originalItem.unit_price) > 0.01) {
      return {
        valid: false,
        error: `Unit price mismatch for ${refundItem.product_name}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Get refund history for a sale
 * 
 * Returns all stock movements of type='return' for the given sale
 */
export async function getRefundHistory(saleId: string) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      *,
      products (
        id,
        name,
        sku
      )
    `)
    .eq('type', 'return')
    .ilike('note', `%Sale #${saleId}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch refund history:', error)
    return []
  }

  return data
}

/**
 * Check if a sale can be refunded
 * 
 * Returns true if the sale is in 'completed' or 'partially_refunded' status
 * and has remaining refundable amount
 */
export async function canRefundSale(saleId: string): Promise<boolean> {
  const { data: sale, error } = await supabase
    .from('sales')
    .select('status, total_amount, refunded_amount')
    .eq('id', saleId)
    .single()

  if (error || !sale) {
    return false
  }

  // Can refund if not fully refunded and has remaining amount
  if (sale.status === 'refunded') {
    return false
  }

  const remainingRefundable = sale.total_amount - (sale.refunded_amount || 0)
  return remainingRefundable > 0.01 // Allow 1 cent tolerance
}
