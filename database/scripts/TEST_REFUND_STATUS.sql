-- ============================================================================
-- Test Refund Status Update
-- ============================================================================
-- Run this in Supabase SQL Editor to test if status update works

-- Step 1: Check if columns exist
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'sales'
  AND column_name IN ('status', 'refunded_amount')
ORDER BY column_name;

-- Expected: 2 rows (status, refunded_amount)
-- If 0 rows: COLUMNS DON'T EXIST! Run the migration again!

-- ============================================================================

-- Step 2: Get a sale ID to test with
SELECT 
  id,
  total_amount,
  status,
  refunded_amount,
  payment_method
FROM sales
ORDER BY created_at DESC
LIMIT 1;

-- Copy the 'id' value from the result

-- ============================================================================

-- Step 3: Try to update the sale status manually
-- Replace 'YOUR_SALE_ID_HERE' with the actual ID from Step 2

UPDATE sales
SET 
  status = 'refunded',
  refunded_amount = total_amount,
  refund_reason = 'Test refund',
  refunded_at = NOW()
WHERE id = 'YOUR_SALE_ID_HERE'
RETURNING id, status, refunded_amount;

-- If this works: Columns exist, frontend code issue
-- If this fails with "column does not exist": Migration didn't run!
-- If this fails with "permission denied": RLS policy issue

-- ============================================================================

-- Step 4: Check RLS policies on sales table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY policyname;

-- Expected: At least 3-4 policies (SELECT, INSERT, UPDATE, DELETE)
-- If UPDATE policy is missing, that's the problem!

-- ============================================================================

-- Step 5: If UPDATE policy is missing, add it
CREATE POLICY IF NOT EXISTS "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================

-- Step 6: Verify the update worked
SELECT 
  id,
  status,
  refunded_amount,
  refund_reason,
  refunded_at
FROM sales
WHERE id = 'YOUR_SALE_ID_HERE';

-- Expected: status = 'refunded', refunded_amount = total_amount

-- ============================================================================

-- Step 7: Reset the sale back to completed (for testing)
UPDATE sales
SET 
  status = 'completed',
  refunded_amount = 0,
  refund_reason = NULL,
  refunded_at = NULL
WHERE id = 'YOUR_SALE_ID_HERE';

-- ============================================================================
-- RESULTS INTERPRETATION
-- ============================================================================

/*
SCENARIO 1: Step 1 returns 0 rows
→ Columns don't exist
→ Migration didn't run
→ Solution: Run add_pre_launch_fields_to_sales.sql again

SCENARIO 2: Step 3 fails with "column does not exist"
→ Same as Scenario 1
→ Solution: Run migration

SCENARIO 3: Step 3 fails with "permission denied"
→ RLS policy blocking UPDATE
→ Solution: Run Step 5 to add UPDATE policy

SCENARIO 4: Step 3 succeeds
→ Columns exist and work
→ Problem is in frontend code
→ Solution: Check browser console for errors, hard refresh (Ctrl+Shift+R)

SCENARIO 5: Step 3 succeeds but frontend still shows "Completed"
→ Frontend is cached or not deployed
→ Solution: Hard refresh browser, check Vercel deployment
*/
