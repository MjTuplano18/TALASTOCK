# Customer Credit Management Migration Guide

## Overview
This migration creates the complete database schema for the Customer Credit Management feature, enabling Filipino SMEs to track customer credit accounts ("utang"), record credit sales, manage payments, and monitor outstanding balances.

## Migration File
**File:** `create_customer_credit_management_schema.sql`  
**Date:** 2026-04-16  
**Spec:** Customer Credit Management

## What This Migration Creates

### Tables (4)
1. **customers** - Customer profiles with credit limits and payment terms
2. **credit_sales** - Credit sales transactions linked to customers
3. **payments** - Customer payment records against credit balances
4. **credit_limit_overrides** - Audit log for credit limit override events

### Functions (4)
1. **calculate_customer_balance(customer_id)** - Calculates current balance for a customer
2. **update_customer_balance()** - Trigger function to auto-update customer balance
3. **update_credit_sale_status()** - Trigger function to auto-update credit sale status
4. **check_overdue_credit_sales()** - Updates overdue status (run daily via cron)

### Triggers (4)
1. **trigger_update_balance_on_credit_sale** - Updates balance when credit sale changes
2. **trigger_update_balance_on_payment** - Updates balance when payment changes
3. **trigger_update_credit_sale_status_on_payment** - Updates sale status when payment changes
4. **trigger_customers_updated_at** - Auto-updates customers.updated_at timestamp

### Views (4)
1. **customer_balances** - Complete customer balance information with summaries
2. **overdue_accounts** - List of overdue credit sales with customer info
3. **customers_near_limit** - Customers using ≥80% of credit limit
4. **credit_sales_with_details** - Credit sales with customer and payment details

### Indexes (18)
Performance indexes on all foreign keys, status fields, and date fields for fast queries.

### RLS Policies (16)
Complete Row Level Security policies for multi-tenant security on all tables.

## How to Apply This Migration

### Option 1: Supabase SQL Editor (Recommended)
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `create_customer_credit_management_schema.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute
7. Verify success by checking the verification queries at the end

### Option 2: Supabase CLI
```bash
# From project root
supabase db push database/migrations/create_customer_credit_management_schema.sql
```

### Option 3: psql Command Line
```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i database/migrations/create_customer_credit_management_schema.sql
```

## Verification

After running the migration, verify everything was created successfully:

### Check Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY table_name;
```

**Expected Result:** 4 tables

### Check Views
```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('customer_balances', 'overdue_accounts', 'customers_near_limit', 'credit_sales_with_details')
ORDER BY table_name;
```

**Expected Result:** 4 views

### Check Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_customer_balance', 'update_customer_balance', 'update_credit_sale_status', 'check_overdue_credit_sales')
ORDER BY routine_name;
```

**Expected Result:** 4 functions

### Check Triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customers', 'credit_sales', 'payments')
ORDER BY event_object_table, trigger_name;
```

**Expected Result:** 4 triggers

### Check RLS Policies
```sql
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
GROUP BY tablename
ORDER BY tablename;
```

**Expected Result:**
- customers: 4 policies
- credit_sales: 4 policies
- payments: 4 policies
- credit_limit_overrides: 2 policies

## Testing the Schema

### Test 1: Create a Customer
```sql
INSERT INTO customers (name, contact_number, credit_limit, payment_terms_days, created_by)
VALUES ('Juan Dela Cruz', '09171234567', 10000.00, 30, auth.uid())
RETURNING *;
```

### Test 2: Create a Credit Sale
```sql
INSERT INTO credit_sales (customer_id, amount, due_date, created_by)
SELECT id, 5000.00, CURRENT_DATE + INTERVAL '30 days', auth.uid()
FROM customers
WHERE name = 'Juan Dela Cruz'
LIMIT 1
RETURNING *;
```

### Test 3: Verify Balance Auto-Update
```sql
SELECT name, current_balance, credit_limit, (credit_limit - current_balance) AS available_credit
FROM customers
WHERE name = 'Juan Dela Cruz';
```

**Expected:** current_balance should be 5000.00

### Test 4: Record a Payment
```sql
INSERT INTO payments (customer_id, amount, payment_method, created_by)
SELECT id, 2000.00, 'cash', auth.uid()
FROM customers
WHERE name = 'Juan Dela Cruz'
LIMIT 1
RETURNING *;
```

### Test 5: Verify Balance After Payment
```sql
SELECT name, current_balance, credit_limit, (credit_limit - current_balance) AS available_credit
FROM customers
WHERE name = 'Juan Dela Cruz';
```

**Expected:** current_balance should be 3000.00 (5000 - 2000)

### Test 6: Check Views
```sql
-- Customer balances view
SELECT * FROM customer_balances WHERE name = 'Juan Dela Cruz';

-- Credit sales with details
SELECT * FROM credit_sales_with_details WHERE customer_name = 'Juan Dela Cruz';
```

## Key Features

### Automatic Balance Calculation
- Customer balance is automatically updated when credit sales or payments are created/updated/deleted
- Uses database triggers for real-time accuracy
- Balance = Total Credit Sales - Total Payments

### Credit Limit Enforcement
- Credit limit is enforced at the application level (backend API)
- Overrides are logged in `credit_limit_overrides` table for audit trail
- Customers near limit (≥80%) are tracked in `customers_near_limit` view

### Payment Status Tracking
- Credit sale status automatically updates based on payments:
  - `pending` - No payments yet
  - `partially_paid` - Some payment received
  - `paid` - Fully paid
  - `overdue` - Past due date and not fully paid

### Overdue Detection
- Run `check_overdue_credit_sales()` function daily via cron
- Updates status to `overdue` for sales past due date
- Overdue accounts tracked in `overdue_accounts` view

## Business Rules Implemented

1. **Credit Limit Validation**
   - Enforced at application level before creating credit sale
   - Override capability with audit logging

2. **Balance Calculation**
   - `current_balance = SUM(credit_sales.amount) - SUM(payments.amount)`
   - Updated automatically via triggers

3. **Due Date Calculation**
   - `due_date = sale_date + customer.payment_terms_days`
   - Set when creating credit sale

4. **Payment Application**
   - Payments can be linked to specific invoices (credit_sale_id)
   - Or applied to customer balance generally (credit_sale_id = NULL)

5. **Status Updates**
   - Credit sale status updates automatically based on payments
   - Overdue status set by daily cron job

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Authenticated users can read all records
- Users can only create records with their own user ID
- Multi-tenant ready (can be restricted by organization in future)

### Audit Trail
- All tables track `created_by` user
- Credit limit overrides are logged separately
- Soft delete recommended (mark `is_active = false` instead of DELETE)

### Data Integrity
- Foreign key constraints prevent orphaned records
- CHECK constraints ensure valid data (positive amounts, valid statuses)
- NOT NULL constraints on required fields

## Performance Considerations

### Indexes
- All foreign keys are indexed for fast joins
- Status fields indexed for filtering
- Date fields indexed for date range queries
- Created_at fields indexed for sorting

### Views
- Pre-computed aggregations for common queries
- Use views instead of complex joins in application code
- Views are automatically updated when underlying data changes

### Triggers
- Minimal overhead (only update one customer record)
- Triggers run in same transaction as INSERT/UPDATE/DELETE
- No external API calls or slow operations

## Maintenance

### Daily Cron Job
Set up a daily cron job to check for overdue credit sales:

```sql
-- Run this daily at midnight
SELECT check_overdue_credit_sales();
```

**Supabase Edge Function Example:**
```typescript
// supabase/functions/check-overdue-sales/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { error } = await supabase.rpc('check_overdue_credit_sales')
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

### Monitoring Queries

**Total Credit Outstanding:**
```sql
SELECT SUM(current_balance) AS total_outstanding
FROM customers
WHERE is_active = true;
```

**Overdue Balance:**
```sql
SELECT SUM(amount_due) AS total_overdue
FROM overdue_accounts;
```

**Customers Near Limit:**
```sql
SELECT COUNT(*) AS customers_near_limit
FROM customers_near_limit;
```

## Rollback

If you need to rollback this migration, run the rollback script at the end of the migration file:

```sql
-- Drop views
DROP VIEW IF EXISTS credit_sales_with_details;
DROP VIEW IF EXISTS customers_near_limit;
DROP VIEW IF EXISTS overdue_accounts;
DROP VIEW IF EXISTS customer_balances;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS trigger_update_credit_sale_status_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_update_balance_on_credit_sale ON credit_sales;

-- Drop functions
DROP FUNCTION IF EXISTS check_overdue_credit_sales();
DROP FUNCTION IF EXISTS update_credit_sale_status();
DROP FUNCTION IF EXISTS update_customer_balance();
DROP FUNCTION IF EXISTS calculate_customer_balance(UUID);

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS credit_limit_overrides;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS credit_sales;
DROP TABLE IF EXISTS customers;
```

## Next Steps

After applying this migration:

1. ✅ Verify all tables, views, functions, and triggers were created
2. ✅ Test the schema with sample data
3. ✅ Set up daily cron job for overdue detection
4. ⏭️ Implement backend API endpoints (Task 2-6)
5. ⏭️ Implement frontend UI components (Task 8-13)

## Support

For issues or questions:
- Check verification queries above
- Review the migration file comments
- Consult the Customer Credit Management spec
- Check Supabase logs for error details

## References

- **Spec:** `.kiro/specs/customer-credit-management/requirements.md`
- **Design:** `.kiro/specs/customer-credit-management/design.md`
- **Tasks:** `.kiro/specs/customer-credit-management/tasks.md`
- **Supabase Conventions:** `.kiro/steering/supabase-conventions.md`
- **Security Standards:** `.kiro/steering/security-standards.md`
