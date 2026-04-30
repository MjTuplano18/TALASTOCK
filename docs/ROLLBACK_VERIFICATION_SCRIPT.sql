-- ============================================================================
-- Rollback Verification Script
-- ============================================================================
-- Use this script to verify rollback is working correctly
-- Run in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check recent imports
SELECT 
  id,
  file_name,
  entity_type,
  status,
  total_rows,
  successful_rows,
  can_rollback,
  rolled_back_at,
  created_at
FROM import_history
WHERE entity_type = 'inventory'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check snapshots for a specific import
-- Replace 'YOUR_IMPORT_ID' with actual import ID from Step 1
SELECT 
  s.id,
  s.entity_id as product_id,
  s.operation,
  s.old_data,
  s.new_data,
  s.created_at,
  p.name as product_name,
  p.sku
FROM import_data_snapshot s
LEFT JOIN products p ON p.id = s.entity_id
WHERE s.import_id = 'YOUR_IMPORT_ID'
ORDER BY s.created_at;

-- Step 3: Check current inventory for products in the import
-- Replace product IDs from Step 2
SELECT 
  i.product_id,
  p.name,
  p.sku,
  i.quantity,
  i.low_stock_threshold,
  i.updated_at
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE i.product_id IN (
  SELECT entity_id 
  FROM import_data_snapshot 
  WHERE import_id = 'YOUR_IMPORT_ID'
)
ORDER BY p.name;

-- Step 4: Check stock movements for rollback
SELECT 
  sm.id,
  sm.product_id,
  p.name as product_name,
  p.sku,
  sm.type,
  sm.quantity,
  sm.note,
  sm.created_at
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
WHERE sm.type = 'rollback'
  OR sm.import_history_id = 'YOUR_IMPORT_ID'
ORDER BY sm.created_at DESC;

-- ============================================================================
-- Diagnostic Queries
-- ============================================================================

-- Check if snapshots exist for recent imports
SELECT 
  h.id as import_id,
  h.file_name,
  h.created_at as import_date,
  COUNT(s.id) as snapshot_count,
  h.can_rollback,
  h.rolled_back_at
FROM import_history h
LEFT JOIN import_data_snapshot s ON s.import_id = h.id
WHERE h.entity_type = 'inventory'
  AND h.created_at > NOW() - INTERVAL '7 days'
GROUP BY h.id, h.file_name, h.created_at, h.can_rollback, h.rolled_back_at
ORDER BY h.created_at DESC;

-- Check for imports without snapshots
SELECT 
  h.id,
  h.file_name,
  h.created_at,
  h.status
FROM import_history h
LEFT JOIN import_data_snapshot s ON s.import_id = h.id
WHERE h.entity_type = 'inventory'
  AND s.id IS NULL
  AND h.created_at > NOW() - INTERVAL '7 days'
ORDER BY h.created_at DESC;

-- ============================================================================
-- Manual Rollback Test (if needed)
-- ============================================================================

-- 1. Get snapshot data
SELECT 
  entity_id as product_id,
  old_data->>'quantity' as old_quantity,
  old_data->>'low_stock_threshold' as old_threshold,
  new_data->>'quantity' as new_quantity,
  new_data->>'low_stock_threshold' as new_threshold
FROM import_data_snapshot
WHERE import_id = 'YOUR_IMPORT_ID';

-- 2. Manually update inventory (for testing)
-- Replace values from query above
UPDATE inventory
SET 
  quantity = 50,  -- old_quantity
  low_stock_threshold = 10,  -- old_threshold
  updated_at = NOW()
WHERE product_id = 'YOUR_PRODUCT_ID';

-- 3. Verify update
SELECT 
  i.product_id,
  p.name,
  i.quantity,
  i.low_stock_threshold,
  i.updated_at
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE i.product_id = 'YOUR_PRODUCT_ID';

-- ============================================================================
-- Cleanup (if needed)
-- ============================================================================

-- Delete test import and its snapshots
-- WARNING: This will permanently delete the import history
-- DELETE FROM import_history WHERE id = 'YOUR_IMPORT_ID';
-- (Snapshots will cascade delete automatically)

