# Rollback Debug Guide

## Error: "No snapshots found for this import"

This error occurs when you try to rollback an import that doesn't have any data snapshots.

---

## Why This Happens

Snapshots are only created for imports that were done **after** the rollback feature was implemented (2026-04-29).

**Old imports** (before today) will NOT have snapshots and cannot be rolled back.

---

## How to Check if Snapshots Exist

### Option 1: Check in Supabase Dashboard

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run this query:

```sql
SELECT 
  h.id as import_id,
  h.file_name,
  h.created_at,
  COUNT(s.id) as snapshot_count
FROM import_history h
LEFT JOIN import_data_snapshot s ON s.import_id = h.id
WHERE h.entity_type = 'inventory'
GROUP BY h.id, h.file_name, h.created_at
ORDER BY h.created_at DESC
LIMIT 10;
```

**Result**:
- `snapshot_count = 0` → Cannot rollback (no snapshots)
- `snapshot_count > 0` → Can rollback

### Option 2: Check in Browser Console

1. Open Import History page
2. Open browser DevTools (F12)
3. Click on an import to view details
4. In Console, type:

```javascript
// Check if import has snapshots
fetch('http://localhost:8000/api/v1/imports/history/YOUR_IMPORT_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json()).then(d => console.log('Snapshot count:', d.data.snapshot_count))
```

---

## Solution: Create a New Import

To test rollback, you need to create a **new import** (after the feature was implemented):

### Step 1: Prepare Test Data

Create a CSV file `test-rollback.csv`:

```csv
SKU,Quantity,Threshold
PROD-001,100,15
PROD-002,200,20
PROD-003,150,12
```

### Step 2: Import the File

1. Go to **Inventory** page
2. Click **Import** button
3. Upload `test-rollback.csv`
4. Select **Replace** mode
5. Click **Confirm Import**
6. Wait for success message

### Step 3: Verify Snapshots Were Created

Run this SQL query:

```sql
SELECT 
  s.*,
  h.file_name
FROM import_data_snapshot s
JOIN import_history h ON h.id = s.import_id
WHERE h.file_name = 'test-rollback.csv'
ORDER BY s.created_at DESC;
```

**Expected**: You should see 3 rows (one for each product)

### Step 4: Test Rollback

1. Go to **Import History** page
2. Find the import you just created
3. Click on it to open details
4. Click **Rollback Import** button
5. Enter reason: "Testing rollback"
6. Click **Confirm Rollback**
7. Should see success message

---

## Common Issues

### Issue 1: Old Imports Don't Have Snapshots

**Symptom**: Error "No snapshots found for this import"

**Cause**: Import was created before rollback feature was implemented

**Solution**: Create a new import (see above)

**Why**: Snapshots are only created during import, not retroactively

---

### Issue 2: Snapshot Creation Failed During Import

**Symptom**: Import succeeded but no snapshots in database

**Cause**: Error during snapshot creation (check browser console)

**Solution**: 
1. Check browser console for errors during import
2. Check backend logs for snapshot creation errors
3. Verify RLS policies allow snapshot insertion

**Debug**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'import_data_snapshot';

-- Try manual insert
INSERT INTO import_data_snapshot (
  import_id,
  entity_type,
  entity_id,
  operation,
  old_data,
  new_data
) VALUES (
  'test-import-id',
  'inventory',
  'test-product-id',
  'update',
  '{"quantity": 50}'::jsonb,
  '{"quantity": 100}'::jsonb
);
```

---

### Issue 3: Rollback Button Not Visible

**Symptom**: Can't find rollback button

**Possible Causes**:
1. Import is for products (not inventory) → Products cannot be rolled back
2. Import already rolled back → Cannot rollback twice
3. `can_rollback` is false in database

**Check**:
```sql
SELECT 
  id,
  file_name,
  entity_type,
  can_rollback,
  rolled_back_at
FROM import_history
WHERE id = 'YOUR_IMPORT_ID';
```

---

### Issue 4: Rollback Fails with "Import not found"

**Symptom**: 404 error when trying to rollback

**Cause**: Import belongs to different user or doesn't exist

**Check**:
```sql
SELECT 
  id,
  user_id,
  file_name
FROM import_history
WHERE id = 'YOUR_IMPORT_ID';
```

**Solution**: Make sure you're logged in as the user who created the import

---

## Testing Checklist

Before reporting a bug, verify:

- [ ] Import was created **after** 2026-04-29 (when feature was implemented)
- [ ] Import is for **inventory** (not products)
- [ ] Snapshots exist in database (run SQL query above)
- [ ] Import has NOT been rolled back already
- [ ] You are logged in as the user who created the import
- [ ] Browser console shows no errors during import
- [ ] Backend logs show no errors during snapshot creation

---

## How to Enable Rollback for Old Imports (Advanced)

**Warning**: This is a manual process and should only be done if you understand the risks.

### Step 1: Identify Products in Old Import

```sql
-- Find products that were imported
SELECT 
  h.id as import_id,
  h.file_name,
  sm.product_id,
  sm.quantity as change_amount,
  sm.created_at
FROM import_history h
JOIN stock_movements sm ON sm.note LIKE '%' || h.file_name || '%'
WHERE h.id = 'YOUR_OLD_IMPORT_ID'
  AND sm.type = 'import';
```

### Step 2: Get Current Values

```sql
-- Get current inventory values
SELECT 
  i.product_id,
  i.quantity as current_quantity,
  i.low_stock_threshold as current_threshold
FROM inventory i
WHERE i.product_id IN (
  -- List of product IDs from Step 1
);
```

### Step 3: Calculate Old Values

For each product:
- If import was "Replace" mode: `old_quantity = current_quantity - change_amount`
- If import was "Add" mode: `old_quantity = current_quantity - change_amount`

### Step 4: Manually Create Snapshots

```sql
-- Create snapshot for each product
INSERT INTO import_data_snapshot (
  import_id,
  entity_type,
  entity_id,
  operation,
  old_data,
  new_data
) VALUES (
  'YOUR_OLD_IMPORT_ID',
  'inventory',
  'PRODUCT_ID',
  'update',
  '{"quantity": OLD_QUANTITY, "low_stock_threshold": OLD_THRESHOLD}'::jsonb,
  '{"quantity": CURRENT_QUANTITY, "low_stock_threshold": CURRENT_THRESHOLD}'::jsonb
);
```

**Note**: This is error-prone and not recommended. Better to just create a new import.

---

## Quick Fix: Just Re-Import

If you need to undo an old import:

1. Export current inventory to CSV
2. Manually edit the CSV to restore old values
3. Import the corrected CSV
4. This new import will have snapshots and can be rolled back

---

## Contact Support

If none of the above solutions work, provide:

1. Import ID
2. Screenshot of error
3. Browser console logs
4. Result of SQL query: `SELECT * FROM import_history WHERE id = 'YOUR_IMPORT_ID'`
5. Result of SQL query: `SELECT COUNT(*) FROM import_data_snapshot WHERE import_id = 'YOUR_IMPORT_ID'`

---

**Last Updated**: 2026-04-29
