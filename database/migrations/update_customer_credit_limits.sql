-- ============================================================================
-- Update Customer Credit Limits
-- ============================================================================
-- Date: 2026-04-27
-- Description: Updates all existing customers to have a default credit limit
--              of ₱5,000 if they currently have ₱0 credit limit.
--
-- This is a one-time fix to set credit limits for customers that were
-- created before credit limits were properly configured.
-- ============================================================================

-- Update all customers with 0 credit limit to have ₱5,000 credit limit
UPDATE customers
SET 
  credit_limit = 5000.00,
  updated_at = NOW()
WHERE credit_limit = 0;

-- Verify the update
SELECT 
  id,
  name,
  business_name,
  credit_limit,
  current_balance,
  (credit_limit - current_balance) AS available_credit,
  is_active
FROM customers
ORDER BY name;

-- ============================================================================
-- INSTRUCTIONS FOR USER
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
-- This will update all customers with ₱0 credit limit to have ₱5,000.
-- 
-- If you want to set a different credit limit for all customers, change
-- the value 5000.00 in the UPDATE statement above.
-- 
-- If you want to set different credit limits for specific customers,
-- you can run individual UPDATE statements like:
-- 
-- UPDATE customers
-- SET credit_limit = 10000.00, updated_at = NOW()
-- WHERE name = 'Jenilyn Tuplano';
-- 
-- ============================================================================
