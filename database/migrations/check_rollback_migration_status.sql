-- ============================================================================
-- Check Rollback Migration Status
-- ============================================================================
-- Run this to check if the rollback conflict detection migration is needed
-- ============================================================================

-- Check 1: has_conflicts column
SELECT 
  'has_conflicts column' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'import_history' 
      AND column_name = 'has_conflicts'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - Run migration' END as status;

-- Check 2: can_safely_rollback_import function
SELECT 
  'can_safely_rollback_import function' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public'
      AND routine_name = 'can_safely_rollback_import'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - Run migration' END as status;

-- Check 3: mark_conflicting_imports function
SELECT 
  'mark_conflicting_imports function' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public'
      AND routine_name = 'mark_conflicting_imports'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - Run migration' END as status;

-- Check 4: trigger_inventory_conflict_detection trigger
SELECT 
  'trigger_inventory_conflict_detection trigger' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
      AND trigger_name = 'trigger_inventory_conflict_detection'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - Run migration' END as status;

-- Summary
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM (
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_history' AND column_name = 'has_conflicts')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_safely_rollback_import')
        UNION ALL
        SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_inventory_conflict_detection'
      ) x
    ) = 3 
    THEN '✅ MIGRATION COMPLETE - All components exist'
    ELSE '❌ MIGRATION NEEDED - Run add_rollback_conflict_detection.sql'
  END as migration_status;

