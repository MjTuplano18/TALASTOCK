-- ============================================================================
-- Fix: Duplicate Trigger Error
-- ============================================================================
-- This script cleans up any partially-run migration and ensures a clean state
-- Run this FIRST, then run the full migration again
-- ============================================================================

-- Drop existing triggers (if they exist)
DROP TRIGGER IF EXISTS trigger_update_balance_on_credit_sale ON credit_sales;
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_credit_sale_status_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;

-- Drop existing functions (if they exist)
DROP FUNCTION IF EXISTS update_customer_balance() CASCADE;
DROP FUNCTION IF EXISTS update_credit_sale_status() CASCADE;
DROP FUNCTION IF EXISTS calculate_customer_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_overdue_credit_sales() CASCADE;

-- Drop existing views (if they exist)
DROP VIEW IF EXISTS credit_sales_with_details CASCADE;
DROP VIEW IF EXISTS customers_near_limit CASCADE;
DROP VIEW IF EXISTS overdue_accounts CASCADE;
DROP VIEW IF EXISTS customer_balances CASCADE;

-- Drop existing tables (if they exist) - in reverse order of dependencies
DROP TABLE IF EXISTS credit_limit_overrides CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS credit_sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ============================================================================
-- Verification: Check that everything is cleaned up
-- ============================================================================

-- Should return 0 rows
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides');

-- Should return 0 rows
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('customer_balances', 'overdue_accounts', 'customers_near_limit', 'credit_sales_with_details');

-- ============================================================================
-- Status
-- ============================================================================

SELECT 'Cleanup completed. Now run create_customer_credit_management_schema.sql' AS status;
