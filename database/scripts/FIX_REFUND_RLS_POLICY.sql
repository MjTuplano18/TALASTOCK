-- ============================================================================
-- Fix Refund Status Update - RLS Policy Check and Fix
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose and fix the refund status issue

-- ============================================================================
-- STEP 1: Check Current RLS Policies on Sales Table
-- ============================================================================

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Read'
    WHEN cmd = 'INSERT' THEN '✅ Create'
    WHEN cmd = 'UPDATE' THEN '✅ Update (REQUIRED FOR REFUND)'
    WHEN cmd = 'DELETE' THEN '✅ Delete'
  END as description
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY cmd;

-- Expected: You should see 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- If UPDATE is missing, that's why refunds aren't working!

-- ============================================================================
-- STEP 2: Check if RLS is Enabled
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'sales';

-- Expected: rls_enabled = true
-- If false, RLS is disabled (not recommended but would allow updates)

-- ============================================================================
-- STEP 3: Add Missing UPDATE Policy (if needed)
-- ============================================================================

-- Drop existing UPDATE policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;

-- Create UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);  -- Allow all authenticated users to update any sale

-- ============================================================================
-- STEP 4: Verify Policy Was Created
-- ============================================================================

SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'sales'
  AND cmd = 'UPDATE';

-- Expected: 1 row showing the UPDATE policy

-- ============================================================================
-- STEP 5: Test Manual Update
-- ============================================================================

-- Get a recent sale to test with
SELECT 
  id,
  total_amount,
  status,
  refunded_amount,
  created_at
FROM sales
ORDER BY created_at DESC
LIMIT 1;

-- Copy the 'id' from the result above and paste it below

-- Test update (replace YOUR_SALE_ID with actual ID)
UPDATE sales
SET 
  status = 'refunded',
  refunded_amount = total_amount,
  refund_reason = 'Test refund - manual SQL',
  refunded_at = NOW()
WHERE id = 'YOUR_SALE_ID'
RETURNING id, status, refunded_amount, refund_reason;

-- If this works: Policy is fixed! ✅
-- If this fails: Check error message

-- ============================================================================
-- STEP 6: Reset Test Sale (Optional)
-- ============================================================================

-- Reset the sale back to completed (replace YOUR_SALE_ID)
UPDATE sales
SET 
  status = 'completed',
  refunded_amount = 0,
  refund_reason = NULL,
  refunded_at = NULL
WHERE id = 'YOUR_SALE_ID';

-- ============================================================================
-- STEP 7: Check All Policies (Final Verification)
-- ============================================================================

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY cmd;

-- Expected output:
-- 1. SELECT policy (read)
-- 2. INSERT policy (create)
-- 3. UPDATE policy (update) ← THIS IS CRITICAL FOR REFUNDS
-- 4. DELETE policy (delete)

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

/*
SCENARIO 1: No UPDATE policy found in Step 1
→ Solution: Run Step 3 to create the policy
→ Then test refund in the app

SCENARIO 2: UPDATE policy exists but Step 5 fails
→ Check error message
→ Possible causes:
  - Column doesn't exist (run add_pre_launch_fields_to_sales.sql)
  - Wrong data type
  - Constraint violation

SCENARIO 3: Step 5 succeeds but app still doesn't work
→ Frontend issue
→ Check browser console for errors
→ Hard refresh browser (Ctrl+Shift+R)
→ Check if Vercel deployment is live

SCENARIO 4: RLS is disabled (Step 2 shows false)
→ Enable RLS:
  ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
→ Then run Step 3 to add policies
*/

-- ============================================================================
-- COMPLETE POLICY SET (Run if you want to recreate all policies)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;

-- Create complete policy set
CREATE POLICY "Authenticated users can read sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (true);

-- Verify all policies were created
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY cmd;

-- Expected: 4 rows (SELECT, INSERT, UPDATE, DELETE)

