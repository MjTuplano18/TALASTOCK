# 🚨 CORS FIX - ACTION REQUIRED

## What I Just Did

I fixed the CORS error by reordering the middleware in `backend/main.py`.

**The fix is pushed to GitHub. Render is redeploying NOW.**

## What You Need to Do (10 Minutes)

### Step 1: Wait for Render Redeploy (5 Minutes)

1. Go to https://dashboard.render.com
2. Click your service
3. Watch "Logs" tab
4. Wait for: **"Build successful 🎉"**
5. Wait for: **"Running 'uvicorn main:app...'"**

### Step 2: Verify CORS Environment Variable

1. In Render, click **"Environment"** tab
2. Find `CORS_ORIGINS`
3. **Should be:** `https://talastock.vercel.app,https://www.talastock.vercel.app`
4. **NO spaces, NO trailing slashes!**

**If it has spaces or slashes, fix it:**
```
CORRECT: https://talastock.vercel.app,https://www.talastock.vercel.app
WRONG:   https://talastock.vercel.app/, https://www.talastock.vercel.app/
```

### Step 3: Test Credit Sales (2 Minutes)

1. Go to https://talastock.vercel.app
2. **Hard refresh:** Press `Ctrl + Shift + R`
3. Go to Sales page
4. Click "Record Sale"
5. Select "Credit Sale"
6. Select customer: Jenilyn Tuplano
7. Add product: Rice 5kg, Qty: 1
8. Click "Record Sale"

**Expected:** ✅ Success! No CORS error!

### Step 4: Fix Customer Issue (Only One Showing)

You said there are 2 customers but only 1 shows. This is likely RLS (Row Level Security).

**Check in Supabase:**
1. Go to https://supabase.com/dashboard
2. Select project: uwzidzpwiceijjcmifum
3. Click "SQL Editor"
4. Run this query:
```sql
SELECT id, name, business_name, is_active, created_by 
FROM customers 
WHERE is_active = true 
ORDER BY name;
```

**How many rows do you see?**
- If you see 2 rows → RLS is filtering them
- If you see 1 row → Second customer is inactive or deleted

**If you see 2 rows, fix RLS:**
```sql
-- Drop restrictive policy
DROP POLICY IF EXISTS "Users can only see their own customers" ON customers;

-- Allow all authenticated users to see all customers
CREATE POLICY "Authenticated users can see all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);
```

Then refresh your app and both customers should show!

## Why CORS Was Broken

**Problem:** CORS middleware was added AFTER rate limiting middleware.

**Result:** Preflight OPTIONS requests hit rate limiter first, got blocked, never reached CORS middleware.

**Fix:** Move CORS middleware to be FIRST, so it handles OPTIONS requests before anything else.

## Expected Results

### After Render Redeploys:
- ✅ Credit sales work without CORS errors
- ✅ All API calls succeed
- ✅ Backend responds with proper CORS headers

### After RLS Fix:
- ✅ All customers show in dropdown
- ✅ Customer list is complete

## Timeline

- **Render redeploy:** 3-5 minutes (happening now)
- **Test credit sales:** 2 minutes
- **Fix RLS:** 1 minute
- **Test customers:** 2 minutes
- **Total:** ~10 minutes

## What to Report Back

1. ✅ Did Render redeploy successfully?
2. ✅ Does credit sale work without CORS error?
3. ✅ How many customers do you see in SQL query?
4. ✅ How many customers show in dropdown after RLS fix?

---

**Wait 5 minutes for Render to redeploy, then test credit sales!**
