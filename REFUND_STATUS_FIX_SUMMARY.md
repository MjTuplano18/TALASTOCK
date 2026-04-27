# Refund Status Not Updating - Complete Fix Guide

## Problem Summary
- ✅ Refund succeeds (inventory restored, customer balance updated)
- ✅ Toast shows "Full refund processed successfully"
- ❌ Status remains "Completed" instead of "Refunded"
- ❌ Database shows `status: 'completed'`, `refunded_amount: 0.00`

## Root Cause
**The database UPDATE is silently failing due to missing RLS policy.**

The `sales` table likely doesn't have an UPDATE policy for authenticated users, so the Supabase client can't update the status even though the user is authenticated.

## Solution

### Step 1: Check RLS Policies (REQUIRED)
Run this in Supabase SQL Editor:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY cmd;
```

**Expected output**: You should see 4 policies:
- SELECT (read)
- INSERT (create)
- **UPDATE (update) ← THIS IS CRITICAL**
- DELETE (delete)

If UPDATE is missing, that's the problem!

### Step 2: Add UPDATE Policy
Run this in Supabase SQL Editor:

```sql
-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;

-- Create UPDATE policy
CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);
```

### Step 3: Verify Policy Was Created
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'sales'
  AND cmd = 'UPDATE';
```

Expected: 1 row showing the UPDATE policy

### Step 4: Test Manual Update
```sql
-- Get a sale ID
SELECT id, status, refunded_amount
FROM sales
ORDER BY created_at DESC
LIMIT 1;

-- Test update (replace YOUR_SALE_ID with actual ID from above)
UPDATE sales
SET 
  status = 'refunded',
  refunded_amount = 100.00
WHERE id = 'YOUR_SALE_ID'
RETURNING id, status, refunded_amount;
```

If this works → Policy is fixed! ✅
If this fails → Share the error message

### Step 5: Test in App
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Try to refund a sale
3. Check if status updates to "Refunded"

### Step 6: Check Browser Console (If Still Not Working)
1. Open DevTools (F12)
2. Go to Console tab
3. Try to refund a sale
4. Look for these log messages:
   - `[Refund] Updating sale: ...`
   - `[Refund] Update result: ...`
   - `[Refund] Sale updated successfully: ...`
5. Take screenshot and share

## What I Changed

### 1. Added Debug Logging to `frontend/lib/refund-api.ts`
Added console.log statements to track the update process:
- Before update: Shows sale ID and new status
- After update: Shows result data and any errors
- Detects if update succeeds but returns no data (RLS issue)

### 2. Created Diagnostic SQL Scripts
- `FIX_REFUND_RLS_POLICY.sql` - Complete RLS policy check and fix
- `DEBUG_REFUND_ISSUE.md` - Detailed troubleshooting guide

## Files Modified
- ✅ `frontend/lib/refund-api.ts` - Added debug logging
- ✅ `FIX_REFUND_RLS_POLICY.sql` - Created (RLS policy fix)
- ✅ `DEBUG_REFUND_ISSUE.md` - Created (troubleshooting guide)
- ✅ `REFUND_STATUS_FIX_SUMMARY.md` - Created (this file)

## Quick Action Checklist
- [ ] Run Step 1 (check RLS policies)
- [ ] If UPDATE policy missing, run Step 2 (add policy)
- [ ] Run Step 3 (verify policy created)
- [ ] Run Step 4 (test manual update)
- [ ] Run Step 5 (test in app)
- [ ] If still not working, run Step 6 (check console)

## Expected Behavior After Fix
1. User clicks "Refund" button
2. Selects items to refund
3. Clicks "Process Refund"
4. Toast shows "Full refund processed successfully"
5. **Status immediately changes to "Refunded"** ✅
6. **Refunded amount shows in UI** ✅
7. **Refund and Void buttons disappear** ✅
8. **Filtering by "Refunded" status works** ✅

## Next Steps
1. **Run `FIX_REFUND_RLS_POLICY.sql` in Supabase SQL Editor**
2. Follow Steps 1-5 above
3. If still not working, share:
   - Screenshot of Step 1 output (RLS policies)
   - Screenshot of Step 4 output (manual update test)
   - Screenshot of browser console during refund

## Technical Details

### Why This Happens
Supabase uses Row Level Security (RLS) to control database access. Even though the user is authenticated, if there's no UPDATE policy on the `sales` table, the Supabase client can't update rows.

The update call doesn't throw an error (it just returns empty data), so the frontend thinks it succeeded and shows the success toast.

### Why Local State Update Doesn't Help
The code does update local state immediately:
```typescript
setAllSales(prev => prev.map(sale => 
  sale.id === refundTarget.id 
    ? { ...sale, status: response.new_status, ... }
    : sale
))
```

But when the page refreshes or the data is refetched, it pulls from the database, which still shows `status: 'completed'` because the UPDATE never actually happened.

### The Fix
Adding the UPDATE policy allows authenticated users to update sales records, which enables the refund status update to work correctly.

