# Inventory Import/Export Feature - Specification Summary

**Status:** Spec Complete - Ready for Implementation  
**Created:** 2026-04-15  
**Spec Location:** `.kiro/specs/inventory-import-export/`

## Overview

Enterprise-grade inventory import/export feature with category filtering, bulk quantity updates, comprehensive validation, and audit trail. Implemented in 3 phases for incremental delivery.

## Key Features

### v1 (MVP) - Core Functionality
- **Category Filter:** Filter inventory by product category
- **Export:** Download inventory as Excel or CSV (respects active filters)
- **Import:** Bulk update quantities via Excel/CSV upload
- **Validation:** Comprehensive error checking before import
- **Preview:** Review all changes before applying
- **Audit Trail:** Complete logging in stock_movements table

### v1.5 - Enhanced Capabilities
- **Threshold Updates:** Bulk update low stock thresholds via import
- **Import Template:** Download pre-formatted Excel template with examples
- **Enhanced Validation:** Additional checks for threshold values

### v2 - Advanced Features
- **Partial Import:** Skip error rows, import valid rows
- **Dry Run Mode:** Preview changes without saving
- **Import History:** View all past imports with details
- **Rollback:** Undo imports within 24 hours
- **Enhanced Export:** "Export All" option and custom column selection

## Technical Decisions

### Matching Strategy
**Hybrid Approach (SKU first, name fallback)**
- Try exact SKU match (case-insensitive)
- Fallback to exact product name match
- Return null for ambiguous matches (multiple name matches)

### Import Behavior
**User Choice with Replace as Default**
- Replace mode: Set quantity to imported value
- Add mode: Add imported value to current quantity
- User selects mode per import

### File Format
**Full Format (Export-Import Symmetry)**
```
SKU | Product Name | Category | Quantity | Low Stock Threshold
```
- Quantity and Threshold columns are optional (blank = no update)
- Category used for validation only (warn on mismatch)

### Duplicate Handling
**Reject Entire Import**
- Fail-fast principle
- Users fix duplicates and re-upload
- Builds trust with predictable behavior

### Export Scope
**Respect Active Filters**
- Export only filtered items by default
- Display badge: "Exporting X of Y items"
- v2 adds "Export All" option

## File Structure

```
.kiro/specs/inventory-import-export/
├── .config.kiro              # Spec metadata
├── requirements.md           # 18 detailed requirements
├── design.md                 # Technical design document
└── tasks.md                  # 28 implementation tasks

frontend/
├── app/(dashboard)/inventory/
│   ├── page.tsx              # Main inventory page (modified)
│   └── history/              # Import history page (v2)
│       ├── page.tsx
│       └── loading.tsx
├── components/inventory/
│   ├── CategoryFilter.tsx    # New
│   ├── ExportButtons.tsx     # New
│   ├── ImportModal.tsx       # New
│   ├── FileUploader.tsx      # New
│   ├── ImportPreview.tsx     # New
│   ├── ValidationErrors.tsx  # New
│   ├── ImportHistoryDrawer.tsx  # New (v2)
│   └── StockHistoryDrawer.tsx   # Modified
└── lib/
    ├── import-parser.ts      # New - Parse Excel/CSV
    ├── import-validator.ts   # New - Validation engine
    ├── product-matcher.ts    # New - Matching algorithm
    ├── export-inventory.ts   # New - Export functions
    ├── generate-import-template.ts  # New (v1.5)
    └── rollback-import.ts    # New (v2)
```

## Database Changes

### New Table: import_history (v2)
```sql
CREATE TABLE import_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  filename TEXT,
  timestamp TIMESTAMPTZ,
  rows_imported INTEGER,
  rows_skipped INTEGER,
  mode TEXT CHECK (mode IN ('replace', 'add')),
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  rollback_available BOOLEAN,
  rollback_deadline TIMESTAMPTZ
);
```

### Modified Table: stock_movements
```sql
-- Add new types
ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_type_check 
  CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'import', 'rollback'));

-- Add import reference
ALTER TABLE stock_movements
  ADD COLUMN import_history_id UUID REFERENCES import_history(id);
```

## Implementation Phases

### Phase 1: v1 (MVP) - 13 Tasks, ~45 hours
1. Category filter (2h)
2. Export Excel (4h)
3. Export CSV (2h)
4. Export buttons component (2h)
5. File parser - Excel (4h)
6. File parser - CSV (3h)
7. Product matching algorithm (3h)
8. Validation engine (4h)
9. Import modal - upload step (4h)
10. Import modal - preview step (5h)
11. Import execution (5h)
12. Audit trail integration (2h)
13. Integration and testing (4h)

### Phase 2: v1.5 - 3 Tasks, ~7 hours
1. Threshold column support (3h)
2. Import template generator (3h)
3. Download template button (1h)

### Phase 3: v2 - 7 Tasks, ~28 hours
1. Import history database schema (2h)
2. Partial import mode (4h)
3. Dry run mode (3h)
4. Import history page (5h)
5. Import history drawer (4h)
6. Rollback functionality (5h)
7. Enhanced export options (3h)

**Total Estimated Effort:** ~80 hours

## Security Considerations

- File type validation (MIME type + extension)
- File size limit: 5MB
- Row count limit: 1000 rows
- Input sanitization (prevent XSS)
- Rate limiting: 5 imports per minute per user
- SQL injection prevention (parameterized queries)
- Authentication required for all operations
- Audit logging for security monitoring

## Testing Strategy

### Unit Tests
- File parsers (Excel, CSV)
- Product matching algorithm
- Validation engine
- Export generators

### Integration Tests
- Full import flow (upload → preview → execute)
- Export flow (Excel, CSV)
- Rollback functionality (v2)

### Edge Cases
- Empty files
- Files with only headers
- Large files (1000+ rows)
- Special characters in product names
- Negative quantities
- Duplicate SKUs
- Products not in database
- Concurrent imports
- Rollback after 24 hours

## User Experience Flow

### Import Flow
```
1. Click "Import" button
2. Upload file (drag-and-drop or browse)
3. Select mode (Replace/Add)
4. File is parsed and validated
5. Preview shows all changes with validation errors
6. User reviews and confirms
7. Import executes in transaction
8. Success message with count
9. Inventory table refreshes
```

### Export Flow
```
1. Apply filters (optional)
2. Click "Export Excel" or "Export CSV"
3. File generates (respecting filters)
4. Browser downloads file
5. Success toast notification
```

## Dependencies

### New NPM Packages
```bash
npm install xlsx  # Excel file processing
```

### Existing Dependencies
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- React Hook Form
- Zod

## Success Metrics

- Import success rate > 95%
- Average import time < 5 seconds for 100 rows
- Export time < 3 seconds for 1000 rows
- Validation accuracy: 100% (no false positives)
- User satisfaction: Positive feedback on ease of use

## Next Steps

1. Review and approve this specification
2. Begin Phase 1 implementation (v1 MVP)
3. Test thoroughly with real data
4. Deploy to staging for user acceptance testing
5. Deploy to production
6. Gather user feedback
7. Proceed to Phase 2 (v1.5)
8. Proceed to Phase 3 (v2)

## Related Documentation

- [Requirements Document](.kiro/specs/inventory-import-export/requirements.md)
- [Design Document](.kiro/specs/inventory-import-export/design.md)
- [Tasks Document](.kiro/specs/inventory-import-export/tasks.md)
- [Security Checklist](../guides/SECURITY_CHECKLIST.md)
- [Coding Standards](../../.kiro/steering/coding-standards.md)

