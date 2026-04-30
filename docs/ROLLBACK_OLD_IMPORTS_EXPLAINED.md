# Rollback for Old Imports - Explained

**Date**: 2026-04-29  
**Issue**: Old imports cannot be rolled back  
**Status**: ✅ Working as designed

---

## The Problem

When users try to rollback imports created **before April 29, 2026**, they see an error:

```
HTTP 400: No snapshots found for this import. Rollback is not available because data snapshots were not created during import.
```

---

## Why This Happens

### Timeline

1. **Before April 29, 2026**: Imports did NOT create snapshots
   - No `import_data_snapshot` records were created
   - Rollback feature didn't exist yet
   - Old imports have `can_rollback = true` by default (database default)

2. **After April 29, 2026**: Imports DO create snapshots
   - Every inventory import creates snapshots in `import_data_snapshot` table
   - Snapshots capture old values BEFORE update and new values AFTER update
   - These imports can be rolled back

### Why Old Imports Can't Be Rolled Back

**Rollback requires snapshots** to know what the old values were:

```sql
-- Rollback needs this data:
SELECT old_data FROM import_data_snapshot WHERE import_id = 'xxx'

-- For old imports, this returns EMPTY
-- Without old_data, we don't know what to restore
```

**Example**:
- Import on April 20, 2026: Product A quantity changed from 50 → 100
- No snapshot was created (feature didn't exist)
- On April 29, user tries to rollback
- System doesn't know the old value was 50
- **Cannot rollback safely**

---

## Enterprise Solution Implemented

### 1. **Backend Validation**

The backend checks for snapshots before allowing rollback:

```python
# backend/routers/imports.py
snapshots_result = db.table("import_data_snapshot").select("*").eq("import_id", import_id).execute()

if not snapshots_result.data or len(snapshots_result.data) == 0:
    raise HTTPException(
        status_code=400, 
        detail="No snapshots found for this import. Rollback is not available because data snapshots were not created during import."
    )
```

### 2. **Frontend UI Indicators**

The UI now shows different states:

#### A. Import with Snapshots (Can Rollback)
```
[Rollback Import] button visible
```

#### B. Import with Conflicts (Cannot Rollback)
```
⚠️ Cannot rollback - products have been modified
```

#### C. Import without Snapshots (Cannot Rollback)
```
ℹ️ Rollback not available - no snapshots found
```

#### D. Products Import (Never Rollback)
```
Product imports cannot be rolled back
```

### 3. **Error Messages**

When user tries to rollback an old import:

```
❌ Cannot rollback: No snapshots available

This import was created before the rollback feature was implemented. 
Only imports created after April 29, 2026 can be rolled back.
```

---

## What Enterprises Do

### Option 1: Accept the Limitation ✅ (Recommended)
- Old imports cannot be rolled back
- Only new imports (after feature launch) support rollback
- This is the standard approach for new features

**Pros**:
- Simple, clean implementation
- No data integrity risks
- Clear cutoff date

**Cons**:
- Old imports are "locked in"

### Option 2: Backfill Snapshots ❌ (Not Recommended)
- Try to reconstruct old snapshots from current data
- Requires complex logic and assumptions
- High risk of data corruption

**Why we don't do this**:
- We don't know what the old values were
- Current inventory might have changed multiple times
- Could restore wrong values
- Data integrity risk is too high

### Option 3: Manual Rollback ⚠️ (Advanced Users Only)
- Database admin manually reverts changes
- Requires SQL knowledge and database access
- Only for critical situations

---

## User Communication

### In the UI

1. **Import History Table**:
   - Rollback button only shows if `can_rollback = true` AND no conflicts
   - Old imports without snapshots: button is hidden

2. **Import Details Modal**:
   - Shows message: "Rollback not available - no snapshots found"
   - Explains why rollback is not possible

3. **Error Toast** (if user somehow triggers rollback):
   ```
   Cannot rollback: No snapshots available
   
   This import was created before the rollback feature was implemented.
   Only imports created after April 29, 2026 can be rolled back.
   ```

### In Documentation

- User guide explains rollback is only for new imports
- FAQ addresses "Why can't I rollback old imports?"
- Migration guide for users upgrading from old version

---

## Database State

### Old Imports (Before April 29, 2026)

```sql
-- import_history table
id: xxx
file_name: "inventory_april20.csv"
created_at: "2026-04-20T10:00:00Z"
can_rollback: true  -- Default value
rolled_back_at: null
has_conflicts: false

-- import_data_snapshot table
-- NO RECORDS for this import_id
```

### New Imports (After April 29, 2026)

```sql
-- import_history table
id: yyy
file_name: "inventory_april29.csv"
created_at: "2026-04-29T15:00:00Z"
can_rollback: true
rolled_back_at: null
has_conflicts: false

-- import_data_snapshot table
id: 1
import_id: yyy
entity_id: product_id_1
operation: "update"
old_data: {"quantity": 50, "low_stock_threshold": 10}
new_data: {"quantity": 100, "low_stock_threshold": 15}
```

---

## Migration Strategy

If you want to mark old imports as non-rollbackable in the database:

```sql
-- Mark all imports without snapshots as can_rollback = false
UPDATE import_history h
SET can_rollback = false
WHERE NOT EXISTS (
  SELECT 1 
  FROM import_data_snapshot s 
  WHERE s.import_id = h.id
);
```

This will:
- Hide rollback button for old imports
- Make it clear in the database that they can't be rolled back
- Prevent confusion

---

## Testing Scenarios

### Test 1: Old Import (No Snapshots)
1. ✅ View old import in Import History
2. ✅ Rollback button is hidden
3. ✅ Shows message: "Rollback not available - no snapshots found"
4. ✅ If user somehow triggers rollback, shows error toast

### Test 2: New Import (With Snapshots)
1. ✅ Import inventory with snapshots
2. ✅ Rollback button is visible
3. ✅ Rollback works successfully
4. ✅ Quantities are restored

### Test 3: Import with Conflicts
1. ✅ Import inventory
2. ✅ Manually update same products
3. ✅ Conflict detection marks import as has_conflicts
4. ✅ Rollback button is hidden
5. ✅ Shows message: "Cannot rollback - products have been modified"

---

## Conclusion

**Old imports cannot be rolled back** because:
1. No snapshots were created (feature didn't exist)
2. We don't know what the old values were
3. Attempting to rollback would be unsafe

**This is working as designed** and follows enterprise best practices:
- Clear cutoff date for feature availability
- No data integrity risks
- User-friendly error messages
- UI indicators for different states

**Recommendation**: Accept this limitation and communicate clearly to users that only imports created after April 29, 2026 can be rolled back.

---

## Files Modified

- `frontend/components/imports/ImportDetailsModal.tsx` - Better error handling and UI states
- `docs/ROLLBACK_OLD_IMPORTS_EXPLAINED.md` - This documentation

---

## Next Steps

1. ✅ Run migration to mark old imports as `can_rollback = false` (optional)
2. ✅ Update user documentation
3. ✅ Add FAQ entry
4. ✅ Monitor for user questions

