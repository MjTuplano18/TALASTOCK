# Rollback Feature Guide

> Complete guide to Talastock's import rollback capability - revert bad imports with before/after snapshots.

---

## Overview

The Rollback feature allows users to safely revert data imports that contain errors or were performed by mistake. It uses before/after snapshots to restore data to its previous state.

**Key Features:**
- Snapshot-based rollback (stores before/after data)
- Conflict detection (detects if data changed after import)
- Audit trail (tracks who rolled back and when)
- Safety checks (prevents double rollback)

---

## How It Works

### Import Flow with Snapshots

```
1. User imports file
2. For each row being modified:
   ├─ Take snapshot of OLD data (before change)
   ├─ Apply change
   └─ Take snapshot of NEW data (after change)
3. Store snapshots in import_data_snapshot table
4. Mark import as can_rollback = true
```

### Rollback Flow

```
1. User clicks "Rollback" button
2. System checks:
   ├─ Import hasn't been rolled back already
   ├─ Snapshots exist
   └─ No conflicts (data hasn't changed since import)
3. For each snapshot:
   ├─ Read old_data
   ├─ Restore to database
   └─ Create stock movement record
4. Mark import as rolled_back_at = now()
5. Set can_rollback = false
```

---

## Database Schema

### import_data_snapshot Table

```sql
CREATE TABLE import_data_snapshot (
  id UUID PRIMARY KEY,
  import_id UUID REFERENCES import_history(id),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  operation TEXT CHECK (operation IN ('insert', 'update', 'delete')),
  old_data JSONB,  -- Data before change
  new_data JSONB,  -- Data after change
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Example Snapshot:**
```json
{
  "old_data": {
    "product_id": "abc-123",
    "quantity": 50,
    "low_stock_threshold": 10
  },
  "new_data": {
    "product_id": "abc-123",
    "quantity": 100,
    "low_stock_threshold": 10
  }
}
```

---

## API Usage

### Rollback an Import

```typescript
import { rollbackImport } from '@/lib/api-imports'

const result = await rollbackImport({
  import_id: 'uuid-of-import',
  reason: 'Imported wrong file',
})

console.log(`Rolled back ${result.rollback_count} changes`)
if (result.errors.length > 0) {
  console.error('Some rollbacks failed:', result.errors)
}
```

### Check if Import Can Be Rolled Back

```typescript
import { getImportDetails } from '@/lib/api-imports'

const importDetails = await getImportDetails(importId)

if (!importDetails.can_rollback) {
  alert('This import cannot be rolled back')
  return
}

if (importDetails.rolled_back_at) {
  alert('This import has already been rolled back')
  return
}

// Proceed with rollback
await rollbackImport({ import_id: importId })
```

---

## Conflict Detection

### What Are Conflicts?

Conflicts occur when data has been modified AFTER the import but BEFORE the rollback.

**Example:**
```
1. Import changes quantity from 50 → 100 (April 20)
2. User manually edits quantity to 120 (April 25)
3. User tries to rollback import (April 29)
   ❌ Conflict! Data changed after import
```

### How Conflicts Are Detected

```sql
-- Check if inventory was modified after import
SELECT COUNT(*) 
FROM inventory i
JOIN import_data_snapshot s ON s.entity_id = i.product_id
WHERE s.import_id = 'xxx'
  AND i.updated_at > (SELECT created_at FROM import_history WHERE id = 'xxx')
```

### Handling Conflicts

**Option 1: Prevent Rollback**
```typescript
if (importDetails.has_conflicts) {
  alert('Cannot rollback: Data has been modified since import')
  return
}
```

**Option 2: Force Rollback (Advanced)**
```typescript
// Only for admin users
const result = await rollbackImport({
  import_id: importId,
  reason: 'Force rollback despite conflicts',
  force: true, // Override conflict check
})
```

---

## Old Imports (No Snapshots)

### The Problem

Imports created BEFORE the rollback feature was implemented don't have snapshots.

**Why?**
- Rollback feature added April 29, 2026
- Imports before this date have no snapshots
- Cannot rollback without snapshots

### The Solution

Mark old imports as non-rollbackable:

```sql
-- Run this migration
UPDATE import_history h
SET can_rollback = false
WHERE NOT EXISTS (
  SELECT 1 FROM import_data_snapshot s 
  WHERE s.import_id = h.id
);
```

**Result:**
- Old imports show "Cannot Rollback" in UI
- Prevents errors when users try to rollback
- Clear messaging to users

---

## UI Components

### Rollback Button

```typescript
'use client'
import { rollbackImport } from '@/lib/api-imports'

export function RollbackButton({ importId, canRollback }: Props) {
  async function handleRollback() {
    if (!confirm('Are you sure you want to rollback this import?')) {
      return
    }

    try {
      const result = await rollbackImport({ 
        import_id: importId,
        reason: 'User requested rollback'
      })
      alert(`Successfully rolled back ${result.rollback_count} changes`)
    } catch (error) {
      alert('Rollback failed: ' + error.message)
    }
  }

  if (!canRollback) {
    return <button disabled>Cannot Rollback</button>
  }

  return (
    <button onClick={handleRollback} className="text-red-600">
      Rollback
    </button>
  )
}
```

### Rollback Confirmation Dialog

```typescript
export function RollbackDialog({ importId, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRollback() {
    setLoading(true)
    try {
      const result = await rollbackImport({ import_id: importId, reason })
      alert(`Successfully rolled back ${result.rollback_count} changes`)
      onSuccess()
    } catch (error) {
      alert('Rollback failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <h2>Rollback Import</h2>
      <p>This will revert all changes made by this import.</p>
      <p className="text-red-600">This action cannot be undone.</p>
      
      <label>
        Reason (optional):
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)}
          placeholder="Why are you rolling back this import?"
        />
      </label>

      <button onClick={handleRollback} disabled={loading}>
        {loading ? 'Rolling back...' : 'Confirm Rollback'}
      </button>
    </Dialog>
  )
}
```

---

## Troubleshooting

### Rollback Button Disabled

**Possible Reasons:**
1. Import has already been rolled back
2. Import has no snapshots (old import)
3. Import has conflicts
4. User doesn't have permission

**Check:**
```sql
SELECT 
  can_rollback,
  rolled_back_at,
  has_conflicts,
  (SELECT COUNT(*) FROM import_data_snapshot WHERE import_id = h.id) as snapshot_count
FROM import_history h
WHERE id = 'YOUR_IMPORT_ID';
```

### Rollback Failed

**Common Errors:**
1. "Import has already been rolled back"
   - Check `rolled_back_at` field
   - Cannot rollback twice

2. "No snapshots found"
   - Old import without snapshots
   - Cannot rollback

3. "Conflicts detected"
   - Data changed after import
   - Use force rollback (admin only)

4. "Permission denied"
   - User doesn't own the import
   - Only import owner can rollback

---

## Best Practices

### 1. Always Confirm Before Rollback
```typescript
// ✅ Good: Confirm with user
if (confirm('Are you sure?')) {
  await rollbackImport({ import_id: importId })
}

// ❌ Bad: No confirmation
await rollbackImport({ import_id: importId })
```

### 2. Provide Rollback Reason
```typescript
// ✅ Good: Explain why
await rollbackImport({
  import_id: importId,
  reason: 'Imported wrong file - should be April data not March'
})

// ❌ Bad: No reason
await rollbackImport({ import_id: importId })
```

### 3. Check Conflicts First
```typescript
// ✅ Good: Check before rollback
const details = await getImportDetails(importId)
if (details.has_conflicts) {
  alert('Cannot rollback: Data has been modified')
  return
}
await rollbackImport({ import_id: importId })
```

### 4. Handle Errors Gracefully
```typescript
// ✅ Good: Handle errors
try {
  await rollbackImport({ import_id: importId })
  toast.success('Rollback successful')
} catch (error) {
  toast.error('Rollback failed: ' + error.message)
}
```

---

## Security

### Row Level Security

Users can only rollback their own imports:

```sql
CREATE POLICY "Users can rollback own imports"
ON import_history
FOR UPDATE
USING (auth.uid() = user_id);
```

### Audit Trail

All rollbacks are tracked:
- Who rolled back (user_id)
- When rolled back (rolled_back_at)
- Why rolled back (reason in stock_movements)

---

## Related Documentation

- **ETL Guide:** `docs/features/ETL_GUIDE.md`
- **Database Migration:** `database/migrations/create_import_history_tables.sql`
- **Conflict Detection:** `database/migrations/add_rollback_conflict_detection.sql`
- **Old Imports Fix:** `database/migrations/mark_old_imports_non_rollbackable.sql`

---

**Status:** ✅ Production Ready  
**Last Updated:** April 29, 2026
