# Fix Credit Reports 404 Error

## Current Error
```
GET https://talastocks.onrender.com/api/v1/customers?per_page=100 404 (Not Found)
```

The Customer Statement report page can't load customers because the API endpoint returns 404.

## Quick Diagnosis

### Test 1: Check if Backend Has the Endpoint
Open this URL in your browser:
```
https://talastocks.onrender.com/api/v1/customers
```

**Expected Results:**
- ✅ **401 Unauthorized** = Endpoint exists, just needs auth (GOOD!)
- ❌ **404 Not Found** = Endpoint doesn't exist (BAD - need to redeploy)

### Test 2: Check if Table Exists in Production
Go to Supabase Dashboard → SQL Editor → Run:
```sql
SELECT COUNT(*) FROM customers;
```

**Expected Results:**
- ✅ Returns a number (even 0) = Table exists (GOOD!)
- ❌ "relation does not exist" = Table missing (BAD - need to run migration)

## Fix Based on Test Results

### Scenario A: 404 + Table Exists
**Problem:** Backend code not deployed
**Solution:** Redeploy backend on Render

1. Go to https://dashboard.render.com
2. Find your `talastocks` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 2-3 minutes for deployment
5. Refresh the Credit Reports page

### Scenario B: 401 + Table Missing
**Problem:** Database migration not run
**Solution:** Run the migration in production Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `SIMPLE_PRODUCTION_MIGRATION.sql`
3. Paste and run it
4. Refresh the Credit Reports page

### Scenario C: 404 + Table Missing
**Problem:** Both backend and database need updating
**Solution:** Do both fixes above (database first, then backend)

## Verification

After applying the fix, test again:

1. Open: https://talastock.vercel.app/reports/credit
2. Click on "Customer Statement" tab
3. The customer dropdown should show "Select a customer" (not an error)
4. Browser console should have NO 404 errors

## Root Cause

The customers API endpoint (`backend/routers/customers.py`) exists in your local codebase and is registered in `main.py`, but it may not have been deployed to production yet.

The UI changes we just made (truncating business names) will work once the API endpoint is accessible.

## Files Modified (Already Done)
- ✅ `frontend/components/credit/RecordPaymentTrigger.tsx` - Truncates business names > 20 chars
- ✅ `frontend/components/credit/reports/CustomerStatementReport.tsx` - Simplified format
- ✅ `frontend/components/forms/SaleForm.tsx` - Truncates business names > 25 chars

These changes are already committed and will work once the backend endpoint is available.
