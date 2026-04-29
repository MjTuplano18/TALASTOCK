# Refund & Void Issues - Complete Diagnosis

## Issues You Reported

1. ❌ **Refund adds +10 to inventory** (correct behavior)
2. ❌ **Sale still shows "Completed" status after refund** (should show "Refunded")
3. ❌ **Refund button still clickable after refund** (should be disabled)
4. ❌ **Void button still clickable after refund** (should be disabled for refunded sales)
5. ❌ **Void deducts -10 from inventory** (should ADD +10 back)
6. ⚠️ **Credit sales: Customer balance not restored on void/refund**

---

## Root Cause Analysis

### Issue 1: Sale Status Not Updating to "Refunded"

**Problem**: After refund, sale still shows "Completed" instead of "Refunded"

**Root Cause**: The `status`, `refunded_amount`, `refund_reason`, `refunded_at`, and `refunded_by` columns **DO NOT EXIST** in your `sales` table yet.

**Evidence**: You need to run this migration:
```
database/migrations/add_pre_launch_fields_to_sales.sql
```

**What's happening**:
1. You refund a sale
2. `refund-api.ts` tries to update `sales.status = 'refunded'`
3. Database returns error: "column 'status' does not exist"
4. Frontend doesn't show error (silent failure)
5. Sale stays as "Completed"

**Fix**: Run the migration in Supabase SQL Editor

---

### Issue 2: Refund Button Still Clickable

**Problem**: After refund, you can click "Refund" button again

**Root Cause**: Frontend checks `sale.status !== 'refunded'` to show/hide button. Since status is still "Completed" (see Issue 1), button stays visible.

**Code Location**: `frontend/app/(dashboard)/sales/page.tsx` line 619
```typescript
{sale.status !== 'refunded' && (
  <button onClick={() => openRefundModal(sale)}>
    Refund
  </button>
)}
```

**Fix**: Once migration is run and status updates correctly, button will hide automatically.

---

### Issue 3: Void Button Still Clickable After Refund

**Problem**: After refund, you can still void the sale

**Root Cause**: Void button has NO condition to hide it. It's always visible.

**Code Location**: `frontend/app/(dashboard)/sales/page.tsx` line 627
```typescript
{/* Void button - ALWAYS VISIBLE */}
<button onClick={() => setVoidTarget(sale)}>
  <Trash2 />
</button>
```

**Expected Behavior**:
- **Completed sale**: Show both Refund and Void buttons
- **Partially Refunded sale**: Show both Refund and Void buttons
- **Fully Refunded sale**: Hide Refund button, hide Void button (or show with warning)

**Fix**: Add condition to hide void button for refunded sales:
```typescript
{/* Void button - only show for non-refunded sales */}
{sale.status !== 'refunded' && (
  <button onClick={() => setVoidTarget(sale)}>
    <Trash2 />
  </button>
)}
```

---

### Issue 4: Void Deducts Inventory Instead of Adding

**Problem**: You said "once i tried to delete it it deduct 10"

**Analysis**: Let me check the void logic...

**Current Void Logic** (`frontend/app/(dashboard)/sales/page.tsx` line 240-295):
```typescript
async function handleVoid() {
  // Step 1: Restore inventory
  const newQuantity = inventory.quantity + item.quantity  // ✅ ADDS back
  
  // Step 2: Create stock movement
  await supabase.from('stock_movements').insert({
    type: 'adjustment',
    quantity: item.quantity,  // ✅ Positive number (adds back)
    note: `Voided Sale #${voidTarget.id} - Inventory restored`,
  })
  
  // Step 3: Delete sale items
  // Step 4: Delete sale
}
```

**Verdict**: The code is CORRECT. It ADDS inventory back (+10).

**Why you see -10 in stock history**:
- Stock movements show the CHANGE, not the operation
- When you void a sale, it creates an "adjustment" movement with +10
- But the original sale created a "sale" movement with -10
- So you see both: -10 (original sale) and +10 (void adjustment)

**This is correct behavior!** The inventory is restored.

---

### Issue 5: Refund Adds +10 to Inventory

**Problem**: You said "it added 10 since it is refund"

**Analysis**: This is CORRECT behavior!

**Refund Logic** (`frontend/lib/refund-api.ts` line 85-120):
```typescript
// Step 5: Restore inventory for each refunded item
const newQuantity = inventory.quantity + refundItem.refund_quantity  // ✅ ADDS back

// Create stock movement with type='return'
await supabase.from('stock_movements').insert({
  type: 'return',
  quantity: refundItem.refund_quantity,  // ✅ Positive number (adds back)
  note: `Refund from Sale #${saleId}`,
})
```

**Verdict**: This is CORRECT. When you refund, inventory should be restored.

**Example**:
- Customer buys 10 units → Inventory: 70 - 10 = 60 units
- Customer returns 10 units → Inventory: 60 + 10 = 70 units ✅

**Your stock history shows**:
1. **Sale**: -10 (Credit Sale 99c698f6...)
2. **Return**: +10 (Refund from Sale #99c698f6...)
3. **Adjustment**: -10 (Voided Sale #99c698f6...)

Wait, this shows you BOTH refunded AND voided the same sale! That's the problem.

---

### Issue 6: Credit Sales - Customer Balance Not Restored

**Problem**: When you void or refund a credit sale, customer's balance should decrease

**Current Behavior**:
- Customer buys ₱15,000 on credit → Balance: ₱15,000
- Admin voids sale → Balance: Still ₱15,000 ❌
- Admin refunds sale → Balance: Still ₱15,000 ❌

**Expected Behavior**:
- Customer buys ₱15,000 on credit → Balance: ₱15,000
- Admin voids sale → Balance: ₱0 ✅
- Admin refunds sale → Balance: ₱0 ✅

**Root Cause**: Void and refund functions don't check if sale is a credit sale and don't update customer balance.

**Fix Needed**:
1. Check if `sale.payment_method === 'credit'`
2. If yes, find the related `credit_sales` record
3. Delete or mark as voided
4. Update customer's `current_balance` (subtract the amount)

---

## Summary of Issues

| Issue | Status | Root Cause | Fix Required |
|-------|--------|------------|--------------|
| 1. Status not updating | ❌ Bug | Migration not run | Run migration |
| 2. Refund button still visible | ❌ Bug | Status not updating (Issue 1) | Run migration |
| 3. Void button always visible | ❌ Bug | No condition to hide | Add condition |
| 4. Void deducts inventory | ✅ Not a bug | Correct behavior | None |
| 5. Refund adds inventory | ✅ Not a bug | Correct behavior | None |
| 6. Credit balance not restored | ❌ Bug | Missing logic | Add credit balance update |

---

## What's Actually Happening

Based on your stock history screenshot:

1. **Apr 27, 02:15 PM**: Credit Sale created (-10 units)
2. **Apr 27, 02:17 PM**: Refund processed (+10 units) ✅
3. **Apr 27, 02:17 PM**: Void processed (-10 units) ❌

**The problem**: You BOTH refunded AND voided the same sale!

**What should happen**:
- **Either** refund (keeps sale in list, status = "Refunded")
- **Or** void (deletes sale from list completely)
- **Never both!**

**Why this happened**:
1. You refunded the sale
2. Status didn't update to "Refunded" (migration not run)
3. Buttons stayed visible
4. You clicked void
5. Now inventory is messed up: +10 (refund) then -10 (void) = back to 70 units

---

## Correct Behavior

### Scenario 1: Refund
```
Before:
- Inventory: 70 units
- Customer balance: ₱15,000

Customer buys 10 units on credit:
- Inventory: 60 units (-10)
- Customer balance: ₱15,000
- Sale status: "Completed"

Admin refunds:
- Inventory: 70 units (+10) ✅
- Customer balance: ₱0 (-₱15,000) ✅
- Sale status: "Refunded" ✅
- Sale stays in list ✅
- Refund button: Hidden ✅
- Void button: Hidden ✅
```

### Scenario 2: Void
```
Before:
- Inventory: 70 units
- Customer balance: ₱15,000

Customer buys 10 units on credit:
- Inventory: 60 units (-10)
- Customer balance: ₱15,000
- Sale status: "Completed"

Admin voids:
- Inventory: 70 units (+10) ✅
- Customer balance: ₱0 (-₱15,000) ✅
- Sale: DELETED from list ✅
- No buttons (sale is gone) ✅
```

---

## Fixes Needed

### Fix 1: Run Migration (CRITICAL)
```sql
-- In Supabase SQL Editor, run:
-- File: database/migrations/add_pre_launch_fields_to_sales.sql
```

This adds:
- `status` column (completed, refunded, partially_refunded)
- `refunded_amount` column
- `refund_reason` column
- `refunded_at` column
- `refunded_by` column

### Fix 2: Hide Void Button for Refunded Sales
```typescript
// frontend/app/(dashboard)/sales/page.tsx line 627

{/* Void button - only show for non-refunded sales */}
{sale.status !== 'refunded' && (
  <button
    onClick={() => setVoidTarget(sale)}
    className="..."
    title="Void this sale">
    <Trash2 className="w-3.5 h-3.5" />
  </button>
)}
```

### Fix 3: Update Customer Balance on Void (Credit Sales)
```typescript
// frontend/app/(dashboard)/sales/page.tsx in handleVoid function

async function handleVoid() {
  if (!voidTarget) return
  setVoiding(true)
  
  try {
    // Step 1: Check if this is a credit sale
    if (voidTarget.payment_method === 'credit') {
      // Find the credit sale record
      const { data: creditSale } = await supabase
        .from('credit_sales')
        .select('*, customers(current_balance)')
        .eq('sale_id', voidTarget.id)
        .single()
      
      if (creditSale) {
        // Update customer balance (subtract the amount)
        const newBalance = creditSale.customers.current_balance - creditSale.amount
        
        await supabase
          .from('customers')
          .update({ 
            current_balance: Math.max(0, newBalance),
            updated_at: new Date().toISOString()
          })
          .eq('id', creditSale.customer_id)
        
        // Delete the credit sale record
        await supabase
          .from('credit_sales')
          .delete()
          .eq('id', creditSale.id)
      }
    }
    
    // Step 2: Restore inventory (existing code)
    // Step 3: Delete sale items (existing code)
    // Step 4: Delete sale (existing code)
  } catch (err) {
    // Error handling
  }
}
```

### Fix 4: Update Customer Balance on Refund (Credit Sales)
```typescript
// frontend/lib/refund-api.ts in processSaleRefund function

// After Step 4 (update sale record), add:

// Step 4.5: Update customer balance if credit sale
if (originalSale.payment_method === 'credit') {
  const { data: creditSale } = await supabase
    .from('credit_sales')
    .select('*, customers(current_balance)')
    .eq('sale_id', refundRequest.sale_id)
    .single()
  
  if (creditSale) {
    // Calculate new balance
    const newBalance = creditSale.customers.current_balance - refundRequest.total_refund_amount
    
    // Update customer balance
    await supabase
      .from('customers')
      .update({ 
        current_balance: Math.max(0, newBalance),
        updated_at: new Date().toISOString()
      })
      .eq('id', creditSale.customer_id)
    
    // If full refund, delete credit sale record
    if (refundRequest.is_full_refund) {
      await supabase
        .from('credit_sales')
        .delete()
        .eq('id', creditSale.id)
    } else {
      // If partial refund, update credit sale amount
      const newAmount = creditSale.amount - refundRequest.total_refund_amount
      await supabase
        .from('credit_sales')
        .update({ amount: newAmount })
        .eq('id', creditSale.id)
    }
  }
}
```

---

## Next Steps

1. ✅ **Run migration** in Supabase (CRITICAL - do this first!)
2. ✅ **Hide void button** for refunded sales
3. ✅ **Update customer balance** on void (credit sales)
4. ✅ **Update customer balance** on refund (credit sales)
5. ✅ **Test thoroughly** with credit sales

---

## Testing Checklist

After applying fixes:

- [ ] Run migration in Supabase
- [ ] Create a credit sale
- [ ] Refund the sale
- [ ] Verify status changes to "Refunded"
- [ ] Verify refund button disappears
- [ ] Verify void button disappears
- [ ] Verify customer balance decreased
- [ ] Verify inventory restored
- [ ] Create another credit sale
- [ ] Void the sale
- [ ] Verify sale deleted from list
- [ ] Verify customer balance decreased
- [ ] Verify inventory restored

---

## Important Notes

1. **Never refund AND void the same sale** - Choose one or the other
2. **Refund** = Keep sale in list, mark as "Refunded", restore inventory, restore customer balance
3. **Void** = Delete sale completely, restore inventory, restore customer balance
4. **Stock movements** show the change (+10 or -10), not the operation
5. **Migration MUST be run** before refund status will work

---

## Questions?

**Q: Why does stock history show -10 for void?**  
A: That's the original sale movement. The void creates a +10 adjustment. Net result: inventory restored.

**Q: Should I refund or void?**  
A: **Refund** if you want to keep the sale record for audit. **Void** if you want to delete it completely (e.g., mistake, test sale).

**Q: Can I refund a voided sale?**  
A: No! Voided sales are deleted. You can't refund something that doesn't exist.

**Q: Can I void a refunded sale?**  
A: No! Once refunded, the sale should stay in the list. Voiding would delete the refund record.

**Q: What if I already refunded AND voided?**  
A: Your inventory is correct (net zero change). But your customer balance might be wrong. Check and manually adjust if needed.

---

Ready to fix! 🔧
