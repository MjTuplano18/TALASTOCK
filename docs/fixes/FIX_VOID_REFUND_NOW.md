# 🚨 URGENT FIX: Void and Refund Not Working

## The Problem

Void (delete) and refund operations are failing because the database Row Level Security (RLS) policies don't allow DELETE operations on `sales` and `sale_items` tables.

## The Solution (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select project: `uwzidzpwiceijjcmifum`
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New query"**

### Step 2: Run This SQL

Copy and paste this entire block, then click **"Run"**:

```sql
-- Fix sales DELETE policy
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;

CREATE POLICY "Authenticated users can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on sale_items
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Fix sale_items policies
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON sale_items;

CREATE POLICY "Authenticated users can delete sale_items"
  ON sale_items FOR DELETE
  TO authenticated
  USING (true);

-- Verify the fix
SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('sales', 'sale_items')
  AND cmd = 'DELETE'
ORDER BY tablename;
```

### Step 3: Verify

You should see output like:

| tablename | policyname | operation |
|-----------|------------|-----------|
| sale_items | Authenticated users can delete sale_items | DELETE |
| sales | Authenticated users can delete sales | DELETE |

✅ If you see both rows, the fix worked!

### Step 4: Test Void

1. Go to: https://talastock.vercel.app/sales
2. Click **trash icon** on any sale
3. Confirm deletion
4. ✅ Sale should disappear immediately

### Step 5: Test Refund

1. Click **rotate icon** on any sale
2. Select items to refund
3. Confirm refund
4. ✅ Status should change to "Refunded"

## Why This Happened

The RLS (Row Level Security) policies on your Supabase database were missing DELETE permissions for the `sales` and `sale_items` tables. This prevented the frontend from deleting records even though the code was correct.

## Root Cause

When the database schema was created, the DELETE policies were either:
1. Not created at all
2. Created but then dropped during a migration
3. Created with incorrect permissions

## Prevention

The SQL script above ensures:
- ✅ DELETE policy exists on `sales` table
- ✅ DELETE policy exists on `sale_items` table
- ✅ Both policies allow authenticated users to delete
- ✅ RLS is enabled on both tables

## Alternative: Full Policy Reset

If the quick fix above doesn't work, run this comprehensive fix:

```sql
-- ============================================================================
-- COMPREHENSIVE FIX: Reset all policies for sales and sale_items
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;

DROP POLICY IF EXISTS "Authenticated users can read sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON sale_items;

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create complete policies for sales
CREATE POLICY "Authenticated users can read sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (true);

-- Create complete policies for sale_items
CREATE POLICY "Authenticated users can read sale_items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sale_items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sale_items"
  ON sale_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sale_items"
  ON sale_items FOR DELETE
  TO authenticated
  USING (true);

-- Verify all policies
SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('sales', 'sale_items')
ORDER BY tablename, cmd;
```

## Troubleshooting

### Still Not Working?

1. **Check browser console** (F12) for errors
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh** the page (Ctrl+F5)
4. **Log out and log back in** to refresh auth token

### Check RLS Policies

Run this query to see all current policies:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('sales', 'sale_items')
ORDER BY tablename, cmd;
```

### Check Table Permissions

Run this query to verify DELETE permissions:

```sql
SELECT 
  'sales' AS table_name,
  has_table_privilege('authenticated', 'sales', 'DELETE') AS can_delete
UNION ALL
SELECT 
  'sale_items' AS table_name,
  has_table_privilege('authenticated', 'sale_items', 'DELETE') AS can_delete;
```

Both should return `true`.

## Files

- **Quick Fix SQL:** See above
- **Comprehensive Fix:** `database/migrations/fix_sales_delete_policy.sql`

## Need Help?

1. Check Supabase logs for errors
2. Check browser console (F12) for frontend errors
3. Verify you're logged in as an authenticated user
4. Try the comprehensive fix if quick fix doesn't work

---

**Status:** ⚠️ Requires manual SQL execution in Supabase  
**Time to fix:** 2 minutes  
**Complexity:** Simple SQL query
