# Rollback Feature - Testing Guide

**Date**: 2026-04-29  
**Feature**: Import Rollback with Data Snapshots  
**Status**: Ready for Testing

---

## Prerequisites

1. ✅ Backend running on `http://localhost:8000`
2. ✅ Frontend running on `http://localhost:3000`
3. ✅ Logged in as authenticated user
4. ✅ At least 3-5 products in the system with existing inventory

---

## Test Scenario 1: Basic Rollback Flow

### Step 1: Prepare Test Data

1. Go to **Inventory** page
2. Note down current quantities for 3 products:
   ```
   Product A: Current Qty = 50
   Product B: Current Qty = 30
   Product C: Current Qty = 75
   ```

### Step 2: Create Import File

Create a CSV file named `test-rollback.csv`:

```csv
SKU,Quantity,Threshold
PROD-A-001,100,15
PROD-B-002,80,20
PROD-C-003,150,25
```

### Step 3: Import the File

1. Click **Import** button on Inventory page
2. Upload `test-rollback.csv`
3. Select **Replace** mode
4. Uncheck "Dry Run"
5. Click **Confirm Import**
6. Wait for success message

### Step 4: Verify Import

1. Check inventory quantities are updated:
   ```
   Product A: 50 → 100 ✅
   Product B: 30 → 80 ✅
   Product C: 75 → 150 ✅
   ```

### Step 5: Check Import History

1. Go to **Import History** page
2. Find the import you just created
3. Click on the row to open details
4. Verify:
   - ✅ Status: Success
   - ✅ Total Rows: 3
   - ✅ Successful Rows: 3
   - ✅ Failed Rows: 0
   - ✅ "Rollback Import" button is visible

### Step 6: Perform Rollback

1. Click **Rollback Import** button
2. Enter reason: "Testing rollback feature"
3. Click **Confirm Rollback**
4. Wait for success message: "Successfully rolled back 3 changes"

### Step 7: Verify Rollback

1. **Go to Inventory page** (important - you need to navigate away from Import History)
2. Refresh the page if needed
3. Check quantities are restored:
   ```
   Product A: 100 → 50 ✅
   Product B: 80 → 30 ✅
   Product C: 150 → 75 ✅
   ```

4. Go back to **Import History**
5. Open the same import details
6. Verify:
   - ✅ Shows "This import has been rolled back"
   - ✅ "Rollback Import" button is hidden
   - ✅ Rolled back date is displayed

**Note**: After rollback, you must navigate to the Inventory page to see the changes. The Import History page does not automatically refresh inventory data.

---

## Test Scenario 2: Add Mode Rollback

### Step 1: Note Current Quantities

```
Product A: Current Qty = 50
Product B: Current Qty = 30
```

### Step 2: Import with Add Mode

Create `test-add-mode.csv`:
```csv
SKU,Quantity
PROD-A-001,20
PROD-B-002,15
```

1. Import with **Add** mode (not Replace)
2. Verify quantities:
   ```
   Product A: 50 + 20 = 70 ✅
   Product B: 30 + 15 = 45 ✅
   ```

### Step 3: Rollback

1. Go to Import History
2. Rollback the import
3. Verify quantities restored:
   ```
   Product A: 70 → 50 ✅
   Product B: 45 → 30 ✅
   ```

---

## Test Scenario 3: Partial Import Rollback

### Step 1: Create File with Errors

Create `test-partial.csv`:
```csv
SKU,Quantity,Threshold
PROD-A-001,100,15
INVALID-SKU,50,10
PROD-B-002,80,20
```

### Step 2: Import with Partial Mode

1. Upload file
2. Enable "Partial Import" checkbox
3. Import should succeed for valid rows only
4. Verify:
   - ✅ Successful Rows: 2
   - ✅ Failed Rows: 1

### Step 3: Rollback

1. Rollback the import
2. Verify only the 2 successful products are rolled back
3. Invalid SKU should not affect rollback

---

## Test Scenario 4: Edge Cases

### Test 4.1: Double Rollback (Should Fail)

1. Import inventory
2. Rollback successfully
3. Try to rollback again
4. ✅ Should show error: "This import has already been rolled back"

### Test 4.2: Rollback Without Reason (Should Fail)

1. Import inventory
2. Click "Rollback Import"
3. Leave reason field empty
4. Click "Confirm Rollback"
5. ✅ Should show error: "Please provide a reason for rollback"

### Test 4.3: Products Import (No Rollback)

1. Go to **Products** page
2. Import products (not inventory)
3. Go to Import History
4. Open product import details
5. ✅ Should show: "Product imports cannot be rolled back"
6. ✅ Rollback button should be hidden

### Test 4.4: Import Without Snapshots

This is a manual database test:

1. Import inventory normally
2. Manually delete snapshots from database:
   ```sql
   DELETE FROM import_data_snapshot WHERE import_id = 'your-import-id';
   ```
3. Try to rollback
4. ✅ Should show error: "No snapshots found for this import"

---

## Test Scenario 5: Multiple Products (Stress Test)

### Step 1: Create Large Import File

Create `test-large.csv` with 20+ products:
```csv
SKU,Quantity,Threshold
PROD-001,100,10
PROD-002,200,15
PROD-003,150,12
... (add 17 more rows)
```

### Step 2: Import and Rollback

1. Import all 20 products
2. Verify all are updated
3. Rollback
4. Verify all are restored
5. Check performance (should complete in < 5 seconds)

---

## Database Verification

### Check Snapshots Were Created

```sql
SELECT 
  s.id,
  s.entity_id,
  s.operation,
  s.old_data,
  s.new_data,
  h.file_name
FROM import_data_snapshot s
JOIN import_history h ON h.id = s.import_id
WHERE h.entity_type = 'inventory'
ORDER BY s.created_at DESC
LIMIT 10;
```

### Check Import History

```sql
SELECT 
  id,
  file_name,
  entity_type,
  status,
  total_rows,
  successful_rows,
  failed_rows,
  can_rollback,
  rolled_back_at,
  created_at
FROM import_history
WHERE entity_type = 'inventory'
ORDER BY created_at DESC
LIMIT 5;
```

### Count Snapshots Per Import

```sql
SELECT 
  h.file_name,
  h.status,
  COUNT(s.id) as snapshot_count
FROM import_history h
LEFT JOIN import_data_snapshot s ON s.import_id = h.id
WHERE h.entity_type = 'inventory'
GROUP BY h.id, h.file_name, h.status
ORDER BY h.created_at DESC;
```

---

## Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Basic rollback | Quantities restored | ✅ |
| Add mode rollback | Quantities restored | ✅ |
| Partial import rollback | Only valid rows rolled back | ✅ |
| Double rollback | Error message | ✅ |
| No reason | Error message | ✅ |
| Products import | No rollback button | ✅ |
| No snapshots | Error message | ✅ |
| Large import | All restored | ✅ |

---

## Troubleshooting

### Issue: Snapshots Not Created

**Symptoms**: Rollback fails with "No snapshots found"

**Check**:
1. Open browser console during import
2. Look for errors in snapshot creation
3. Check backend logs for errors

**Solution**:
- Verify `createDataSnapshot()` is being called
- Check network tab for failed API calls
- Verify RLS policies allow snapshot insertion

### Issue: Rollback Doesn't Restore Values

**Symptoms**: Rollback succeeds but quantities unchanged

**Check**:
1. Verify snapshots have correct `old_data`
2. Check backend logs for update errors
3. Verify `product_id` matches in snapshots

**Solution**:
- Check `useInventory.ts` captures old values correctly
- Verify backend uses `product_id` not `id` for updates

### Issue: Rollback Button Not Visible

**Symptoms**: Can't find rollback button

**Check**:
1. Verify import is for inventory (not products)
2. Check `can_rollback` is true in database
3. Verify import hasn't been rolled back already

**Solution**:
- Only inventory imports support rollback
- Check import_history.can_rollback column

---

## Success Criteria

✅ All test scenarios pass  
✅ No console errors during import/rollback  
✅ Database snapshots are created correctly  
✅ Quantities are restored accurately  
✅ Error messages are clear and helpful  
✅ UI is responsive and intuitive  

---

## Next Steps After Testing

1. ✅ Mark feature as production-ready
2. ✅ Update user documentation
3. ✅ Add rollback support for Sales (future)
4. ✅ Add rollback support for Customers (future)
5. ✅ Consider adding "Redo" feature (future)

---

## Contact

If you encounter any issues during testing, check:
- Browser console for frontend errors
- Backend logs for API errors
- Database for data integrity issues

**Happy Testing! 🚀**
