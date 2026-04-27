-- ============================================================================
-- Migration: Add 'credit' payment method to sales table
-- Purpose: Allow credit sales to be recorded with payment_method = 'credit'
--          so they can be linked to credit_sales records via sale_id
-- ============================================================================

-- Drop the existing CHECK constraint on payment_method
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

-- Re-add the constraint with 'credit' included
ALTER TABLE sales
  ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'gcash', 'paymaya', 'bank_transfer', 'credit'));

COMMENT ON COLUMN sales.payment_method IS 'Payment method: cash, card, gcash, paymaya, bank_transfer, or credit (linked to credit_sales)';

-- ============================================================================
-- Verification
-- ============================================================================
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'sales'::regclass
  AND conname = 'sales_payment_method_check';
