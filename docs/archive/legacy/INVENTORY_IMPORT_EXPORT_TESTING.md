# Inventory Import/Export - Testing Guide

**Date:** April 15, 2026  
**Feature:** Inventory Import/Export v1 (MVP)  
**Status:** Ready for Testing

---

## 🎯 Testing Objectives

1. Verify all features work as expected
2. Test edge cases and error scenarios
3. Ensure data integrity
4. Validate user experience
5. Check mobile responsiveness

---

## 📋 Pre-Testing Setup

### 1. Run Database Migration

**IMPORTANT:** Run this SQL command in Supabase SQL Editor first:

```sql
-- Add 'import' and 'rollback' types to stock_movements
ALTER TABLE stock_movements 
  DROP CONSTRAINT IF EXISTS stock_movements_type_check;

ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_type_check 
  CHECK (type IN ('restock', 'sale', 'adjustment', 'return', 'import', 'rollback'));
```

### 2. Start Development Server

```bash
cd frontend
npm run dev
```

Navigate to: http://localhost:3000/inventory

### 3. Prepare Test Data

Create test files for import testing:

**test-import-valid.xlsx** (or .csv):
```
SKU       | Product Name | Category    | Quantity | Low Stock Threshold
ABC123    | Widget A     | Electronics | 100      | 10
DEF456    | Widget B     | Hardware    | 50       | 5
GHI789    | Widget C     | Electronics | 75       | 15
```

**test-import-errors.xlsx**:
```
SKU       | Product Name | Category    | Quantity | Low Stock Threshold
ABC123    | Widget A     | Electronics | 100      | 10
INVALID   | Not Found    | Electronics | 50       | 5
ABC123    | Widget A     | Electronics | 75       | 15  (duplicate)
DEF456    | Widget B     | Hardware    | -10      | 5   (negative qty)
```

---

## ✅ Test Cases

### Test 1: Category Filter

**Steps:**
1. Go to Inventory page
2. Click category filter dropdown
3. Select a category
4. Verify only products from that category are shown
5. Combine with search filter
6. Combine with status filter
7. Click "Clear filters"

**Expected Results:**
- [  ] Category dropdown shows all categories
- [  ] Filtering works correctly
- [  ] Works with other filters
- [  ] Clear filters resets category
- [  ] Item count updates correctly

---

### Test 2: Export to Excel

**Steps:**
1. Go to Inventory page
2. Apply some filters (optional)
3. Click "Excel" button
4. Wait for download
5. Open the downloaded file

**Expected Results:**
- [  ] File downloads with timestamp in filename
- [  ] File opens in Excel/Sheets
- [  ] Contains correct columns: Product Name, SKU, Category, Quantity, Threshold, Status, Last Updated
- [  ] Data matches filtered inventory
- [  ] Status is human-readable (In Stock, Low Stock, Out of Stock)
- [  ] Dates are formatted correctly
- [  ] Badge shows "Exporting X of Y items" when filters active
- [  ] Success toast appears

---

### Test 3: Export to CSV

**Steps:**
1. Go to Inventory page
2. Apply different filters
3. Click "CSV" button
4. Wait for download
5. Open the downloaded file

**Expected Results:**
- [  ] File downloads with timestamp in filename
- [  ] File opens in text editor/Excel
- [  ] Contains same data as Excel export
- [  ] CSV format is correct (comma-separated)
- [  ] Special characters handled correctly
- [  ] Success toast appears

---

### Test 4: Download Import Template

**Steps:**
1. Go to Inventory page
2. Click "Import" button
3. Click "Download Template"
4. Open the downloaded file

**Expected Results:**
- [  ] File downloads: `talastock-inventory-import-template.xlsx`
- [  ] File has two sheets: "Instructions" and "Import Data"
- [  ] Instructions sheet has clear guidance
- [  ] Import Data sheet has sample rows
- [  ] Headers are bold and formatted
- [  ] Success toast appears

---

### Test 5: Import - Valid File (Replace Mode)

**Steps:**
1. Click "Import" button
2. Upload `test-import-valid.xlsx`
3. Keep mode as "Replace"
4. Wait for parsing
5. Review preview
6. Click "Confirm Import"
7. Wait for completion

**Expected Results:**
- [  ] File uploads successfully
- [  ] Parsing completes without errors
- [  ] Preview shows all rows
- [  ] All rows marked as valid (green checkmarks)
- [  ] Current quantities shown correctly
- [  ] New quantities calculated correctly
- [  ] Changes calculated correctly
- [  ] Summary shows: X total, X valid, 0 errors
- [  ] Import executes successfully
- [  ] Success message shows count
- [  ] Inventory table refreshes
- [  ] Quantities updated to new values

---

### Test 6: Import - Valid File (Add Mode)

**Steps:**
1. Note current quantities for test products
2. Click "Import" button
3. Upload same file
4. Select "Add" mode
5. Review preview
6. Click "Confirm Import"

**Expected Results:**
- [  ] Mode selector works
- [  ] Preview updates when mode changes
- [  ] New quantities = current + imported
- [  ] Changes show positive values
- [  ] Import executes successfully
- [  ] Quantities increased by imported amounts

---

### Test 7: Import - File with Errors

**Steps:**
1. Click "Import" button
2. Upload `test-import-errors.xlsx`
3. Review validation errors

**Expected Results:**
- [  ] Parsing completes
- [  ] Validation errors displayed
- [  ] Errors grouped by type
- [  ] Error rows highlighted in red
- [  ] Error messages are clear
- [  ] "Confirm Import" button is disabled
- [  ] "Download Error Report" button appears
- [  ] Error report downloads as CSV

---

### Test 8: Import - Drag and Drop

**Steps:**
1. Click "Import" button
2. Drag a file from file explorer
3. Drop it on the upload area

**Expected Results:**
- [  ] Drag-and-drop works
- [  ] File uploads automatically
- [  ] Parsing starts immediately

---

### Test 9: Import - File Validation

**Steps:**
1. Try uploading a .txt file
2. Try uploading a 10MB file
3. Try uploading a file with 1500 rows

**Expected Results:**
- [  ] .txt file rejected with error message
- [  ] Large file rejected: "File too large (max 5MB)"
- [  ] Too many rows rejected: "More than 1000 rows"

---

### Test 10: Import - Dry Run Mode

**Steps:**
1. Click "Import" button
2. Upload valid file
3. Check "Dry Run" checkbox
4. Click "Run Dry Run"
5. Check inventory after completion

**Expected Results:**
- [  ] Dry run banner shows: "DRY RUN MODE"
- [  ] Preview shows normally
- [  ] Import completes quickly
- [  ] Success message: "Dry run complete. X rows would be imported."
- [  ] Inventory NOT updated (quantities unchanged)
- [  ] No stock movements created

---

### Test 11: Import - Partial Import Mode

**Steps:**
1. Click "Import" button
2. Upload file with some errors
3. Check "Partial Import" checkbox
4. Click "Confirm Import"

**Expected Results:**
- [  ] Partial import checkbox works
- [  ] "Confirm Import" button enabled even with errors
- [  ] Import executes
- [  ] Valid rows imported
- [  ] Error rows skipped
- [  ] Success message: "X imported, Y skipped"

---

### Test 12: Import - Product Matching

**Test SKU Matching:**
1. Create file with correct SKUs
2. Import and verify matches

**Test Name Matching:**
1. Create file without SKUs, only names
2. Import and verify matches

**Test Ambiguous Matching:**
1. Create file with duplicate product names
2. Verify error: "Multiple products match"

**Expected Results:**
- [  ] SKU matching works (case-insensitive)
- [  ] Name matching works as fallback
- [  ] Ambiguous matches flagged as errors
- [  ] Preview shows match strategy used

---

### Test 13: Import - Threshold Updates

**Steps:**
1. Create file with threshold column
2. Import file
3. Verify thresholds updated

**Expected Results:**
- [  ] Threshold column parsed correctly
- [  ] Preview shows threshold changes
- [  ] Thresholds updated after import
- [  ] Stock movements created for threshold changes

---

### Test 14: Import - Audit Trail

**Steps:**
1. Import a file
2. Click on a product's "History" button
3. View stock history drawer

**Expected Results:**
- [  ] Stock movement created with type "Import"
- [  ] Note includes filename
- [  ] Note includes mode (replace/add)
- [  ] User ID recorded correctly
- [  ] Timestamp accurate
- [  ] Import icon shows (green upload icon)

---

### Test 15: Import - Category Mismatch Warning

**Steps:**
1. Create file with wrong category names
2. Import file
3. Check for warnings

**Expected Results:**
- [  ] Category mismatch shows as warning (not error)
- [  ] Warning message clear
- [  ] Import still allowed
- [  ] Products matched correctly despite mismatch

---

### Test 16: Import - Empty Cells

**Steps:**
1. Create file with some empty quantity cells
2. Create file with some empty threshold cells
3. Import files

**Expected Results:**
- [  ] Empty quantity cells: no quantity update
- [  ] Empty threshold cells: no threshold update
- [  ] At least one of quantity/threshold required
- [  ] Error if both empty

---

### Test 17: Mobile Responsiveness

**Steps:**
1. Open inventory page on mobile device (or use browser dev tools)
2. Test category filter
3. Test export buttons
4. Test import modal

**Expected Results:**
- [  ] Category filter works on mobile
- [  ] Export buttons accessible
- [  ] Import modal full-screen on mobile
- [  ] File upload works on mobile
- [  ] Preview table scrollable
- [  ] All buttons accessible

---

### Test 18: Error Handling

**Test Network Errors:**
1. Disconnect internet
2. Try to import
3. Verify error message

**Test Invalid Data:**
1. Import file with special characters
2. Import file with formulas
3. Verify handling

**Expected Results:**
- [  ] Network errors handled gracefully
- [  ] Error messages user-friendly
- [  ] No console errors
- [  ] App doesn't crash

---

### Test 19: Performance

**Test Large Import:**
1. Create file with 500 rows
2. Import file
3. Measure time

**Test Large Export:**
1. Filter to show 500+ items
2. Export to Excel
3. Measure time

**Expected Results:**
- [  ] 500-row import completes in < 10 seconds
- [  ] 500-item export completes in < 5 seconds
- [  ] No UI freezing
- [  ] Progress indicators show

---

### Test 20: Concurrent Operations

**Steps:**
1. Start an import
2. While importing, try to adjust inventory manually
3. Verify behavior

**Expected Results:**
- [  ] Import completes successfully
- [  ] Manual adjustment works after import
- [  ] No data corruption
- [  ] Realtime updates work correctly

---

## 🐛 Bug Reporting Template

If you find a bug, report it with this format:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Console Errors:**
[Any errors in browser console]
```

---

## ✅ Sign-Off Checklist

After completing all tests:

- [  ] All test cases passed
- [  ] No critical bugs found
- [  ] Mobile experience acceptable
- [  ] Performance acceptable
- [  ] Error handling works
- [  ] Audit trail complete
- [  ] User experience smooth
- [  ] Ready for production

---

## 📊 Test Results Summary

**Date Tested:** _______________  
**Tester Name:** _______________  
**Total Tests:** 20  
**Passed:** _____ / 20  
**Failed:** _____ / 20  
**Bugs Found:** _____  

**Overall Assessment:**
- [  ] Ready for Production
- [  ] Needs Minor Fixes
- [  ] Needs Major Fixes

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Deploy to production
   - Monitor for issues
   - Gather user feedback

2. **If bugs found:**
   - Document all bugs
   - Prioritize fixes
   - Re-test after fixes

3. **User Acceptance Testing:**
   - Get 3-5 real users to test
   - Collect feedback
   - Make improvements

---

**Happy Testing! 🧪**

