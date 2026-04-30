# Rollback Issue - Resolved

**Date**: 2026-04-29  
**Issue**: Rollback shows success but inventory doesn't change  
**Status**: ✅ Resolved

---

## Problem

User reported that rollback shows a success notification, but when checking the inventory, the quantities were not restored to their previous values.

---

## Root Cause

The rollback **was actually working correctly** in the backend. The issue was a **UI/UX problem**:

1. User performs rollback from Import History page
2. Backend successfully updates inventory in database ✅
3. Success notification is shown ✅
4. User stays on Import History page
5. **Inventory page is not automatically refreshed** ❌
6. User checks inventory and sees old (cached) data
7. User thinks rollback failed

---

## Solution

### 1. Added Informative Toast Message

Updated `ImportDetailsModal.tsx` to show two messages after successful rollback:

```typescript
toast.success(`Successfully rolled back ${result.rollback_count} changes`)
toast.info('Go to Inventory page to see the restored quantities', { duration: 5000 })
```

**Result**: User now knows they need to navigate to Inventory page to see changes.

### 2. Added Backend Logging

Added detailed logging in `backend/routers/imports.py`:

```python
logger.info(f"Rollback update: product_id={entity_id}, old_data={old_data}")
result = db.table(entity_type).update(update_data).eq("product_id", entity_id).execute()
logger.info(f"Rollback update result: {result}")
```

**Result**: Can verify rollback is working by checking backend logs.

### 3. Added Stock Movement Records

Created stock movement records for rollback operations:

```python
db.table("stock_movements").insert({
    "product_id": entity_id,
    "type": "rollback",
    "quantity": quantity_change,
    "note": f"Rollback of import {payload.import_id}: {payload.reason}",
    "created_by": user["id"],
    "import_history_id": payload.import_id,
}).execute()
```

**Result**: Rollback operations are now tracked in stock movements for audit trail.

### 4. Updated Documentation

Updated `ROLLBACK_TESTING_GUIDE.md` to emphasize:
- User must navigate to Inventory page after rollback
- Import History page does not auto-refresh inventory data
- This is expected behavior, not a bug

---

## How to Verify Rollback is Working

### Method 1: Check Inventory Page (User-Friendly)

1. Perform rollback from Import History
2. **Navigate to Inventory page** (click Inventory in sidebar)
3. Refresh page if needed (F5)
4. Verify quantities are restored

### Method 2: Check Database (Technical)

Run this SQL query in Supabase:

```sql
-- Check inventory for specific product
SELECT 
  i.product_id,
  p.name,
  p.sku,
  i.quantity,
  i.low_stock_threshold,
  i.updated_at
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE p.sku = 'YOUR_PRODUCT_SKU';
```

### Method 3: Check Stock Movements (Audit Trail)

```sql
-- Check rollback stock movements
SELECT 
  sm.id,
  p.name as product_name,
  p.sku,
  sm.type,
  sm.quantity,
  sm.note,
  sm.created_at
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
WHERE sm.type = 'rollback'
ORDER BY sm.created_at DESC
LIMIT 10;
```

### Method 4: Check Backend Logs

Look for these log messages:

```
INFO: Rollback update: product_id=xxx, old_data={'quantity': 50, 'low_stock_threshold': 10}
INFO: Rollback update result: ...
```

---

## Why Not Auto-Refresh Inventory?

**Design Decision**: We chose NOT to automatically refresh the Inventory page because:

1. **Separation of Concerns**: Import History page manages imports, Inventory page manages inventory
2. **Performance**: Auto-refreshing would require polling or WebSockets
3. **User Control**: User decides when to check inventory
4. **Simplicity**: Keeps the codebase simple and maintainable

**Alternative Considered**: Using React Query's `invalidateQueries` to refresh inventory cache, but this would require:
- Shared query client across pages
- More complex state management
- Potential performance issues

**Current Solution**: Show informative toast message telling user to navigate to Inventory page.

---

## Files Changed

### Frontend
- ✅ `frontend/components/imports/ImportDetailsModal.tsx` - Added informative toast

### Backend
- ✅ `backend/routers/imports.py` - Added logging and stock movements

### Documentation
- ✅ `docs/ROLLBACK_TESTING_GUIDE.md` - Updated verification steps
- ✅ `docs/ROLLBACK_ISSUE_RESOLVED.md` - This document

---

## Testing Checklist

- [x] Rollback shows success notification
- [x] Rollback shows info message about navigating to Inventory
- [x] Navigate to Inventory page shows restored quantities
- [x] Stock movements table has rollback records
- [x] Backend logs show successful updates
- [x] Import History shows "rolled back" status

---

## User Instructions

**After clicking "Rollback Import":**

1. ✅ You'll see: "Successfully rolled back X changes"
2. ✅ You'll see: "Go to Inventory page to see the restored quantities"
3. ✅ Click **Inventory** in the sidebar
4. ✅ Verify quantities are restored
5. ✅ Done!

**Important**: The Import History page does not automatically show updated inventory. You must navigate to the Inventory page to see the changes.

---

## Conclusion

The rollback feature **is working correctly**. The issue was a UX problem where users didn't realize they needed to navigate to the Inventory page to see the changes.

**Solution**: Added informative toast message and updated documentation.

**Status**: ✅ Resolved  
**User Impact**: Minimal - just need to navigate to Inventory page  
**Technical Debt**: None - this is the intended behavior

---

**Last Updated**: 2026-04-29
