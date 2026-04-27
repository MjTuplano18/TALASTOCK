# Production Issues - Complete Fix Guide

## Current Issues

1. ❌ CORS errors from Render backend
2. ❌ 404 errors on `/api/v1/customers` and other endpoints
3. ❌ Delete/Void shows success but items come back
4. ❌ Credit sales not recording
5. ❌ Customer deletions revert

## Root Cause

**Your Render backend is NOT running** because the deployment failed due to Python 3.14 build issues.

## Evidence

```
Access to fetch at 'https://talastocks.onrender.com/api/v1/credit-sales' 
from origin 'https://talastock.vercel.app' has been blocked by CORS policy
```

This means:
- ✅ Vercel is now calling the correct URL (talastocks.onrender.com)
- ❌ Render backend is not responding (deployment failed)
- ❌ No CORS headers because backend isn't running

## Complete Fix - Step by Step

### Step 1: Fix Render Backend Deployment

#### Option A: Set Python Version in Render Dashboard (RECOMMENDED)

1. Go to https://dashboard.render.com
2. Click on your TALASTOCK service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add these variables:

```
PYTHON_VERSION = 3.11.9
SUPABASE_URL = https://uwzidzpwiceijjcmifum.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlkenB3aWNlaWpqY21pZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTI1MTYsImV4cCI6MjA5MTYyODUxNn0.fA2ZR8omA7wmTtJEoEsvwX5c2C0kR_Kvx2XWsKOpaME
SUPABASE_SERVICE_KEY = [GET FROM SUPABASE DASHBOARD]
CORS_ORIGINS = https://talastock.vercel.app
ENV = production
```

6. **Get SUPABASE_SERVICE_KEY:**
   - Go to https://supabase.com/dashboard
   - Select project: uwzidzpwiceijjcmifum
   - Settings → API
   - Copy **service_role** key (NOT anon key)

7. Click **"Save Changes"**
8. Render will auto-redeploy

#### Option B: Use Railway Instead (If Render Keeps Failing)

If Render continues to fail, switch to Railway:

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select TALASTOCK repository
4. Set Root Directory: `backend`
5. Add same environment variables as above
6. Railway will deploy successfully

### Step 2: Verify Backend is Running

After deployment succeeds, test:

```bash
# Test health endpoint
curl https://talastocks.onrender.com/health

# Expected response:
{"status":"ok","version":"1.0.0","env":"production"}
```

If you get a response, backend is running! ✅

### Step 3: Fix Delete/Void Issues

The delete/void issue is caused by **cache**. When backend is down, frontend uses cached data, so deletions appear to work but revert.

Once backend is running, this will be fixed automatically.

### Step 4: Test Everything

After backend is running:

1. **Test Credit Sales:**
   - Go to Sales page
   - Record a credit sale
   - Should work without CORS errors
   - Customer balance should update

2. **Test Delete:**
   - Delete a sale
   - Should disappear and stay gone
   - Refresh page - should still be gone

3. **Test Void:**
   - Void a sale
   - Should disappear and stay gone
   - Inventory should be restored

4. **Test Customer Delete:**
   - Delete a customer
   - Should disappear and stay gone
   - Refresh page - should still be gone

## Why Items Come Back After Delete

This happens because:

1. Frontend calls backend to delete
2. Backend is down (404 error)
3. Frontend shows success toast (optimistic UI)
4. Frontend removes item from local state
5. User refreshes page
6. Frontend fetches from Supabase directly
7. Item is still there (backend never deleted it)
8. Item "comes back"

**Solution:** Get backend running!

## Troubleshooting

### Issue: Render Build Still Fails

**Check Render Logs:**
1. Go to Render dashboard
2. Click on service
3. Click "Logs" tab
4. Look for errors

**Common Errors:**

**Error:** "Using Python version 3.14.3"
**Fix:** Add `PYTHON_VERSION=3.11.9` environment variable

**Error:** "pydantic-core build failed"
**Fix:** Python version is still wrong, set environment variable

**Error:** "Module not found"
**Fix:** Check `requirements.txt` is in backend folder

### Issue: CORS Errors After Backend is Running

**Check CORS_ORIGINS:**
```
CORS_ORIGINS = https://talastock.vercel.app
```

Make sure:
- ✅ No trailing slash
- ✅ Exact match with Vercel URL
- ✅ HTTPS (not HTTP)

### Issue: 404 on All Endpoints

**Check Root Directory:**
- Should be: `backend`
- Not: `backend/` or `/backend`

**Check Start Command:**
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Issue: Backend Runs But Still 404

**Check if backend is actually accessible:**
```bash
curl https://talastocks.onrender.com/health
```

If this returns 404, backend is not configured correctly.

**Check Render URL:**
- Your URL is: `talastocks.onrender.com`
- Make sure this matches what's in Vercel

## Current Status Checklist

- [ ] Render backend deployed successfully
- [ ] Health endpoint returns 200 OK
- [ ] CORS_ORIGINS set correctly
- [ ] SUPABASE_SERVICE_KEY set correctly
- [ ] Vercel NEXT_PUBLIC_API_URL points to Render
- [ ] Frontend redeployed
- [ ] Credit sales work
- [ ] Delete/Void work
- [ ] Customer operations work

## Quick Test Commands

```bash
# Test backend health
curl https://talastocks.onrender.com/health

# Test CORS
curl -X OPTIONS https://talastocks.onrender.com/api/v1/credit-sales \
  -H "Origin: https://talastock.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Test customers endpoint
curl https://talastocks.onrender.com/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Summary

**Main Problem:** Render backend deployment failed due to Python 3.14 issue

**Main Solution:** Set `PYTHON_VERSION=3.11.9` in Render environment variables

**Secondary Issues:** All caused by backend being down:
- CORS errors → Backend not responding
- 404 errors → Backend not running
- Delete/Void not working → Backend can't process requests
- Items coming back → Changes not saved to database

**Once backend is running, ALL issues will be resolved!**

---

**Next Step:** Go to Render dashboard and add `PYTHON_VERSION=3.11.9` environment variable, then wait for redeploy.
