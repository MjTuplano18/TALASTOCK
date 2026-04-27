-- ============================================================================
-- Migration: Add Credit Limit Tracking Columns
-- ============================================================================
-- Date: 2026-04-27
-- Description: Adds old_credit_limit and new_credit_limit columns to 
--              credit_limit_overrides table to track credit limit changes
--              when admin approves override.
--
-- Purpose: When admin checks "Override credit limit" checkbox, the system
--          should automatically increase the customer's credit limit and
--          record both the old and new limits for audit purposes.
-- ============================================================================

-- Add columns to credit_limit_overrides table
ALTER TABLE credit_limit_overrides
ADD COLUMN IF NOT EXISTS old_credit_limit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS new_credit_limit NUMERIC(10,2);

-- Add comments
COMMENT ON COLUMN credit_limit_overrides.old_credit_limit IS 'Customer credit limit before override';
COMMENT ON COLUMN credit_limit_overrides.new_credit_limit IS 'Customer credit limit after override (auto-increased)';

-- Backfill existing records (set old_credit_limit to credit_limit column)
UPDATE credit_limit_overrides
SET old_credit_limit = credit_limit
WHERE old_credit_limit IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'credit_limit_overrides'
  AND column_name IN ('old_credit_limit', 'new_credit_limit')
ORDER BY column_name;

-- Show sample data
SELECT 
  id,
  customer_id,
  credit_sale_id,
  previous_balance,
  sale_amount,
  new_balance,
  old_credit_limit,
  new_credit_limit,
  created_at
FROM credit_limit_overrides
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

SELECT 'Migration completed: add_credit_limit_tracking_columns.sql' AS status;
