# Rollback Feature - Setup Guide

**Date**: 2026-04-29  
**Purpose**: Step-by-step guide to enable rollback conflict detection

---

## Prerequisites

- ✅ Supabase project access
- ✅ SQL Editor access
- ✅ Backend running
- ✅ Frontend running

---

## Step 1: Run Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of:
   ```
   database/migrations/add_rollback_conflict_detection.sql
   ```
5. Click **Run** (or press Ctrl+Enter)
6. Wait for success message

### Option B: Via Command Line

```bash
# If you have Supabase CLI installed
supabase db push database/migrations/add_rollback_conflict_detection.sql
```

---

## Step 2: Verify Migration

Run this query to verify the migration was successful:

```sql
-- Check if has_conflicts column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'import_history' 
  AND column_name = 'has_conflicts';

-- Should return:
-- column_name    | data_type
-- has_conflicts  | boolean

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'can_safely_rollback_import';

-- Should return:
-- routine_name
-- can_safely_rollback_import

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_inventory_conflict_detection';

-- Should return:
-- trigger_name
-- trigger_inventory_conflict_detection
```

---

## Step 3: Mark Existing Imports

Run this to mark any existing imports that have conflicts:

```sql
SELECT mark_conflicting_imports();
```

This will:
- Find all imports where products have been modified
- Mark them as `has_conflicts = true`
- Set `can_rollback = false`

---

## Step 4: Restart Backend

The backend needs to be restarted to pick up the new database schema:

```bash
# Stop backend (Ctrl+C)
# Start backend again
cd backend
uvicorn main:app --reload --port 8000
```

---

## Step 5: Test the Feature

### Test 1: Create New Import

1. Go to **Inventory** page
2. Create a test CSV:
   ```csv
   SKU,Quantity,Threshold
   PROD-001,100,15
   PROD-002,200,20
   ```
3. Import the file
4. Go to **Import History**
5. Click on the import
6. You should see **"Rollback Import"** button ✅

### Test 2: Create Conflict

1. Go to **Inventory** page
2. Manually adjust one of the products
3. Go back to **Import History**
4. Click on the same import
5. You should see **⚠️ "Cannot rollback - products have been modified"** ✅

### Test 3: Rollback Safe Import

1. Create another new import
2. Immediately go to **Import History**
3. Click rollback
4. Should succeed ✅

---

## Troubleshooting

### Error: "column has_conflicts does not exist"

**Cause**: Migration not run

**Solution**:
1. Run the migration SQL (Step 1)
2. Restart backend (Step 4)

---

### Error: "function can_safely_rollback_import does not exist"

**Cause**: Migration not run or partially failed

**Solution**:
1. Check if migration ran successfully
2. Run this query to check:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE '%rollback%';
   ```
3. If empty, re-run migration

---

### Error: "No snapshots found for this import"

**Cause**: Trying to rollback an old import (created before rollback feature)

**Solution**:
- Old imports cannot be rolled back
- Only imports created **after** 2026-04-29 have snapshots
- Create a new import to test

---

### Rollback Button Not Showing

**Possible Causes**:
1. Import is for products (not inventory)
2. Import already rolled back
3. Import has conflicts
4. `can_rollback` is false

**Check**:
```sql
SELECT 
  id,
  file_name,
  entity_type,
  can_rollback,
  has_conflicts,
  rolled_back_at
FROM import_history
WHERE id = 'YOUR_IMPORT_ID';
```

---

### Backend Returns 400 Error

**Possible Causes**:
1. Migration not run
2. Backend not restarted
3. Database connection issue

**Solution**:
1. Check backend logs for detailed error
2. Verify migration ran successfully
3. Restart backend

---

## Verification Checklist

After setup, verify:

- [ ] Migration ran successfully (no errors)
- [ ] `has_conflicts` column exists in `import_history` table
- [ ] `can_safely_rollback_import()` function exists
- [ ] `trigger_inventory_conflict_detection` trigger exists
- [ ] Backend restarted
- [ ] Frontend shows rollback button for new imports
- [ ] Conflict detection works (test by modifying product)
- [ ] Rollback succeeds for safe imports
- [ ] Rollback blocked for conflicted imports

---

## Quick Test Script

Run this in Supabase SQL Editor to test everything:

```sql
-- 1. Check migration
SELECT 
  'has_conflicts column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'import_history' AND column_name = 'has_conflicts'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'can_safely_rollback_import function',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'can_safely_rollback_import'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'trigger_inventory_conflict_detection trigger',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_inventory_conflict_detection'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 2. Check recent imports
SELECT 
  id,
  file_name,
  entity_type,
  can_rollback,
  has_conflicts,
  rolled_back_at,
  created_at
FROM import_history
WHERE entity_type = 'inventory'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Test conflict detection function
-- Replace 'YOUR_IMPORT_ID' with actual import ID
-- SELECT * FROM can_safely_rollback_import('YOUR_IMPORT_ID');
```

---

## Expected Results

After successful setup:

1. **New imports**: Can be rolled back immediately
2. **Modified products**: Older imports marked as conflicted
3. **UI**: Shows appropriate buttons/warnings
4. **Errors**: Clear and helpful messages

---

## Rollback to Previous State (If Needed)

If you want to remove the conflict detection feature:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_inventory_conflict_detection ON inventory;

-- Remove functions
DROP FUNCTION IF EXISTS trigger_mark_conflicting_imports();
DROP FUNCTION IF EXISTS mark_conflicting_imports();
DROP FUNCTION IF EXISTS can_safely_rollback_import(UUID);

-- Remove column
ALTER TABLE import_history DROP COLUMN IF EXISTS has_conflicts;
```

**Warning**: This will remove the safety feature. Not recommended for production.

---

## Support

If you encounter issues:

1. Check backend logs for detailed errors
2. Verify migration ran completely
3. Check database connection
4. Restart backend and frontend
5. Review this guide again

---

**Last Updated**: 2026-04-29
