# Fix: Set NEXT_PUBLIC_API_URL on Vercel

## Problem
Payment recording fails with 404 because the frontend on Vercel is calling:
```
http://localhost:8000/api/v1/payments
```

Instead of:
```
https://talastocks.onrender.com/api/v1/payments
```

## Root Cause
The `NEXT_PUBLIC_API_URL` environment variable is not set on Vercel, so it defaults to `http://localhost:8000` (which only works locally).

## Solution (2 minutes)

### Step 1: Add Environment Variable on Vercel
1. Go to https://vercel.com/dashboard
2. Click on your project: `talastock`
3. Click "Settings" tab
4. Click "Environment Variables" in left sidebar
5. Click "Add New"
6. Fill in:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://talastocks.onrender.com`
   - **Environments**: Check all (Production, Preview, Development)
7. Click "Save"

### Step 2: Redeploy Frontend
After adding the environment variable, you need to redeploy:

**Option A: Trigger Redeploy from Vercel**
1. Go to "Deployments" tab
2. Click the 3 dots (...) on the latest deployment
3. Click "Redeploy"
4. Wait 1-2 minutes

**Option B: Push to GitHub (Auto-deploy)**
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

### Step 3: Verify Fix
1. Wait for Vercel deployment to complete (check https://vercel.com/dashboard)
2. Go to https://talastock.vercel.app
3. Open browser DevTools (F12) → Network tab
4. Try to record a payment
5. Check the request URL - should be:
   ```
   https://talastocks.onrender.com/api/v1/payments
   ```
   NOT:
   ```
   http://localhost:8000/api/v1/payments
   ```

## Why This Happened

### Local Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
This works locally because your backend runs on localhost:8000.

### Production (Vercel)
Vercel doesn't have access to your `.env.local` file (it's in `.gitignore`).
So `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`, which doesn't exist in production.

### The Fix
Set `NEXT_PUBLIC_API_URL=https://talastocks.onrender.com` on Vercel so the frontend knows where the backend is.

## Expected Behavior After Fix

### Before Fix ❌
```
Frontend (Vercel) → http://localhost:8000/api/v1/payments → 404 Not Found
```

### After Fix ✅
```
Frontend (Vercel) → https://talastocks.onrender.com/api/v1/payments → 200 OK
```

## All Environment Variables Needed on Vercel

Make sure these are all set on Vercel:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://uwzidzpwiceijjcmifum.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key)

3. **NEXT_PUBLIC_API_URL** ← **THIS IS MISSING!**
   - Value: `https://talastocks.onrender.com`

4. **GEMINI_API_KEY** (optional, for AI features)
   - Value: Your Gemini API key

5. **GROQ_API_KEY** (optional, for AI features)
   - Value: Your Groq API key

## Troubleshooting

### Still Getting 404 After Adding Environment Variable
1. Make sure you redeployed after adding the variable
2. Check Vercel deployment logs for errors
3. Hard refresh browser (Ctrl+Shift+R)

### Getting CORS Error Instead of 404
This means the environment variable is set correctly! The CORS error is a different issue (backend needs to allow Vercel domain).

Check `backend/.env` on Render:
```env
CORS_ORIGINS=https://talastock.vercel.app,http://localhost:3000
```

### Payment Works Locally But Not on Vercel
This confirms the environment variable issue. Local works because `.env.local` has `http://localhost:8000`, but Vercel doesn't have the variable set.

## Quick Checklist
- [ ] Add `NEXT_PUBLIC_API_URL` to Vercel environment variables
- [ ] Set value to `https://talastocks.onrender.com`
- [ ] Redeploy frontend on Vercel
- [ ] Test payment recording
- [ ] Verify request URL in Network tab

## Next Steps
1. **Add environment variable on Vercel** (Step 1 above)
2. **Redeploy frontend** (Step 2 above)
3. **Test payment recording** (Step 3 above)
4. Share screenshot if still not working

