# Pre-Launch Essentials - Requirements

## Overview

This specification covers all critical and high-priority features that must be implemented before launching Talastock to paying customers. These features are essential for a production-ready inventory management system.

## Target Users

- Filipino SME owners and managers
- Retail store operators
- Binondo traders
- Sari-sari store owners
- Restaurant and food business operators

## Business Goals

1. Make Talastock production-ready and sellable
2. Provide essential features that all businesses need
3. Ensure users can recover from common issues (password reset)
4. Enable proper financial tracking (payment methods, discounts)
5. Support business operations (refunds, reports)
6. Prevent data loss (confirmation dialogs)

---

## 🔴 CRITICAL REQUIREMENTS

### 1. Password Reset & Recovery

**Priority:** CRITICAL  
**User Story:** As a user, I want to reset my password if I forget it, so I don't get permanently locked out of my account.

#### Acceptance Criteria

1.1. **Forgot Password Page**
- User can access "Forgot Password" link from login page
- User enters their email address
- System sends password reset email via Supabase Auth
- User sees confirmation message
- Email contains secure reset link with expiration (1 hour)

1.2. **Reset Password Page**
- User clicks reset link from email
- User is redirected to reset password page
- User enters new password (minimum 8 characters)
- User confirms new password (must match)
- System validates password strength
- User sees success message and is redirected to login

1.3. **Error Handling**
- Invalid email: Show "Email not found" message
- Expired link: Show "Link expired, request new one"
- Weak password: Show password requirements
- Passwords don't match: Show validation error

1.4. **Security**
- Reset links expire after 1 hour
- Reset links are single-use only
- Password must meet minimum requirements
- Rate limit: Max 3 reset requests per hour per email

---

### 2. Payment Methods in POS

**Priority:** CRITICAL  
**User Story:** As a cashier, I want to record how customers pay (cash, card, GCash), so I can track payment methods and reconcile cash drawer.

#### Acceptance Criteria

2.1. **Payment Method Selection**
- POS shows payment method selector before completing sale
- Options: Cash, Card, GCash, PayMaya, Bank Transfer
- Default selection: Cash
- User can change payment method before confirming

2.2. **Cash Payment Flow**
- User selects "Cash"
- System shows cash calculator
- User enters amount received from customer
- System calculates and displays change
- Change amount shown prominently
- User confirms to complete sale

2.3. **Non-Cash Payment Flow**
- User selects Card/GCash/PayMaya/Bank Transfer
- System shows total amount
- User confirms payment received
- No change calculation needed
- User completes sale

2.4. **Receipt Display**
- Receipt shows payment method
- For cash: Shows amount received and change given
- For non-cash: Shows payment method only

2.5. **Sales Record**
- Payment method saved to sales table
- Cash received and change saved (for cash payments)
- Sales page shows payment method column
- Can filter sales by payment method

2.6. **Database Schema**
```sql
ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'cash'
  CHECK (payment_method IN ('cash', 'card', 'gcash', 'paymaya', 'bank_transfer'));
ALTER TABLE sales ADD COLUMN cash_received NUMERIC(10,2);
ALTER TABLE sales ADD COLUMN change_given NUMERIC(10,2);
```

---

### 3. Discounts in POS

**Priority:** CRITICAL  
**User Story:** As a cashier, I want to apply discounts to sales (percentage, fixed amount, senior/PWD), so I can give customers the correct discounted price.

#### Acceptance Criteria

3.1. **Discount Input**
- POS cart shows "Add Discount" button
- Clicking opens discount modal
- User selects discount type: Percentage, Fixed Amount, Senior/PWD
- User enters discount value (e.g., 10% or ₱50)
- System validates discount (cannot exceed total)
- Discount applied to cart total

3.2. **Discount Types**
- **Percentage:** User enters % (e.g., 10%), system calculates amount
- **Fixed Amount:** User enters ₱ amount (e.g., ₱50)
- **Senior/PWD:** Auto-applies 20% discount (Philippine law)

3.3. **Discount Display**
- Cart shows original total
- Cart shows discount amount (e.g., -₱100)
- Cart shows final total after discount
- Discount can be edited or removed before completing sale

3.4. **Receipt Display**
- Receipt shows original subtotal
- Receipt shows discount type and amount
- Receipt shows final total
- For Senior/PWD: Shows "Senior Citizen/PWD Discount (20%)"

3.5. **Sales Record**
- Discount type saved to sales table
- Discount value saved (percentage or amount)
- Discount amount saved (calculated amount)
- Sales page shows discount column
- Can filter sales by discount type

3.6. **Validation**
- Discount cannot exceed total amount
- Percentage must be 0-100%
- Fixed amount must be positive
- Senior/PWD discount is exactly 20%

3.7. **Database Schema**
```sql
ALTER TABLE sales ADD COLUMN discount_type TEXT DEFAULT 'none'
  CHECK (discount_type IN ('none', 'percentage', 'fixed', 'senior_pwd'));
ALTER TABLE sales ADD COLUMN discount_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0;
```

---

### 4. Sales Refund & Return

**Priority:** CRITICAL  
**User Story:** As a manager, I want to process refunds and returns, so I can handle customer returns and restore inventory.

#### Acceptance Criteria

4.1. **Refund Button**
- Sales page shows "Refund" button on each sale
- Only completed sales can be refunded
- Already refunded sales show "Refunded" status
- Clicking opens refund modal

4.2. **Refund Modal**
- Shows sale details (items, quantities, prices)
- User can select items to refund (full or partial)
- User can adjust refund quantities (cannot exceed original)
- Shows refund amount calculation
- User enters refund reason (optional)
- User confirms refund

4.3. **Full Refund**
- All items returned
- Full amount refunded
- All inventory restored
- Sale status changed to "refunded"

4.4. **Partial Refund**
- Some items returned
- Partial amount refunded
- Selected items' inventory restored
- Sale status changed to "partially_refunded"
- Original sale record preserved

4.5. **Inventory Restoration**
- Refunded items added back to inventory
- Stock movements created with type='return'
- Inventory quantities updated immediately
- Stock movements show original sale reference

4.6. **Refund Record**
- Refund amount saved to sales table
- Refund reason saved
- Refund date/time recorded
- Refunded by user recorded
- Original sale linked to refund

4.7. **Sales Page Display**
- Refunded sales show status badge
- Refund amount displayed
- Can filter by status (completed, refunded, partially_refunded)
- Refunded sales clearly marked

4.8. **Validation**
- Cannot refund same sale twice (full refund)
- Cannot refund more than original quantity
- Cannot refund negative amounts
- Requires manager/owner permission (future)

4.9. **Database Schema**
```sql
ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'
  CHECK (status IN ('completed', 'refunded', 'partially_refunded'));
ALTER TABLE sales ADD COLUMN refunded_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN refund_reason TEXT;
ALTER TABLE sales ADD COLUMN refunded_at TIMESTAMPTZ;
ALTER TABLE sales ADD COLUMN refunded_by UUID REFERENCES auth.users(id);
```

---

### 5. Basic Reports

**Priority:** CRITICAL  
**User Story:** As a business owner, I want to generate sales, inventory, and profit reports, so I can track business performance and prepare for accounting.

#### Acceptance Criteria

5.1. **Reports Page**
- New "Reports" navigation item in sidebar
- Reports page shows 3 report types: Sales, Inventory, Profit & Loss
- Each report has "Generate" button
- User selects date range (start date, end date)
- User clicks "Generate Report"
- Report displays on screen
- User can export to PDF or Excel

5.2. **Sales Report**
- Shows all sales within date range
- Grouped by day/week/month (user selects)
- Columns: Date, # of Sales, Total Revenue, Avg Order Value
- Shows payment method breakdown (cash, card, GCash, etc.)
- Shows discount breakdown (total discounts given)
- Shows top 10 products by revenue
- Shows top 10 products by quantity
- Summary totals at bottom

5.3. **Inventory Report**
- Shows current inventory status (as of report date)
- Columns: Product, SKU, Category, Quantity, Cost Price, Total Value
- Shows low stock items (highlighted)
- Shows out of stock items (highlighted)
- Shows dead stock items (no sales in 60 days)
- Summary: Total products, Total inventory value, Low stock count
- Can filter by category

5.4. **Profit & Loss Report**
- Shows financial performance for date range
- Revenue: Total sales revenue
- Cost of Goods Sold (COGS): Sum of (quantity sold × cost price)
- Gross Profit: Revenue - COGS
- Gross Margin %: (Gross Profit / Revenue) × 100
- Discounts Given: Total discount amount
- Net Revenue: Revenue - Discounts
- Net Profit: Net Revenue - COGS
- Breakdown by category
- Breakdown by month (if date range > 1 month)

5.5. **Export Functionality**
- Export to PDF: Formatted, printable report
- Export to Excel: Raw data for further analysis
- PDF includes: Business name, report title, date range, generated date
- Excel includes: All data in tabular format

5.6. **Performance**
- Reports generate in <5 seconds for 10,000 sales
- Reports generate in <10 seconds for 100,000 sales
- Show loading indicator while generating
- Cache reports for 5 minutes (same date range)

---

## 🟠 HIGH PRIORITY REQUIREMENTS

### 6. Confirmation Dialogs

**Priority:** HIGH  
**User Story:** As a user, I want to confirm before deleting important data, so I don't accidentally lose information.

#### Acceptance Criteria

6.1. **Delete Product Confirmation**
- User clicks delete button on product
- Modal appears: "Delete Product?"
- Shows product name and SKU
- Warning: "This will also delete inventory and stock movement records"
- User must type "DELETE" to confirm (or click confirm button)
- User can cancel

6.2. **Delete Category Confirmation**
- User clicks delete button on category
- Modal appears: "Delete Category?"
- Shows category name
- Warning: "X products are in this category. They will be uncategorized."
- User must confirm
- User can cancel

6.3. **Delete Sale Confirmation**
- User clicks delete button on sale
- Modal appears: "Delete Sale?"
- Shows sale ID and total amount
- Warning: "This will NOT restore inventory. Use Refund instead."
- User must confirm
- User can cancel

6.4. **Clear Cart Confirmation**
- User clicks "Clear Cart" in POS
- Modal appears: "Clear Cart?"
- Shows number of items
- User confirms or cancels
- No typing required (quick action)

6.5. **Bulk Delete Confirmation**
- User selects multiple items and clicks delete
- Modal appears: "Delete X items?"
- Shows count of items
- User must confirm
- User can cancel

---

### 7. Error Tracking (Sentry)

**Priority:** HIGH  
**User Story:** As a developer, I want to know when errors occur in production, so I can fix bugs quickly and improve the system.

#### Acceptance Criteria

7.1. **Sentry Integration**
- Sentry installed in frontend (Next.js)
- Sentry installed in backend (FastAPI)
- Sentry configured with project DSN
- Errors automatically reported to Sentry
- User context included (user ID, email)
- Breadcrumbs captured (user actions leading to error)

7.2. **Error Reporting**
- All unhandled exceptions reported
- All API errors reported
- All database errors reported
- Frontend errors (React errors, API call failures)
- Backend errors (Python exceptions, database errors)

7.3. **Error Context**
- User ID and email
- Page/route where error occurred
- Browser and OS information
- Timestamp
- Stack trace
- User actions (breadcrumbs)

7.4. **Alerts**
- Email alert for critical errors
- Slack notification for high-priority errors (optional)
- Daily error summary email

7.5. **Privacy**
- No sensitive data in error reports (passwords, tokens)
- PII (Personally Identifiable Information) scrubbed
- Compliant with data privacy laws

---

### 8. Mobile Device Testing

**Priority:** HIGH  
**User Story:** As a mobile user, I want the system to work perfectly on my phone/tablet, so I can manage my business on the go.

#### Acceptance Criteria

8.1. **Device Testing**
- Test on iPhone (Safari)
- Test on Android (Chrome)
- Test on iPad (Safari)
- Test on Android tablet (Chrome)
- Test on different screen sizes (320px to 1024px)

8.2. **Functionality Testing**
- All pages load correctly
- All buttons are tappable (44px minimum)
- All forms work with mobile keyboard
- All modals display correctly
- All tables switch to card view on mobile
- All charts render correctly
- Navigation menu works (hamburger)

8.3. **POS Testing**
- POS works on tablet (768px minimum)
- Product search works with mobile keyboard
- Cart updates work with touch
- Quantity input works with mobile keyboard
- Complete sale works
- Receipt displays correctly
- Print receipt works (mobile browser print)

8.4. **Performance Testing**
- Pages load in <3 seconds on 4G
- No horizontal scrolling
- No layout shifts
- Smooth scrolling
- Touch interactions responsive (<100ms)

8.5. **Barcode Scanner Testing**
- Test with real USB barcode scanner on tablet
- Scanner input detected correctly
- Products added to cart automatically
- No interference with manual input

---

### 9. Admin User Guide

**Priority:** HIGH  
**User Story:** As a new user, I want a comprehensive guide, so I can learn how to use Talastock effectively.

#### Acceptance Criteria

9.1. **Guide Content**
- Getting Started (first login, setup)
- Dashboard Overview (understanding metrics)
- Managing Products (add, edit, delete, import)
- Managing Inventory (stock levels, adjustments, import/export)
- Managing Categories (organize products)
- Recording Sales (manual entry, import)
- Using POS (search, scan, cart, payment, discounts)
- Processing Refunds (full and partial)
- Viewing Reports (sales, inventory, P&L)
- Understanding AI Insights (what they mean, how to use)
- Troubleshooting (common issues and solutions)

9.2. **Format**
- Markdown document
- Screenshots for each major feature
- Step-by-step instructions
- Tips and best practices
- FAQ section

9.3. **Accessibility**
- Available in docs folder
- Linked from dashboard (Help button)
- Searchable
- Printable (PDF version)

---

## Non-Functional Requirements

### Performance
- All pages load in <3 seconds
- Reports generate in <10 seconds
- POS operations complete in <500ms
- No blocking operations on UI thread

### Security
- All features require authentication
- RLS policies enforced on all tables
- Input validation on all forms
- SQL injection prevention
- XSS prevention

### Usability
- Consistent UI across all features
- Clear error messages
- Loading indicators for async operations
- Success/failure feedback (toasts)
- Keyboard shortcuts for power users

### Compatibility
- Works on Chrome, Firefox, Safari, Edge
- Works on Windows, Mac, Linux
- Works on iOS, Android
- Minimum screen width: 320px (mobile), 768px (POS)

### Reliability
- 99.9% uptime
- Automatic error recovery
- Data backup (Supabase automatic)
- No data loss on errors

---

## Success Criteria

1. ✅ All critical features implemented and tested
2. ✅ All high-priority features implemented and tested
3. ✅ No critical bugs in production
4. ✅ Mobile testing complete on real devices
5. ✅ Admin guide complete and accessible
6. ✅ Error tracking active and monitored
7. ✅ System ready for beta testing
8. ✅ System ready for official launch

---

## Out of Scope (Future Versions)

- Multi-location support
- Employee management
- Customer management
- Loyalty programs
- Advanced tax calculations
- Integration with accounting software
- Mobile app (native)
- Multi-tenant architecture

---

**Requirements Version:** 1.0  
**Created:** April 16, 2026  
**Status:** Ready for Design Phase
