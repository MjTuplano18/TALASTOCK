# 🚨 QUICK FIX: Credit Limits Are Set to ₱0

## The Problem

Your customers have `credit_limit = 0` in the database, so credit sales are being rejected.

## The Solution (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select project: `uwzidzpwiceijjcmifum`
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New query"**

### Step 2: Run This SQL

Copy and paste this entire block, then click **"Run"**:

```sql
-- Update all customers to have ₱5,000 credit limit
UPDATE customers
SET 
  credit_limit = 5000.00,
  updated_at = NOW()
WHERE credit_limit = 0;

-- Show the results
SELECT 
  name,
  business_name,
  credit_limit,
  current_balance,
  (credit_limit - current_balance) AS available_credit
FROM customers
ORDER BY name;
```

### Step 3: Verify

You should see output like:

| name | business_name | credit_limit | current_balance | available_credit |
|------|---------------|--------------|-----------------|------------------|
| Jenilyn Collantes | null | 5000.00 | 0.00 | 5000.00 |
| Jenilyn Tuplano | null | 5000.00 | 0.00 | 5000.00 |
| MOCHI Tuplano | null | 5000.00 | 0.00 | 5000.00 |

### Step 4: Test Credit Sale

1. Go to: https://talastock.vercel.app/sales
2. Click **"Record Sale"**
3. Select **"Credit Sale"** as payment type
4. Select a customer
5. Add items and submit
6. ✅ Should work now!

## Why This Happened

When customers were created, the credit limit field defaulted to `0` instead of `5000`. This is now fixed in the database.

## Need Different Credit Limits?

To set a specific customer to a different amount:

```sql
-- Example: Set Jenilyn Tuplano to ₱10,000
UPDATE customers
SET credit_limit = 10000.00, updated_at = NOW()
WHERE name = 'Jenilyn Tuplano';
```

## Still Not Working?

1. Clear browser cache and reload
2. Check Render logs: https://dashboard.render.com
3. Check browser console for errors (F12)
4. Read full guide: `docs/CREDIT_LIMIT_FIX_GUIDE.md`

---

**That's it!** Your credit sales should work now. 🎉
