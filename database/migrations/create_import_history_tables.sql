-- ============================================================================
-- Import History & Data Quality Dashboard
-- ============================================================================
-- Purpose: Track all data imports, enable rollback, and provide audit trail
-- Created: 2026-04-29
-- ============================================================================

-- ─── Import History Table ───────────────────────────────────────────────────
-- Tracks every import operation with success/failure metrics
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('products', 'sales', 'inventory', 'customers')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  total_rows INT NOT NULL DEFAULT 0,
  successful_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  processing_time_ms INT,
  can_rollback BOOLEAN DEFAULT true,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Import Data Snapshot Table ─────────────────────────────────────────────
-- Stores before/after snapshots for rollback capability
CREATE TABLE IF NOT EXISTS import_data_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES import_history(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('products', 'sales', 'inventory', 'customers')),
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Import Templates Table ─────────────────────────────────────────────────
-- Stores saved column mapping templates for recurring imports
CREATE TABLE IF NOT EXISTS import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('products', 'sales', 'inventory', 'customers')),
  column_mappings JSONB NOT NULL,
  -- Example: {"Item Name": "product_name", "Code": "sku", "Price (₱)": "price"}
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, entity_type)
);

-- ─── Indexes for Performance ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_entity_type ON import_history(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_data_snapshot_import_id ON import_data_snapshot(import_id);
CREATE INDEX IF NOT EXISTS idx_import_data_snapshot_entity_id ON import_data_snapshot(entity_id);
CREATE INDEX IF NOT EXISTS idx_import_templates_user_id ON import_templates(user_id);

-- ─── Row Level Security (RLS) ───────────────────────────────────────────────
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_data_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;

-- Import History Policies
CREATE POLICY "Users can view their own import history"
  ON import_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import history"
  ON import_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import history"
  ON import_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Import Data Snapshot Policies
CREATE POLICY "Users can view snapshots of their imports"
  ON import_data_snapshot FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM import_history
      WHERE import_history.id = import_data_snapshot.import_id
      AND import_history.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert snapshots for their imports"
  ON import_data_snapshot FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM import_history
      WHERE import_history.id = import_data_snapshot.import_id
      AND import_history.user_id = auth.uid()
    )
  );

-- Import Templates Policies
CREATE POLICY "Users can view their own templates"
  ON import_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON import_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON import_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON import_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── Helper Functions ───────────────────────────────────────────────────────

-- Function to calculate data quality score for an import
CREATE OR REPLACE FUNCTION calculate_import_quality_score(p_import_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_rows INT;
  v_successful_rows INT;
  v_warnings_count INT;
  v_score NUMERIC;
BEGIN
  SELECT total_rows, successful_rows, jsonb_array_length(warnings)
  INTO v_total_rows, v_successful_rows, v_warnings_count
  FROM import_history
  WHERE id = p_import_id;
  
  IF v_total_rows = 0 THEN
    RETURN 0;
  END IF;
  
  -- Base score: percentage of successful rows
  v_score := (v_successful_rows::NUMERIC / v_total_rows::NUMERIC) * 100;
  
  -- Deduct points for warnings (max 10 points)
  v_score := v_score - LEAST(v_warnings_count * 2, 10);
  
  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- Function to get import statistics for a date range
CREATE OR REPLACE FUNCTION get_import_statistics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_imports BIGINT,
  successful_imports BIGINT,
  failed_imports BIGINT,
  partial_imports BIGINT,
  success_rate NUMERIC,
  total_rows_processed BIGINT,
  avg_processing_time_ms NUMERIC,
  avg_quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_imports,
    COUNT(*) FILTER (WHERE status = 'success')::BIGINT as successful_imports,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_imports,
    COUNT(*) FILTER (WHERE status = 'partial')::BIGINT as partial_imports,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0
    END as success_rate,
    COALESCE(SUM(total_rows), 0)::BIGINT as total_rows_processed,
    COALESCE(AVG(processing_time_ms), 0)::NUMERIC as avg_processing_time_ms,
    COALESCE(AVG(calculate_import_quality_score(id)), 0)::NUMERIC as avg_quality_score
  FROM import_history
  WHERE created_at BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ─── Comments ───────────────────────────────────────────────────────────────
COMMENT ON TABLE import_history IS 'Tracks all data import operations with metrics and audit trail';
COMMENT ON TABLE import_data_snapshot IS 'Stores before/after snapshots for rollback capability';
COMMENT ON TABLE import_templates IS 'User-defined column mapping templates for recurring imports';
COMMENT ON FUNCTION calculate_import_quality_score IS 'Calculates data quality score (0-100) for an import';
COMMENT ON FUNCTION get_import_statistics IS 'Returns aggregated import statistics for a date range';

-- ============================================================================
-- End of Migration
-- ============================================================================
