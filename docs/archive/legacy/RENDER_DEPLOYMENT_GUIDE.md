# Render Deployment Guide - Talastock Backend

## Current Issue

Your production frontend (https://talastock.vercel.app) is trying to call `http://localhost:8000` which doesn't exist in production. You need to update it to point to your Render backend URL.

## Step-by-Step Fix

### Step 1: Find Your Render Backend URL

1. Go to https://dashboard.render.com
2. Find your Talastock backend service
3. Copy the URL (should look like: `https://talastock-backend.onrender.com`)

### Step 2: Check Render Configuration

Make sure your Render service has these settings:

#### Build Settings:
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Environment Variables:
Go to Environment tab and verify these are set:

```env
SUPABASE_URL=https://uwzidzpwiceijjcmifum.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlkenB3aWNlaWpqY21pZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTI1MTYsImV4cCI6MjA5MTYyODUxNn0.fA2ZR8omA7wmTtJEoEsvwX5c2C0kR_Kvx2XWsKOpaME
SUPABASE_SERVICE_KEY=your_service_role_key_here
CORS_ORIGINS=https://talastock.vercel.app
ENV=production
```

**Important:** Get your `SUPABASE_SERVICE_KEY`:
1. Go to https://supabase.com/dashboard
2. Select your project (uwzidzpwiceijjcmifum)
3. Settings → API → Copy the `service_role` key (NOT the anon key)

### Step 3: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your Talastock project
3. Settings → Environment Variables
4. Find `NEXT_PUBLIC_API_URL`
5. Update it to your Render URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```
6. Click "Save"

### Step 4: Redeploy Frontend

After updating the environment variable:
1. Go to Deployments tab in Vercel
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Step 5: Test Your Backend

```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Expected response:
{"status":"ok","version":"1.0.0","env":"production"}
```

### Step 6: Test Credit Sales

1. Go to https://talastock.vercel.app
2. Login
3. Go to Sales page
4. Click "Record Sale"
5. Select "Credit Sale"
6. Select a customer
7. Add products
8. Click "Record Sale"
9. Should work without CORS errors!

## Troubleshooting

### Issue: Render Service Not Found

If you haven't deployed to Render yet:

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the TALASTOCK repository
5. Configure:
   - **Name:** talastock-backend
   - **Root Directory:** `backend`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
6. Add environment variables (see Step 2 above)
7. Click "Create Web Service"
8. Wait 5-10 minutes for first deployment

### Issue: Build Fails on Render

**Error:** "Could not find requirements.txt"

**Solution:** Make sure `backend/requirements.txt` exists and is committed:
```bash
cd backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add requirements.txt"
git push origin main
```

**Error:** "Module not found"

**Solution:** Check all dependencies are in requirements.txt:
```bash
cd backend
pip install -r requirements.txt  # Test locally first
```

### Issue: CORS Errors Still Happening

**Check 1:** Verify CORS_ORIGINS in Render includes your Vercel domain:
```env
CORS_ORIGINS=https://talastock.vercel.app
```

**Check 2:** If you have multiple domains (www, non-www):
```env
CORS_ORIGINS=https://talastock.vercel.app,https://www.talastock.vercel.app
```

**Check 3:** Check Render logs for CORS errors:
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for CORS-related errors

### Issue: 500 Internal Server Error

**Solution:** Check Render logs:
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for Python errors
5. Common issues:
   - Missing SUPABASE_SERVICE_KEY
   - Wrong Supabase URL
   - Database connection errors

### Issue: Render Service Spins Down (Free Tier)

**Problem:** Render free tier spins down after 15 minutes of inactivity. First request after spin-down takes 30-60 seconds.

**Solutions:**
1. **Upgrade to paid plan** ($7/month) - no spin-down
2. **Use a ping service** (not recommended for production)
3. **Accept the delay** - it's free!

**User Experience:**
- First request after inactivity: 30-60 seconds
- Subsequent requests: Fast
- Show loading state in frontend

### Issue: Environment Variables Not Working

**Solution:** After adding/updating environment variables in Render:
1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait for deployment to complete
3. Test again

## Render Free Tier Limitations

- ✅ 750 hours per month (enough for 24/7 if only one service)
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Slower cold starts (30-60 seconds)
- ✅ Free SSL certificate
- ✅ Auto-deploys from GitHub
- ✅ Good for development/testing

## Recommended: Upgrade to Paid Plan

For production use, consider upgrading to Render's paid plan ($7/month):
- ✅ No spin-down
- ✅ Faster performance
- ✅ More reliable
- ✅ Better for customers

## Quick Checklist

- [ ] Render service deployed and running
- [ ] Health endpoint returns 200 OK
- [ ] SUPABASE_SERVICE_KEY set correctly
- [ ] CORS_ORIGINS includes Vercel domain
- [ ] Vercel NEXT_PUBLIC_API_URL updated
- [ ] Frontend redeployed
- [ ] Credit sales work without errors
- [ ] Customer balance updates correctly
- [ ] No CORS errors in browser console

## Current Error Analysis

Based on your error logs:

```
Access to fetch at 'http://localhost:8000/api/v1/credit-sales' 
from origin 'https://talastock.vercel.app' has been blocked by CORS policy
```

**This means:**
- ✅ Frontend is deployed (talastock.vercel.app)
- ❌ Frontend is calling localhost (wrong!)
- ✅ Backend is deployed on Render (you said so)
- ❌ Vercel doesn't know about Render URL

**Fix:** Update `NEXT_PUBLIC_API_URL` in Vercel to your Render URL!

## After Fix, You Should See:

```
[Credit Sale] Calling backend API: https://your-backend.onrender.com/api/v1/credit-sales
[Credit Sale] Request payload: {...}
[Credit Sale] Auth token: Present
✅ Credit sale created successfully
✅ Customer balance updated
```

## Need Your Render URL?

If you don't know your Render URL:
1. Go to https://dashboard.render.com
2. Click on your backend service
3. Look at the top - you'll see the URL
4. Copy it (e.g., `https://talastock-backend.onrender.com`)
5. Use this in Vercel's `NEXT_PUBLIC_API_URL`

---

**Once you update Vercel with your Render URL and redeploy, everything will work!**
