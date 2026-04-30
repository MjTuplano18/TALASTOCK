# Deploy Customers Endpoint to Production

## Issue
The Credit Reports page is showing a 404 error when trying to fetch customers:
```
GET https://talastocks.onrender.com/api/v1/customers?per_page=100 404 (Not Found)
```

## Root Cause
The backend on Render doesn't have the `/api/v1/customers` endpoint. The customers router exists in the codebase but may not have been deployed to production yet.

## Solution

### Step 1: Verify Local Backend Has the Endpoint
1. Make sure your local backend is running:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. Test the endpoint locally:
   ```bash
   curl http://localhost:8000/api/v1/customers
   ```
   
   You should get a response (might be 401 Unauthorized without auth token, but NOT 404)

### Step 2: Commit and Push to Git
If you haven't already committed the customers router:

```bash
git add backend/routers/customers.py
git add backend/main.py
git commit -m "Add customers API endpoint for credit reports"
git push origin main
```

### Step 3: Redeploy on Render
Render should automatically redeploy when you push to main. If not:

1. Go to https://dashboard.render.com
2. Find your `talastocks` backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete (watch the logs)

### Step 4: Verify Production Endpoint
Once deployed, test the production endpoint:

```bash
curl https://talastocks.onrender.com/api/v1/customers
```

You should get a 401 Unauthorized (not 404), which means the endpoint exists.

### Step 5: Test in Frontend
1. Go to your deployed frontend: https://talastock.vercel.app
2. Navigate to Reports → Credit Reports → Customer Statement
3. The customer dropdown should now load without errors

## Expected Behavior After Fix
- Customer dropdown in Credit Reports will populate with customer names
- No more 404 errors in the browser console
- You can select a customer and view their statement

## Files Involved
- `backend/routers/customers.py` - Contains the GET /customers endpoint
- `backend/main.py` - Registers the customers router (line 96)
- `frontend/components/credit/reports/CustomerStatementReport.tsx` - Calls the endpoint

## Troubleshooting

### If you still get 404 after deployment:
1. Check Render logs for any import errors:
   ```
   Failed to import routers: No module named 'customers'
   ```

2. Verify the customers router is in the correct location:
   ```
   backend/routers/customers.py
   ```

3. Check that main.py imports customers:
   ```python
   from routers import products, inventory, sales, categories, settings, customers, credit_sales, payments, reports
   ```

### If you get 500 Internal Server Error:
The endpoint exists but there's a database issue. Check:
1. Did you run the credit management migration on production Supabase?
2. Does the `customers` table exist in production?

Run this query in Supabase SQL Editor (production):
```sql
SELECT COUNT(*) FROM customers;
```

If you get "relation does not exist", you need to run the migration first.

## Next Steps
After the customers endpoint is working, you may also need to ensure:
- The `customers` table exists in production (run migration if needed)
- RLS policies are set up correctly
- The frontend is using the correct API URL (should be https://talastocks.onrender.com)
