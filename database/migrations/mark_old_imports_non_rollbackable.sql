-- ============================================================================
-- Mark Old Imports as Non-Rollbackable
-- ============================================================================
-- Purpose: Mark imports without snapshots as can_rollback = false
-- Created: 2026-04-29
-- Reason: Old imports (before rollback feature) don't have snapshots
-- ============================================================================

-- Mark all imports without snapshots as non-rollbackable
UPDATE import_history h
SET can_rollback = false
WHERE NOT EXISTS (
  SELECT 1 
  FROM import_data_snapshot s 
  WHERE s.import_id = h.id
)
AND can_rollback = true;

-- Log the results
DO $$
DECLARE
  v_updated_count INT;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Marked % old imports as non-rollbackable', v_updated_count;
END $$;

-- Verify the update
SELECT 
  COUNT(*) as total_imports,
  COUNT(*) FILTER (WHERE can_rollback = true) as rollbackable_imports,
  COUNT(*) FILTER (WHERE can_rollback = false) as non_rollbackable_imports,
  COUNT(*) FILTER (WHERE can_rollback = true AND EXISTS (
    SELECT 1 FROM import_data_snapshot s WHERE s.import_id = import_history.id
  )) as rollbackable_with_snapshots,
  COUNT(*) FILTER (WHERE can_rollback = false AND NOT EXISTS (
    SELECT 1 FROM import_data_snapshot s WHERE s.import_id = import_history.id
  )) as non_rollbackable_without_snapshots
FROM import_history;

-- ============================================================================
-- Expected Results:
-- - All imports without snapshots: can_rollback = false
-- - All imports with snapshots: can_rollback = true
-- - UI will hide rollback button for old imports
-- ============================================================================

COMMENT ON COLUMN import_history.can_rollback IS 'Whether this import can be rolled back (requires snapshots)';

-- ============================================================================
-- End of Migration
-- ============================================================================
