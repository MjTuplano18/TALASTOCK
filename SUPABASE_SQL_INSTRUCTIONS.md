# 📋 Supabase SQL Editor - Step-by-Step Instructions

## What You Need to Do

Update your customers' credit limits from ₱0 to ₱5,000 in the database.

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Log in with your Supabase account
3. You should see your projects list

### Step 2: Select Your Project

1. Click on your project: **`uwzidzpwiceijjcmifum`**
2. This will open your project dashboard

### Step 3: Open SQL Editor

1. Look at the left sidebar
2. Find and click on **"SQL Editor"** (it has a `</>` icon)
3. This opens the SQL query interface

### Step 4: Create New Query

1. Click the **"New query"** button (top right)
2. This opens a blank SQL editor

### Step 5: Paste the SQL Code

Copy this entire block and paste it into the SQL editor:

```sql
-- Update all customers to have ₱5,000 credit limit
UPDATE customers
SET 
  credit_limit = 5000.00,
  updated_at = NOW()
WHERE credit_limit = 0;

-- Show the updated customers
SELECT 
  name,
  business_name,
  credit_limit,
  current_balance,
  (credit_limit - current_balance) AS available_credit,
  is_active
FROM customers
ORDER BY name;
```

### Step 6: Run the Query

1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the query to execute (should take 1-2 seconds)

### Step 7: Check the Results

You should see a table showing your customers with updated credit limits:

```
┌─────────────────────┬───────────────┬──────────────┬─────────────────┬──────────────────┬───────────┐
│ name                │ business_name │ credit_limit │ current_balance │ available_credit │ is_active │
├─────────────────────┼───────────────┼──────────────┼─────────────────┼──────────────────┼───────────┤
│ Jenilyn Collantes   │ null          │ 5000.00      │ 0.00            │ 5000.00          │ true      │
│ Jenilyn Tuplano     │ null          │ 5000.00      │ 0.00            │ 5000.00          │ true      │
│ MOCHI Tuplano       │ null          │ 5000.00      │ 0.00            │ 5000.00          │ true      │
└─────────────────────┴───────────────┴──────────────┴─────────────────┴──────────────────┴───────────┘
```

**✅ If you see `credit_limit = 5000.00` for all customers, the fix worked!**

### Step 8: Test Credit Sales

1. Go to your app: **https://talastock.vercel.app**
2. Navigate to **Sales** page
3. Click **"Record Sale"**
4. Select **"Credit Sale"** as payment type
5. Select a customer (e.g., "Jenilyn Tuplano")
6. Add an item (e.g., ₱85)
7. Click **"Record Sale"**
8. **✅ Should work now!**

## Troubleshooting

### "No rows updated"

If you see `UPDATE 0` in the results, it means all customers already have credit limits set. Check the SELECT query results to see their current credit limits.

### "Permission denied"

Make sure you're logged in as the project owner or have admin access to the database.

### "Table 'customers' does not exist"

This means the credit management schema hasn't been created yet. Run the schema migration first:
- File: `database/migrations/create_customer_credit_management_schema.sql`

### Still getting "Credit limit exceeded" error

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard refresh the page:**
   - Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

3. **Check the database again:**
   - Run the SELECT query to verify credit limits are actually 5000

4. **Check backend logs:**
   - Go to: https://dashboard.render.com
   - Select your backend service
   - Click "Logs"
   - Look for any errors

## Alternative: Update Individual Customers

If you want to set different credit limits for different customers:

```sql
-- Set Jenilyn Tuplano to ₱10,000
UPDATE customers
SET credit_limit = 10000.00, updated_at = NOW()
WHERE name = 'Jenilyn Tuplano';

-- Set MOCHI Tuplano to ₱3,000
UPDATE customers
SET credit_limit = 3000.00, updated_at = NOW()
WHERE name = 'MOCHI Tuplano';

-- Verify the changes
SELECT name, credit_limit FROM customers ORDER BY name;
```

## Alternative: Update by Customer ID

If you know the customer ID:

```sql
-- Update by ID
UPDATE customers
SET credit_limit = 5000.00, updated_at = NOW()
WHERE id = '002d0d24-2b13-42f9-ad1c-51d6cb0236c7';

-- Verify
SELECT id, name, credit_limit FROM customers 
WHERE id = '002d0d24-2b13-42f9-ad1c-51d6cb0236c7';
```

## What This SQL Does

### UPDATE Statement

```sql
UPDATE customers
SET 
  credit_limit = 5000.00,
  updated_at = NOW()
WHERE credit_limit = 0;
```

- **UPDATE customers** - Modifies the customers table
- **SET credit_limit = 5000.00** - Sets credit limit to ₱5,000
- **SET updated_at = NOW()** - Updates the timestamp
- **WHERE credit_limit = 0** - Only updates customers with ₱0 credit limit

### SELECT Statement

```sql
SELECT 
  name,
  business_name,
  credit_limit,
  current_balance,
  (credit_limit - current_balance) AS available_credit,
  is_active
FROM customers
ORDER BY name;
```

- Shows all customers with their credit information
- Calculates available credit (limit - balance)
- Sorts by customer name

## Need More Help?

1. **Read the full guide:** `docs/CREDIT_LIMIT_FIX_GUIDE.md`
2. **Check diagnosis:** `docs/CREDIT_SALES_DIAGNOSIS_COMPLETE.md`
3. **Quick reference:** `FIX_CREDIT_LIMITS_NOW.md`

---

**That's it!** After running this SQL, your credit sales should work perfectly. 🎉
