# Debug Refund Status Issue

## Problem
Refund succeeds (inventory restored, toast shows success) but status remains "Completed" instead of "Refunded".

## Database Check Results
User ran query and confirmed:
- ✅ Columns exist: `status`, `refunded_amount`
- ❌ All sales show: `status: 'completed'`, `refunded_amount: 0.00`

**This means the database UPDATE is NOT happening!**

## Root Cause
The `processSaleRefund()` function in `frontend/lib/refund-api.ts` is calling:

```typescript
const { error: updateError } = await supabase
  .from('sales')
  .update({
    status: newStatus,
    refunded_amount: newRefundedAmount,
    refund_reason: refundRequest.refund_reason || null,
    refunded_at: new Date().toISOString(),
    refunded_by: userId,
  })
  .eq('id', refundRequest.sale_id)
```

But the update is **silently failing** (no error thrown, but database not updated).

## Possible Causes

### 1. RLS Policy Missing (Most Likely)
The sales table might not have an UPDATE policy for authenticated users.

**Solution**: Run this in Supabase SQL Editor:

```sql
-- Check if UPDATE policy exists
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'sales';

-- If no UPDATE policy, add it:
CREATE POLICY IF NOT EXISTS "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);
```

### 2. Supabase Client Not Authenticated
The frontend might be calling the API without a valid session token.

**Solution**: Check browser console for auth errors.

### 3. Silent Error in Supabase Update
The update might be failing but not throwing an error.

**Solution**: Add logging to see the actual error:

```typescript
const { error: updateError } = await supabase
  .from('sales')
  .update({
    status: newStatus,
    refunded_amount: newRefundedAmount,
    refund_reason: refundRequest.refund_reason || null,
    refunded_at: new Date().toISOString(),
    refunded_by: userId,
  })
  .eq('id', refundRequest.sale_id)

console.log('Update error:', updateError) // ADD THIS
console.log('Updating sale:', refundRequest.sale_id, 'to status:', newStatus) // ADD THIS
```

## Immediate Action Required

### Step 1: Check RLS Policies
Run this in Supabase SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY cmd;
```

**Expected output**: You should see policies for SELECT, INSERT, UPDATE, DELETE.

If UPDATE is missing, run:

```sql
CREATE POLICY IF NOT EXISTS "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);
```

### Step 2: Test Manual Update
Run this to test if UPDATE works:

```sql
-- Get a sale ID
SELECT id, status, refunded_amount
FROM sales
ORDER BY created_at DESC
LIMIT 1;

-- Try to update it (replace YOUR_SALE_ID with actual ID)
UPDATE sales
SET 
  status = 'refunded',
  refunded_amount = 100.00
WHERE id = 'YOUR_SALE_ID'
RETURNING id, status, refunded_amount;
```

If this fails with "permission denied" → RLS policy issue
If this succeeds → Frontend code issue

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to refund a sale
4. Look for errors (red text)
5. Take screenshot and share

### Step 4: Add Debug Logging
I'll add console.log statements to see what's happening.

## Next Steps
1. Run Step 1 (check RLS policies) - **DO THIS FIRST**
2. Share the results
3. If UPDATE policy is missing, run the CREATE POLICY command
4. Try refund again
5. If still not working, run Step 3 (check browser console)

