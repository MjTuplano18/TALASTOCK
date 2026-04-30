# Import History & Rollback - Complete Guide

## What is Import History?

Import History tracks every data import in Talastock, recording:
- ✅ What was imported (products, inventory, sales, customers)
- ✅ Success/failure counts
- ✅ Errors and warnings
- ✅ Processing time
- ✅ Quality score
- ✅ Who imported it and when

## Where is it Recorded?

**Currently Integrated:**
1. ✅ **Inventory Import** - Full history tracking with rollback support
2. ✅ **Products Import** - History tracking (no rollback)

**Not Yet Integrated:**
- ❌ Sales Import
- ❌ Customers Import

## What is Rollback?

**Rollback** = "Undo" button for imports

### How Rollback Works

When you import data, the system creates **snapshots** of what changed:

```
BEFORE IMPORT:
Product A: quantity = 100

IMPORT:
Product A: quantity = 150 (added 50)

SNAPSHOT SAVED:
- entity: Product A
- operation: update
- old_value: 100
- new_value: 150

ROLLBACK:
Product A: quantity = 100 (restored from snapshot)
```

### Rollback Actions by Operation Type

| Operation | Rollback Action |
|-----------|----------------|
| **Insert** (new record) | Delete the record |
| **Update** (changed record) | Restore old values |
| **Delete** (removed record) | Re-insert the record |

## Why Products Can't Be Rolled Back

**Problem:** Foreign key constraints

When you import products:
1. Product is created
2. Inventory record is created (linked to product)
3. Product might be used in sales

**If you try to rollback (delete product):**
```
❌ ERROR 409 (CONFLICT)
Cannot delete product because:
- Inventory record references it
- Sales records reference it
- Foreign key constraint violation
```

**Solution:** Products imports are **NOT rollback-able**
- Too risky to delete products with dependencies
- Could break sales history
- Could orphan inventory records

## What CAN Be Rolled Back?

### ✅ Inventory Imports (Quantity Updates)

**Safe because:**
- Only updates quantities (no new records)
- No foreign key issues
- Easy to restore old quantities

**Example:**
```
IMPORT: Update 50 products' quantities
ROLLBACK: Restore all 50 quantities to previous values
```

## Import History Features

### 1. Track All Imports
- View all imports in one place
- Filter by type, status, date
- See success/failure rates

### 2. Quality Scoring
Automatically calculated based on:
- Success rate (70% weight)
- Error count (20% weight)
- Warning count (10% weight)

**Formula:**
```
Quality Score = (successful_rows / total_rows) × 70
              + (1 - errors / total_rows) × 20
              + (1 - warnings / total_rows) × 10
```

### 3. Error Tracking
Records detailed errors:
- Which row failed
- What field had the issue
- Error message
- Invalid value

### 4. Statistics Dashboard
Shows:
- Total imports (last 30 days)
- Success rate
- Average quality score
- Total rows processed

## Current Implementation Status

### ✅ Completed
- [x] Database schema (3 tables)
- [x] Backend API (9 endpoints)
- [x] Frontend UI (Import History page)
- [x] Inventory import integration
- [x] Products import integration
- [x] Rollback for inventory
- [x] Quality scoring
- [x] Error tracking
- [x] Statistics

### ⚠️ Limitations
- Products imports: No rollback (by design)
- Sales imports: Not integrated yet
- Customers imports: Not integrated yet
- Max 100 imports shown (backend limit)

## How to Use

### View Import History
1. Go to **Imports** page in sidebar
2. See all imports with status, quality, date
3. Use filters to find specific imports
4. Click eye icon to view details

### Rollback an Import (Inventory Only)
1. Open import details
2. Click "Rollback Import" button
3. Enter reason for rollback
4. Confirm rollback
5. System reverts all changes

### Check Import Quality
- **100%** = Perfect import, no errors
- **80-99%** = Good, minor issues
- **60-79%** = Fair, some failures
- **<60%** = Poor, many failures

## Error Messages Explained

### 409 Conflict (Rollback)
```
Cannot rollback: Foreign key constraint
```
**Meaning:** Can't delete records that are referenced elsewhere
**Solution:** Products can't be rolled back (by design)

### 422 Unprocessable Entity
```
Validation error: limit exceeds maximum
```
**Meaning:** Requested too many records
**Solution:** Backend limits to 100 imports per request

### 500 Internal Server Error
```
Failed to create import history
```
**Meaning:** Backend couldn't save the import record
**Solution:** Check backend logs, verify database connection

## Best Practices

### ✅ DO
- Review import details before closing
- Use rollback for inventory mistakes
- Check quality scores regularly
- Filter imports to find issues
- Keep import files for reference

### ❌ DON'T
- Don't try to rollback products (will fail)
- Don't ignore low quality scores
- Don't import without checking errors
- Don't rollback without a reason
- Don't delete import history records

## Future Enhancements

### Planned Features
- [ ] Sales import tracking
- [ ] Customers import tracking
- [ ] Export import history to Excel
- [ ] Email notifications for failed imports
- [ ] Scheduled imports
- [ ] Import templates management
- [ ] Bulk rollback (multiple imports)
- [ ] Import history retention policy

### Under Consideration
- [ ] Partial rollback (select specific rows)
- [ ] Rollback preview (dry run)
- [ ] Import comparison (before/after)
- [ ] Automated quality checks
- [ ] Import scheduling
