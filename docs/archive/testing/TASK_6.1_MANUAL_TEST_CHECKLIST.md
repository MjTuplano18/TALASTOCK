# Task 6.1: Manual Testing Checklist

**Purpose:** Verify all POS features (payment methods, discounts, refunds) work together  
**Estimated Time:** 30-45 minutes  
**Prerequisites:** 
- Development server running (`npm run dev` in frontend folder)
- Supabase database accessible
- At least 3-5 test products in the system

---

## Pre-Test Setup

- [ ] Start development server
- [ ] Login to the application
- [ ] Navigate to Products page and verify you have at least 3 products
- [ ] Note down product names and prices for testing

---

## Test 1: Cash Payment with Percentage Discount

**Objective:** Verify cash payment with change calculation and percentage discount

### Steps:
1. [ ] Navigate to POS page
2. [ ] Add Product 1 to cart (e.g., ₱100)
3. [ ] Add Product 2 to cart (e.g., ₱200)
4. [ ] Verify cart shows subtotal: ₱300
5. [ ] Click "Add Discount" button
6. [ ] Select "Percentage" discount type
7. [ ] Enter 10% discount
8. [ ] Verify preview shows:
   - Original Total: ₱300
   - Discount (10%): -₱30
   - Final Total: ₱270
9. [ ] Click "Apply Discount"
10. [ ] Verify cart shows discount breakdown
11. [ ] Click "Complete Sale"
12. [ ] Verify payment modal opens
13. [ ] Verify "Cash" is selected by default
14. [ ] Verify total amount shows ₱270
15. [ ] Enter ₱300 in "Cash Received"
16. [ ] Verify change shows ₱30 (highlighted in orange)
17. [ ] Click "Complete Sale" in modal
18. [ ] Verify success toast appears
19. [ ] Verify receipt displays:
    - All items with quantities and prices
    - Original subtotal: ₱300
    - Discount (10%): -₱30
    - Final total: ₱270
    - Payment Method: Cash
    - Cash Received: ₱300
    - Change: ₱30
20. [ ] Click "New Sale"
21. [ ] Navigate to Sales page
22. [ ] Verify the sale appears with:
    - Payment Method badge: "Cash"
    - Discount badge: "Percentage" with -₱30
    - Status badge: "Completed"
    - Total: ₱270

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 2: GCash Payment with Senior/PWD Discount

**Objective:** Verify non-cash payment and automatic 20% senior/PWD discount

### Steps:
1. [ ] Navigate to POS page
2. [ ] Add Product 3 to cart (e.g., ₱500)
3. [ ] Click "Add Discount"
4. [ ] Select "Senior/PWD" discount type
5. [ ] Verify discount value is automatically set to 20%
6. [ ] Verify preview shows:
   - Original Total: ₱500
   - Discount (Senior/PWD 20%): -₱100
   - Final Total: ₱400
7. [ ] Click "Apply Discount"
8. [ ] Click "Complete Sale"
9. [ ] In payment modal, select "GCash"
10. [ ] Verify confirmation message shows: "Please confirm that payment of ₱400 has been received via GCash"
11. [ ] Click "Complete Sale"
12. [ ] Verify receipt shows:
    - Discount: "Senior Citizen/PWD Discount (20%)"
    - Payment Method: GCash
    - No cash received/change fields
13. [ ] Navigate to Sales page
14. [ ] Verify sale shows:
    - Payment Method: "GCash" badge
    - Discount: "Senior/PWD" badge with -₱100

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 3: Card Payment with Fixed Discount

**Objective:** Verify card payment and fixed amount discount

### Steps:
1. [ ] Navigate to POS page
2. [ ] Add multiple products totaling ₱1000
3. [ ] Click "Add Discount"
4. [ ] Select "Fixed Amount" discount type
5. [ ] Enter ₱150
6. [ ] Verify preview shows:
   - Original Total: ₱1000
   - Discount (₱150): -₱150
   - Final Total: ₱850
7. [ ] Click "Apply Discount"
8. [ ] Click "Complete Sale"
9. [ ] Select "Card" payment method
10. [ ] Click "Complete Sale"
11. [ ] Verify receipt shows:
    - Discount: ₱150
    - Payment Method: Card
12. [ ] Navigate to Sales page
13. [ ] Verify sale shows correct payment method and discount

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 4: Discount Validation

**Objective:** Verify discount validation rules

### Steps:
1. [ ] Navigate to POS page
2. [ ] Add product with price ₱100
3. [ ] Click "Add Discount"
4. [ ] Select "Percentage"
5. [ ] Try to enter 150% - verify error: "Percentage cannot exceed 100%"
6. [ ] Enter 100% - verify it works (total becomes ₱0)
7. [ ] Click "Apply Discount"
8. [ ] Click "Edit Discount"
9. [ ] Select "Fixed Amount"
10. [ ] Try to enter ₱200 - verify error: "Discount cannot exceed total amount"
11. [ ] Enter ₱50 - verify it works

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 5: Cash Payment Validation

**Objective:** Verify cash payment validation

### Steps:
1. [ ] Navigate to POS page
2. [ ] Add product with price ₱100
3. [ ] Click "Complete Sale"
4. [ ] Select "Cash"
5. [ ] Enter ₱50 in "Cash Received"
6. [ ] Verify error message: "Cash received must be greater than or equal to total amount"
7. [ ] Verify "Complete Sale" button is disabled
8. [ ] Enter ₱100 (exact amount)
9. [ ] Verify change shows ₱0
10. [ ] Verify "Exact amount received" notice appears
11. [ ] Verify "Complete Sale" button is enabled
12. [ ] Enter ₱150
13. [ ] Verify change shows ₱50
14. [ ] Click "Complete Sale"
15. [ ] Verify sale completes successfully

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 6: Full Refund

**Objective:** Verify full refund processing with inventory restoration

### Steps:
1. [ ] Complete a sale with 2 products (note the quantities)
2. [ ] Navigate to Inventory page
3. [ ] Note the current inventory quantities for those products
4. [ ] Navigate to Sales page
5. [ ] Find the sale you just created
6. [ ] Click the Refund button (↻ icon)
7. [ ] Verify refund modal opens showing all items
8. [ ] Verify all items are checked by default
9. [ ] Verify refund quantities match original quantities
10. [ ] Enter refund reason: "Customer changed mind"
11. [ ] Verify total refund amount is correct
12. [ ] Click "Process Refund"
13. [ ] Verify success toast appears
14. [ ] Verify sale status changes to "Refunded"
15. [ ] Verify refund amount is displayed
16. [ ] Verify refund button is now disabled
17. [ ] Navigate to Inventory page
18. [ ] Verify inventory quantities increased by refunded amounts
19. [ ] Navigate to Inventory page and click on one of the products
20. [ ] Verify stock movement shows "return" type with refund note

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 7: Partial Refund

**Objective:** Verify partial refund processing

### Steps:
1. [ ] Complete a sale with 3 products:
   - Product A: qty 2
   - Product B: qty 1
   - Product C: qty 1
2. [ ] Note inventory quantities before refund
3. [ ] Navigate to Sales page
4. [ ] Click Refund button on the sale
5. [ ] Uncheck Product A (don't refund)
6. [ ] Keep Product B checked with qty 1
7. [ ] Keep Product C checked with qty 1
8. [ ] Enter refund reason: "Partial return"
9. [ ] Verify refund amount = (Product B price) + (Product C price)
10. [ ] Click "Process Refund"
11. [ ] Verify success toast
12. [ ] Verify sale status changes to "Partially Refunded"
13. [ ] Verify refund amount is displayed
14. [ ] Verify refund button is still enabled (can refund more)
15. [ ] Navigate to Inventory page
16. [ ] Verify Product B and C quantities increased
17. [ ] Verify Product A quantity unchanged
18. [ ] Go back to Sales page
19. [ ] Click Refund button again on the same sale
20. [ ] Verify you can refund Product A now
21. [ ] Refund Product A with qty 2
22. [ ] Verify sale status changes to "Refunded"
23. [ ] Verify refund button is now disabled

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 8: Refund with Discount

**Objective:** Verify refund amount calculation with discounted sale

### Steps:
1. [ ] Complete a sale with 2 products totaling ₱300
2. [ ] Apply 10% discount (final total: ₱270)
3. [ ] Complete sale with any payment method
4. [ ] Navigate to Sales page
5. [ ] Click Refund button
6. [ ] Select all items for full refund
7. [ ] Verify refund amount is ₱270 (discounted amount, not ₱300)
8. [ ] Process refund
9. [ ] Verify refunded amount is ₱270

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 9: Multiple Payment Methods

**Objective:** Verify all payment methods work

### Steps:
1. [ ] Complete Sale 1 with Cash payment
2. [ ] Complete Sale 2 with Card payment
3. [ ] Complete Sale 3 with GCash payment
4. [ ] Complete Sale 4 with PayMaya payment
5. [ ] Complete Sale 5 with Bank Transfer payment
6. [ ] Navigate to Sales page
7. [ ] Verify all sales show correct payment method badges
8. [ ] Use payment method filter to filter by "Cash"
9. [ ] Verify only cash sales are shown
10. [ ] Test other payment method filters
11. [ ] Verify refund works for all payment methods

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 10: Sales Page Filters

**Objective:** Verify all filters work correctly

### Steps:
1. [ ] Complete several sales with different:
   - Payment methods
   - Discount types
   - Statuses (some refunded, some not)
2. [ ] Navigate to Sales page
3. [ ] Test search by product name
4. [ ] Test amount range filter
5. [ ] Test date range filter
6. [ ] Test payment method filter
7. [ ] Test discount type filter
8. [ ] Test status filter
9. [ ] Test combining multiple filters
10. [ ] Click "Clear filters" and verify all filters reset

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 11: Receipt Display

**Objective:** Verify receipt shows all information correctly

### Steps:
1. [ ] Complete a sale with:
   - Multiple items
   - Discount applied
   - Cash payment with change
2. [ ] Verify receipt shows:
   - [ ] All items with names, SKUs, quantities, prices
   - [ ] Original subtotal
   - [ ] Discount line with type and amount
   - [ ] Final total
   - [ ] Payment method
   - [ ] Cash received (for cash)
   - [ ] Change given (for cash)
   - [ ] Date and time
3. [ ] Click "Print Receipt" (if implemented)
4. [ ] Click "New Sale"
5. [ ] Verify cart is cleared and ready for new sale

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Test 12: Edge Cases

**Objective:** Test edge cases and error handling

### Steps:
1. [ ] Try to complete sale with empty cart - verify error
2. [ ] Try to apply discount > 100% - verify error
3. [ ] Try to apply fixed discount > total - verify error
4. [ ] Try to refund already refunded sale - verify button disabled
5. [ ] Try to refund with quantity > original - verify validation
6. [ ] Try to complete cash sale with insufficient cash - verify error
7. [ ] Add item to cart, then delete the product from Products page, try to complete sale - verify error handling
8. [ ] Test with very large numbers (e.g., ₱999,999.99)
9. [ ] Test with very small numbers (e.g., ₱0.01)
10. [ ] Test with decimal quantities (if supported)

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Database Verification

**Objective:** Verify data is saved correctly in database

### Steps:
1. [ ] Open Supabase dashboard
2. [ ] Navigate to Table Editor > sales
3. [ ] Find a recent sale
4. [ ] Verify columns contain correct data:
   - [ ] `total_amount`
   - [ ] `payment_method`
   - [ ] `cash_received` (for cash sales)
   - [ ] `change_given` (for cash sales)
   - [ ] `discount_type`
   - [ ] `discount_value`
   - [ ] `discount_amount`
   - [ ] `status`
   - [ ] `refunded_amount` (for refunded sales)
   - [ ] `refund_reason` (for refunded sales)
   - [ ] `refunded_at` (for refunded sales)
   - [ ] `refunded_by` (for refunded sales)
4. [ ] Navigate to sale_items table
5. [ ] Verify sale items are linked correctly
6. [ ] Navigate to stock_movements table
7. [ ] Verify stock movements exist for:
   - [ ] Sales (type='sale', negative quantity)
   - [ ] Refunds (type='return', positive quantity)
8. [ ] Navigate to inventory table
9. [ ] Verify quantities are correct after sales and refunds

**Result:** ☐ PASS ☐ FAIL  
**Notes:**

---

## Summary

**Total Tests:** 12  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ___%

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

**Tested By:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production  
**Overall Status:** ☐ PASS ☐ FAIL ☐ NEEDS REVIEW

---

## Next Steps

If all tests pass:
- [ ] Mark Task 6.1 as complete
- [ ] Proceed to Task 7.1 (Reports Page)
- [ ] Consider deploying to staging for further testing

If tests fail:
- [ ] Document all issues in detail
- [ ] Create bug tickets for each issue
- [ ] Fix issues and re-test
- [ ] Do not proceed to next task until all critical issues are resolved
