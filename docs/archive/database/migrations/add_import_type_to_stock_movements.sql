-- Migration: Add 'import' and 'rollback' types to stock_movements
-- Date: 2026-04-15
-- Description: Support inventory import/export feature

-- Drop existing constraint
ALTER TABLE stock_movements 
  DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- Add new constraint with import and rollback types
ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_type_check 
  CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'import', 'rollback'));

-- Add import_history_id column for v2 (optional for now)
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS import_history_id UUID REFERENCES import_history(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_import_history ON stock_movements(import_history_id) WHERE import_history_id IS NOT NULL;
