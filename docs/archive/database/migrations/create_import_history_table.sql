-- Migration: Create import_history table for v2
-- Date: 2026-04-15
-- Description: Track all inventory imports with rollback capability

CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  mode TEXT CHECK (mode IN ('replace', 'add')) NOT NULL,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')) NOT NULL,
  rollback_available BOOLEAN DEFAULT TRUE,
  rollback_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_import_history_user ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_timestamp ON import_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_rollback ON import_history(rollback_available, rollback_deadline) 
  WHERE rollback_available = TRUE;

-- Enable RLS
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Add comment
COMMENT ON TABLE import_history IS 'Tracks all inventory import operations with rollback capability (v2 feature)';
