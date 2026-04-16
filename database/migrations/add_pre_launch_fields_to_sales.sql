-- ============================================================================
-- Migration: Add Pre-Launch Fields to Sales Table
-- ============================================================================
-- Date: 2026-04-16
-- Description: Adds payment method tracking, cash handling, discount tracking,
--              and refund tracking columns to the sales table to support
--              production-ready POS features.
--
-- Features Added:
--   1. Payment method tracking (cash, card, GCash, PayMaya, bank transfer)
--   2. Cash handling (amount received, change given)
--   3. Discount tracking (type, value, calculated amount)
--   4. Refund tracking (status, amount, reason, timestamp, user)
--
-- Requirements: 2.6, 3.7, 4.9 (Pre-Launch Essentials Spec)
-- ============================================================================

-- ============================================================================
-- PAYMENT METHOD COLUMNS
-- ============================================================================

-- Add payment_method column with CHECK constraint
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'
  CHECK (payment_method IN ('cash', 'card', 'gcash', 'paymaya', 'bank_transfer'));

COMMENT ON COLUMN sales.payment_method IS 'Payment method used: cash, card, gcash, paymaya, or bank_transfer';

-- ============================================================================
-- CASH HANDLING COLUMNS
-- ============================================================================

-- Add cash_received column (for cash payments)
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS cash_received NUMERIC(10,2);

COMMENT ON COLUMN sales.cash_received IS 'Amount of cash received from customer (for cash payments only)';

-- Add change_given column (for cash payments)
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS change_given NUMERIC(10,2);

COMMENT ON COLUMN sales.change_given IS 'Change given to customer (for cash payments only)';

-- ============================================================================
-- DISCOUNT COLUMNS
-- ============================================================================

-- Add discount_type column with CHECK constraint
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none'
  CHECK (discount_type IN ('none', 'percentage', 'fixed', 'senior_pwd'));

COMMENT ON COLUMN sales.discount_type IS 'Type of discount applied: none, percentage, fixed, or senior_pwd (20% Philippine law)';

-- Add discount_value column (percentage or fixed amount)
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN sales.discount_value IS 'Discount value: percentage (0-100) or fixed amount in pesos';

-- Add discount_amount column (calculated discount)
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN sales.discount_amount IS 'Calculated discount amount in pesos (subtracted from total)';

-- ============================================================================
-- REFUND TRACKING COLUMNS
-- ============================================================================

-- Add status column with CHECK constraint
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
  CHECK (status IN ('completed', 'refunded', 'partially_refunded'));

COMMENT ON COLUMN sales.status IS 'Sale status: completed, refunded, or partially_refunded';

-- Add refunded_amount column
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN sales.refunded_amount IS 'Total amount refunded (for full or partial refunds)';

-- Add refund_reason column
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

COMMENT ON COLUMN sales.refund_reason IS 'Reason for refund (optional, entered by user)';

-- Add refunded_at timestamp column
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

COMMENT ON COLUMN sales.refunded_at IS 'Timestamp when refund was processed';

-- Add refunded_by user reference column
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN sales.refunded_by IS 'User who processed the refund';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on payment_method for filtering sales by payment type
CREATE INDEX IF NOT EXISTS idx_sales_payment_method 
  ON sales(payment_method);

-- Index on discount_type for filtering sales with discounts
CREATE INDEX IF NOT EXISTS idx_sales_discount_type 
  ON sales(discount_type);

-- Index on status for filtering by sale status
CREATE INDEX IF NOT EXISTS idx_sales_status 
  ON sales(status);

-- Index on refunded_at for refund reports
CREATE INDEX IF NOT EXISTS idx_sales_refunded_at 
  ON sales(refunded_at DESC) 
  WHERE refunded_at IS NOT NULL;

-- Index on refunded_by for tracking who processed refunds
CREATE INDEX IF NOT EXISTS idx_sales_refunded_by 
  ON sales(refunded_by) 
  WHERE refunded_by IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all columns were added successfully
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
  AND column_name IN (
    'payment_method', 'cash_received', 'change_given',
    'discount_type', 'discount_value', 'discount_amount',
    'status', 'refunded_amount', 'refund_reason', 'refunded_at', 'refunded_by'
  )
ORDER BY ordinal_position;

-- Verify CHECK constraints were added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'sales'::regclass
  AND contype = 'c'
  AND conname IN ('sales_payment_method_check', 'sales_discount_type_check', 'sales_status_check')
ORDER BY conname;

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'sales'
  AND indexname IN (
    'idx_sales_payment_method',
    'idx_sales_discount_type',
    'idx_sales_status',
    'idx_sales_refunded_at',
    'idx_sales_refunded_by'
  )
ORDER BY indexname;

-- Show sample of updated table structure
SELECT 
  id,
  total_amount,
  payment_method,
  discount_type,
  discount_amount,
  status,
  created_at
FROM sales
LIMIT 5;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- To rollback this migration, run the following:

-- Drop indexes
DROP INDEX IF EXISTS idx_sales_payment_method;
DROP INDEX IF EXISTS idx_sales_discount_type;
DROP INDEX IF EXISTS idx_sales_status;
DROP INDEX IF EXISTS idx_sales_refunded_at;
DROP INDEX IF EXISTS idx_sales_refunded_by;

-- Drop columns
ALTER TABLE sales DROP COLUMN IF EXISTS payment_method;
ALTER TABLE sales DROP COLUMN IF EXISTS cash_received;
ALTER TABLE sales DROP COLUMN IF EXISTS change_given;
ALTER TABLE sales DROP COLUMN IF EXISTS discount_type;
ALTER TABLE sales DROP COLUMN IF EXISTS discount_value;
ALTER TABLE sales DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE sales DROP COLUMN IF EXISTS status;
ALTER TABLE sales DROP COLUMN IF EXISTS refunded_amount;
ALTER TABLE sales DROP COLUMN IF EXISTS refund_reason;
ALTER TABLE sales DROP COLUMN IF EXISTS refunded_at;
ALTER TABLE sales DROP COLUMN IF EXISTS refunded_by;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration completed successfully
SELECT 'Migration completed: add_pre_launch_fields_to_sales.sql' AS status;
