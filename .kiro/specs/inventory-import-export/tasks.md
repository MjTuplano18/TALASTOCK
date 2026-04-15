# Implementation Tasks

## Phase 1: v1 (MVP) - Core Import/Export Functionality

### Task 1.1: Category Filter
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 2 hours

**Description:**  
Add category filter dropdown to inventory page alongside existing search and status filters.

**Acceptance Criteria:**
- [ ] Create CategoryFilter component using FilterSelect
- [ ] Fetch categories from Supabase
- [ ] Integrate filter into inventory page
- [ ] Update filtered inventory query to include category filter
- [ ] Filter works alongside search and status filters
- [ ] Clear filters button resets category filter

**Files to Modify:**
- `frontend/app/(dashboard)/inventory/page.tsx`
- `frontend/components/inventory/CategoryFilter.tsx` (new)
- `frontend/lib/supabase-queries.ts`

---

### Task 1.2: Export Functionality - Excel
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 4 hours

**Description:**  
Implement Excel export functionality that respects active filters and exports full inventory data.

**Acceptance Criteria:**
- [ ] Install xlsx library: `npm install xlsx`
- [ ] Create export utility function for Excel format
- [ ] Include columns: Product Name, SKU, Category, Quantity, Threshold, Status, Last Updated
- [ ] Format Status as human-readable text
- [ ] Format dates in ISO 8601 format
- [ ] Generate filename with timestamp
- [ ] Trigger browser download
- [ ] Show loading indicator during export
- [ ] Display success/error toast

**Files to Create:**
- `frontend/lib/export-inventory.ts`

**Files to Modify:**
- `frontend/app/(dashboard)/inventory/page.tsx`

---

### Task 1.3: Export Functionality - CSV
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 2 hours

**Description:**  
Implement CSV export functionality with same data as Excel export.

**Acceptance Criteria:**
- [ ] Create CSV export function
- [ ] Use same data structure as Excel export
- [ ] Handle special characters and commas in data
- [ ] Generate filename with timestamp
- [ ] Trigger browser download

**Files to Modify:**
- `frontend/lib/export-inventory.ts`
- `frontend/app/(dashboard)/inventory/page.tsx`

---

### Task 1.4: Export Buttons Component
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 2 hours

**Description:**  
Create ExportButtons component with Excel and CSV export options.

**Acceptance Criteria:**
- [ ] Create ExportButtons component
- [ ] Display "Exporting X of Y items" badge when filters active
- [ ] Show loading state during export
- [ ] Disable buttons during export
- [ ] Follow Talastock design system
- [ ] Mobile responsive layout

**Files to Create:**
- `frontend/components/inventory/ExportButtons.tsx`

**Files to Modify:**
- `frontend/app/(dashboard)/inventory/page.tsx`

---

### Task 1.5: File Parser - Excel
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 4 hours

**Description:**  
Implement Excel file parser that extracts data from uploaded .xlsx files.

**Acceptance Criteria:**
- [ ] Parse Excel files using xlsx library
- [ ] Extract data from first worksheet only
- [ ] Treat first row as headers
- [ ] Handle flexible column names (SKU, Product Code, etc.)
- [ ] Return normalized ParsedRow array
- [ ] Handle empty cells gracefully
- [ ] Validate file structure

**Files to Create:**
- `frontend/lib/import-parser.ts`

---

### Task 1.6: File Parser - CSV
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 3 hours

**Description:**  
Implement CSV file parser that handles various delimiters and formats.

**Acceptance Criteria:**
- [ ] Parse CSV files with comma, semicolon, tab delimiters
- [ ] Auto-detect delimiter
- [ ] Handle quoted values with commas
- [ ] Treat first row as headers
- [ ] Return normalized ParsedRow array
- [ ] Handle empty cells gracefully

**Files to Modify:**
- `frontend/lib/import-parser.ts`

---

### Task 1.7: Product Matching Algorithm
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 3 hours

**Description:**  
Implement hybrid matching strategy (SKU first, name fallback) to match imported rows to existing products.

**Acceptance Criteria:**
- [ ] Match by SKU (case-insensitive, trimmed)
- [ ] Fallback to product name matching
- [ ] Return null for ambiguous matches (multiple name matches)
- [ ] Trim whitespace from inputs
- [ ] Log matching strategy used

**Files to Create:**
- `frontend/lib/product-matcher.ts`

---

### Task 1.8: Validation Engine
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 4 hours

**Description:**  
Implement comprehensive validation for imported data.

**Acceptance Criteria:**
- [ ] Validate required fields (SKU or Product Name, Quantity)
- [ ] Validate quantity is non-negative integer
- [ ] Detect duplicate entries within file
- [ ] Detect products not found in database
- [ ] Validate file size (max 5MB)
- [ ] Validate row count (max 1000)
- [ ] Return structured ValidationResult with errors and warnings
- [ ] Group errors by type

**Files to Create:**
- `frontend/lib/import-validator.ts`

---

### Task 1.9: Import Modal - File Upload Step
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 4 hours

**Description:**  
Create import modal with file upload interface.

**Acceptance Criteria:**
- [ ] Create ImportModal component with Dialog
- [ ] Implement drag-and-drop file upload
- [ ] Implement click-to-browse file upload
- [ ] Validate file type (.xlsx, .csv only)
- [ ] Validate file size (max 5MB)
- [ ] Show mode selector (Replace/Add)
- [ ] Display file name after upload
- [ ] Show loading indicator during parsing
- [ ] Handle upload errors gracefully

**Files to Create:**
- `frontend/components/inventory/ImportModal.tsx`
- `frontend/components/inventory/FileUploader.tsx`

---

### Task 1.10: Import Modal - Preview Step
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 5 hours

**Description:**  
Create import preview table showing matched products and calculated changes.

**Acceptance Criteria:**
- [ ] Display preview table with columns: Row, SKU, Product, Current Qty, New Qty, Change, Status
- [ ] Highlight validation errors in red
- [ ] Highlight successful matches in green
- [ ] Display summary: Total Rows, Valid Rows, Error Rows
- [ ] Show validation errors grouped by type
- [ ] Provide "Download Error Report" button
- [ ] Disable "Confirm Import" if errors exist
- [ ] Show "Cancel" button

**Files to Create:**
- `frontend/components/inventory/ImportPreview.tsx`
- `frontend/components/inventory/ValidationErrors.tsx`

---

### Task 1.11: Import Execution
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 5 hours

**Description:**  
Implement import execution that updates inventory in a transaction.

**Acceptance Criteria:**
- [ ] Execute all updates in single transaction
- [ ] Calculate new quantities based on mode (replace/add)
- [ ] Update inventory table
- [ ] Create stock_movements records for each update
- [ ] Include import metadata in stock_movements note
- [ ] Update inventory.updated_at timestamps
- [ ] Rollback on any error
- [ ] Display success message with count
- [ ] Refresh inventory table after success
- [ ] Handle execution errors gracefully

**Files to Modify:**
- `frontend/hooks/useInventory.ts`
- `frontend/lib/supabase-queries.ts`

---

### Task 1.12: Audit Trail Integration
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 2 hours

**Description:**  
Ensure import operations are properly logged in stock_movements table.

**Acceptance Criteria:**
- [ ] Add 'import' type to stock_movements type constraint
- [ ] Include filename, mode, and row number in note field
- [ ] Record user ID in created_by field
- [ ] Display import operations in Stock History drawer with distinct icon
- [ ] Test audit trail queries

**Files to Modify:**
- Database schema (migration)
- `frontend/components/inventory/StockHistoryDrawer.tsx`

---

### Task 1.13: Integration and Testing
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 4 hours

**Description:**  
Integrate all components and perform end-to-end testing.

**Acceptance Criteria:**
- [ ] Integrate ImportModal into inventory page
- [ ] Test full import flow (upload → preview → execute)
- [ ] Test export flow (Excel and CSV)
- [ ] Test category filter integration
- [ ] Test error handling scenarios
- [ ] Test with various file formats and sizes
- [ ] Test mobile responsiveness
- [ ] Fix any bugs found during testing

---

## Phase 2: v1.5 - Threshold Updates & Templates

### Task 2.1: Threshold Column Support
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 3 hours

**Description:**  
Add support for importing low stock threshold values.

**Acceptance Criteria:**
- [ ] Update parser to extract threshold column
- [ ] Update validation to validate threshold values
- [ ] Update preview to show threshold changes
- [ ] Update execution to update low_stock_threshold
- [ ] Create stock_movements record for threshold changes
- [ ] Handle optional threshold column (blank = no update)

**Files to Modify:**
- `frontend/lib/import-parser.ts`
- `frontend/lib/import-validator.ts`
- `frontend/components/inventory/ImportPreview.tsx`
- `frontend/hooks/useInventory.ts`

---

### Task 2.2: Import Template Generator
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 3 hours

**Description:**  
Create Excel template generator with sample data and formatting.

**Acceptance Criteria:**
- [ ] Generate Excel file with proper headers
- [ ] Include 3 sample rows with example data
- [ ] Apply bold formatting to headers
- [ ] Add background color to header row
- [ ] Include data validation rules
- [ ] Create instruction sheet explaining columns
- [ ] Filename: `talastock-inventory-import-template.xlsx`

**Files to Create:**
- `frontend/lib/generate-import-template.ts`

---

### Task 2.3: Download Template Button
**Status:** pending  
**Priority:** low  
**Estimated Effort:** 1 hour

**Description:**  
Add "Download Template" button to import modal.

**Acceptance Criteria:**
- [ ] Add button to import modal upload step
- [ ] Trigger template download on click
- [ ] Show success toast after download
- [ ] Follow Talastock design system

**Files to Modify:**
- `frontend/components/inventory/ImportModal.tsx`

---

## Phase 3: v2 - Advanced Features

### Task 3.1: Import History Database Schema
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 2 hours

**Description:**  
Create import_history table and update stock_movements schema.

**Acceptance Criteria:**
- [ ] Create import_history table with all required columns
- [ ] Add indexes for performance
- [ ] Add 'rollback' type to stock_movements
- [ ] Add import_history_id foreign key to stock_movements
- [ ] Enable RLS on import_history table
- [ ] Create RLS policies

**Files to Create:**
- Database migration script

---

### Task 3.2: Partial Import Mode
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 4 hours

**Description:**  
Implement partial import mode that skips error rows and imports valid rows.

**Acceptance Criteria:**
- [ ] Add "Partial Import" checkbox to import modal
- [ ] Update preview to clearly indicate skipped rows
- [ ] Update execution to skip error rows
- [ ] Display summary: "X imported, Y skipped"
- [ ] Provide "Download Skipped Rows" button
- [ ] Generate CSV with skipped rows and error reasons
- [ ] Update audit trail with skipped count

**Files to Modify:**
- `frontend/components/inventory/ImportModal.tsx`
- `frontend/components/inventory/ImportPreview.tsx`
- `frontend/hooks/useInventory.ts`

---

### Task 3.3: Dry Run Mode
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 3 hours

**Description:**  
Implement dry run mode that previews changes without saving.

**Acceptance Criteria:**
- [ ] Add "Dry Run (Preview Only)" checkbox
- [ ] Display prominent banner: "DRY RUN MODE"
- [ ] Execute validation and matching without saving
- [ ] Display message: "Dry run complete. No changes were saved."
- [ ] Provide "Run for Real" button after dry run
- [ ] Don't create stock_movements or audit records

**Files to Modify:**
- `frontend/components/inventory/ImportModal.tsx`
- `frontend/hooks/useInventory.ts`

---

### Task 3.4: Import History Page
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 5 hours

**Description:**  
Create dedicated page showing history of all imports.

**Acceptance Criteria:**
- [ ] Create ImportHistoryPage component
- [ ] Display table with: Date, User, Filename, Rows Imported, Rows Skipped, Mode, Status
- [ ] Implement pagination (20 per page)
- [ ] Add date range filter
- [ ] Add user filter
- [ ] Add "Import History" link to inventory page
- [ ] Follow Talastock design system

**Files to Create:**
- `frontend/app/(dashboard)/inventory/history/page.tsx`
- `frontend/app/(dashboard)/inventory/history/loading.tsx`

---

### Task 3.5: Import History Drawer
**Status:** pending  
**Priority:** medium  
**Estimated Effort:** 4 hours

**Description:**  
Create drawer showing detailed information for a specific import.

**Acceptance Criteria:**
- [ ] Display all imported products with old/new values
- [ ] Show changes made for each product
- [ ] Display import metadata (user, timestamp, mode)
- [ ] Provide "Rollback" button for imports < 24 hours old
- [ ] Disable rollback for older imports
- [ ] Follow Talastock design system

**Files to Create:**
- `frontend/components/inventory/ImportHistoryDrawer.tsx`

---

### Task 3.6: Rollback Functionality
**Status:** pending  
**Priority:** high  
**Estimated Effort:** 5 hours

**Description:**  
Implement rollback functionality to undo recent imports.

**Acceptance Criteria:**
- [ ] Check if import is within 24-hour window
- [ ] Restore all products to pre-import values
- [ ] Create new stock_movements records with type "rollback"
- [ ] Update import_history record to mark as rolled back
- [ ] Require confirmation before rollback
- [ ] Display success message after rollback
- [ ] Refresh inventory table

**Files to Create:**
- `frontend/lib/rollback-import.ts`

**Files to Modify:**
- `frontend/hooks/useInventory.ts`
- `frontend/lib/supabase-queries.ts`

---

### Task 3.7: Enhanced Export Options
**Status:** pending  
**Priority:** low  
**Estimated Effort:** 3 hours

**Description:**  
Add "Export All" button and custom column selection.

**Acceptance Criteria:**
- [ ] Add "Export All" button alongside "Export Filtered"
- [ ] Create custom columns dialog
- [ ] Allow users to select which columns to export
- [ ] Remember user's column preferences
- [ ] Update export functions to respect column selection

**Files to Modify:**
- `frontend/components/inventory/ExportButtons.tsx`
- `frontend/lib/export-inventory.ts`

---

## Summary

**Total Tasks:** 28  
**Phase 1 (v1):** 13 tasks  
**Phase 2 (v1.5):** 3 tasks  
**Phase 3 (v2):** 7 tasks  

**Estimated Total Effort:** ~80 hours

**Priority Breakdown:**
- High Priority: 15 tasks
- Medium Priority: 11 tasks
- Low Priority: 2 tasks

**Recommended Implementation Order:**
1. Phase 1 Tasks 1.1-1.4 (Category filter + Export) - Quick wins
2. Phase 1 Tasks 1.5-1.12 (Import functionality) - Core feature
3. Phase 1 Task 1.13 (Integration testing)
4. Phase 2 Tasks 2.1-2.3 (Threshold updates + Templates)
5. Phase 3 Tasks 3.1-3.7 (Advanced features)

