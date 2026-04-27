# Void vs Refund - Complete Explanation

## Overview

Talastock has two ways to handle sales that need to be reversed:
1. **VOID (Delete)** - For mistakes/errors
2. **REFUND** - For legitimate returns

## 🗑️ VOID (Delete)

### What It Does

1. ✅ **Restores inventory** - Adds quantities back to stock
2. ✅ **Deletes the sale** - Completely removes from database
3. ✅ **Creates audit trail** - Stock movement records the void
4. ✅ **Removes from list** - Sale disappears from Sales page

### When to Use

- **Mistake:** Sale was recorded by accident
- **Duplicate:** Same sale was entered twice
- **Test:** Testing the system
- **Error:** Wrong customer, wrong items, wrong amount

### What Happens

```
Before Void:
- Sale: ₱100 (2 items)
- Inventory: Product A = 10 units

After Void:
- Sale: DELETED (no record)
- Inventory: Product A = 12 units (restored)
- Stock Movement: "Voided Sale #123 - Inventory restored"
```

### Important Notes

- ⚠️ **Cannot be undone** - Sale is permanently deleted
- ✅ **Inventory is restored** - Quantities added back automatically
- ✅ **Audit trail preserved** - Stock movements show the void
- ❌ **No financial record** - Sale is completely removed

---

## 🔄 REFUND

### What It Does

1. ✅ **Restores inventory** - Adds quantities back to stock
2. ✅ **Updates sale status** - Changes to "Refunded" or "Partially Refunded"
3. ✅ **Keeps the sale** - Remains in database for records
4. ✅ **Stays in list** - Sale remains visible with "Refunded" badge
5. ✅ **Tracks refund amount** - Shows how much was refunded

### When to Use

- **Customer return:** Customer returns product
- **Defective item:** Product was damaged/defective
- **Wrong item:** Customer received wrong product
- **Change of mind:** Customer doesn't want the product
- **Partial return:** Customer returns some items, not all

### What Happens

```
Before Refund:
- Sale: ₱100 (2 items) - Status: Completed
- Inventory: Product A = 10 units

After Full Refund:
- Sale: ₱100 (2 items) - Status: Refunded, Refunded Amount: ₱100
- Inventory: Product A = 12 units (restored)
- Stock Movement: "Refund from Sale #123"

After Partial Refund (1 item):
- Sale: ₱100 (2 items) - Status: Partially Refunded, Refunded Amount: ₱50
- Inventory: Product A = 11 units (1 item restored)
- Stock Movement: "Refund from Sale #123"
```

### Important Notes

- ✅ **Can be undone** - Sale record is preserved
- ✅ **Inventory is restored** - Quantities added back automatically
- ✅ **Financial record kept** - Sale remains for accounting
- ✅ **Audit trail complete** - All refund details are tracked
- ✅ **Partial refunds supported** - Can refund some items, not all

---

## 📊 Comparison Table

| Feature | VOID (Delete) | REFUND |
|---------|---------------|--------|
| **Restores Inventory** | ✅ Yes | ✅ Yes |
| **Keeps Sale Record** | ❌ No (deleted) | ✅ Yes |
| **Visible in Sales List** | ❌ No (removed) | ✅ Yes (with badge) |
| **Financial Record** | ❌ No | ✅ Yes |
| **Audit Trail** | ✅ Stock movements only | ✅ Complete |
| **Can Undo** | ❌ No | ✅ Yes (record preserved) |
| **Partial Support** | ❌ No (all or nothing) | ✅ Yes |
| **Use Case** | Mistakes/errors | Legitimate returns |

---

## 🎯 Decision Guide

### Use VOID when:
- ❌ Sale was entered by mistake
- ❌ Duplicate entry
- ❌ Testing the system
- ❌ Wrong customer/items/amount
- ❌ You want to completely remove the sale

### Use REFUND when:
- ✅ Customer returns product
- ✅ Product is defective
- ✅ Customer changes mind
- ✅ Need to keep financial records
- ✅ Partial return (some items only)
- ✅ Need audit trail for accounting

---

## 🔍 How to Check

### After VOID:
1. Go to **Sales** page
2. ✅ Sale should be GONE from the list
3. Go to **Inventory** page
4. ✅ Product quantity should be INCREASED
5. Go to **Inventory** → Click product → View movements
6. ✅ Should see "Voided Sale #123 - Inventory restored"

### After REFUND:
1. Go to **Sales** page
2. ✅ Sale should STILL BE THERE
3. ✅ Status badge should say "Refunded" or "Partially Refunded"
4. ✅ Should show "Refunded: ₱XX.XX" under total amount
5. Go to **Inventory** page
6. ✅ Product quantity should be INCREASED
7. Go to **Inventory** → Click product → View movements
8. ✅ Should see "Refund from Sale #123"

---

## 💡 Best Practices

### For Void:
1. **Double-check** before voiding - it cannot be undone
2. **Use sparingly** - only for genuine mistakes
3. **Document** why you voided (in notes if possible)
4. **Verify inventory** was restored correctly

### For Refund:
1. **Always use refund** for customer returns
2. **Add refund reason** for audit trail
3. **Partial refunds** when customer keeps some items
4. **Check inventory** was restored correctly
5. **Keep records** for accounting/tax purposes

---

## 🐛 Troubleshooting

### Void Not Working?
1. Check browser console (F12) for errors
2. Verify you have DELETE permissions in Supabase
3. Check if sale has related records (credit sales, etc.)
4. Try refreshing the page

### Refund Not Working?
1. Check browser console (F12) for errors
2. Verify inventory table has the products
3. Check if sale is already fully refunded
4. Try refreshing the page

### Inventory Not Restored?
1. Check **Inventory** page to verify
2. Check **Stock Movements** for audit trail
3. Manually adjust if needed
4. Report bug if consistently failing

---

## 📝 Technical Details

### Void Implementation

```typescript
// 1. Restore inventory for each item
for (const item of sale.sale_items) {
  // Get current quantity
  const inventory = await supabase
    .from('inventory')
    .select('quantity')
    .eq('product_id', item.product_id)
    .single()
  
  // Add back the quantity
  await supabase
    .from('inventory')
    .update({ quantity: inventory.quantity + item.quantity })
    .eq('product_id', item.product_id)
  
  // Create stock movement
  await supabase.from('stock_movements').insert({
    product_id: item.product_id,
    type: 'adjustment',
    quantity: item.quantity,
    note: `Voided Sale #${sale.id} - Inventory restored`
  })
}

// 2. Delete sale items
await supabase.from('sale_items').delete().eq('sale_id', sale.id)

// 3. Delete sale
await supabase.from('sales').delete().eq('id', sale.id)
```

### Refund Implementation

```typescript
// 1. Update sale status and refund amount
await supabase
  .from('sales')
  .update({
    status: isFullRefund ? 'refunded' : 'partially_refunded',
    refunded_amount: currentRefunded + refundAmount,
    refund_reason: reason,
    refunded_at: new Date().toISOString(),
    refunded_by: userId
  })
  .eq('id', sale.id)

// 2. Restore inventory for each refunded item
for (const item of refundItems) {
  // Get current quantity
  const inventory = await supabase
    .from('inventory')
    .select('quantity')
    .eq('product_id', item.product_id)
    .single()
  
  // Add back the refunded quantity
  await supabase
    .from('inventory')
    .update({ quantity: inventory.quantity + item.refund_quantity })
    .eq('product_id', item.product_id)
  
  // Create stock movement
  await supabase.from('stock_movements').insert({
    product_id: item.product_id,
    type: 'return',
    quantity: item.refund_quantity,
    note: `Refund from Sale #${sale.id}`
  })
}
```

---

## 🎓 Summary

**VOID = Delete Everything + Restore Inventory**
- Use for mistakes
- Sale disappears
- Inventory restored
- No financial record

**REFUND = Keep Record + Restore Inventory**
- Use for returns
- Sale stays visible
- Inventory restored
- Financial record kept

---

**Remember:** When in doubt, use REFUND instead of VOID. It's safer because it keeps the record!
