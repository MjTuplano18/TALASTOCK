# Implementation Plan: Pre-Launch Essentials

## Overview

This implementation plan covers all critical and high-priority features required before launching Talastock to paying customers. The plan focuses on production-ready features including password reset, payment methods, discounts, refunds, reports, confirmation dialogs, error tracking, mobile testing, and user documentation.

**Tech Stack:**
- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL + Auth)
- Libraries: React Hook Form, Zod, jsPDF, xlsx, Sonner (toasts)

**Database Changes Required:**
- Add payment method, cash handling, and discount columns to `sales` table
- Add refund tracking columns to `sales` table

---

## Tasks

### 1. Database Schema Updates

- [x] 1.1 Create database migration for sales table enhancements
  - Add payment_method column (TEXT, CHECK constraint for valid values)
  - Add cash_received column (NUMERIC(10,2))
  - Add change_given column (NUMERIC(10,2))
  - Add discount_type column (TEXT, CHECK constraint)
  - Add discount_value column (NUMERIC(10,2))
  - Add discount_amount column (NUMERIC(10,2))
  - Add status column (TEXT, CHECK constraint for completed/refunded/partially_refunded)
  - Add refunded_amount column (NUMERIC(10,2))
  - Add refund_reason column (TEXT)
  - Add refunded_at column (TIMESTAMPTZ)
  - Add refunded_by column (UUID, references auth.users)
  - Create file: `database/migrations/add_pre_launch_fields_to_sales.sql`
  - _Requirements: 2.6, 3.7, 4.9_

- [ ]* 1.2 Test database migration locally
  - Run migration on local Supabase instance
  - Verify all columns created correctly
  - Verify CHECK constraints work
  - Test rollback if needed
  - _Requirements: 2.6, 3.7, 4.9_

- [x] 1.3 Apply database migration to production
  - Run migration in Supabase SQL editor
  - Verify migration success
  - Update TypeScript types to match new schema
  - _Requirements: 2.6, 3.7, 4.9_

### 2. Password Reset & Recovery (CRITICAL)

- [x] 2.1 Create Forgot Password page
  - Create route: `frontend/app/(auth)/forgot-password/page.tsx`
  - Implement form with email input field
  - Add form validation using React Hook Form + Zod
  - Call Supabase Auth `resetPasswordForEmail()` method
  - Show success message after email sent
  - Show error message for invalid email
  - Add "Back to Login" link
  - Style with Talastock design system
  - _Requirements: 1.1_

- [x] 2.2 Create Reset Password page
  - Create route: `frontend/app/(auth)/reset-password/page.tsx`
  - Extract reset token from URL query params
  - Implement form with new password and confirm password fields
  - Add password strength validation (min 8 chars)
  - Add password match validation
  - Call Supabase Auth `updateUser()` method
  - Show success message and redirect to login
  - Handle expired/invalid token errors
  - Style with Talastock design system
  - _Requirements: 1.2, 1.3_

- [x] 2.3 Add "Forgot Password" link to login page
  - Update `frontend/app/(auth)/login/page.tsx`
  - Add link below login form
  - Link to `/forgot-password` route
  - _Requirements: 1.1_

- [ ]* 2.4 Test password reset flow end-to-end
  - Test forgot password with valid email
  - Test forgot password with invalid email
  - Test reset password with valid token
  - Test reset password with expired token
  - Test password validation rules
  - Test successful password reset and login
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### 3. Payment Methods in POS (CRITICAL)

- [x] 3.1 Create payment method types and schemas
  - Create TypeScript types for payment methods
  - Add PaymentMethod type: 'cash' | 'card' | 'gcash' | 'paymaya' | 'bank_transfer'
  - Update Sale type to include payment fields
  - Create Zod schemas for payment validation
  - File: `frontend/types/index.ts`
  - _Requirements: 2.1, 2.5_

- [x] 3.2 Create PaymentMethodSelector component
  - Create `frontend/components/pos/PaymentMethodSelector.tsx`
  - Display 5 payment method buttons (Cash, Card, GCash, PayMaya, Bank Transfer)
  - Highlight selected payment method
  - Default selection: Cash
  - Use Talastock button styles
  - _Requirements: 2.1_

- [x] 3.3 Create CashCalculator component
  - Create `frontend/components/pos/CashCalculator.tsx`
  - Show total amount due
  - Input field for cash received
  - Calculate and display change amount
  - Highlight change amount prominently
  - Validate cash received >= total amount
  - Use Talastock design system
  - _Requirements: 2.2_

- [x] 3.4 Integrate payment flow into POS page
  - Update `frontend/app/(dashboard)/pos/page.tsx`
  - Add payment method state
  - Show PaymentMethodSelector before completing sale
  - Show CashCalculator when Cash is selected
  - Show simple confirmation for non-cash payments
  - Pass payment data to completePOSSale function
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.5 Update POS API to save payment data
  - Update `frontend/lib/pos-api.ts` completePOSSale function
  - Save payment_method to sales table
  - Save cash_received and change_given for cash payments
  - Update Supabase insert query
  - _Requirements: 2.5_

- [x] 3.6 Update receipt to show payment information
  - Update `frontend/components/pos/ReceiptView.tsx`
  - Display payment method on receipt
  - For cash: Show "Cash Received" and "Change" lines
  - For non-cash: Show payment method only
  - Style with Talastock colors
  - _Requirements: 2.4_

- [x] 3.7 Update Sales page to display payment method
  - Update `frontend/app/(dashboard)/sales/page.tsx`
  - Add payment_method column to sales table
  - Add filter dropdown for payment method
  - Show payment method badge with appropriate styling
  - _Requirements: 2.5_

- [x] 3.8 Test payment methods end-to-end
  - Test cash payment with exact amount
  - Test cash payment with change calculation
  - Test card payment
  - Test GCash payment
  - Test PayMaya payment
  - Test bank transfer payment
  - Verify payment data saved correctly
  - Verify receipt displays correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### 4. Discounts in POS (CRITICAL)

- [x] 4.1 Create discount types and schemas
  - Create TypeScript types for discounts
  - Add DiscountType: 'none' | 'percentage' | 'fixed' | 'senior_pwd'
  - Update Sale type to include discount fields
  - Create Zod schemas for discount validation
  - File: `frontend/types/index.ts`
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Create DiscountModal component
  - Create `frontend/components/pos/DiscountModal.tsx`
  - Use shadcn Dialog component
  - Show discount type selector (Percentage, Fixed Amount, Senior/PWD)
  - Input field for discount value (percentage or amount)
  - Calculate and preview discount amount
  - Validate discount doesn't exceed total
  - Show error messages for invalid discounts
  - Confirm and apply discount buttons
  - _Requirements: 3.1, 3.2, 3.6_

- [x] 4.3 Integrate discount into POS cart
  - Update `frontend/components/pos/POSCart.tsx`
  - Add "Add Discount" button above cart total
  - Show discount breakdown (original total, discount, final total)
  - Allow editing/removing discount before sale completion
  - Update cart total calculation to include discount
  - _Requirements: 3.1, 3.3_

- [x] 4.4 Update POS page to handle discount state
  - Update `frontend/app/(dashboard)/pos/page.tsx`
  - Add discount state (type, value, amount)
  - Pass discount to completePOSSale function
  - Clear discount when starting new sale
  - _Requirements: 3.1, 3.3_

- [x] 4.5 Update POS API to save discount data
  - Update `frontend/lib/pos-api.ts` completePOSSale function
  - Save discount_type, discount_value, discount_amount to sales table
  - Adjust total_amount to reflect discount
  - Update Supabase insert query
  - _Requirements: 3.5_

- [x] 4.6 Update receipt to show discount information
  - Update `frontend/components/pos/ReceiptView.tsx`
  - Show original subtotal
  - Show discount line with type and amount
  - Show final total after discount
  - For Senior/PWD: Show "Senior Citizen/PWD Discount (20%)"
  - _Requirements: 3.4_

- [x] 4.7 Update Sales page to display discount information
  - Update `frontend/app/(dashboard)/sales/page.tsx`
  - Add discount column to sales table
  - Show discount type and amount
  - Add filter for discount type
  - _Requirements: 3.5_

- [ ]* 4.8 Test discount functionality end-to-end
  - Test percentage discount (10%, 50%, 100%)
  - Test fixed amount discount
  - Test Senior/PWD discount (auto 20%)
  - Test discount validation (cannot exceed total)
  - Test discount with payment methods
  - Verify discount data saved correctly
  - Verify receipt displays correctly
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

### 5. Sales Refund & Return (CRITICAL)

- [x] 5.1 Create refund types and schemas
  - Create TypeScript types for refunds
  - Add SaleStatus: 'completed' | 'refunded' | 'partially_refunded'
  - Create RefundRequest interface
  - Create Zod schemas for refund validation
  - File: `frontend/types/index.ts`
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 5.2 Create RefundModal component
  - Create `frontend/components/sales/RefundModal.tsx`
  - Use shadcn Dialog component
  - Display sale details (items, quantities, prices)
  - Show checkboxes for each item to refund
  - Input fields for refund quantities (max = original quantity)
  - Calculate and show refund amount
  - Input field for refund reason (optional)
  - Validate refund quantities
  - Confirm refund button
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 5.3 Create refund API function
  - Create `frontend/lib/refund-api.ts`
  - Implement processSaleRefund function
  - Update sale status in sales table
  - Update refunded_amount, refund_reason, refunded_at, refunded_by
  - Restore inventory quantities for refunded items
  - Create stock_movements records with type='return'
  - Handle full vs partial refunds
  - Use Supabase transactions for data consistency
  - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 5.4 Add refund button to Sales page
  - Update `frontend/app/(dashboard)/sales/page.tsx`
  - Add "Refund" button to each sale row
  - Only show for completed sales
  - Show "Refunded" badge for refunded sales
  - Disable refund button for already refunded sales
  - Open RefundModal on click
  - _Requirements: 4.1, 4.7_

- [x] 5.5 Update Sales page to show refund status
  - Update `frontend/app/(dashboard)/sales/page.tsx`
  - Add status column with badges
  - Show refund amount if applicable
  - Add status filter (All, Completed, Refunded, Partially Refunded)
  - Style refunded sales differently
  - _Requirements: 4.7_

- [x] 5.6 Update Inventory page to reflect refund stock movements
  - Verify stock movements table shows return type
  - Verify inventory quantities update correctly
  - Add filter for return movements
  - _Requirements: 4.5_

- [ ]* 5.7 Test refund functionality end-to-end
  - Test full refund (all items)
  - Test partial refund (some items)
  - Test refund quantity validation
  - Test inventory restoration
  - Test stock movements creation
  - Test refund with discounted sale
  - Test refund with different payment methods
  - Verify cannot refund same sale twice
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

### 6. Checkpoint - Core POS Features Complete

- [x] 6.1 Verify all POS features work together
  - Test complete sale flow with payment method, discount, and refund
  - Ensure all tests pass
  - Ask user if questions arise

### 7. Basic Reports (CRITICAL)

- [x] 7.1 Create Reports page structure
  - Create route: `frontend/app/(dashboard)/reports/page.tsx`
  - Create layout with 3 report cards: Sales, Inventory, Profit & Loss
  - Add date range picker component (start date, end date)
  - Add "Generate Report" button for each report type
  - Add export buttons (PDF, Excel) for each report
  - Style with Talastock design system
  - _Requirements: 5.1_

- [x] 7.2 Create report types and interfaces
  - Create TypeScript interfaces for report data
  - SalesReportData, InventoryReportData, ProfitLossReportData
  - File: `frontend/types/index.ts`
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 7.3 Create Sales Report component
  - Create `frontend/components/reports/SalesReport.tsx`
  - Fetch sales data for date range from Supabase
  - Group by day/week/month (user selects)
  - Calculate: # of sales, total revenue, avg order value
  - Show payment method breakdown
  - Show discount breakdown
  - Show top 10 products by revenue
  - Show top 10 products by quantity
  - Display summary totals
  - Use Talastock table styling
  - _Requirements: 5.2_

- [x] 7.4 Create Inventory Report component
  - Create `frontend/components/reports/InventoryReport.tsx`
  - Fetch current inventory data from Supabase
  - Show: Product, SKU, Category, Quantity, Cost Price, Total Value
  - Highlight low stock items (red background)
  - Highlight out of stock items (darker red)
  - Identify dead stock (no sales in 60 days)
  - Calculate summary: Total products, Total inventory value, Low stock count
  - Add category filter
  - Use Talastock table styling
  - _Requirements: 5.3_

- [x] 7.5 Create Profit & Loss Report component
  - Create `frontend/components/reports/ProfitLossReport.tsx`
  - Fetch sales and product data for date range
  - Calculate Revenue (total sales)
  - Calculate COGS (sum of quantity sold × cost price)
  - Calculate Gross Profit (Revenue - COGS)
  - Calculate Gross Margin % ((Gross Profit / Revenue) × 100)
  - Calculate Discounts Given (total discount amount)
  - Calculate Net Revenue (Revenue - Discounts)
  - Calculate Net Profit (Net Revenue - COGS)
  - Show breakdown by category
  - Show breakdown by month (if date range > 1 month)
  - Display as formatted table
  - _Requirements: 5.4_

- [ ] 7.6 Implement PDF export functionality
  - Install jsPDF and jspdf-autotable (already in package.json)
  - Create `frontend/lib/pdf-export.ts`
  - Implement exportSalesReportPDF function
  - Implement exportInventoryReportPDF function
  - Implement exportProfitLossReportPDF function
  - Include: Business name, report title, date range, generated date
  - Format tables with proper styling
  - _Requirements: 5.5_

- [x] 7.7 Implement Excel export functionality
  - Use xlsx library (already in package.json)
  - Create `frontend/lib/excel-export.ts`
  - Implement exportSalesReportExcel function
  - Implement exportInventoryReportExcel function
  - Implement exportProfitLossReportExcel function
  - Export raw data in tabular format
  - Include headers and formatting
  - _Requirements: 5.5_

- [ ] 7.8 Add loading states and error handling
  - Show loading spinner while generating reports
  - Show error toast if report generation fails
  - Add empty state for no data
  - Implement report caching (5 minutes for same date range)
  - _Requirements: 5.6_

- [ ] 7.9 Test reports functionality end-to-end
  - Test Sales Report with various date ranges
  - Test Inventory Report with filters
  - Test Profit & Loss Report calculations
  - Test PDF export for all report types
  - Test Excel export for all report types
  - Verify report accuracy with manual calculations
  - Test performance with large datasets
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

### 8. Confirmation Dialogs (HIGH PRIORITY)

- [ ] 8.1 Create reusable ConfirmDialog component
  - Create `frontend/components/ui/ConfirmDialog.tsx`
  - Use shadcn Dialog component
  - Props: title, message, confirmText, onConfirm, onCancel, variant (danger/warning)
  - Show warning icon for dangerous actions
  - Style confirm button as danger for delete actions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.2 Add delete product confirmation
  - Update `frontend/app/(dashboard)/products/page.tsx`
  - Show ConfirmDialog before deleting product
  - Message: "Delete Product? This will also delete inventory and stock movement records."
  - Show product name and SKU
  - Require confirmation
  - _Requirements: 6.1_

- [ ] 8.3 Add delete category confirmation
  - Update `frontend/app/(dashboard)/categories/page.tsx`
  - Show ConfirmDialog before deleting category
  - Message: "Delete Category? X products are in this category. They will be uncategorized."
  - Show category name and product count
  - Require confirmation
  - _Requirements: 6.2_

- [ ] 8.4 Add delete sale confirmation
  - Update `frontend/app/(dashboard)/sales/page.tsx`
  - Show ConfirmDialog before deleting sale
  - Message: "Delete Sale? This will NOT restore inventory. Use Refund instead."
  - Show sale ID and total amount
  - Require confirmation
  - _Requirements: 6.3_

- [ ] 8.5 Add clear cart confirmation
  - Update `frontend/components/pos/POSCart.tsx`
  - Show ConfirmDialog before clearing cart
  - Message: "Clear Cart? This will remove all X items."
  - Simple confirmation (no typing required)
  - _Requirements: 6.4_

- [ ]* 8.6 Test confirmation dialogs
  - Test all confirmation dialogs appear correctly
  - Test cancel action (no deletion)
  - Test confirm action (deletion proceeds)
  - Verify appropriate warnings shown
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

### 9. Error Tracking with Sentry (HIGH PRIORITY)

- [ ] 9.1 Install and configure Sentry for Next.js
  - Install @sentry/nextjs package
  - Run Sentry setup wizard: `npx @sentry/wizard@latest -i nextjs`
  - Configure Sentry DSN in environment variables
  - Create `sentry.client.config.ts`
  - Create `sentry.server.config.ts`
  - Create `sentry.edge.config.ts`
  - _Requirements: 7.1_

- [ ] 9.2 Configure Sentry error reporting
  - Set up user context (user ID, email)
  - Configure breadcrumbs for user actions
  - Set environment (development, staging, production)
  - Configure sample rate for performance monitoring
  - Add beforeSend hook to scrub sensitive data (passwords, tokens)
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 9.3 Add Sentry to FastAPI backend (if needed)
  - Install sentry-sdk[fastapi] package
  - Configure Sentry in `backend/main.py`
  - Set up error reporting for API endpoints
  - Configure user context
  - Scrub sensitive data from error reports
  - _Requirements: 7.1, 7.2_

- [ ] 9.4 Configure Sentry alerts
  - Set up email alerts for critical errors
  - Configure alert rules in Sentry dashboard
  - Set up daily error summary email
  - Optional: Configure Slack notifications
  - _Requirements: 7.4_

- [ ] 9.5 Test Sentry error reporting
  - Trigger test error in frontend
  - Trigger test error in backend
  - Verify errors appear in Sentry dashboard
  - Verify user context included
  - Verify breadcrumbs captured
  - Verify sensitive data scrubbed
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

### 10. Mobile Device Testing (HIGH PRIORITY)

- [ ] 10.1 Create mobile testing checklist document
  - Create `docs/MOBILE_TESTING_CHECKLIST.md`
  - List all pages to test
  - List all functionality to test
  - List all devices to test
  - Include pass/fail criteria
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10.2 Test on iPhone (Safari)
  - Test all pages load correctly
  - Test all buttons are tappable (44px minimum)
  - Test all forms work with mobile keyboard
  - Test all modals display correctly
  - Test navigation menu (hamburger)
  - Test POS on tablet size (768px minimum)
  - Test barcode scanner with USB scanner
  - Document any issues found
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 10.3 Test on Android (Chrome)
  - Test all pages load correctly
  - Test all buttons are tappable
  - Test all forms work with mobile keyboard
  - Test all modals display correctly
  - Test navigation menu
  - Test POS on tablet size
  - Test barcode scanner with USB scanner
  - Document any issues found
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 10.4 Test on iPad (Safari)
  - Test all pages load correctly
  - Test POS functionality (primary use case)
  - Test product search with touch
  - Test cart interactions
  - Test receipt printing
  - Test barcode scanner integration
  - Document any issues found
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 10.5 Test on Android tablet (Chrome)
  - Test all pages load correctly
  - Test POS functionality
  - Test product search with touch
  - Test cart interactions
  - Test receipt printing
  - Test barcode scanner integration
  - Document any issues found
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 10.6 Test responsive behavior at different screen sizes
  - Test at 320px (small mobile)
  - Test at 375px (iPhone)
  - Test at 768px (tablet)
  - Test at 1024px (large tablet)
  - Verify no horizontal scrolling
  - Verify tables switch to card view on mobile
  - Verify charts render correctly
  - _Requirements: 8.1, 8.4_

- [ ] 10.7 Test performance on mobile devices
  - Test page load times on 4G connection
  - Verify pages load in <3 seconds
  - Test touch interaction responsiveness (<100ms)
  - Verify smooth scrolling
  - Verify no layout shifts
  - _Requirements: 8.4_

- [ ] 10.8 Fix any mobile issues found
  - Address all critical issues found during testing
  - Fix button sizes if needed
  - Fix layout issues
  - Fix keyboard issues
  - Retest after fixes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

### 11. Admin User Guide (HIGH PRIORITY)

- [ ] 11.1 Create comprehensive user guide document
  - Create `docs/USER_GUIDE.md`
  - Use clear markdown formatting
  - Include table of contents
  - _Requirements: 9.1, 9.2_

- [ ] 11.2 Write Getting Started section
  - First login instructions
  - Initial setup steps
  - Dashboard overview
  - Navigation guide
  - _Requirements: 9.1_

- [ ] 11.3 Write Products & Inventory section
  - How to add products
  - How to edit products
  - How to delete products
  - How to import products
  - How to manage inventory
  - How to adjust stock levels
  - How to import/export inventory
  - _Requirements: 9.1_

- [ ] 11.4 Write Categories section
  - How to create categories
  - How to organize products
  - How to edit/delete categories
  - _Requirements: 9.1_

- [ ] 11.5 Write Sales & POS section
  - How to record manual sales
  - How to import sales
  - How to use POS
  - How to search/scan products
  - How to apply discounts
  - How to select payment methods
  - How to complete sales
  - How to process refunds
  - _Requirements: 9.1_

- [ ] 11.6 Write Reports section
  - How to generate Sales Report
  - How to generate Inventory Report
  - How to generate Profit & Loss Report
  - How to export to PDF
  - How to export to Excel
  - How to interpret report data
  - _Requirements: 9.1_

- [ ] 11.7 Write AI Insights section
  - What AI insights mean
  - How to use insights
  - How to interpret recommendations
  - _Requirements: 9.1_

- [ ] 11.8 Write Troubleshooting section
  - Common issues and solutions
  - Password reset instructions
  - Offline mode handling
  - Error messages explained
  - _Requirements: 9.1_

- [ ] 11.9 Add screenshots to user guide
  - Take screenshots of all major features
  - Annotate screenshots with arrows/labels
  - Embed in markdown document
  - _Requirements: 9.2_

- [ ] 11.10 Create FAQ section
  - Common questions and answers
  - Tips and best practices
  - _Requirements: 9.2_

- [ ] 11.11 Add Help button to dashboard
  - Update `frontend/app/(dashboard)/layout.tsx`
  - Add Help button in header/sidebar
  - Link to user guide document
  - _Requirements: 9.3_

- [ ] 11.12 Create printable PDF version of user guide
  - Convert markdown to PDF
  - Format for printing
  - Store in docs folder
  - _Requirements: 9.3_

### 12. Final Testing & Quality Assurance

- [ ] 12.1 Run full regression testing
  - Test all features work together
  - Test all user flows end-to-end
  - Test error handling
  - Test edge cases
  - Document any issues found

- [ ] 12.2 Performance testing
  - Test with 10,000 sales records
  - Test with 1,000 products
  - Verify page load times <3 seconds
  - Verify report generation <10 seconds
  - Verify POS operations <500ms

- [ ] 12.3 Security audit
  - Verify RLS policies enabled on all tables
  - Verify authentication required on all routes
  - Verify input validation on all forms
  - Verify no sensitive data in error messages
  - Verify Sentry scrubs sensitive data

- [ ] 12.4 Accessibility check
  - Verify keyboard navigation works
  - Verify screen reader compatibility
  - Verify color contrast meets WCAG AA
  - Verify form labels present
  - Verify error messages accessible

- [ ] 12.5 Browser compatibility testing
  - Test on Chrome (Windows, Mac)
  - Test on Firefox (Windows, Mac)
  - Test on Safari (Mac)
  - Test on Edge (Windows)
  - Document any browser-specific issues

- [ ] 12.6 Final checkpoint - Production readiness
  - All critical features implemented
  - All high-priority features implemented
  - No critical bugs
  - Mobile testing complete
  - User guide complete
  - Error tracking active
  - Ensure all tests pass, ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Database migration must be completed first before implementing features
- Sentry should be configured early to catch errors during development
- Mobile testing should be done on real devices, not just browser DevTools
- User guide should be written as features are implemented for accuracy
- All features must work together seamlessly before launch

---

## Success Criteria

✅ All critical features (1-5) implemented and tested  
✅ All high-priority features (6-9) implemented and tested  
✅ Database schema updated and migrated  
✅ Mobile testing complete on real devices  
✅ User guide complete with screenshots  
✅ Error tracking active and monitored  
✅ No critical bugs in production  
✅ System ready for beta testing and official launch

