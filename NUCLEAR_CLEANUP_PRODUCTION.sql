-- ============================================================================
-- NUCLEAR CLEANUP: Remove ALL Credit Management Objects
-- ============================================================================
-- Run this FIRST, then run PRODUCTION_MIGRATION_CLEAN.sql
-- This will completely remove all credit management objects
-- ============================================================================

-- Disable RLS temporarily to drop policies
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_limit_overrides DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (brute force)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_balance_on_credit_sale ON credit_sales;
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_credit_sale_status_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;

-- Drop functions
DROP FUNCTION IF EXISTS update_customer_balance() CASCADE;
DROP FUNCTION IF EXISTS update_credit_sale_status() CASCADE;
DROP FUNCTION IF EXISTS calculate_customer_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_overdue_credit_sales() CASCADE;

-- Drop views
DROP VIEW IF EXISTS credit_sales_with_details CASCADE;
DROP VIEW IF EXISTS customers_near_limit CASCADE;
DROP VIEW IF EXISTS overdue_accounts CASCADE;
DROP VIEW IF EXISTS customer_balances CASCADE;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS credit_limit_overrides CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS credit_sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Verify cleanup
SELECT 'Cleanup completed!' AS status,
       (SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')) AS remaining_tables,
       (SELECT COUNT(*) FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')) AS remaining_policies;

-- Should show: remaining_tables = 0, remaining_policies = 0
