-- ============================================================================
-- QUICK FIX: Refund Status Not Updating
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and click "Run"

-- Step 1: Add UPDATE policy for sales table
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;

CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);

-- Step 2: Verify policy was created
SELECT 
  '✅ Policy created successfully!' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'sales'
  AND cmd = 'UPDATE';

-- Expected output: 1 row showing "Authenticated users can update sales"

-- ============================================================================
-- DONE! Now test refund in the app:
-- 1. Hard refresh browser (Ctrl+Shift+R)
-- 2. Try to refund a sale
-- 3. Status should now update to "Refunded" ✅
-- ============================================================================

