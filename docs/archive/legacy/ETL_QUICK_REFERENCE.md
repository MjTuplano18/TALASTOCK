# ETL Features - Quick Reference Guide

**For Developers:** Quick reference for using the new ETL features

---

## 🚀 Quick Start

### 1. Database Setup
```sql
-- Run this in Supabase SQL Editor
-- File: database/migrations/create_import_history_tables.sql
```

### 2. Import the API Client
```typescript
import {
  getImportHistory,
  getImportDetails,
  createImportHistory,
  getImportStatistics,
  rollbackImport,
  getImportTemplates,
  createImportTemplate,
} from '@/lib/api-imports'
```

### 3. Import Types
```typescript
import type {
  ImportHistory,
  ImportStatistics,
  ImportTemplate,
  ImportError,
  ImportWarning,
} from '@/types'
```

---

## 📝 Common Use Cases

### Use Case 1: Track an Import Operation

```typescript
// After processing an import file
const importRecord = await createImportHistory({
  file_name: file.name,
  entity_type: 'products', // or 'sales', 'inventory', 'customers'
  status: 'success', // or 'failed', 'partial'
  total_rows: 100,
  successful_rows: 95,
  failed_rows: 5,
  errors: [
    { row: 10, field: 'sku', message: 'SKU already exists', value: 'ABC123' },
    { row: 25, field: 'price', message: 'Price must be positive', value: -10 },
  ],
  warnings: [
    { row: 50, message: 'Product name is very long', field: 'name' },
  ],
  processing_time_ms: Date.now() - startTime,
})
```

---

### Use Case 2: Display Import History

```typescript
// Fetch recent imports
const { imports, total } = await getImportHistory({
  entity_type: 'products', // optional filter
  status: 'success', // optional filter
  limit: 20,
  offset: 0,
})

// Display in a table
imports.forEach(imp => {
  console.log(`${imp.file_name}: ${imp.successful_rows}/${imp.total_rows} rows`)
  console.log(`Quality Score: ${imp.quality_score}%`)
})
```

---

### Use Case 3: Show Import Statistics

```typescript
// Get statistics for last 30 days
const { statistics } = await getImportStatistics(30)

console.log(`Total Imports: ${statistics.total_imports}`)
console.log(`Success Rate: ${statistics.success_rate}%`)
console.log(`Avg Quality Score: ${statistics.avg_quality_score}%`)
```

---

### Use Case 4: Rollback a Bad Import

```typescript
// Rollback an import
const result = await rollbackImport({
  import_id: 'uuid-of-import',
  reason: 'Imported wrong file',
})

console.log(`Rolled back ${result.rollback_count} changes`)
if (result.errors.length > 0) {
  console.error('Some rollbacks failed:', result.errors)
}
```

---

### Use Case 5: Save Column Mapping Template

```typescript
// Create a template for recurring imports
const template = await createImportTemplate({
  name: 'Supplier A Format',
  entity_type: 'products',
  column_mappings: {
    'Item Name': 'product_name',
    'Code': 'sku',
    'Price (₱)': 'price',
    'Stock': 'quantity',
    'Category': 'category_name',
  },
  is_default: true, // Set as default for this entity type
})
```

---

### Use Case 6: Load and Use Template

```typescript
// Get templates for products
const templates = await getImportTemplates('products')

// Find default template
const defaultTemplate = templates.find(t => t.is_default)

// Use the template to map columns
function mapColumns(fileHeaders: string[], template: ImportTemplate) {
  const mappedData = {}
  fileHeaders.forEach(header => {
    const systemField = template.column_mappings[header]
    if (systemField) {
      mappedData[systemField] = rowData[header]
    }
  })
  return mappedData
}
```

---

## 🎨 UI Component Examples

### Import History Table

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getImportHistory } from '@/lib/api-imports'
import type { ImportHistory } from '@/types'

export function ImportHistoryTable() {
  const [imports, setImports] = useState<ImportHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchImports() {
      try {
        const { imports } = await getImportHistory({ limit: 50 })
        setImports(imports)
      } catch (error) {
        console.error('Failed to fetch imports:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchImports()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>File Name</th>
          <th>Entity Type</th>
          <th>Status</th>
          <th>Rows</th>
          <th>Quality Score</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {imports.map(imp => (
          <tr key={imp.id}>
            <td>{imp.file_name}</td>
            <td>{imp.entity_type}</td>
            <td>
              <StatusBadge status={imp.status} />
            </td>
            <td>{imp.successful_rows}/{imp.total_rows}</td>
            <td>
              <QualityScoreBadge score={imp.quality_score || 0} />
            </td>
            <td>{new Date(imp.created_at).toLocaleDateString()}</td>
            <td>
              <button onClick={() => viewDetails(imp.id)}>View</button>
              {imp.can_rollback && (
                <button onClick={() => rollback(imp.id)}>Rollback</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

### Statistics Dashboard

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getImportStatistics } from '@/lib/api-imports'
import type { ImportStatistics } from '@/types'

export function ImportStatisticsCard() {
  const [stats, setStats] = useState<ImportStatistics | null>(null)

  useEffect(() => {
    async function fetchStats() {
      const { statistics } = await getImportStatistics(30)
      setStats(statistics)
    }
    fetchStats()
  }, [])

  if (!stats) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        label="Total Imports"
        value={stats.total_imports}
      />
      <MetricCard
        label="Success Rate"
        value={`${stats.success_rate.toFixed(1)}%`}
      />
      <MetricCard
        label="Rows Processed"
        value={stats.total_rows_processed.toLocaleString()}
      />
      <MetricCard
        label="Avg Quality Score"
        value={`${stats.avg_quality_score.toFixed(1)}%`}
      />
    </div>
  )
}
```

---

### Rollback Confirmation Dialog

```typescript
'use client'
import { useState } from 'react'
import { rollbackImport } from '@/lib/api-imports'
import { Dialog } from '@/components/ui/dialog'

export function RollbackDialog({ 
  importId, 
  onSuccess 
}: { 
  importId: string
  onSuccess: () => void 
}) {
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
      <p>This will revert all changes made by this import. This action cannot be undone.</p>
      
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

## 🎨 Helper Functions

### Calculate Quality Score

```typescript
import { calculateImportQualityScore } from '@/types'

const score = calculateImportQualityScore(importRecord)
console.log(`Quality Score: ${score}%`)
```

### Get Status Color

```typescript
import { getImportStatusColor } from '@/types'

const colorClass = getImportStatusColor(importRecord.status)
// Returns: 'text-green-600', 'text-red-600', or 'text-yellow-600'
```

### Get Quality Score Color

```typescript
import { getQualityScoreColor } from '@/types'

const colorClass = getQualityScoreColor(score)
// Returns: 'text-green-600' (90+), 'text-yellow-600' (70-89), or 'text-red-600' (<70)
```

---

## 🔍 Filtering Examples

### Filter by Entity Type

```typescript
const { imports } = await getImportHistory({
  entity_type: 'products',
})
```

### Filter by Status

```typescript
const { imports } = await getImportHistory({
  status: 'failed',
})
```

### Filter by Date Range

```typescript
const { imports } = await getImportHistory({
  start_date: '2026-04-01T00:00:00Z',
  end_date: '2026-04-30T23:59:59Z',
})
```

### Combined Filters

```typescript
const { imports } = await getImportHistory({
  entity_type: 'products',
  status: 'success',
  start_date: '2026-04-01T00:00:00Z',
  end_date: '2026-04-30T23:59:59Z',
  limit: 20,
  offset: 0,
})
```

---

## 🧪 Testing Examples

### Test Import History Creation

```typescript
// Create a test import record
const testImport = await createImportHistory({
  file_name: 'test.xlsx',
  entity_type: 'products',
  status: 'success',
  total_rows: 10,
  successful_rows: 10,
  failed_rows: 0,
  errors: [],
  warnings: [],
  processing_time_ms: 1000,
})

console.log('Created import:', testImport.id)
```

### Test Rollback

```typescript
// Create an import, then roll it back
const imp = await createImportHistory({ /* ... */ })
const result = await rollbackImport({ import_id: imp.id })
console.log('Rollback successful:', result.rollback_count)
```

### Test Template Management

```typescript
// Create template
const template = await createImportTemplate({
  name: 'Test Template',
  entity_type: 'products',
  column_mappings: { 'Name': 'product_name' },
})

// Update template
await updateImportTemplate(template.id, {
  name: 'Updated Template',
})

// Delete template
await deleteImportTemplate(template.id)
```

---

## 📊 API Response Examples

### Import History Response

```json
{
  "success": true,
  "data": {
    "imports": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "file_name": "products_2026-04-29.xlsx",
        "entity_type": "products",
        "status": "success",
        "total_rows": 100,
        "successful_rows": 95,
        "failed_rows": 5,
        "errors": [
          {
            "row": 10,
            "field": "sku",
            "message": "SKU already exists",
            "value": "ABC123"
          }
        ],
        "warnings": [],
        "processing_time_ms": 1234,
        "can_rollback": true,
        "rolled_back_at": null,
        "created_at": "2026-04-29T10:30:00Z",
        "quality_score": 95.0
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  },
  "message": "Import history retrieved successfully"
}
```

### Statistics Response

```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_imports": 45,
      "successful_imports": 42,
      "failed_imports": 2,
      "partial_imports": 1,
      "success_rate": 93.33,
      "total_rows_processed": 1250,
      "avg_processing_time_ms": 1234.5,
      "avg_quality_score": 95.5
    },
    "period_days": 30,
    "start_date": "2026-03-30T00:00:00Z",
    "end_date": "2026-04-29T00:00:00Z"
  },
  "message": "Import statistics retrieved successfully"
}
```

---

## 🚨 Error Handling

### Handle API Errors

```typescript
try {
  const { imports } = await getImportHistory()
} catch (error) {
  if (error.message.includes('401')) {
    // Handle authentication error
    console.error('Not authenticated')
  } else if (error.message.includes('404')) {
    // Handle not found
    console.error('Import not found')
  } else {
    // Handle other errors
    console.error('Failed to fetch imports:', error)
  }
}
```

### Validate Before Rollback

```typescript
// Check if import can be rolled back
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

## 💡 Best Practices

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
  // Use saved mappings
  const mappedData = mapColumns(fileHeaders, supplierTemplate)
}
```

### 3. Show Quality Scores
```typescript
// ✅ Good: Display quality scores to users
<div className={getQualityScoreColor(import.quality_score)}>
  Quality: {import.quality_score}%
</div>
```

### 4. Confirm Before Rollback
```typescript
// ✅ Good: Always confirm rollback
if (confirm('Are you sure you want to rollback this import?')) {
  await rollbackImport({ import_id: importId })
}
```

---

## 📚 Additional Resources

- **Full Documentation:** `docs/ETL_IMPROVEMENTS_IMPLEMENTATION.md`
- **Phase 1 Summary:** `docs/ETL_PHASE1_COMPLETE.md`
- **Database Migration:** `database/migrations/create_import_history_tables.sql`
- **Backend Router:** `backend/routers/imports.py`
- **API Client:** `frontend/lib/api-imports.ts`
- **Types:** `frontend/types/index.ts`

---

**Quick Reference Version:** 1.0  
**Last Updated:** April 29, 2026  
**Status:** Ready to Use
