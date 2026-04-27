-- ============================================================================
-- Fix Sales DELETE Policy
-- ============================================================================
-- Date: 2026-04-27
-- Description: Ensures authenticated users can delete sales and sale_items
--
-- This fixes the issue where void (delete) operations fail due to missing
-- or incorrect RLS policies.
-- ============================================================================

-- First, check current policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('sales', 'sale_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- FIX: sales table policies
-- ============================================================================

-- Drop existing DELETE policy if it exists (to recreate it correctly)
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;

-- Create DELETE policy for sales
CREATE POLICY "Authenticated users can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (true);

-- Verify sales policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY policyname;

-- ============================================================================
-- FIX: sale_items table policies
-- ============================================================================

-- Check if sale_items has RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'sale_items';

-- Enable RLS on sale_items if not already enabled
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can read sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON sale_items;

-- Create comprehensive policies for sale_items
CREATE POLICY "Authenticated users can read sale_items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sale_items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sale_items"
  ON sale_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sale_items"
  ON sale_items FOR DELETE
  TO authenticated
  USING (true);

-- Verify sale_items policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sale_items'
ORDER BY policyname;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test DELETE permission on sales (should return true)
SELECT has_table_privilege('authenticated', 'sales', 'DELETE') AS can_delete_sales;

-- Test DELETE permission on sale_items (should return true)
SELECT has_table_privilege('authenticated', 'sale_items', 'DELETE') AS can_delete_sale_items;

-- Show all policies for both tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END AS action
FROM pg_policies
WHERE tablename IN ('sales', 'sale_items')
ORDER BY tablename, cmd;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 
-- To run this migration in Supabase:
-- 
-- 1. Go to your Supabase project dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" button
-- 
-- Expected output:
-- - All policies should be created successfully
-- - Verification queries should show DELETE policies exist
-- - Permission checks should return true
-- 
-- After running this:
-- 1. Test void (delete) in the Sales page
-- 2. Test refund in the Sales page
-- 3. Both should work correctly now
-- 
-- ============================================================================

-- Migration completed
SELECT 'Migration completed: fix_sales_delete_policy.sql' AS status;
