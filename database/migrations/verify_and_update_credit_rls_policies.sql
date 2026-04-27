-- ============================================================================
-- Migration: Verify and Update Credit Management RLS Policies
-- ============================================================================
-- Date: 2026-04-16
-- Description: Updates RLS policies for customer credit management tables to
--              enforce proper multi-tenant security using auth.uid() = created_by.
--
-- DESIGN DECISION — Shared Store vs Multi-Tenant
-- -----------------------------------------------
-- The original migration (create_customer_credit_management_schema.sql) used
-- USING (true) for SELECT/UPDATE/DELETE policies, meaning any authenticated
-- user could read and modify any customer's data. This was intentional for a
-- single-store model where all staff share one account.
--
-- This migration upgrades to a MULTI-TENANT model:
--   - Each user (store owner) can only see and modify records they created.
--   - This is enforced via auth.uid() = created_by on all operations.
--   - INSERT policies already used WITH CHECK (auth.uid() = created_by) and
--     are left unchanged.
--
-- IMPACT: After applying this migration, users will only see their own
-- customers, credit sales, payments, and overrides. If multiple staff members
-- share data under one Supabase user account, this change has no impact.
-- If each staff member has their own account, they will no longer see each
-- other's records — which is the intended multi-tenant behaviour.
-- ============================================================================

-- ============================================================================
-- CUSTOMERS — Drop permissive policies, recreate with uid check
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

CREATE POLICY "Users can read own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================================================
-- CREDIT_SALES — Drop permissive policies, recreate with uid check
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read credit_sales" ON credit_sales;
DROP POLICY IF EXISTS "Authenticated users can insert credit_sales" ON credit_sales;
DROP POLICY IF EXISTS "Authenticated users can update credit_sales" ON credit_sales;
DROP POLICY IF EXISTS "Authenticated users can delete credit_sales" ON credit_sales;

CREATE POLICY "Users can read own credit_sales"
  ON credit_sales FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own credit_sales"
  ON credit_sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own credit_sales"
  ON credit_sales FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own credit_sales"
  ON credit_sales FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================================================
-- PAYMENTS — Drop permissive policies, recreate with uid check
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON payments;

CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================================================
-- CREDIT_LIMIT_OVERRIDES — Drop permissive SELECT, add uid-scoped policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read credit_limit_overrides" ON credit_limit_overrides;
DROP POLICY IF EXISTS "Authenticated users can insert credit_limit_overrides" ON credit_limit_overrides;

CREATE POLICY "Users can read own credit_limit_overrides"
  ON credit_limit_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own credit_limit_overrides"
  ON credit_limit_overrides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Confirm all expected policies are in place
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY tablename, cmd, policyname;

-- Confirm RLS is still enabled on all tables
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

SELECT 'Migration completed: verify_and_update_credit_rls_policies.sql' AS status;
