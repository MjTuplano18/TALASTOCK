# Production Deployment Checklist - URGENT FIX

## Current Status: Backend Not Running ❌

Your errors show the backend at `https://talastocks.onrender.com` is **NOT responding**.

## Evidence
```
Access to fetch at 'https://talastocks.onrender.com/api/v1/credit-sales' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

This means:
- ✅ Vercel is calling the correct URL (talastocks.onrender.com)
- ❌ Backend is not responding (no CORS headers = backend down)
- ❌ All operations fail (delete, void, credit sales)

## IMMEDIATE ACTION REQUIRED

### Step 1: Check Render Deployment Status

1. Go to https://dashboard.render.com
2. Click on your "TALASTOCK" or "talastock-backend" service
3. Look at the **Status** at the top:
   - 🟢 **"Live"** = Backend is running (good!)
   - 🔴 **"Build failed"** = Deployment failed (need to fix!)
   - 🟡 **"Building"** = Still deploying (wait)

### Step 2: Check Render Logs

1. In Render dashboard, click **"Logs"** tab
2. Scroll to the bottom
3. Look for:

**✅ SUCCESS - You should see:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

**❌ FAILURE - If you see:**
```
Using Python version 3.14.3
pydantic-core build failed
Read-only file system
Build failed
```

This means Python version is STILL wrong!

### Step 3: Verify Environment Variables

In Render dashboard, click **"Environment"** tab.

**Required variables:**

```
PYTHON_VERSION = 3.11.9
SUPABASE_URL = https://uwzidzpwiceijjcmifum.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlkenB3aWNlaWpqY21pZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTI1MTYsImV4cCI6MjA5MTYyODUxNn0.fA2ZR8omA7wmTtJEoEsvwX5c2C0kR_Kvx2XWsKOpaME
SUPABASE_SERVICE_KEY = [YOUR SERVICE KEY]
CORS_ORIGINS = https://talastock.vercel.app,https://www.talastock.vercel.app
ENV = production
```

**CRITICAL:** If `PYTHON_VERSION` is missing or wrong, add it!

### Step 4: Force Redeploy

After adding/fixing environment variables:

1. Click **"Manual Deploy"** button (top right)
2. Select **"Deploy latest commit"**
3. Wait 3-5 minutes
4. Watch the logs

### Step 5: Test Backend Health

Once deployment shows "Live", test:

```bash
curl https://talastocks.onrender.com/health
```

**Expected response:**
```json
{"status":"ok","version":"1.0.0","env":"production"}
```

**If you get this response, backend is working!** ✅

**If you get timeout or connection refused, backend is still down.** ❌

## Common Issues & Fixes

### Issue 1: Python Version Still 3.14

**Symptom:** Logs show "Using Python version 3.14.3"

**Fix:**
1. Add `PYTHON_VERSION=3.11.9` in Environment tab
2. Click "Save Changes"
3. Render will auto-redeploy
4. Wait 3-5 minutes
5. Check logs again

### Issue 2: Build Command Not Found

**Symptom:** "Could not find requirements.txt"

**Fix:**
1. In Render dashboard, go to **Settings** tab
2. Check **Root Directory** = `backend` (not `backend/` or `/backend`)
3. Check **Build Command** = `pip install -r requirements.txt`
4. Check **Start Command** = `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click "Save Changes"

### Issue 3: Module Import Errors

**Symptom:** "ModuleNotFoundError: No module named 'fastapi'"

**Fix:**
1. Check `backend/requirements.txt` exists
2. Make sure it's committed to git
3. Redeploy

### Issue 4: Supabase Connection Error

**Symptom:** "Could not connect to Supabase"

**Fix:**
1. Verify `SUPABASE_SERVICE_KEY` is set correctly
2. Get it from: https://supabase.com/dashboard → Project Settings → API → service_role key
3. Update in Render Environment tab
4. Redeploy

## Why Delete/Void Don't Work

When backend is down:

1. Frontend calls backend to delete → **404 error**
2. Frontend shows success toast (optimistic UI)
3. Frontend removes item from local state
4. User refreshes page
5. Frontend fetches from Supabase directly
6. Item is still there (backend never deleted it)
7. Item "comes back" ❌

**Once backend is running, this will be fixed automatically!**

## Why Credit Sales Fail

Same reason - backend is down:

1. Frontend calls backend to create credit sale → **CORS error (backend not responding)**
2. Frontend shows error toast
3. Nothing is saved
4. Customer balance doesn't update

**Once backend is running, this will work!**

## Chart Width Error (Separate Issue)

This is a minor UI bug, not related to backend. We'll fix this after backend is running.

## Action Plan - Do This Now

1. ✅ Go to Render dashboard
2. ✅ Check deployment status (Live or Failed?)
3. ✅ Check logs (see Python version and errors)
4. ✅ Verify `PYTHON_VERSION=3.11.9` in Environment tab
5. ✅ If missing, add it and save
6. ✅ Wait for auto-redeploy (3-5 minutes)
7. ✅ Test health endpoint: `curl https://talastocks.onrender.com/health`
8. ✅ If health check works, test credit sales in browser
9. ✅ If credit sales work, test delete/void

## Expected Timeline

- **Add environment variable:** 1 minute
- **Render redeploy:** 3-5 minutes
- **Test health endpoint:** 10 seconds
- **Test in browser:** 2 minutes
- **Total:** ~10 minutes

## What to Report Back

After following the steps above, tell me:

1. **Render Status:** Live, Building, or Failed?
2. **Logs:** What do you see at the bottom of logs?
3. **Python Version:** What version is being used? (from logs)
4. **Health Check:** Does `curl https://talastocks.onrender.com/health` work?
5. **Environment Variables:** Is `PYTHON_VERSION=3.11.9` set?

## If Still Not Working

If after all this the backend still won't deploy, we have two options:

### Option A: Switch to Railway

Railway handles Python versions better:

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select TALASTOCK repository
4. Set Root Directory: `backend`
5. Add environment variables
6. Deploy (usually works first try)

### Option B: Debug Render Further

We'll need to see:
- Full deployment logs
- Environment variables screenshot
- Settings screenshot

---

**NEXT STEP:** Go to Render dashboard NOW and check the status. Report back what you see!
