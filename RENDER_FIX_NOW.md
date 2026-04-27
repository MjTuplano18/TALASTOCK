# 🚨 FIX YOUR BACKEND NOW - 5 MINUTES

## The Problem

Your backend at `https://talastocks.onrender.com` is **NOT RUNNING**.

That's why:
- ❌ CORS errors on credit sales
- ❌ Delete/void show success but items come back
- ❌ Refunds don't work
- ❌ All backend API calls fail

## The Solution (5 Minutes)

### Step 1: Open Render Dashboard

Go to: **https://dashboard.render.com**

### Step 2: Click Your Service

Find and click: **"TALASTOCK"** or **"talastock-backend"**

### Step 3: Check Status

Look at the top - you'll see:
- 🔴 **"Build failed"** ← This is what you have
- 🟡 **"Building"** ← Wait if you see this
- 🟢 **"Live"** ← Unlikely (backend is down)

### Step 4: Check Logs

1. Click **"Logs"** tab
2. Scroll to bottom
3. You'll see:
```
Using Python version 3.14.3  ← WRONG VERSION!
pydantic-core build failed
Read-only file system
Build failed
```

### Step 5: Add Environment Variable

1. Click **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Enter:
   - **Key:** `PYTHON_VERSION`
   - **Value:** `3.11.9`
4. Click **"Save Changes"**
5. Render will auto-redeploy (wait 3-5 minutes)

### Step 6: Watch Logs

1. Go back to **"Logs"** tab
2. Watch the deployment
3. Look for:
```
Using Python version 3.11.9  ← CORRECT!
Installing dependencies...
Starting server...
Uvicorn running on http://0.0.0.0:10000  ← SUCCESS!
```

### Step 7: Test Backend

Open terminal and run:
```bash
curl https://talastocks.onrender.com/health
```

**Expected response:**
```json
{"status":"ok","version":"1.0.0","env":"production"}
```

**If you get this, backend is working!** ✅

## What Happens Next

Once backend is running:

1. ✅ Credit sales work without CORS errors
2. ✅ Delete/void persist after refresh
3. ✅ Refunds work correctly
4. ✅ Customer balance updates
5. ✅ All API calls succeed

## All Environment Variables

Make sure these are set in Render:

```
PYTHON_VERSION = 3.11.9
SUPABASE_URL = https://uwzidzpwiceijjcmifum.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlkenB3aWNlaWpqY21pZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTI1MTYsImV4cCI6MjA5MTYyODUxNn0.fA2ZR8omA7wmTtJEoEsvwX5c2C0kR_Kvx2XWsKOpaME
SUPABASE_SERVICE_KEY = [Get from Supabase Dashboard]
CORS_ORIGINS = https://talastock.vercel.app,https://www.talastock.vercel.app
ENV = production
```

**To get SUPABASE_SERVICE_KEY:**
1. Go to https://supabase.com/dashboard
2. Select project: uwzidzpwiceijjcmifum
3. Settings → API
4. Copy **service_role** key (NOT anon key)

## Timeline

- Add environment variable: **1 minute**
- Render redeploy: **3-5 minutes**
- Test backend: **30 seconds**
- Test in browser: **2 minutes**
- **Total: ~10 minutes**

## What to Report Back

After you do this, tell me:

1. ✅ Render status (Live/Building/Failed)?
2. ✅ What do logs show?
3. ✅ Does health check work?
4. ✅ Do credit sales work?
5. ✅ Do delete/void persist?

---

## Why This Fixes Everything

**Root Cause:** Render is using Python 3.14.3 (which has build issues)

**Fix:** Force Python 3.11.9 (which works perfectly)

**Result:** Backend deploys successfully → All features work

---

**GO TO RENDER DASHBOARD NOW AND ADD `PYTHON_VERSION=3.11.9`!**

That's literally all you need to do. Everything else is already correct.
