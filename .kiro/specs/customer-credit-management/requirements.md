# Customer Credit Management — Requirements

## Overview
Enable Talastock to track customer credit accounts, record credit sales, manage payments, and monitor outstanding balances. This feature is essential for Filipino SMEs that offer "utang" (credit) to trusted customers.

## Business Context
- Many sari-sari stores and trading businesses in Binondo offer credit to regular customers
-店主 (store owners) need to track who owes money and how much
- Payment terms are typically informal (e.g., "bayad next week", "end of month")
- Need to prevent over-extension of credit to risky customers

## Core Requirements

### 1. Customer Management
- Create and manage customer profiles with credit accounts
- Store customer information: name, contact, address, business name (optional)
- Set credit limit per customer (max amount they can owe)
- Set payment terms (e.g., 7 days, 15 days, 30 days, 60 days)
- Mark customers as active/inactive
- Track customer credit history and payment behavior

### 2. Credit Sales Recording
- Record sales on credit (separate from cash sales)
- Link credit sales to specific customers
- Support partial credit (e.g., ₱500 cash + ₱300 credit)
- Automatically update customer balance on credit sale
- Prevent credit sale if it exceeds customer's credit limit
- Record due date based on customer's payment terms

### 3. Payment Recording
- Record customer payments against outstanding balance
- Support partial payments
- Support overpayments (credit balance for future purchases)
- Link payments to specific invoices (optional)
- Record payment method (cash, bank transfer, GCash, etc.)
- Automatically update customer balance on payment

### 4. Balance Tracking
- Real-time customer balance calculation
- Show total outstanding balance per customer
- Show overdue balance (past due date)
- Show available credit (credit limit - current balance)
- Track payment history per customer

### 5. Credit Monitoring & Alerts
- Dashboard widget showing total credit outstanding
- List of customers with overdue balances
- List of customers near credit limit (>80% utilized)
- Alert when attempting credit sale that exceeds limit
- Low-priority alert for customers with good payment history

### 6. Reporting
- Customer credit summary report (all customers, balances, status)
- Individual customer statement (transaction history, payments, balance)
- Aging report (0-7 days, 8-15 days, 16-30 days, 31-60 days, 60+ days)
- Payment collection report (payments received in date range)
- Export reports to PDF

## Data Requirements

### Customer Table
- id (uuid, primary key)
- name (text, required)
- contact_number (text, optional)
- address (text, optional)
- business_name (text, optional)
- credit_limit (numeric, default 0)
- current_balance (numeric, default 0)
- payment_terms_days (integer, default 30)
- is_active (boolean, default true)
- notes (text, optional)
- created_at (timestamptz)
- updated_at (timestamptz)

### Credit Sales Table
- id (uuid, primary key)
- customer_id (uuid, foreign key to customers)
- sale_id (uuid, foreign key to sales, optional)
- amount (numeric, required)
- due_date (date, required)
- status (text: 'pending', 'paid', 'overdue', 'partially_paid')
- notes (text, optional)
- created_by (uuid, foreign key to auth.users)
- created_at (timestamptz)

### Payments Table
- id (uuid, primary key)
- customer_id (uuid, foreign key to customers)
- credit_sale_id (uuid, foreign key to credit_sales, optional)
- amount (numeric, required)
- payment_method (text: 'cash', 'bank_transfer', 'gcash', 'other')
- payment_date (date, required)
- notes (text, optional)
- created_by (uuid, foreign key to auth.users)
- created_at (timestamptz)

## Business Rules

### Credit Limit Enforcement
- Cannot record credit sale if: `customer.current_balance + sale_amount > customer.credit_limit`
- Exception: Allow override with confirmation dialog (for trusted customers)
- Log all credit limit overrides for audit

### Balance Calculation
- `current_balance = sum(credit_sales.amount) - sum(payments.amount)`
- Update customer.current_balance on every credit sale and payment
- Use database trigger for automatic balance updates

### Due Date Calculation
- `due_date = sale_date + customer.payment_terms_days`
- Mark as overdue if `current_date > due_date AND status != 'paid'`

### Payment Application
- Payments reduce customer balance immediately
- If payment linked to specific invoice, mark invoice as paid/partially paid
- If payment not linked, apply to oldest outstanding invoice first (FIFO)

## Security Requirements
- Only authenticated users can access credit management
- RLS policies: users can only see customers they created (multi-tenant ready)
- Audit log for all credit sales and payments
- Cannot delete credit sales or payments (soft delete only)
- Cannot edit payment amount after creation (create reversal instead)

## Performance Requirements
- Customer list must load in <500ms for up to 1,000 customers
- Balance calculation must be real-time (no batch processing)
- Dashboard credit widgets must load in <300ms

## User Experience Requirements
- Clear visual distinction between cash sales and credit sales
- Prominent warning when customer is near/over credit limit
- Easy-to-read customer statement (like a bank statement)
- One-click payment recording from customer detail page
- Mobile-friendly customer list and payment recording

### Navigation Design
- **Collapsible "Credit" group in sidebar** with 3 sub-items:
  - Customers (main customer list and management)
  - Credit Sales (credit sales history)
  - Payments (payment records)
- **Badge indicator** on Credit group showing count of overdue customers
- **Smooth expand/collapse animation** for the Credit group
- **Active state highlighting** for current page within Credit section
- Works on desktop (full sidebar), tablet (collapsed sidebar), and mobile (drawer)

### Dashboard Tab Design
- **Add tab switcher** at top of dashboard page with 2 tabs:
  - "Overview" tab (existing dashboard content)
  - "Credit" tab (credit management dashboard)
- **Credit tab content**:
  - 3 KPI metric cards: Total Credit Outstanding, Overdue Balance, Customers Near Limit
  - Overdue Customers table widget (name, amount, days overdue, quick actions)
  - Credit Sales Trend chart (7d, 30d, 3m, 6m filters)
  - Payment Collection Trend chart
  - Quick action buttons: "Add Customer", "Record Payment"
- Tab state persists on page refresh
- Mobile-friendly tab design with horizontal scroll if needed

## Integration Requirements
- Integrate with existing Sales module (link credit sales to sales table)
- Integrate with Dashboard (add "Credit" tab with dedicated credit dashboard)
- Integrate with Reports module (add credit report tabs)
- Integrate with Sidebar navigation (add collapsible Credit group)
- Use existing Supabase auth for user tracking

### Credit Reports Integration
Credit reports will be added as **new tabs** within the existing Reports page (`/reports`):
- Customer Statement tab
- Aging Report tab  
- Credit Summary tab

This keeps all reporting in one centralized location for better UX.

## Future Enhancements (Out of Scope for V1)
- SMS reminders for overdue payments
- Interest calculation for late payments
- Customer credit score based on payment history
- Bulk payment import from bank statements
- Customer portal for self-service balance checking

## Success Metrics
- Store owners can track all customer credit in one place
- Zero credit sales that exceed limits without explicit override
- Reduction in forgotten/unrecorded credit transactions
- Faster payment collection through better tracking

## Non-Functional Requirements
- Must work offline (sync when online)
- Must support Filipino currency (₱) and number formatting
- Must be accessible on mobile devices
- Must follow Talastock design system (warm peach palette)
