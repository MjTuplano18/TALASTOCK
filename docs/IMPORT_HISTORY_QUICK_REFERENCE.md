# Import History - Quick Reference Card

**For Developers** | Last Updated: 2026-04-29

---

## 🚀 Quick Start

### View Import History
```typescript
import { getImportHistory } from '@/lib/api-imports'

const { imports, total } = await getImportHistory({
  limit: 20,
  offset: 0,
  entity_type: 'inventory',
  status: 'success'
})
```

### Create Import Record
```typescript
import { createImportHistory } from '@/lib/api-imports'

await createImportHistory({
  file_name: 'inventory.csv',
  entity_type: 'inventory',
  status: 'success',
  total_rows: 100,
  successful_rows: 95,
  failed_rows: 5,
  errors: [{ row: 10, field: 'quantity', message: 'Invalid value' }],
  warnings: [],
  processing_time_ms: 1234
})
```

### Rollback Import
```typescript
import { rollbackImport } from '@/lib/api-imports'

await rollbackImport({
  import_id: 'uuid',
  reason: 'Imported wrong file'
})
```

---

## 📊 TypeScript Types

```typescript
interface ImportHistory {
  id: string
  user_id: string
  file_name: string
  entity_type: 'products' | 'inventory' | 'sales' | 'customers'
  status: 'success' | 'failed' | 'partial'
  total_rows: number
  successful_rows: number
  failed_rows: number
  errors: ImportError[]
  warnings: ImportWarning[]
  processing_time_ms: number
  quality_score: number
  can_rollback: boolean
  has_conflicts: boolean
  rolled_back_at: string | null
  rolled_back_by: string | null
  created_at: string
  updated_at: string
}

interface ImportError {
  row: number
  field: string
  message: string
  value?: any
}

interface ImportWarning {
  row: number
  field?: string
  message: string
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/imports/history` | List imports |
| GET | `/api/v1/imports/history/{id}` | Get details |
| POST | `/api/v1/imports/history` | Create record |
| GET | `/api/v1/imports/statistics` | Get stats |
| POST | `/api/v1/imports/rollback` | Rollback |
| POST | `/api/v1/imports/snapshots` | Create snapshot |

---

## 🎯 Rollback Eligibility

```typescript
function canRollback(imp: ImportHistory): boolean {
  return (
    imp.entity_type === 'inventory' &&
    imp.can_rollback === true &&
    imp.has_conflicts === false &&
    imp.rolled_back_at === null
  )
}
```

---

## 🎨 UI Components

### Import History Table
```typescript
import { ImportHistoryTable } from '@/components/imports/ImportHistoryTable'

<ImportHistoryTable
  imports={imports}
  loading={loading}
  onViewDetails={handleViewDetails}
  onRefresh={fetchData}
  sortColumn="created_at"
  sortDirection="desc"
  onSort={handleSort}
/>
```

### Import Details Modal
```typescript
import { ImportDetailsModal } from '@/components/imports/ImportDetailsModal'

<ImportDetailsModal
  importRecord={selectedImport}
  onClose={() => setShowModal(false)}
  onRollbackSuccess={handleRollbackSuccess}
/>
```

---

## 🔍 Search & Filter

```typescript
// Debounced search
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

// Client-side filtering
const filtered = useMemo(() => {
  return allImports.filter(imp => {
    if (debouncedSearch) {
      return imp.file_name.toLowerCase().includes(debouncedSearch.toLowerCase())
    }
    return true
  })
}, [allImports, debouncedSearch])
```

---

## 📈 Quality Score

```typescript
function getQualityScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}
```

---

## 🔄 Snapshot Creation

```typescript
// During import
const snapshots = []

for (const product of products) {
  // Fetch old values
  const oldInventory = await getInventory(product.id)
  
  // Update inventory
  await updateInventory(product.id, newQuantity)
  
  // Create snapshot
  snapshots.push({
    productId: product.id,
    oldQuantity: oldInventory.quantity,
    newQuantity: newQuantity,
    oldThreshold: oldInventory.low_stock_threshold,
    newThreshold: newThreshold
  })
}

// Save snapshots
for (const snapshot of snapshots) {
  await createDataSnapshot({
    import_id: importId,
    entity_type: 'inventory',
    entity_id: snapshot.productId,
    operation: 'update',
    old_data: {
      quantity: snapshot.oldQuantity,
      low_stock_threshold: snapshot.oldThreshold
    },
    new_data: {
      quantity: snapshot.newQuantity,
      low_stock_threshold: snapshot.newThreshold
    }
  })
}
```

---

## ⚠️ Error Handling

```typescript
try {
  await rollbackImport({ import_id, reason })
  toast.success('Successfully rolled back')
} catch (error: any) {
  if (error.message?.includes('No snapshots found')) {
    toast.error('Cannot rollback: No snapshots available', {
      description: 'This import was created before the rollback feature was implemented.'
    })
  } else if (error.message?.includes('have been modified')) {
    toast.error('Cannot rollback: Products have been modified')
  } else {
    toast.error(error.message || 'Failed to rollback import')
  }
}
```

---

## 🎨 Talastock Colors

```typescript
const colors = {
  bg: '#FDF6F0',
  surface: '#FFFFFF',
  soft: '#FDE8DF',
  border: '#F2C4B0',
  accent: '#E8896A',
  accentDark: '#C1614A',
  text: '#7A3E2E',
  muted: '#B89080',
  danger: '#C05050',
  dangerSoft: '#FDECEA'
}
```

---

## 🗄️ Database Queries

### Get imports with quality scores
```sql
SELECT 
  h.*,
  calculate_import_quality_score(h.id) as quality_score
FROM import_history h
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20;
```

### Check rollback eligibility
```sql
SELECT 
  can_safely_rollback_import($1) as can_rollback;
```

### Get snapshots for import
```sql
SELECT *
FROM import_data_snapshot
WHERE import_id = $1
ORDER BY created_at DESC;
```

---

## 🧪 Testing

```typescript
// Test rollback eligibility
describe('canRollback', () => {
  it('returns true for eligible imports', () => {
    const imp = {
      entity_type: 'inventory',
      can_rollback: true,
      has_conflicts: false,
      rolled_back_at: null
    }
    expect(canRollback(imp)).toBe(true)
  })
  
  it('returns false for old imports', () => {
    const imp = {
      entity_type: 'inventory',
      can_rollback: false,
      has_conflicts: false,
      rolled_back_at: null
    }
    expect(canRollback(imp)).toBe(false)
  })
})
```

---

## 📝 Common Patterns

### Import with Error Tracking
```typescript
const errors: ImportError[] = []
const warnings: ImportWarning[] = []

for (const [index, row] of rows.entries()) {
  try {
    await processRow(row)
  } catch (error) {
    errors.push({
      row: index + 2, // +2 for header and 0-index
      field: 'quantity',
      message: error.message,
      value: row.quantity
    })
  }
}

await createImportHistory({
  file_name: file.name,
  entity_type: 'inventory',
  status: errors.length === 0 ? 'success' : errors.length === rows.length ? 'failed' : 'partial',
  total_rows: rows.length,
  successful_rows: rows.length - errors.length,
  failed_rows: errors.length,
  errors,
  warnings,
  processing_time_ms: Date.now() - startTime
})
```

---

## 🚨 Gotchas

1. **Old imports don't have snapshots** - Check `can_rollback` before showing button
2. **Products can't be rolled back** - Only inventory imports
3. **Client-side filtering limited to 100** - Backend max limit
4. **Snapshots use product_id not inventory.id** - Important for rollback
5. **Quality score is calculated on-demand** - Not stored in database

---

## 📚 Documentation

- **Complete Guide**: `docs/IMPORT_HISTORY_COMPLETE.md`
- **UX Improvements**: `docs/IMPORT_HISTORY_UX_IMPROVEMENTS_COMPLETE.md`
- **Rollback Feature**: `docs/ROLLBACK_IMPLEMENTATION_COMPLETE.md`
- **Old Imports**: `docs/ROLLBACK_OLD_IMPORTS_EXPLAINED.md`
- **UI States**: `docs/IMPORT_HISTORY_UI_STATES.md`

---

## 🆘 Need Help?

1. Check the documentation above
2. Review the code in `frontend/app/(dashboard)/imports/page.tsx`
3. Check backend logic in `backend/routers/imports.py`
4. Look at database schema in `database/migrations/`

---

**Last Updated**: 2026-04-29  
**Version**: 1.0

