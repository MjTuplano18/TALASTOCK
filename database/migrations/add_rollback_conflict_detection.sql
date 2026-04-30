-- ============================================================================
-- Rollback Conflict Detection
-- ============================================================================
-- Purpose: Prevent rollback of imports when products have been modified
-- Created: 2026-04-29
-- ============================================================================

-- Function to check if an import can be safely rolled back
CREATE OR REPLACE FUNCTION can_safely_rollback_import(p_import_id UUID)
RETURNS TABLE (
  can_rollback BOOLEAN,
  conflict_count INT,
  conflicts JSONB
) AS $$
DECLARE
  v_import_date TIMESTAMPTZ;
  v_conflicts JSONB;
  v_conflict_count INT;
BEGIN
  -- Get import date
  SELECT created_at INTO v_import_date
  FROM import_history
  WHERE id = p_import_id;
  
  -- Check for conflicts: products modified after this import
  WITH snapshot_products AS (
    SELECT DISTINCT entity_id as product_id
    FROM import_data_snapshot
    WHERE import_id = p_import_id
  ),
  newer_modifications AS (
    SELECT 
      sp.product_id,
      p.name as product_name,
      p.sku,
      i.quantity as current_quantity,
      i.updated_at as last_modified,
      COUNT(sm.id) as modification_count
    FROM snapshot_products sp
    JOIN products p ON p.id = sp.product_id
    JOIN inventory i ON i.product_id = sp.product_id
    LEFT JOIN stock_movements sm ON sm.product_id = sp.product_id 
      AND sm.created_at > v_import_date
    WHERE i.updated_at > v_import_date
    GROUP BY sp.product_id, p.name, p.sku, i.quantity, i.updated_at
  )
  SELECT 
    COUNT(*),
    jsonb_agg(
      jsonb_build_object(
        'product_id', product_id,
        'product_name', product_name,
        'sku', sku,
        'current_quantity', current_quantity,
        'last_modified', last_modified,
        'modification_count', modification_count
      )
    )
  INTO v_conflict_count, v_conflicts
  FROM newer_modifications;
  
  -- Return results
  RETURN QUERY SELECT 
    (v_conflict_count = 0) as can_rollback,
    COALESCE(v_conflict_count, 0) as conflict_count,
    COALESCE(v_conflicts, '[]'::jsonb) as conflicts;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION can_safely_rollback_import IS 'Checks if an import can be safely rolled back without data conflicts';

-- ============================================================================
-- Update import_history to track if rollback is safe
-- ============================================================================

-- Add column to track if import has conflicts
ALTER TABLE import_history 
ADD COLUMN IF NOT EXISTS has_conflicts BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN import_history.has_conflicts IS 'Whether products from this import have been modified by newer operations';

-- ============================================================================
-- Function to mark imports with conflicts
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_conflicting_imports()
RETURNS void AS $$
BEGIN
  -- Mark imports that have conflicts
  UPDATE import_history h
  SET 
    has_conflicts = TRUE,
    can_rollback = FALSE
  WHERE h.entity_type = 'inventory'
    AND h.rolled_back_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM import_data_snapshot s
      JOIN inventory i ON i.product_id = s.entity_id
      WHERE s.import_id = h.id
        AND i.updated_at > h.created_at
    );
END;
$$ LANGUAGE plpgsql;

-- Run the function to mark existing imports
SELECT mark_conflicting_imports();

-- ============================================================================
-- Trigger to automatically mark imports when inventory is updated
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_mark_conflicting_imports()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark older imports as having conflicts
  UPDATE import_history h
  SET 
    has_conflicts = TRUE,
    can_rollback = FALSE
  WHERE h.entity_type = 'inventory'
    AND h.rolled_back_at IS NULL
    AND h.created_at < NOW()
    AND EXISTS (
      SELECT 1
      FROM import_data_snapshot s
      WHERE s.import_id = h.id
        AND s.entity_id = NEW.product_id
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on inventory updates
DROP TRIGGER IF EXISTS trigger_inventory_conflict_detection ON inventory;
CREATE TRIGGER trigger_inventory_conflict_detection
  AFTER UPDATE ON inventory
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold)
  EXECUTE FUNCTION trigger_mark_conflicting_imports();

-- ============================================================================
-- End of Migration
-- ============================================================================

