-- ============================================================================
-- Verification Script for Import History Tables
-- ============================================================================
-- Run this after creating the tables to verify everything is set up correctly
-- ============================================================================

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('import_history', 'import_data_snapshot', 'import_templates') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('import_history', 'import_data_snapshot', 'import_templates')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('import_history', 'import_data_snapshot', 'import_templates')
ORDER BY tablename;

-- Check if functions exist
SELECT 
    routine_name,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calculate_import_quality_score', 'get_import_statistics')
ORDER BY routine_name;

-- Check if indexes exist
SELECT 
    indexname,
    tablename,
    '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('import_history', 'import_data_snapshot', 'import_templates')
ORDER BY tablename, indexname;

-- Count policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS POLICIES'
        ELSE '❌ NO POLICIES'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('import_history', 'import_data_snapshot', 'import_templates')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- Tables: 3 tables should exist
-- RLS: All 3 tables should have RLS enabled
-- Functions: 2 functions should exist
-- Indexes: 7 indexes should exist
-- Policies: Each table should have 2-4 policies
-- ============================================================================
