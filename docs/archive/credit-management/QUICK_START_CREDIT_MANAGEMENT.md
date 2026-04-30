# Quick Start: Customer Credit Management

## 🚀 Apply the Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration
1. Open `database/migrations/create_customer_credit_management_schema.sql`
2. Copy the entire file contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success
The migration will output verification queries at the end. You should see:
- ✅ 4 tables created (customers, credit_sales, payments, credit_limit_overrides)
- ✅ 4 views created (customer_balances, overdue_accounts, customers_near_limit, credit_sales_with_details)
- ✅ 4 functions created
- ✅ 4 triggers created
- ✅ 16 RLS policies created

## 📝 Quick Test

Run this in SQL Editor to test the schema:

```sql
-- 1. Create a test customer
INSERT INTO customers (name, contact_number, credit_limit, payment_terms_days, created_by)
VALUES ('Test Customer', '09171234567', 10000.00, 30, auth.uid())
RETURNING *;

-- 2. Create a credit sale
INSERT INTO credit_sales (customer_id, amount, due_date, created_by)
SELECT id, 5000.00, CURRENT_DATE + INTERVAL '30 days', auth.uid()
FROM customers
WHERE name = 'Test Customer'
LIMIT 1
RETURNING *;

-- 3. Check customer balance (should be 5000.00)
SELECT name, current_balance, credit_limit, (credit_limit - current_balance) AS available_credit
FROM customers
WHERE name = 'Test Customer';

-- 4. Record a payment
INSERT INTO payments (customer_id, amount, payment_method, created_by)
SELECT id, 2000.00, 'cash', auth.uid()
FROM customers
WHERE name = 'Test Customer'
LIMIT 1
RETURNING *;

-- 5. Check balance again (should be 3000.00)
SELECT name, current_balance, credit_limit, (credit_limit - current_balance) AS available_credit
FROM customers
WHERE name = 'Test Customer';

-- 6. Check views
SELECT * FROM customer_balances WHERE name = 'Test Customer';
SELECT * FROM credit_sales_with_details WHERE customer_name = 'Test Customer';

-- 7. Clean up test data
DELETE FROM customers WHERE name = 'Test Customer';
```

## 🎯 Key Features

### Automatic Balance Updates
Customer balance updates automatically when:
- ✅ Credit sale is created
- ✅ Payment is recorded
- ✅ Credit sale is deleted
- ✅ Payment is deleted

### Automatic Status Updates
Credit sale status updates automatically:
- `pending` → No payments yet
- `partially_paid` → Some payment received
- `paid` → Fully paid
- `overdue` → Past due date (run daily cron)

### Useful Views
```sql
-- All customer balances
SELECT * FROM customer_balances;

-- Overdue accounts only
SELECT * FROM overdue_accounts;

-- Customers near credit limit (≥80%)
SELECT * FROM customers_near_limit;

-- Credit sales with details
SELECT * FROM credit_sales_with_details;
```

## 🔧 Daily Maintenance

Set up a daily cron job to check for overdue sales:

```sql
SELECT check_overdue_credit_sales();
```

**Supabase Edge Function (recommended):**
Create a scheduled function that runs daily at midnight.

## 📊 Common Queries

### Total Credit Outstanding
```sql
SELECT SUM(current_balance) AS total_outstanding
FROM customers
WHERE is_active = true;
```

### Overdue Balance
```sql
SELECT SUM(amount_due) AS total_overdue
FROM overdue_accounts;
```

### Customers Near Limit Count
```sql
SELECT COUNT(*) AS customers_near_limit
FROM customers_near_limit;
```

### Customer Statement
```sql
-- Get all transactions for a customer
SELECT 
  'Credit Sale' AS type,
  cs.created_at AS date,
  cs.amount,
  cs.status,
  cs.notes
FROM credit_sales cs
WHERE cs.customer_id = 'customer-uuid-here'

UNION ALL

SELECT 
  'Payment' AS type,
  p.payment_date AS date,
  -p.amount AS amount,
  p.payment_method AS status,
  p.notes
FROM payments p
WHERE p.customer_id = 'customer-uuid-here'

ORDER BY date DESC;
```

## 🔐 Security

All tables have RLS enabled:
- ✅ Only authenticated users can access
- ✅ Users can only create records with their own user ID
- ✅ Multi-tenant ready (can be restricted by organization)

## 📚 Documentation

- **Full Migration Guide:** `CREDIT_MANAGEMENT_MIGRATION_README.md`
- **Schema Reference:** `database/SCHEMA_REFERENCE.md`
- **Requirements:** `.kiro/specs/customer-credit-management/requirements.md`
- **Design:** `.kiro/specs/customer-credit-management/design.md`

## ❓ Troubleshooting

### Migration fails with "relation already exists"
The migration uses `IF NOT EXISTS` so it's safe to re-run. If you need to start fresh, use the rollback script at the end of the migration file.

### Balance not updating automatically
Check that triggers are enabled:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customers', 'credit_sales', 'payments');
```

### RLS blocking queries
Make sure you're authenticated:
```sql
SELECT auth.uid(); -- Should return your user ID, not NULL
```

## ✅ Next Steps

After migration is complete:
1. ✅ Verify all tables, views, functions, and triggers
2. ✅ Test with sample data
3. ✅ Set up daily cron for overdue detection
4. ⏭️ Implement backend API endpoints (Task 2-6)
5. ⏭️ Implement frontend UI (Task 8-13)

## 🆘 Need Help?

- Check the full migration README: `CREDIT_MANAGEMENT_MIGRATION_README.md`
- Review Supabase logs for error details
- Verify your Supabase project has auth enabled
- Ensure you're running as an authenticated user
