# Requirements Document

## Introduction

This document specifies the requirements for adding inventory import/export capabilities to the Talastock inventory management system. The feature enables users to filter inventory by category, export current inventory data to Excel/CSV formats, and bulk update inventory quantities via file upload with comprehensive validation and safety features.

## Glossary

- **Inventory_System**: The Talastock inventory management module that tracks product quantities, low stock thresholds, and stock status
- **Export_Module**: The component responsible for generating Excel and CSV files from current inventory data
- **Import_Module**: The component responsible for parsing uploaded files and updating inventory quantities
- **Category_Filter**: A dropdown UI component that filters inventory items by product category
- **Import_Preview**: A UI component that displays parsed import data before applying changes
- **Validation_Engine**: The component that validates imported data for errors and inconsistencies
- **Audit_Logger**: The component that records all import operations with user, timestamp, and changes made
- **File_Parser**: The component that reads and parses Excel (.xlsx) and CSV files
- **Matching_Strategy**: The algorithm used to match imported records to existing products (SKU-based, name-based, or hybrid)

## Requirements

### Requirement 1: Category Filter

**User Story:** As an inventory manager, I want to filter inventory items by category, so that I can focus on specific product groups.

#### Acceptance Criteria

1. THE Category_Filter SHALL display all categories from the database in a dropdown format
2. WHEN a category is selected, THE Inventory_System SHALL display only products belonging to that category
3. THE Category_Filter SHALL work alongside existing search and status filters without conflicts
4. WHEN multiple filters are active, THE Inventory_System SHALL apply all filters using AND logic
5. WHEN the category filter is cleared, THE Inventory_System SHALL display all inventory items
6. THE Category_Filter SHALL display a count of filtered items versus total items

### Requirement 2: Export Functionality

**User Story:** As an inventory manager, I want to export current inventory data to Excel or CSV, so that I can analyze data offline or share with stakeholders.

#### Acceptance Criteria

1. THE Export_Module SHALL provide export buttons for both Excel (.xlsx) and CSV formats
2. WHEN export is triggered, THE Export_Module SHALL respect all active filters (search, status, category)
3. THE Export_Module SHALL include the following columns: Product Name, SKU, Category, Current Quantity, Low Stock Threshold, Status, Last Updated
4. THE Export_Module SHALL format the Status column as human-readable text (In Stock, Low Stock, Out of Stock)
5. THE Export_Module SHALL format the Last Updated column in ISO 8601 format (YYYY-MM-DD HH:MM:SS)
6. WHEN export completes, THE Export_Module SHALL trigger a browser download with filename format: `inventory-export-YYYY-MM-DD-HHMMSS.{xlsx|csv}`
7. THE Export_Module SHALL display a loading indicator during file generation
8. IF export fails, THEN THE Export_Module SHALL display an error message to the user
9. THE Export_Module SHALL display a badge showing "Exporting X of Y items" when filters are active

### Requirement 3: Import File Format

**User Story:** As an inventory manager, I want a standardized import file format, so that I can prepare bulk updates efficiently.

#### Acceptance Criteria

1. THE Import_Module SHALL accept files with the following columns: SKU, Product Name, Category, Quantity, Low Stock Threshold
2. THE Import_Module SHALL accept both Excel (.xlsx) and CSV file formats
3. THE Import_Module SHALL treat the first row as a header row and skip it during processing
4. THE Import_Module SHALL validate that required columns (SKU or Product Name, Quantity) are present
5. THE Quantity and Low Stock Threshold columns SHALL be optional (blank = no update)
6. THE Category column SHALL be used for validation only (warn if mismatch, but don't block import)
7. THE File_Parser SHALL handle common CSV delimiters (comma, semicolon, tab)
8. THE File_Parser SHALL handle Excel files with data in the first worksheet only

### Requirement 4: Product Matching Strategy

**User Story:** As an inventory manager, I want the system to accurately match imported records to existing products, so that updates are applied correctly.

#### Acceptance Criteria

1. THE Import_Module SHALL use a hybrid matching strategy: SKU first, then Product Name fallback
2. WHEN an SKU is provided and matches exactly one product, THE Import_Module SHALL use that product
3. WHEN an SKU is not provided or does not match, THE Import_Module SHALL attempt case-insensitive Product Name matching
4. IF a Product Name matches multiple products, THEN THE Validation_Engine SHALL flag it as an error
5. IF neither SKU nor Product Name matches any product, THEN THE Validation_Engine SHALL flag it as "Product Not Found"
6. THE Import_Module SHALL trim whitespace from SKU and Product Name before matching
7. THE Import_Module SHALL log the matching strategy used for each record in the import preview

### Requirement 5: Import Validation

**User Story:** As an inventory manager, I want comprehensive validation of import data, so that I can identify and fix errors before applying changes.

#### Acceptance Criteria

1. THE Validation_Engine SHALL validate that Quantity values are non-negative integers
2. THE Validation_Engine SHALL validate that Quantity values are numeric (reject text, special characters)
3. THE Validation_Engine SHALL flag duplicate entries within the import file (same SKU or Product Name appearing multiple times)
4. THE Validation_Engine SHALL flag products not found in the database
5. THE Validation_Engine SHALL validate file size does not exceed 5MB
6. THE Validation_Engine SHALL validate row count does not exceed 1000 rows
7. IF validation errors exist, THEN THE Import_Module SHALL prevent the import from proceeding
8. THE Validation_Engine SHALL display all validation errors grouped by type (missing products, invalid quantities, duplicates)

### Requirement 6: Import Preview

**User Story:** As an inventory manager, I want to preview imported data before applying changes, so that I can verify correctness and avoid mistakes.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Import_Preview SHALL display all parsed records in a table format
2. THE Import_Preview SHALL display the following columns: Row Number, SKU, Product Name, Current Quantity, New Quantity, Change, Status
3. THE Import_Preview SHALL calculate and display the quantity change (New - Current) for each record
4. THE Import_Preview SHALL highlight validation errors in red with error messages
5. THE Import_Preview SHALL highlight successful matches in green
6. THE Import_Preview SHALL display a summary: Total Rows, Valid Rows, Error Rows
7. THE Import_Preview SHALL provide a "Cancel" button to discard the import
8. THE Import_Preview SHALL provide a "Confirm Import" button that is disabled when validation errors exist

### Requirement 7: Import Behavior

**User Story:** As an inventory manager, I want to choose how imported quantities are applied, so that I can handle different update scenarios (replace vs. adjust).

#### Acceptance Criteria

1. THE Import_Module SHALL provide two import modes: "Replace Quantity" and "Add to Quantity"
2. WHEN "Replace Quantity" mode is selected, THE Import_Module SHALL set inventory quantity to the imported value
3. WHEN "Add to Quantity" mode is selected, THE Import_Module SHALL add the imported value to the current quantity
4. THE Import_Module SHALL display the selected mode prominently in the Import_Preview
5. THE Import_Module SHALL allow the user to change the mode before confirming the import
6. THE Import_Module SHALL default to "Replace Quantity" mode
7. WHEN "Add to Quantity" mode is used with negative values, THE Import_Module SHALL allow it (for decrements)

### Requirement 8: Import Execution

**User Story:** As an inventory manager, I want imports to be executed safely and atomically, so that partial failures do not corrupt inventory data.

#### Acceptance Criteria

1. WHEN the user confirms an import, THE Import_Module SHALL execute all updates in a single database transaction
2. IF any update fails during execution, THEN THE Import_Module SHALL roll back all changes
3. THE Import_Module SHALL create a stock_movements record for each updated product with type "adjustment"
4. THE Import_Module SHALL include the import filename and timestamp in the stock_movements note field
5. THE Import_Module SHALL update the inventory.updated_at timestamp for each modified product
6. WHEN import completes successfully, THE Import_Module SHALL display a success message with count of updated products
7. IF import fails, THEN THE Import_Module SHALL display an error message and preserve the original inventory state
8. THE Import_Module SHALL refresh the inventory table after successful import

### Requirement 9: Audit Trail

**User Story:** As a business owner, I want a complete audit trail of all import operations, so that I can track who made changes and when.

#### Acceptance Criteria

1. THE Audit_Logger SHALL record the following for each import: user ID, timestamp, filename, row count, mode (replace/add)
2. THE Audit_Logger SHALL record each product update in the stock_movements table
3. THE stock_movements note field SHALL include: "Import: {filename} - {mode} - Row {row_number}"
4. THE Audit_Logger SHALL record the user who performed the import in the created_by field
5. THE Audit_Logger SHALL preserve audit records even if products are later deleted
6. THE Audit_Logger SHALL be queryable via the Stock History drawer for each product
7. WHEN viewing stock history, THE Inventory_System SHALL display import operations with a distinct icon

### Requirement 10: Security and Validation

**User Story:** As a system administrator, I want import operations to be secure and validated, so that malicious or malformed files cannot compromise the system.

#### Acceptance Criteria

1. THE Import_Module SHALL validate file MIME type matches the file extension (.xlsx or .csv)
2. THE Import_Module SHALL reject files with executable extensions or suspicious content
3. THE Import_Module SHALL sanitize all text input from imported files to prevent XSS attacks
4. THE Import_Module SHALL validate that the authenticated user has permission to modify inventory
5. THE Import_Module SHALL rate-limit import operations to 5 imports per minute per user
6. THE Import_Module SHALL log all import attempts (successful and failed) for security monitoring
7. IF file parsing fails, THEN THE Import_Module SHALL display a generic error message without exposing system details
8. THE Import_Module SHALL validate that SKU and Product Name fields do not contain SQL injection patterns

### Requirement 11: User Interface Integration

**User Story:** As an inventory manager, I want import/export features to be easily accessible and consistent with the existing UI, so that I can use them efficiently.

#### Acceptance Criteria

1. THE Inventory_System SHALL display export buttons (Excel, CSV) near the existing filters
2. THE Inventory_System SHALL display an "Import" button near the export buttons
3. WHEN the Import button is clicked, THE Import_Module SHALL open a modal dialog
4. THE Import_Module modal SHALL include: file upload area, mode selector, preview table, action buttons
5. THE Import_Module SHALL support drag-and-drop file upload
6. THE Import_Module SHALL display a sample file download link with the correct format
7. THE Import_Module SHALL follow the Talastock design system (warm peach/salmon palette, shadcn/ui components)
8. THE Import_Module SHALL be mobile-responsive with appropriate layout adjustments

### Requirement 12: Error Handling and User Feedback

**User Story:** As an inventory manager, I want clear error messages and feedback, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN a file upload fails, THE Import_Module SHALL display the specific error (file too large, invalid format, etc.)
2. WHEN validation errors exist, THE Import_Module SHALL display them grouped by category with row numbers
3. WHEN an import succeeds, THE Import_Module SHALL display a toast notification with the count of updated products
4. WHEN an import fails during execution, THE Import_Module SHALL display an error message and suggest contacting support
5. THE Import_Module SHALL provide a "Download Error Report" button when validation errors exist
6. THE Error Report SHALL be a CSV file listing all errors with row numbers and descriptions
7. THE Import_Module SHALL display loading indicators during file parsing, validation, and execution phases
8. THE Import_Module SHALL disable the Confirm button and show a spinner during import execution

---

## v1.5 Requirements

### Requirement 13: Import Template Download

**User Story:** As an inventory manager, I want to download a pre-formatted import template, so that I can avoid formatting errors and understand the expected structure.

#### Acceptance Criteria

1. THE Import_Module SHALL provide a "Download Template" button in the import modal
2. THE template SHALL be an Excel (.xlsx) file with proper column headers: SKU, Product Name, Category, Quantity, Low Stock Threshold
3. THE template SHALL include 3 sample rows with example data and clear formatting
4. THE template SHALL include a header row with bold formatting and background color
5. THE template SHALL include data validation rules (e.g., Quantity must be numeric)
6. THE template filename SHALL be: `talastock-inventory-import-template.xlsx`
7. WHEN the template is downloaded, THE Import_Module SHALL display a toast notification
8. THE template SHALL include an instruction sheet explaining each column and import modes

### Requirement 14: Threshold Updates via Import

**User Story:** As an inventory manager, I want to update low stock thresholds via import, so that I can adjust thresholds seasonally or in bulk.

#### Acceptance Criteria

1. THE Import_Module SHALL accept a "Low Stock Threshold" column in import files
2. WHEN the Threshold column is blank for a row, THE Import_Module SHALL not update that product's threshold
3. WHEN the Threshold column contains a value, THE Import_Module SHALL update the product's low_stock_threshold
4. THE Validation_Engine SHALL validate that Threshold values are non-negative integers
5. THE Import_Preview SHALL display threshold changes in a separate column: "New Threshold"
6. THE Import_Module SHALL create a stock_movements record when threshold is updated (type: "adjustment")
7. THE stock_movements note SHALL indicate: "Threshold updated via import: {old_value} → {new_value}"
8. THE Import_Module SHALL allow updating Quantity only, Threshold only, or both in the same import

---

## v2 Requirements

### Requirement 15: Partial Import Mode

**User Story:** As an inventory manager, I want to import valid rows even when some rows have errors, so that I don't have to fix minor errors and re-upload large files.

#### Acceptance Criteria

1. THE Import_Module SHALL provide a "Partial Import" checkbox in the import modal
2. WHEN Partial Import is enabled, THE Import_Module SHALL import all valid rows and skip rows with errors
3. THE Import_Preview SHALL clearly indicate which rows will be imported (green) and which will be skipped (red)
4. WHEN Partial Import completes, THE Import_Module SHALL display a summary: "142 rows imported, 3 rows skipped"
5. THE Import_Module SHALL provide a "Download Skipped Rows" button to export failed rows as CSV
6. THE Skipped Rows file SHALL include the original data plus an "Error Reason" column
7. THE Import_Module SHALL still reject the entire import if critical errors exist (e.g., file format invalid)
8. THE Audit_Logger SHALL record both imported and skipped row counts in the audit trail

### Requirement 16: Dry Run Mode

**User Story:** As an inventory manager, I want to preview import changes without saving them, so that I can verify correctness before committing.

#### Acceptance Criteria

1. THE Import_Module SHALL provide a "Dry Run (Preview Only)" checkbox in the import modal
2. WHEN Dry Run is enabled, THE Import_Module SHALL execute all validation and matching logic
3. WHEN Dry Run is enabled, THE Import_Module SHALL display the preview with all calculated changes
4. WHEN the user confirms a Dry Run import, THE Import_Module SHALL NOT save any changes to the database
5. WHEN Dry Run completes, THE Import_Module SHALL display: "Dry run complete. No changes were saved."
6. THE Import_Module SHALL provide a "Run for Real" button after Dry Run to execute the actual import
7. THE Dry Run SHALL NOT create stock_movements records or update audit logs
8. THE Import_Module SHALL display a prominent banner: "DRY RUN MODE - No changes will be saved"

### Requirement 17: Import History Page

**User Story:** As a business owner, I want to view a history of all imports with the ability to rollback recent changes, so that I can audit operations and recover from mistakes.

#### Acceptance Criteria

1. THE Inventory_System SHALL provide an "Import History" link in the inventory page header
2. THE Import History page SHALL display a table with columns: Date, User, Filename, Rows Imported, Rows Skipped, Mode, Status
3. THE Import History page SHALL support pagination (20 imports per page)
4. THE Import History page SHALL support filtering by date range and user
5. WHEN a user clicks on an import record, THE Import_Module SHALL display detailed information in a drawer
6. THE detail drawer SHALL show: all imported products, old values, new values, and changes made
7. THE Import_Module SHALL provide a "Rollback" button for imports within the last 24 hours
8. WHEN Rollback is clicked, THE Import_Module SHALL restore all products to their pre-import values
9. THE Rollback operation SHALL create new stock_movements records with type "rollback"
10. THE Import_Module SHALL require confirmation before executing a rollback
11. THE Import History SHALL be stored in a new database table: `import_history`
12. THE import_history table SHALL include: id, user_id, filename, timestamp, rows_imported, rows_skipped, mode, status, rollback_available

### Requirement 18: Enhanced Export Options

**User Story:** As an inventory manager, I want flexible export options, so that I can export exactly what I need for different use cases.

#### Acceptance Criteria

1. THE Export_Module SHALL provide two export buttons: "Export Filtered" and "Export All"
2. THE "Export Filtered" button SHALL export only items matching active filters
3. THE "Export All" button SHALL export the entire inventory regardless of filters
4. WHEN filters are active, THE Export_Module SHALL display a badge: "Exporting X of Y items"
5. THE Export_Module SHALL provide a dropdown to select export format: Excel or CSV
6. THE Export_Module SHALL remember the user's last selected format preference
7. THE Export_Module SHALL include a "Custom Columns" option to select which columns to export
8. THE Custom Columns dialog SHALL allow users to check/uncheck: SKU, Product Name, Category, Quantity, Threshold, Status, Last Updated, Cost Price, Retail Price

## Open Questions for User Decision

All design decisions have been finalized. The feature will be implemented in three phases:

**v1 (MVP):**
- Category filter
- Export (full format: SKU, Product Name, Category, Quantity, Threshold)
- Import (quantity updates only)
- Hybrid matching strategy
- Replace/Add mode selection
- Import preview and validation
- Audit trail

**v1.5:**
- Import with threshold updates
- Download import template button
- Enhanced validation for threshold values

**v2:**
- Partial import (skip errors, import valid rows)
- Dry run mode (preview without saving)
- Import history page with rollback capability

### Question 1: Matching Strategy Priority
**DECISION:** Hybrid approach (SKU first, fallback to Product Name)

**Rationale:**
- SKU provides unique, unambiguous matching when available
- Product Name fallback provides flexibility for users without SKUs
- Industry standard used by SAP, Oracle NetSuite, Shopify
- Balances accuracy with usability

### Question 2: Import Behavior Default
**DECISION:** Default to "Replace Quantity" mode with user choice

**Rationale:**
- Replace mode matches 80% of user expectations ("set to this number")
- Add mode critical for receiving shipments and adjustments
- User choice provides maximum flexibility
- Industry standard in QuickBooks, Xero, and other accounting systems

### Question 3: File Format Columns
**DECISION:** Full format (SKU, Product Name, Category, Quantity, Low Stock Threshold)

**Rationale:** 
- Export-import symmetry allows round-trip data editing
- Enables bulk threshold updates for seasonal changes
- Category acts as validation check
- Quantity and Threshold columns are optional (blank = no update)
- Future-proof design that prevents feature requests later

### Question 4: Duplicate Handling
**DECISION:** Reject entire import if duplicates exist

**Rationale:**
- Fail-fast principle catches errors before any changes
- Builds user trust with predictable behavior
- Industry standard in banking and financial systems
- Users can fix duplicates and re-upload with confidence

### Question 5: Export Scope
**DECISION:** Export respects active filters with visual indicator

**Rationale:**
- Principle of least surprise - users expect filtered export
- Enables targeted exports (e.g., "Export only Low Stock items")
- Visual indicator prevents confusion ("Exporting 47 of 234 items")
- Optional "Export All" button for edge cases

