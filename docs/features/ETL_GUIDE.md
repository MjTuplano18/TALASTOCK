# ETL & Import History Guide

> Complete guide to Talastock's ETL (Extract, Transform, Load) features including import history tracking, rollback capability, and data quality monitoring.

---

## Overview

Talastock's ETL system provides production-grade data import capabilities with:
- **Import History Tracking** - Complete audit trail of all imports
- **Rollback Capability** - Revert bad imports with snapshots
- **Quality Scoring** - Automatic data quality metrics
- **Column Mapping Templates** - Save and reuse import configurations
- **Statistics Dashboard** - Monitor import performance

---

## Quick Start

### 1. Database Setup
Run the migration in Supabase SQL Editor:
```sql
-- File: database/migrations/create_import_history_tables.sql
```

### 2. Import API Client
```typescript
import {
  getImportHistory,
  createImportHistory,
  rollbackImport,
  getImportStatistics,
} from '@/lib/api-imports'
```

### 3. Track an Import
```typescript
const importRecord = await createImportHistory({
  file_name: file.name,
  entity_type: 'products',
  status: 'success',
  total_rows: 100,
  successful_rows: 95,
  failed_rows: 5,
  errors: [
    { row: 10, field: 'sku', message: 'SKU already exists', value: 'ABC123' }
  ],
  warnings: [],
  processing_time_ms: Date.now() - startTime,
})
```

---

## Features

### Import History Tracking

Every import operation is tracked with:
- File name and entity type
- Success/failure status
- Row counts (total, successful, failed)
- Errors and warnings with row numbers
- Processing time
- Quality score (0-100)
- Timestamp and user

**View Import History:**
```typescript
const { imports, total } = await getImportHistory({
  entity_type: 'products',
  status: 'success',
  limit: 20,
  offset: 0,
})
```

---

### Rollback Capability

Revert bad imports with before/after snapshots:

```typescript
const result = await rollbackImport({
  import_id: 'uuid-of-import',
  reason: 'Imported wrong file',
})

console.log(`Rolled back ${result.rollback_count} changes`)
```

**Rollback Features:**
- Handles insert, update, and delete operations
- Prevents double rollback
- Tracks who rolled back and when
- Preserves audit trail

---

### Quality Scoring

Automatic quality score calculation (0-100):

```typescript
// Base score: percentage of successful rows
let score = (successful_rows / total_rows) * 100

// Deduct points for warnings (max 10 points)
score -= Math.min(warnings.length * 2, 10)

// Result: 0-100
```

**Quality Score Ranges:**
- 90-100: Excellent (green)
- 70-89: Good (yellow)
- 0-69: Poor (red)

---

### Column Mapping Templates

Save and reuse column mappings for recurring imports:

```typescript
// Create template
const template = await createImportTemplate({
  name: 'Supplier A Format',
  entity_type: 'products',
  column_mappings: {
    'Item Name': 'product_name',
    'Code': 'sku',
    'Price (₱)': 'price',
    'Stock': 'quantity',
  },
  is_default: true,
})

// Use template
const templates = await getImportTemplates('products')
const defaultTemplate = templates.find(t => t.is_default)
```

---

### Statistics Dashboard

Monitor import performance:

```typescript
const { statistics } = await getImportStatistics(30) // Last 30 days

console.log(`Total Imports: ${statistics.total_imports}`)
console.log(`Success Rate: ${statistics.success_rate}%`)
console.log(`Avg Quality Score: ${statistics.avg_quality_score}%`)
```

---

## API Reference

### Import History Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/imports/history` | List imports (with filters) |
| GET | `/api/v1/imports/history/{id}` | Get import details |
| POST | `/api/v1/imports/history` | Create import record |
| GET | `/api/v1/imports/statistics` | Get statistics |

### Rollback Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/imports/rollback` | Rollback an import |

### Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/imports/templates` | List templates |
| POST | `/api/v1/imports/templates` | Create template |
| PUT | `/api/v1/imports/templates/{id}` | Update template |
| DELETE | `/api/v1/imports/templates/{id}` | Delete template |

---

## Database Schema

### import_history Table
```sql
- id (UUID)
- user_id (UUID)
- file_name (TEXT)
- entity_type (TEXT) -- products, sales, inventory, customers
- status (TEXT) -- success, failed, partial
- total_rows (INT)
- successful_rows (INT)
- failed_rows (INT)
- errors (JSONB)
- warnings (JSONB)
- processing_time_ms (INT)
- can_rollback (BOOLEAN)
- rolled_back_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

### import_data_snapshot Table
```sql
- id (UUID)
- import_id (UUID)
- entity_id (UUID)
- entity_type (TEXT)
- operation (TEXT) -- insert, update, delete
- old_data (JSONB)
- new_data (JSONB)
- created_at (TIMESTAMPTZ)
```

### import_templates Table
```sql
- id (UUID)
- user_id (UUID)
- name (TEXT)
- entity_type (TEXT)
- column_mappings (JSONB)
- is_default (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

## UI Components

### Import History Table
```typescript
'use client'
import { useEffect, useState } from 'react'
import { getImportHistory } from '@/lib/api-imports'

export function ImportHistoryTable() {
  const [imports, setImports] = useState([])
  
  useEffect(() => {
    async function fetchImports() {
      const { imports } = await getImportHistory({ limit: 50 })
      setImports(imports)
    }
    fetchImports()
  }, [])

  return (
    <table>
      {/* Table implementation */}
    </table>
  )
}
```

### Statistics Dashboard
```typescript
export function ImportStatisticsCard() {
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    async function fetchStats() {
      const { statistics } = await getImportStatistics(30)
      setStats(statistics)
    }
    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard label="Total Imports" value={stats.total_imports} />
      <MetricCard label="Success Rate" value={`${stats.success_rate}%`} />
      {/* More metrics */}
    </div>
  )
}
```

---

## Best Practices

### 1. Always Track Imports
```typescript
// ✅ Good: Track every import
const startTime = Date.now()
const result = await processImport(file)
await createImportHistory({
  file_name: file.name,
  entity_type: 'products',
  status: result.success ? 'success' : 'failed',
  total_rows: result.total,
  successful_rows: result.successful,
  failed_rows: result.failed,
  errors: result.errors,
  warnings: result.warnings,
  processing_time_ms: Date.now() - startTime,
})
```

### 2. Use Templates for Recurring Imports
```typescript
// ✅ Good: Save and reuse templates
const templates = await getImportTemplates('products')
const supplierTemplate = templates.find(t => t.name === 'Supplier A')
if (supplierTemplate) {
  const mappedData = mapColumns(fileHeaders, supplierTemplate)
}
```

### 3. Confirm Before Rollback
```typescript
// ✅ Good: Always confirm rollback
if (confirm('Are you sure you want to rollback this import?')) {
  await rollbackImport({ import_id: importId })
}
```

---

## Security

### Authentication
- All endpoints require JWT token
- User ID extracted from token
- No anonymous access

### Row Level Security
- Users can only see their own imports
- Users can only rollback their own imports
- Users can only manage their own templates
- Enforced at database level

---

## Troubleshooting

### Import Not Appearing in History
- Check if `createImportHistory()` was called
- Verify authentication token is valid
- Check browser console for errors
- Verify database migration was run

### Rollback Failed
- Check if import `can_rollback` is true
- Verify import hasn't been rolled back already
- Check if snapshots exist in database
- Verify user has permission

### Quality Score Incorrect
- Verify `successful_rows` and `total_rows` are correct
- Check if warnings are being counted
- Ensure score is between 0-100

---

## Related Documentation

- **Database Migration:** `database/migrations/create_import_history_tables.sql`
- **Backend Router:** `backend/routers/imports.py`
- **API Client:** `frontend/lib/api-imports.ts`
- **Types:** `frontend/types/index.ts`

---

**Status:** ✅ Production Ready  
**Last Updated:** April 29, 2026
