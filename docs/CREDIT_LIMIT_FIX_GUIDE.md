# Credit Limit Fix Guide

## Issue Summary

When trying to create a credit sale, you're getting this error:

```
Credit limit exceeded. Customer limit: ₱0.0, Current balance: ₱0.0, 
New balance would be: ₱85.0. Set override_credit_limit=true to proceed.
```

**Root Cause:** The customers in your database have `credit_limit = 0`, not `₱5,000` as expected.

## Why This Happened

When customers are created, the `credit_limit` field defaults to `0` unless explicitly set. The customers in your database were likely created without setting the credit limit, or the credit limit was not saved properly.

## How to Fix

### Option 1: Update All Customers to ₱5,000 (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: `uwzidzpwiceijjcmifum`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Copy and paste this SQL:

```sql
-- Update all customers with 0 credit limit to have ₱5,000 credit limit
UPDATE customers
SET 
  credit_limit = 5000.00,
  updated_at = NOW()
WHERE credit_limit = 0;

-- Verify the update
SELECT 
  id,
  name,
  business_name,
  credit_limit,
  current_balance,
  (credit_limit - current_balance) AS available_credit,
  is_active
FROM customers
ORDER BY name;
```

6. Click **"Run"** button
7. Check the results to confirm all customers now have ₱5,000 credit limit

### Option 2: Update Individual Customers

If you want to set different credit limits for different customers:

```sql
-- Update specific customer by name
UPDATE customers
SET credit_limit = 10000.00, updated_at = NOW()
WHERE name = 'Jenilyn Tuplano';

-- Update specific customer by ID
UPDATE customers
SET credit_limit = 15000.00, updated_at = NOW()
WHERE id = '002d0d24-2b13-42f9-ad1c-51d6cb0236c7';
```

### Option 3: Update via Frontend (Future Enhancement)

Currently, the frontend doesn't have a UI to edit customer credit limits after creation. This is a feature that should be added to the Customers page.

## Verify the Fix

After running the SQL update:

1. Go to your Talastock app: https://talastock.vercel.app
2. Navigate to **Customers** page
3. Check that all customers show the correct credit limit
4. Try creating a credit sale again
5. It should now work without the "credit limit exceeded" error

## Current Customer Data

Based on the error logs, you have these customers:

| Customer ID | Name | Current Credit Limit | Should Be |
|-------------|------|---------------------|-----------|
| `002d0d24-2b13-42f9-ad1c-51d6cb0236c7` | Jenilyn Collantes | ₱0 | ₱5,000 |
| `12e51b37-69b9-45ba-92f0-c8d962d6f564` | Jenilyn Tuplano | ₱0 | ₱5,000 |
| (other customer) | MOCHI Tuplano | ₱0 | ₱5,000 |

## Prevention for Future

When creating new customers, always ensure the credit limit is set:

1. In the **Add Customer** form, make sure to fill in the **Credit Limit** field
2. Default value should be ₱5,000 (or whatever your standard credit limit is)
3. The form should validate that credit limit is not left at ₱0

## Technical Details

### Database Schema

The `customers` table has this structure:

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  ...
);
```

The `DEFAULT 0` means if you don't specify a credit limit, it defaults to zero.

### Backend Validation

The backend (`backend/routers/credit_sales.py`) checks credit limits:

```python
# Calculate new balance
current_balance = Decimal(str(customer.get("current_balance", 0)))
new_balance = current_balance + payload.amount
credit_limit = Decimal(str(customer.get("credit_limit", 0)))

# Credit limit enforcement
if new_balance > credit_limit:
    if not payload.override_credit_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Credit limit exceeded. Customer limit: ₱{credit_limit}, ..."
        )
```

This is working correctly - it's just that the credit limits in the database are `0`.

## Quick Fix SQL Script

A ready-to-use SQL script is available at:
```
database/migrations/update_customer_credit_limits.sql
```

Just copy the contents and run it in Supabase SQL Editor.

## Need Help?

If you're still having issues after running the SQL update:

1. Check the Supabase SQL Editor output for any errors
2. Verify the customers table was actually updated
3. Clear your browser cache and reload the app
4. Check the browser console for any errors
5. Check Render logs for backend errors

## Related Files

- `database/migrations/update_customer_credit_limits.sql` - SQL script to fix credit limits
- `database/migrations/create_customer_credit_management_schema.sql` - Original schema
- `backend/routers/credit_sales.py` - Credit sale creation logic
- `backend/routers/customers.py` - Customer management API
- `frontend/components/forms/SaleForm.tsx` - Credit sale form
