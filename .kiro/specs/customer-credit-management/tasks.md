# Implementation Plan: Customer Credit Management

## Overview

Implement a complete customer credit management system for Talastock that enables Filipino SMEs to track "utang" (credit accounts), record credit sales, manage payments, and monitor outstanding balances. This feature integrates with the existing sales module and adds new database tables, API endpoints, and UI components.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create customers table with credit limit and payment terms
  - Create credit_sales table to track credit transactions
  - Create payments table to record customer payments
  - Add database triggers for automatic balance updates
  - Create database functions for balance calculation
  - Create useful views (customer_balances, overdue_accounts)
  - Set up RLS policies for multi-tenant security
  - _Requirements: Data Requirements section, Security Requirements_

- [x] 2. Implement backend API - Customer Management
  - [x] 2.1 Create Pydantic schemas for customers
    - CustomerCreate, CustomerUpdate, CustomerResponse schemas
    - Add validation for credit_limit, payment_terms_days
    - _Requirements: 1. Customer Management, Data Requirements_
  
  - [x] 2.2 Create customers router with CRUD endpoints
    - POST /api/v1/customers - Create customer
    - GET /api/v1/customers - List customers with pagination
    - GET /api/v1/customers/{id} - Get customer details
    - PUT /api/v1/customers/{id} - Update customer
    - DELETE /api/v1/customers/{id} - Soft delete (mark inactive)
    - Add filtering by is_active, search by name
    - _Requirements: 1. Customer Management_
  
  - [ ]* 2.3 Write unit tests for customer endpoints
    - Test customer creation with valid/invalid data
    - Test credit limit validation
    - Test pagination and filtering
    - _Requirements: 1. Customer Management_

- [x] 3. Implement backend API - Credit Sales
  - [x] 3.1 Create Pydantic schemas for credit sales
    - CreditSaleCreate, CreditSaleResponse schemas
    - Add validation for amount, due_date calculation
    - _Requirements: 2. Credit Sales Recording, Data Requirements_
  
  - [x] 3.2 Create credit-sales router with endpoints
    - POST /api/v1/credit-sales - Record credit sale
    - GET /api/v1/credit-sales - List credit sales with filters
    - GET /api/v1/credit-sales/{id} - Get credit sale details
    - GET /api/v1/customers/{id}/credit-sales - Get customer's credit sales
    - Implement credit limit enforcement logic
    - Implement automatic balance update on credit sale
    - Calculate due_date based on payment_terms_days
    - _Requirements: 2. Credit Sales Recording, Business Rules_
  
  - [x] 3.3 Implement credit limit override with audit logging
    - Add override flag to CreditSaleCreate schema
    - Log all credit limit overrides to audit table
    - Return warning when customer near credit limit (>80%)
    - _Requirements: 2. Credit Sales Recording, Business Rules_
  
  - [ ]* 3.4 Write unit tests for credit sales endpoints
    - Test credit sale creation within limit
    - Test credit limit enforcement (should fail)
    - Test credit limit override with flag
    - Test due date calculation
    - Test balance update after credit sale
    - _Requirements: 2. Credit Sales Recording, Business Rules_

- [x] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement backend API - Payments
  - [x] 5.1 Create Pydantic schemas for payments
    - PaymentCreate, PaymentResponse schemas
    - Add validation for amount, payment_method
    - _Requirements: 3. Payment Recording, Data Requirements_
  
  - [x] 5.2 Create payments router with endpoints
    - POST /api/v1/payments - Record payment
    - GET /api/v1/payments - List payments with filters
    - GET /api/v1/customers/{id}/payments - Get customer's payments
    - Implement automatic balance update on payment
    - Implement payment application logic (FIFO if not linked to invoice)
    - Support partial payments and overpayments
    - _Requirements: 3. Payment Recording, Business Rules_
  
  - [ ]* 5.3 Write unit tests for payment endpoints
    - Test payment recording and balance update
    - Test partial payment handling
    - Test overpayment handling
    - Test payment application to oldest invoice (FIFO)
    - _Requirements: 3. Payment Recording, Business Rules_

- [x] 6. Implement backend API - Balance Tracking & Reports
  - [x] 6.1 Create balance tracking endpoints
    - GET /api/v1/customers/{id}/balance - Get current balance
    - GET /api/v1/customers/{id}/statement - Get customer statement
    - GET /api/v1/customers/overdue - List customers with overdue balances
    - GET /api/v1/customers/near-limit - List customers near credit limit
    - _Requirements: 4. Balance Tracking, 5. Credit Monitoring & Alerts_
  
  - [x] 6.2 Create credit reports endpoints
    - GET /api/v1/reports/credit-summary - All customers credit summary
    - GET /api/v1/reports/aging - Aging report (0-7, 8-15, 16-30, 31-60, 60+ days)
    - GET /api/v1/reports/payment-collection - Payments in date range
    - _Requirements: 6. Reporting_
  
  - [ ]* 6.3 Write unit tests for balance and reports endpoints
    - Test balance calculation accuracy
    - Test overdue detection logic
    - Test aging report buckets
    - _Requirements: 4. Balance Tracking, 6. Reporting_

- [ ] 7. Checkpoint - Ensure all backend endpoints work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement frontend - Customer Management UI
  - [x] 8.1 Create customer list page
    - Create /app/(dashboard)/customers/page.tsx
    - Display customers table with name, contact, balance, credit limit
    - Add search by name functionality
    - Add filter by active/inactive status
    - Show available credit (credit_limit - current_balance)
    - Add "Add Customer" button
    - Use TanStack Table for data table
    - _Requirements: 1. Customer Management, UX Requirements_
  
  - [x] 8.2 Create customer form modal
    - Create AddCustomerModal component
    - Form fields: name, contact_number, address, business_name, credit_limit, payment_terms_days, notes
    - Use React Hook Form + Zod validation
    - Integrate with POST /api/v1/customers endpoint
    - Show success/error toast notifications
    - _Requirements: 1. Customer Management_
  
  - [x] 8.3 Create customer detail page
    - Create /app/(dashboard)/customers/[id]/page.tsx
    - Display customer information card
    - Show current balance, available credit, overdue amount
    - Display credit sales history table
    - Display payment history table
    - Add "Record Payment" button
    - Add "Edit Customer" button
    - _Requirements: 1. Customer Management, 4. Balance Tracking_

- [x] 9. Implement frontend - Credit Sales UI
  - [x] 9.1 Modify sales recording to support credit sales
    - Update existing sales form to add "Payment Type" selector (Cash / Credit)
    - If Credit selected, show customer dropdown
    - Show customer's available credit and warning if near limit
    - Show credit limit exceeded error with override option
    - Calculate and display due date based on customer's payment terms
    - Integrate with POST /api/v1/credit-sales endpoint
    - _Requirements: 2. Credit Sales Recording, Business Rules_
  
  - [x] 9.2 Create credit sales list page
    - Create /app/(dashboard)/credit-sales/page.tsx
    - Display credit sales table with customer, amount, due_date, status
    - Add filters by status (pending, paid, overdue, partially_paid)
    - Add date range filter
    - Show overdue sales in red
    - _Requirements: 2. Credit Sales Recording_

- [x] 10. Implement frontend - Payment Recording UI
  - [x] 10.1 Create payment recording modal
    - Create RecordPaymentModal component
    - Form fields: amount, payment_method, payment_date, notes
    - Show customer's current balance
    - Show outstanding invoices (optional linking)
    - Validate payment amount > 0
    - Integrate with POST /api/v1/payments endpoint
    - _Requirements: 3. Payment Recording_
  
  - [x] 10.2 Create payments list page
    - Create /app/(dashboard)/payments/page.tsx
    - Display payments table with customer, amount, payment_method, date
    - Add date range filter
    - Add filter by payment_method
    - _Requirements: 3. Payment Recording_

- [x] 11. Implement frontend - Dashboard Credit Tab
  - [x] 11.1 Add tab switcher to dashboard page
    - Update /app/(dashboard)/dashboard/page.tsx to support tabs
    - Add tab state management (Overview / Credit)
    - Persist tab selection in URL query param or localStorage
    - Style tabs with Talastock design system
    - Mobile-friendly tab design
    - _Requirements: UX Requirements - Dashboard Tab Design_
  
  - [x] 11.2 Create Credit dashboard tab content
    - Create CreditDashboardTab component
    - Add 3 KPI metric cards: Total Credit Outstanding, Overdue Balance, Customers Near Limit
    - Fetch data from balance tracking endpoints
    - Add date range filter (7d, 30d, 3m, 6m)
    - Add quick action buttons: "Add Customer", "Record Payment"
    - _Requirements: 5. Credit Monitoring & Alerts, UX Requirements_
  
  - [x] 11.3 Create credit dashboard charts
    - Create CreditSalesTrendChart component (line chart)
    - Create PaymentCollectionChart component (bar chart)
    - Use shadcn/ui Charts with Talastock colors
    - Add loading skeletons for charts
    - _Requirements: 5. Credit Monitoring & Alerts_
  
  - [x] 11.4 Create overdue customers table widget
    - Create OverdueCustomersTable component
    - Display customer name, overdue amount, days overdue
    - Add quick action buttons: "View Details", "Record Payment"
    - Link to customer detail page
    - Show empty state if no overdue customers
    - _Requirements: 5. Credit Monitoring & Alerts_

- [x] 12. Implement frontend - Credit Reports (as tabs in Reports page)
  - [x] 12.1 Update Reports page to support tabs
    - Update /app/(dashboard)/reports/page.tsx to add tab navigation
    - Add tabs: Sales Reports, Credit Reports
    - Credit Reports sub-tabs: Customer Statement, Aging Report, Credit Summary
    - Style tabs with Talastock design system
    - _Requirements: 6. Reporting, Integration Requirements_
  
  - [x] 12.2 Create customer statement report tab
    - Create CustomerStatementReport component
    - Customer selector dropdown
    - Date range selector
    - Display statement table (credit sales, payments, running balance)
    - Add "Export PDF" button
    - Use jsPDF for PDF generation
    - _Requirements: 6. Reporting_
  
  - [x] 12.3 Create aging report tab
    - Create AgingReport component
    - Display aging buckets table (0-7, 8-15, 16-30, 31-60, 60+ days)
    - Show customer count and total amount per bucket
    - Add "Export PDF" button
    - _Requirements: 6. Reporting_
  
  - [x] 12.4 Create credit summary report tab
    - Create CreditSummaryReport component
    - Display all customers with balances, credit limits, status
    - Add filters by status, overdue
    - Add "Export PDF" button
    - _Requirements: 6. Reporting_

- [x] 13. Implement collapsible Credit navigation group
  - [x] 13.1 Update Sidebar component with collapsible group support
    - Modify /components/layout/Sidebar.tsx to support nested navigation
    - Add collapsible group functionality with expand/collapse animation
    - Add "Credit" group with CreditCard icon
    - Add badge indicator showing overdue customer count
    - Ensure works on desktop (full), tablet (collapsed), mobile (drawer)
    - _Requirements: UX Requirements - Navigation Design_
  
  - [x] 13.2 Add Credit sub-navigation items
    - Add "Customers" nav item (Users icon) → /customers
    - Add "Credit Sales" nav item (FileText icon) → /credit-sales
    - Add "Payments" nav item (Wallet icon) → /payments
    - Highlight active sub-item when on respective page
    - Indent sub-items visually for hierarchy
    - _Requirements: UX Requirements - Navigation Design_
  
  - [x] 13.3 Integrate with existing sales module
    - Update sales recording flow to support credit sales
    - Link credit sales to sales table (sale_id foreign key)
    - Ensure stock movements are created for credit sales
    - _Requirements: 2. Credit Sales Recording, Integration Requirements_

- [x] 14. Implement security and performance
  - [x] 14.1 Verify RLS policies are working
    - Test that users can only see their own customers
    - Test that users can only see their own credit sales and payments
    - Test authentication on all endpoints
    - _Requirements: Security Requirements_
  
  - [x] 14.2 Add rate limiting to credit endpoints
    - Apply rate limiting middleware to all credit endpoints
    - Max 20 requests per minute for credit sales
    - Max 30 requests per minute for customer queries
    - _Requirements: Performance Requirements_
  
  - [ ]* 14.3 Write integration tests for credit flow
    - Test complete flow: create customer → record credit sale → record payment
    - Test balance calculation accuracy
    - Test credit limit enforcement
    - Test overdue detection
    - _Requirements: All Business Rules_

- [ ] 15. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete credit management workflow manually
  - Verify dashboard widgets display correctly
  - Verify reports generate correctly
  - Verify PDF exports work

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- All database changes must include RLS policies for security
- All API endpoints must follow Talastock API standards (see api-standards.md)
- All UI components must follow Talastock design system (see ui-components.md)
- Use existing patterns from products/inventory/sales modules as reference
- Filipino currency formatting (₱) must be used throughout
- Mobile responsiveness is required for all UI components
