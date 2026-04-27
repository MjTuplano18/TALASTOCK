-- ============================================================================
-- Verify Migration Ran Successfully
-- ============================================================================
-- Run this in Supabase SQL Editor to check if columns exist

-- Check if columns were added to sales table
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
  AND column_name IN (
    'status',
    'refunded_amount',
    'refund_reason',
    'refunded_at',
    'refunded_by',
    'payment_method'
  )
ORDER BY column_name;

-- Expected result: 6 rows
-- If you see 0 rows, the migration didn't run!

-- ============================================================================
-- Check existing sales data
-- ============================================================================

SELECT 
  id,
  total_amount,
  status,
  refunded_amount,
  payment_method,
  created_at
FROM sales
ORDER BY created_at DESC
LIMIT 10;

-- Check what status values exist
SELECT 
  status,
  COUNT(*) as count
FROM sales
GROUP BY status;

-- ============================================================================
-- Manual fix if migration didn't run
-- ============================================================================

-- If columns don't exist, run this:
/*
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES auth.users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
*/
