# Design Document

## System Architecture

### Overview
The inventory import/export feature extends the existing inventory management system with bulk operations capabilities. The design follows a modular architecture with clear separation between UI components, business logic, and data access layers.

### Component Hierarchy
```
InventoryPage
├── CategoryFilter (new)
├── ExportButtons (new)
├── ImportButton (new)
└── ImportModal (new)
    ├── FileUploader
    ├── ModeSelector
    ├── ImportPreview
    └── ValidationErrors
```

## Database Schema

### New Table: import_history (v2)
```sql
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  mode TEXT CHECK (mode IN ('replace', 'add')) NOT NULL,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')) NOT NULL,
  rollback_available BOOLEAN DEFAULT TRUE,
  rollback_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_history_user ON import_history(user_id);
CREATE INDEX idx_import_history_timestamp ON import_history(timestamp DESC);
CREATE INDEX idx_import_history_rollback ON import_history(rollback_available, rollback_deadline);
```

### Modified Table: stock_movements
```sql
-- Add new type for import operations
ALTER TABLE stock_movements 
  DROP CONSTRAINT IF EXISTS stock_movements_type_check;

ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_type_check 
  CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'import', 'rollback'));

-- Add import_history reference
ALTER TABLE stock_movements
  ADD COLUMN import_history_id UUID REFERENCES import_history(id);
```

## Component Design

### 1. CategoryFilter Component
```typescript
// components/inventory/CategoryFilter.tsx
interface CategoryFilterProps {
  value: string
  onChange: (categoryId: string) => void
  categories: Category[]
}

export function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      placeholder="All Categories"
      options={categories.map(c => ({ label: c.name, value: c.id }))}
    />
  )
}
```

### 2. ExportButtons Component
```typescript
// components/inventory/ExportButtons.tsx
interface ExportButtonsProps {
  filteredCount: number
  totalCount: number
  onExport: (format: 'xlsx' | 'csv') => Promise<void>
}

export function ExportButtons({ filteredCount, totalCount, onExport }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false)
  const hasFilters = filteredCount < totalCount

  async function handleExport(format: 'xlsx' | 'csv') {
    setExporting(true)
    try {
      await onExport(format)
      toast.success(`Exported ${filteredCount} items`)
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {hasFilters && (
        <span className="text-xs text-[#B89080]">
          Exporting {filteredCount} of {totalCount} items
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('xlsx')}
        disabled={exporting}
      >
        <Download className="w-4 h-4 mr-2" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={exporting}
      >
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
    </div>
  )
}
```

### 3. ImportModal Component
```typescript
// components/inventory/ImportModal.tsx
interface ImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type ImportStep = 'upload' | 'preview' | 'executing' | 'complete'

interface ImportState {
  step: ImportStep
  file: File | null
  mode: 'replace' | 'add'
  parsedData: ParsedRow[]
  validationErrors: ValidationError[]
  dryRun: boolean // v2
  partialImport: boolean // v2
}

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    mode: 'replace',
    parsedData: [],
    validationErrors: [],
    dryRun: false,
    partialImport: false,
  })

  // Component renders different views based on step
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {state.step === 'upload' && <FileUploadStep />}
        {state.step === 'preview' && <PreviewStep />}
        {state.step === 'executing' && <ExecutingStep />}
        {state.step === 'complete' && <CompleteStep />}
      </DialogContent>
    </Dialog>
  )
}
```

## File Processing Architecture

### File Parser
```typescript
// lib/import-parser.ts
import * as XLSX from 'xlsx'

export interface ParsedRow {
  rowNumber: number
  sku: string
  productName: string
  category: string
  quantity: number | null
  threshold: number | null
  raw: any
}

export async function parseImportFile(file: File): Promise<ParsedRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file)
  } else if (extension === 'csv') {
    return parseCSV(file)
  } else {
    throw new Error('Unsupported file format')
  }
}

async function parseExcel(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  return normalizeData(jsonData)
}

async function parseCSV(file: File): Promise<ParsedRow[]> {
  const text = await file.text()
  const lines = text.split('\n')
  const data = lines.map(line => line.split(','))
  
  return normalizeData(data)
}

function normalizeData(data: any[][]): ParsedRow[] {
  const headers = data[0].map((h: string) => h.trim().toLowerCase())
  const rows = data.slice(1)
  
  return rows.map((row, index) => ({
    rowNumber: index + 2, // +2 because: 0-indexed + header row
    sku: getCellValue(row, headers, ['sku', 'product code']),
    productName: getCellValue(row, headers, ['product name', 'name', 'product']),
    category: getCellValue(row, headers, ['category']),
    quantity: parseNumber(getCellValue(row, headers, ['quantity', 'qty', 'stock'])),
    threshold: parseNumber(getCellValue(row, headers, ['threshold', 'low stock threshold', 'min stock'])),
    raw: row,
  }))
}
```

### Validation Engine
```typescript
// lib/import-validator.ts
export interface ValidationError {
  rowNumber: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export async function validateImportData(
  rows: ParsedRow[],
  products: Product[]
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  // Check for duplicates within file
  const seen = new Map<string, number>()
  rows.forEach(row => {
    const key = row.sku || row.productName.toLowerCase()
    if (seen.has(key)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'sku/name',
        message: `Duplicate entry (also appears in row ${seen.get(key)})`,
        severity: 'error',
      })
    }
    seen.set(key, row.rowNumber)
  })
  
  // Validate each row
  for (const row of rows) {
    // Required fields
    if (!row.sku && !row.productName) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'sku/name',
        message: 'Either SKU or Product Name is required',
        severity: 'error',
      })
      continue
    }
    
    // Match product
    const matchedProduct = matchProduct(row, products)
    if (!matchedProduct) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'product',
        message: 'Product not found in database',
        severity: 'error',
      })
      continue
    }
    
    // Validate quantity
    if (row.quantity !== null) {
      if (row.quantity < 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'quantity',
          message: 'Quantity cannot be negative',
          severity: 'error',
        })
      }
      if (!Number.isInteger(row.quantity)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'quantity',
          message: 'Quantity must be a whole number',
          severity: 'error',
        })
      }
    }
    
    // Validate threshold (v1.5)
    if (row.threshold !== null) {
      if (row.threshold < 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'threshold',
          message: 'Threshold cannot be negative',
          severity: 'error',
        })
      }
    }
    
    // Category mismatch warning
    if (row.category && matchedProduct.category?.name !== row.category) {
      warnings.push({
        rowNumber: row.rowNumber,
        field: 'category',
        message: `Category mismatch: expected "${matchedProduct.category?.name}", got "${row.category}"`,
        severity: 'warning',
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
```

### Product Matching Algorithm
```typescript
// lib/product-matcher.ts
export function matchProduct(row: ParsedRow, products: Product[]): Product | null {
  // Strategy 1: Exact SKU match (case-insensitive)
  if (row.sku) {
    const skuMatch = products.find(
      p => p.sku.toLowerCase().trim() === row.sku.toLowerCase().trim()
    )
    if (skuMatch) return skuMatch
  }
  
  // Strategy 2: Exact product name match (case-insensitive)
  if (row.productName) {
    const nameMatches = products.filter(
      p => p.name.toLowerCase().trim() === row.productName.toLowerCase().trim()
    )
    
    // If exactly one match, use it
    if (nameMatches.length === 1) return nameMatches[0]
    
    // If multiple matches, return null (ambiguous)
    if (nameMatches.length > 1) return null
  }
  
  return null
}
```

## API Endpoints

### 1. Export Endpoint
```typescript
// app/api/inventory/export/route.ts
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const { format, filters } = await request.json()
  
  // Fetch inventory with filters
  const inventory = await getInventoryWithFilters(filters)
  
  // Generate file
  const fileBuffer = format === 'xlsx' 
    ? await generateExcel(inventory)
    : await generateCSV(inventory)
  
  const filename = `inventory-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.${format}`
  
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': format === 'xlsx' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

### 2. Import Validation Endpoint
```typescript
// app/api/inventory/import/validate/route.ts
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }
  
  // Parse file
  const parsedRows = await parseImportFile(file)
  
  if (parsedRows.length > 1000) {
    return Response.json({ error: 'Too many rows (max 1000)' }, { status: 400 })
  }
  
  // Fetch products for matching
  const products = await getAllProducts()
  
  // Validate
  const validation = await validateImportData(parsedRows, products)
  
  // Match products and calculate changes
  const preview = parsedRows.map(row => {
    const product = matchProduct(row, products)
    return {
      ...row,
      matchedProduct: product,
      currentQuantity: product?.inventory?.quantity ?? 0,
      currentThreshold: product?.inventory?.low_stock_threshold ?? 10,
      change: row.quantity !== null ? row.quantity - (product?.inventory?.quantity ?? 0) : 0,
    }
  })
  
  return Response.json({
    preview,
    validation,
    summary: {
      totalRows: parsedRows.length,
      validRows: parsedRows.length - validation.errors.length,
      errorRows: validation.errors.length,
      warningRows: validation.warnings.length,
    },
  })
}
```

### 3. Import Execute Endpoint
```typescript
// app/api/inventory/import/execute/route.ts
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const { preview, mode, dryRun, partialImport } = await request.json()
  
  if (dryRun) {
    // Don't actually save anything
    return Response.json({ success: true, message: 'Dry run complete' })
  }
  
  const supabase = createServerClient()
  
  try {
    // Start transaction
    const updates = []
    const movements = []
    
    for (const row of preview) {
      if (!row.matchedProduct) {
        if (!partialImport) throw new Error('Invalid row found')
        continue // Skip in partial mode
      }
      
      const product = row.matchedProduct
      
      // Calculate new quantity
      let newQuantity = product.inventory.quantity
      if (row.quantity !== null) {
        newQuantity = mode === 'replace' 
          ? row.quantity 
          : product.inventory.quantity + row.quantity
      }
      
      // Update inventory
      updates.push({
        product_id: product.id,
        quantity: newQuantity,
        low_stock_threshold: row.threshold ?? product.inventory.low_stock_threshold,
        updated_at: new Date().toISOString(),
      })
      
      // Create stock movement
      movements.push({
        product_id: product.id,
        type: 'import',
        quantity: newQuantity - product.inventory.quantity,
        note: `Import: ${row.file.name} - ${mode} mode - Row ${row.rowNumber}`,
        created_by: session.user.id,
      })
    }
    
    // Execute updates in transaction
    const { error: updateError } = await supabase
      .from('inventory')
      .upsert(updates)
    
    if (updateError) throw updateError
    
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert(movements)
    
    if (movementError) throw movementError
    
    return Response.json({
      success: true,
      rowsImported: updates.length,
      rowsSkipped: preview.length - updates.length,
    })
    
  } catch (error) {
    return Response.json({ error: 'Import failed' }, { status: 500 })
  }
}
```

## State Management

### Import Flow State Machine
```
[Upload] → [Parsing] → [Validating] → [Preview] → [Executing] → [Complete]
    ↓          ↓            ↓             ↓            ↓
  [Error]   [Error]     [Error]      [Cancel]     [Error]
```

### Import State Interface
```typescript
interface ImportState {
  // Current step
  step: 'upload' | 'parsing' | 'validating' | 'preview' | 'executing' | 'complete' | 'error'
  
  // File data
  file: File | null
  parsedRows: ParsedRow[]
  
  // Configuration
  mode: 'replace' | 'add'
  dryRun: boolean
  partialImport: boolean
  
  // Validation
  validation: ValidationResult | null
  preview: PreviewRow[]
  
  // Execution
  result: ImportResult | null
  error: string | null
}
```

## Security Implementation

### File Upload Validation
```typescript
function validateUploadedFile(file: File): void {
  // Check MIME type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ]
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
    throw new Error('Invalid file extension')
  }
  
  // Check file size
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large (max 5MB)')
  }
  
  // Check filename for suspicious patterns
  if (/[<>:"|?*]/.test(file.name)) {
    throw new Error('Invalid filename')
  }
}
```

### Input Sanitization
```typescript
function sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .slice(0, 255) // Limit length
}
```

### Rate Limiting
```typescript
// middleware/rate-limit.ts
const importLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 imports per minute
  message: 'Too many import requests, please try again later',
})
```

## UI/UX Flow

### Import Modal Workflow

**Step 1: Upload**
```
┌─────────────────────────────────────┐
│  Import Inventory                   │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Drag & drop file here        │ │
│  │  or click to browse           │ │
│  │                               │ │
│  │  Supported: .xlsx, .csv       │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Download Template]                │
│                                     │
│  Mode: ○ Replace  ○ Add            │
│  □ Dry Run (preview only)          │
│  □ Partial Import (skip errors)    │
│                                     │
│  [Cancel]                           │
└─────────────────────────────────────┘
```

**Step 2: Preview**
```
┌─────────────────────────────────────────────────────────┐
│  Import Preview                                         │
├─────────────────────────────────────────────────────────┤
│  Summary: 142 valid, 3 errors, 2 warnings              │
│  [Download Error Report]                                │
├─────────────────────────────────────────────────────────┤
│  Row │ SKU    │ Product  │ Current │ New │ Change │ ✓  │
│  ────┼────────┼──────────┼─────────┼─────┼────────┼────│
│  2   │ ABC123 │ Widget A │ 50      │ 100 │ +50    │ ✓  │
│  3   │ DEF456 │ Widget B │ 25      │ 75  │ +50    │ ✓  │
│  4   │ GHI789 │ Widget C │ 0       │ 50  │ +50    │ ✗  │
│      │        │          │         │     │        │ ⚠  │
├─────────────────────────────────────────────────────────┤
│  [Back]  [Cancel]              [Confirm Import]         │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Batch Processing
```typescript
async function executeBatchImport(updates: InventoryUpdate[]) {
  const BATCH_SIZE = 50
  
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    await supabase.from('inventory').upsert(batch)
    
    // Update progress
    const progress = Math.round(((i + batch.length) / updates.length) * 100)
    updateProgress(progress)
  }
}
```

### Transaction Management
```typescript
async function executeImportTransaction(updates: InventoryUpdate[]) {
  const { data, error } = await supabase.rpc('import_inventory', {
    updates_json: JSON.stringify(updates),
    user_id: session.user.id,
  })
  
  if (error) throw error
  return data
}
```

### Database Function (PostgreSQL)
```sql
CREATE OR REPLACE FUNCTION import_inventory(
  updates_json JSONB,
  user_id UUID
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update inventory in single transaction
  WITH updated AS (
    UPDATE inventory
    SET 
      quantity = (updates->>'quantity')::INTEGER,
      low_stock_threshold = (updates->>'threshold')::INTEGER,
      updated_at = NOW()
    FROM jsonb_array_elements(updates_json) AS updates
    WHERE inventory.product_id = (updates->>'product_id')::UUID
    RETURNING inventory.product_id
  ),
  movements AS (
    INSERT INTO stock_movements (product_id, type, quantity, note, created_by)
    SELECT 
      (updates->>'product_id')::UUID,
      'import',
      (updates->>'change')::INTEGER,
      updates->>'note',
      user_id
    FROM jsonb_array_elements(updates_json) AS updates
    RETURNING id
  )
  SELECT jsonb_build_object(
    'updated_count', (SELECT COUNT(*) FROM updated),
    'movement_count', (SELECT COUNT(*) FROM movements)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Testing Strategy

### Unit Tests
```typescript
describe('parseImportFile', () => {
  it('should parse Excel file correctly', async () => {
    const file = new File([excelBuffer], 'test.xlsx')
    const rows = await parseImportFile(file)
    expect(rows).toHaveLength(10)
    expect(rows[0].sku).toBe('ABC123')
  })
  
  it('should handle missing columns gracefully', async () => {
    const file = new File([csvWithMissingColumns], 'test.csv')
    const rows = await parseImportFile(file)
    expect(rows[0].threshold).toBeNull()
  })
})

describe('matchProduct', () => {
  it('should match by SKU first', () => {
    const row = { sku: 'ABC123', productName: 'Wrong Name' }
    const product = matchProduct(row, products)
    expect(product?.sku).toBe('ABC123')
  })
  
  it('should fallback to name matching', () => {
    const row = { sku: '', productName: 'Widget A' }
    const product = matchProduct(row, products)
    expect(product?.name).toBe('Widget A')
  })
  
  it('should return null for ambiguous matches', () => {
    const row = { sku: '', productName: 'Duplicate Name' }
    const product = matchProduct(row, products)
    expect(product).toBeNull()
  })
})
```

### Integration Tests
```typescript
describe('Import Flow', () => {
  it('should complete full import successfully', async () => {
    // Upload file
    const file = createTestFile()
    const validateResponse = await fetch('/api/inventory/import/validate', {
      method: 'POST',
      body: createFormData(file),
    })
    const { preview, validation } = await validateResponse.json()
    
    expect(validation.valid).toBe(true)
    
    // Execute import
    const executeResponse = await fetch('/api/inventory/import/execute', {
      method: 'POST',
      body: JSON.stringify({ preview, mode: 'replace' }),
    })
    const result = await executeResponse.json()
    
    expect(result.success).toBe(true)
    expect(result.rowsImported).toBe(10)
  })
})
```

### Edge Cases to Test
1. Empty file
2. File with only headers
3. File with 1000+ rows
4. File with special characters in product names
5. File with negative quantities
6. File with duplicate SKUs
7. File with products not in database
8. File with mixed delimiters (CSV)
9. File with merged cells (Excel)
10. Concurrent imports by same user
11. Import during inventory adjustment
12. Rollback after 24 hours (should fail)

## Mobile Responsiveness

### Breakpoints
- Desktop: Full table view with all columns
- Tablet (768px): Scrollable table with sticky first column
- Mobile (640px): Card-based layout instead of table

### Mobile Import Modal
```typescript
// On mobile, use full-screen modal
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-4xl max-w-full h-full sm:h-auto">
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Implementation Phases

### Phase 1 (v1 - MVP)
1. Create CategoryFilter component
2. Implement export functionality (Excel, CSV)
3. Create ImportModal with file upload
4. Implement file parser (Excel, CSV)
5. Implement validation engine
6. Implement product matching algorithm
7. Create import preview UI
8. Implement import execution
9. Add audit trail to stock_movements

### Phase 2 (v1.5)
1. Add threshold column support to parser
2. Update validation for threshold values
3. Create import template generator
4. Add "Download Template" button
5. Update preview to show threshold changes
6. Update execution to handle threshold updates

### Phase 3 (v2)
1. Create import_history table
2. Implement partial import mode
3. Implement dry run mode
4. Create ImportHistoryPage component
5. Create ImportHistoryDrawer component
6. Implement rollback functionality
7. Add "Export All" vs "Export Filtered" options
8. Add custom column selection for export

## Conclusion

This design provides a comprehensive, enterprise-grade solution for inventory import/export with proper validation, security, and user experience. The phased approach allows for incremental delivery while maintaining code quality and system stability.

