# 🚨 URGENT: Fix Refund Status Not Updating

## The Problem

When you refund a sale, the status stays "Completed" instead of changing to "Refunded" because the `status` column doesn't exist in your `sales` table yet.

## The Solution (2 minutes)

You need to run the migration that adds the refund tracking columns to the sales table.

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select project: `uwzidzpwiceijjcmifum`
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New query"**

### Step 2: Run This Migration

Copy the ENTIRE migration file and paste it into the SQL editor:

**File:** `database/migrations/add_pre_launch_fields_to_sales.sql`

Or copy this quick version:

```sql
-- Add status column
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
  CHECK (status IN ('completed', 'refunded', 'partially_refunded'));

-- Add refund tracking columns
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0;

ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sales_status 
  ON sales(status);

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'sales'
  AND column_name IN ('status', 'refunded_amount', 'refund_reason', 'refunded_at', 'refunded_by')
ORDER BY column_name;
```

### Step 3: Verify

You should see output showing the 5 new columns:

| column_name | data_type | column_default |
|-------------|-----------|----------------|
| refund_reason | text | NULL |
| refunded_amount | numeric | 0 |
| refunded_at | timestamp with time zone | NULL |
| refunded_by | uuid | NULL |
| status | text | 'completed'::text |

✅ If you see all 5 columns, the fix worked!

### Step 4: Test Refund Again

1. Go to: https://talastock.vercel.app/sales
2. Click **rotate icon** on any sale
3. Select items and confirm refund
4. ✅ Status should now change to "Refunded"
5. ✅ Refund button should disappear

---

## About the Statuses

### Current Statuses (After Migration):

1. **Completed** ✅
   - Normal sale, fully paid
   - No refunds processed
   - Default status for all sales

2. **Refunded** ✅
   - Full refund processed
   - All items returned
   - Refund button hidden

3. **Partially Refunded** ✅
   - Some items refunded, not all
   - Customer kept some items
   - Can refund remaining items

---

## How Partially Refunded Works

### Example Scenario:

**Original Sale:**
- Tomato: ₱70
- Onion: ₱50
- Garlic: ₱30
- **Total: ₱150**
- **Status: Completed**

**Customer Returns Only Tomato:**
- Refund: ₱70
- **Status: Partially Refunded**
- **Refunded Amount: ₱70**
- **Remaining: ₱80** (Onion + Garlic)
- Refund button: Still visible (can refund more)

**Customer Later Returns Onion:**
- Refund: ₱50
- **Status: Partially Refunded**
- **Refunded Amount: ₱120**
- **Remaining: ₱30** (Garlic only)
- Refund button: Still visible

**Customer Returns Garlic:**
- Refund: ₱30
- **Status: Refunded** (now fully refunded)
- **Refunded Amount: ₱150**
- **Remaining: ₱0**
- Refund button: Hidden (can't refund anymore)

---

## Do You Need "Partially Refunded"?

### YES, you need it if:
- ✅ Customers sometimes return only some items
- ✅ You want to track partial returns
- ✅ You need accurate financial records

### Example Use Cases:
- Customer buys 5 items, returns 2
- Customer returns damaged item but keeps good ones
- Customer changes mind on one product only

### Benefits:
- ✅ Accurate tracking of what was refunded
- ✅ Can refund remaining items later
- ✅ Clear financial records
- ✅ Better customer service

---

## Recommended Status Flow

```
Sale Created
    ↓
[Completed] ← Default status
    ↓
Customer returns some items
    ↓
[Partially Refunded] ← Some items refunded
    ↓
Customer returns remaining items
    ↓
[Refunded] ← All items refunded
```

---

## Alternative: Simplified Statuses

If you don't need partial refunds, you can simplify to just 2 statuses:

1. **Completed** - Normal sale
2. **Refunded** - Full refund only

**To implement:**
```sql
-- Change the CHECK constraint to only allow 2 statuses
ALTER TABLE sales 
  DROP CONSTRAINT IF EXISTS sales_status_check;

ALTER TABLE sales 
  ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('completed', 'refunded'));
```

**Trade-off:**
- ❌ Can't track partial refunds
- ❌ Must refund entire sale at once
- ✅ Simpler for users
- ✅ Easier to understand

---

## My Recommendation

**Keep all 3 statuses** (Completed, Partially Refunded, Refunded) because:

1. ✅ More flexible for customers
2. ✅ Better financial tracking
3. ✅ Supports real-world scenarios
4. ✅ Already implemented and working
5. ✅ No downside - users only see it when needed

---

## Troubleshooting

### Status Still Not Updating?

1. **Verify migration ran:**
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'status';
```

Should return: `status`

2. **Check existing sales:**
```sql
SELECT id, total_amount, status, refunded_amount
FROM sales
LIMIT 10;
```

All should have `status = 'completed'` by default

3. **Manually update a test sale:**
```sql
UPDATE sales
SET status = 'refunded', refunded_amount = total_amount
WHERE id = 'your-sale-id';
```

4. **Clear browser cache** and refresh

---

## Summary

**Problem:** Status column doesn't exist  
**Solution:** Run the migration SQL above  
**Time:** 2 minutes  
**Statuses:** Keep all 3 (Completed, Partially Refunded, Refunded)  
**Benefit:** Accurate refund tracking

---

**Run the migration now, then test refund again!** ✅
