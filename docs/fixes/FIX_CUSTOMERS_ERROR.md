# Fix: Failed to Fetch Customers Error

## Problem
The frontend is trying to fetch customers but getting a 500 error because the `customers` table doesn't exist in the database yet.

## Root Cause
The customer credit management migration hasn't been run in Supabase yet.

## Solution

### Step 1: Run the Migration in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `database/migrations/create_customer_credit_management_schema.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY table_name;
```

You should see all 4 tables listed.

### Step 3: Verify RLS Policies

Run this query to check RLS policies:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY tablename, policyname;
```

You should see policies for SELECT, INSERT, UPDATE, DELETE on each table.

### Step 4: Test in Frontend

1. Refresh your browser
2. Navigate to the Reports page
3. Click on the "Credit Reports" tab
4. The customer dropdown should now load without errors

## Alternative: Quick Fix SQL

If you just want to test quickly, run this minimal SQL:

```sql
-- Create customers table only
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_number TEXT,
  address TEXT,
  business_name TEXT,
  credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample customer for testing
INSERT INTO customers (name, contact_number, credit_limit, payment_terms_days, created_by)
VALUES ('Test Customer', '09171234567', 10000.00, 30, auth.uid());
```

## Expected Result

After running the migration:
- ✅ No more "Failed to fetch customers" errors
- ✅ Customer dropdown loads successfully
- ✅ Credit Reports tab works
- ✅ Customer management features are available

## Next Steps

After fixing this error, you should also run these related migrations:

1. `database/migrations/add_credit_limit_tracking_columns.sql` - Adds tracking columns
2. `database/migrations/verify_and_update_credit_rls_policies.sql` - Updates RLS policies
3. `database/migrations/add_credit_payment_method_to_sales.sql` - Links sales to credit

## Troubleshooting

### Still Getting Errors?

**Check Authentication:**
```sql
-- Verify you're authenticated
SELECT auth.uid();
```

If this returns NULL, you're not logged in. Log in to the frontend first.

**Check RLS is Enabled:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'customers';
```

Should show `rowsecurity = true`.

**Check Policies Exist:**
```sql
-- List all policies on customers table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers';
```

Should show 4 policies (SELECT, INSERT, UPDATE, DELETE).

### Error: "relation customers does not exist"

This means the table wasn't created. Run the full migration SQL again.

### Error: "permission denied for table customers"

This means RLS is blocking access. Check:
1. You're logged in (auth.uid() returns a value)
2. RLS policies exist
3. Policies allow authenticated users

## Prevention

To avoid this in the future:

1. **Always run migrations before using features**
2. **Check migration status** in Supabase dashboard
3. **Test in development** before deploying
4. **Document required migrations** in feature docs

## Related Files

- Migration: `database/migrations/create_customer_credit_management_schema.sql`
- Frontend Hook: `frontend/hooks/useCustomers.ts`
- Queries: `frontend/lib/supabase-queries.ts`
- Component: `frontend/app/(dashboard)/customers/[id]/page.tsx`

---

**Status:** Ready to fix  
**Priority:** HIGH (blocking feature)  
**Time to Fix:** 5 minutes
