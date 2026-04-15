-- Migration: Add 'import' and 'rollback' types to stock_movements
-- Date: 2026-04-15
-- Description: Extends stock_movements type constraint to support import operations and rollback functionality

-- Drop existing constraint
ALTER TABLE stock_movements 
  DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- Add new constraint with import and rollback types
ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_type_check 
  CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'import', 'rollback'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'stock_movements_type_check';

