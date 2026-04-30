# Deploy Credit Management Features to Render

## Current Status
✅ Backend deployed to Render: https://talastocks.onrender.com  
✅ Backend is running successfully  
❌ Credit management features not working (404 errors)

## Problem
The deployed backend is missing:
1. Database migrations (customers table doesn't exist in production)
2. Possibly missing the customers router

## Solution: Run Migrations on Production Database

### Step 1: Access Supabase Production Database

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run the Credit Management Migration

Copy and paste the entire content from:
`database/migrations/create_customer_credit_management_schema.sql`

Click **Run** to execute.

### Step 3: Verify Tables Were Created

Run this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'credit_sales', 'payments', 'credit_limit_overrides')
ORDER BY table_name;
```

Should return 4 tables.

### Step 4: Fix Duplicate Triggers (If Needed)

If you get duplicate trigger errors, run:
`FIX_DUPLICATE_TRIGGERS_NOW.sql`

### Step 5: Test the Deployed Backend

Open in browser:
https://talastocks.onrender.com/health

Should return:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "env": "production"
}
```

Test customers endpoint (requires auth token):
https://talastocks.onrender.com/api/v1/customers

### Step 6: Verify Frontend Works

1. Go to https://talastock.vercel.app
2. Login
3. Go to Reports → Credit Reports
4. Customer dropdown should load

---

## Alternative: Use Local Backend for Development

If you want to develop locally instead of using the deployed backend:

### Option A: Change Frontend to Use Localhost

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then:
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

And start local backend:
```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Option B: Keep Using Deployed Backend

Just run the migrations on production Supabase (Step 1-3 above).

---

## Troubleshooting

### Error: "relation customers does not exist"
The migration hasn't been run on production. Run Step 2 above.

### Error: "trigger already exists"
Run `FIX_DUPLICATE_TRIGGERS_NOW.sql` in Supabase SQL Editor.

### Error: "permission denied"
Check RLS policies. Run:
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'customers';
```

Should show 4 policies.

### Backend Returns 404 for /api/v1/customers
Check if the customers router is included in `backend/main.py`:
```python
app.include_router(customers.router, prefix="/api/v1")
```

If missing, add it and redeploy to Render.

---

## Deployment Checklist

Before deploying credit features:

- [ ] Run migrations on production Supabase
- [ ] Verify tables exist
- [ ] Verify RLS policies exist
- [ ] Test backend health endpoint
- [ ] Test customers endpoint (with auth)
- [ ] Test frontend credit reports page
- [ ] Verify no 404 errors in browser console

---

## Quick Commands

### Run Migration on Production
1. Copy `database/migrations/create_customer_credit_management_schema.sql`
2. Paste in Supabase SQL Editor
3. Click Run

### Verify Migration
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%customer%' OR table_name LIKE '%credit%' OR table_name LIKE '%payment%';

-- Check RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('customers', 'credit_sales', 'payments');
```

### Test Backend
```bash
# Health check
curl https://talastocks.onrender.com/health

# Customers endpoint (replace TOKEN with your auth token)
curl -H "Authorization: Bearer TOKEN" https://talastocks.onrender.com/api/v1/customers
```

---

## Expected Result

After running migrations:
- ✅ https://talastocks.onrender.com/api/v1/customers returns customer data
- ✅ Frontend credit reports page works
- ✅ Customer dropdown loads
- ✅ No more 404 errors

---

**Status:** Ready to deploy  
**Time to Fix:** 5 minutes  
**Priority:** HIGH (production deployment)
