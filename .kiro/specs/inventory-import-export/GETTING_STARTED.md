# Getting Started - Inventory Import/Export Implementation

## Quick Start Guide

This guide will help you start implementing the inventory import/export feature following the approved specification.

## Prerequisites

- [ ] Read the [Requirements Document](./requirements.md)
- [ ] Read the [Design Document](./design.md)
- [ ] Review the [Tasks Document](./tasks.md)
- [ ] Understand the current inventory page implementation

## Recommended Implementation Order

### Week 1: Quick Wins (Category Filter + Export)

**Day 1-2: Category Filter & Export**
Start with the easiest, highest-value features:

1. **Task 1.1: Category Filter** (2 hours)
   - File: `frontend/components/inventory/CategoryFilter.tsx`
   - Integrate into: `frontend/app/(dashboard)/inventory/page.tsx`
   - Test with existing filters

2. **Task 1.2-1.4: Export Functionality** (8 hours)
   - Install: `npm install xlsx`
   - Create: `frontend/lib/export-inventory.ts`
   - Create: `frontend/components/inventory/ExportButtons.tsx`
   - Test Excel and CSV exports

**Deliverable:** Users can filter by category and export inventory data

---

### Week 2-3: Core Import Functionality

**Day 3-5: File Processing**

3. **Task 1.5-1.6: File Parsers** (7 hours)
   - Create: `frontend/lib/import-parser.ts`
   - Implement Excel parser using xlsx library
   - Implement CSV parser with delimiter detection
   - Write unit tests

4. **Task 1.7: Product Matching** (3 hours)
   - Create: `frontend/lib/product-matcher.ts`
   - Implement hybrid matching (SKU first, name fallback)
   - Write unit tests for edge cases

5. **Task 1.8: Validation Engine** (4 hours)
   - Create: `frontend/lib/import-validator.ts`
   - Implement all validation rules
   - Write unit tests

**Day 6-8: Import UI**

6. **Task 1.9: Import Modal - Upload** (4 hours)
   - Create: `frontend/components/inventory/ImportModal.tsx`
   - Create: `frontend/components/inventory/FileUploader.tsx`
   - Implement drag-and-drop
   - Add mode selector (Replace/Add)

7. **Task 1.10: Import Modal - Preview** (5 hours)
   - Create: `frontend/components/inventory/ImportPreview.tsx`
   - Create: `frontend/components/inventory/ValidationErrors.tsx`
   - Display preview table with changes
   - Show validation errors

**Day 9-10: Import Execution**

8. **Task 1.11: Import Execution** (5 hours)
   - Update: `frontend/hooks/useInventory.ts`
   - Update: `frontend/lib/supabase-queries.ts`
   - Implement transaction-based updates
   - Create stock_movements records

9. **Task 1.12: Audit Trail** (2 hours)
   - Run database migration for new stock_movements types
   - Update: `frontend/components/inventory/StockHistoryDrawer.tsx`
   - Test audit trail display

10. **Task 1.13: Integration Testing** (4 hours)
    - Test full import flow end-to-end
    - Test with various file formats
    - Test error scenarios
    - Fix bugs

**Deliverable:** Full import/export functionality (v1 MVP)

---

### Week 4: v1.5 Features

**Day 11-12: Threshold Updates & Templates**

11. **Task 2.1: Threshold Column Support** (3 hours)
    - Update parser, validator, preview, execution
    - Test threshold updates

12. **Task 2.2-2.3: Import Template** (4 hours)
    - Create: `frontend/lib/generate-import-template.ts`
    - Add download button to import modal
    - Test template generation

**Deliverable:** Enhanced import with threshold updates and templates

---

### Week 5-6: v2 Features (Optional)

**Day 13-15: Advanced Features**

13. **Task 3.1: Database Schema** (2 hours)
    - Create import_history table migration
    - Update stock_movements schema

14. **Task 3.2-3.3: Partial Import & Dry Run** (7 hours)
    - Add checkboxes to import modal
    - Implement partial import logic
    - Implement dry run mode

15. **Task 3.4-3.6: Import History & Rollback** (14 hours)
    - Create import history page
    - Create import history drawer
    - Implement rollback functionality

16. **Task 3.7: Enhanced Export** (3 hours)
    - Add "Export All" button
    - Add custom column selection

**Deliverable:** Full enterprise-grade import/export system

---

## Development Workflow

### 1. Set Up Development Environment

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install xlsx

# Start dev server
npm run dev
```

### 2. Create Feature Branch

```bash
git checkout -b feature/inventory-import-export
```

### 3. Implement Task by Task

For each task:
1. Read task description in `tasks.md`
2. Create/modify files as specified
3. Write code following design document
4. Test functionality manually
5. Write unit tests (if applicable)
6. Commit changes

```bash
git add .
git commit -m "feat: implement category filter (Task 1.1)"
```

### 4. Test Thoroughly

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Test in browser
# - Upload various file formats
# - Test validation errors
# - Test import execution
# - Test export functionality
```

### 5. Create Pull Request

```bash
git push origin feature/inventory-import-export
```

---

## Testing Checklist

### Category Filter
- [ ] Displays all categories from database
- [ ] Filters inventory correctly
- [ ] Works with search and status filters
- [ ] Clear filters button works

### Export
- [ ] Excel export works
- [ ] CSV export works
- [ ] Respects active filters
- [ ] Filename includes timestamp
- [ ] All columns present and formatted correctly
- [ ] Loading indicator shows during export
- [ ] Success toast appears

### Import - File Upload
- [ ] Drag-and-drop works
- [ ] Click-to-browse works
- [ ] File type validation works
- [ ] File size validation works (max 5MB)
- [ ] Mode selector works (Replace/Add)

### Import - Parsing
- [ ] Excel files parse correctly
- [ ] CSV files parse correctly
- [ ] Handles various column names
- [ ] Handles empty cells
- [ ] Handles special characters

### Import - Validation
- [ ] Detects missing required fields
- [ ] Detects invalid quantities (negative, non-numeric)
- [ ] Detects duplicate entries
- [ ] Detects products not found
- [ ] Displays errors grouped by type
- [ ] Disables confirm button when errors exist

### Import - Preview
- [ ] Shows all parsed rows
- [ ] Displays current vs new quantities
- [ ] Calculates changes correctly
- [ ] Highlights errors in red
- [ ] Highlights successes in green
- [ ] Shows summary counts

### Import - Execution
- [ ] Updates inventory quantities
- [ ] Creates stock_movements records
- [ ] Executes in transaction (all-or-nothing)
- [ ] Refreshes inventory table after success
- [ ] Shows success message with count
- [ ] Handles errors gracefully

### Import - Audit Trail
- [ ] Stock movements appear in history drawer
- [ ] Includes import metadata in note
- [ ] Records user ID correctly
- [ ] Timestamp is accurate

---

## Common Issues & Solutions

### Issue: Excel file not parsing
**Solution:** Check that xlsx library is installed and imported correctly

### Issue: Validation not catching errors
**Solution:** Review validation logic in `import-validator.ts`, add console.logs

### Issue: Import not updating inventory
**Solution:** Check Supabase query, verify RLS policies, check transaction logic

### Issue: Export file is empty
**Solution:** Verify filtered inventory data is being passed to export function

### Issue: Category filter not working
**Solution:** Check that category_id is being included in Supabase query

---

## Code Style Guidelines

Follow the project's coding standards:

- Use TypeScript strict mode
- Follow naming conventions (PascalCase for components, camelCase for functions)
- Use Talastock design system colors
- Add proper error handling
- Write descriptive comments for complex logic
- Keep functions small and focused
- Use async/await instead of promises

---

## Resources

### Documentation
- [Requirements](./requirements.md) - What to build
- [Design](./design.md) - How to build it
- [Tasks](./tasks.md) - Step-by-step breakdown

### Code References
- Current inventory page: `frontend/app/(dashboard)/inventory/page.tsx`
- Existing hooks: `frontend/hooks/useInventory.ts`
- Supabase queries: `frontend/lib/supabase-queries.ts`
- Design system: `.kiro/steering/ui-components.md`

### External Libraries
- [xlsx documentation](https://docs.sheetjs.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- [Supabase JS client](https://supabase.com/docs/reference/javascript)

---

## Questions?

If you encounter issues or have questions:

1. Review the design document for implementation details
2. Check the tasks document for acceptance criteria
3. Look at similar existing features for patterns
4. Test with small, simple files first
5. Add console.logs to debug issues

---

## Success Criteria

You'll know you're done when:

- [ ] All tasks in Phase 1 are complete
- [ ] All acceptance criteria are met
- [ ] All tests pass
- [ ] Code follows project standards
- [ ] Feature works on mobile and desktop
- [ ] No console errors or warnings
- [ ] User can successfully import and export inventory
- [ ] Audit trail is complete and accurate

---

**Ready to start? Begin with Task 1.1: Category Filter!**

Good luck! 🚀

