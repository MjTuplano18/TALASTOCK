# Fix: API URL Issue - Frontend Calling Wrong Backend

## Problem
The frontend is calling `https://talastocks.onrender.com/api/v1/customers` instead of `http://localhost:8000/api/v1/customers`.

## Root Cause
The `NEXT_PUBLIC_API_URL` environment variable is not being read correctly, or the frontend wasn't restarted after changing `.env.local`.

## Solution

### Step 1: Verify `.env.local` File

Check `frontend/.env.local` has:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**NOT:**
```env
NEXT_PUBLIC_API_URL=https://talastocks.onrender.com
```

### Step 2: Restart the Frontend

**IMPORTANT:** Next.js only reads `.env.local` on startup!

1. **Stop the frontend** (Ctrl+C in the terminal)
2. **Clear Next.js cache:**
   ```bash
   cd frontend
   rm -rf .next
   ```
3. **Restart the frontend:**
   ```bash
   npm run dev
   ```

### Step 3: Verify Environment Variable is Loaded

Open browser console and run:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

Should show: `http://localhost:8000`

If it shows `undefined` or the wrong URL, the `.env.local` file isn't being read.

### Step 4: Start Backend Server (If Not Running)

In a **separate terminal**:
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running: http://localhost:8000/health

### Step 5: Test the Fix

1. Refresh your browser
2. Go to Reports → Credit Reports
3. Select "Customer Statement" tab
4. The customer dropdown should load without errors

---

## Alternative: Use Next.js API Route Proxy

If the environment variable still doesn't work, you can use the Next.js API proxy that's already set up:

### Edit `frontend/components/credit/reports/CustomerStatementReport.tsx`

Change line 56 from:
```typescript
const response = await apiFetch('/api/v1/customers?per_page=100')
```

To:
```typescript
const response = await fetch('/api/v1/customers?per_page=100', {
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  }
})
```

This will use the Next.js API route at `frontend/app/api/v1/[...path]/route.ts` which proxies to your backend.

---

## Troubleshooting

### Still Getting 404 Errors?

**Check 1: Is backend running?**
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status":"ok","version":"1.0.0","env":"development"}
```

**Check 2: Is frontend using correct URL?**

Open browser DevTools → Network tab → Look for the customers request → Check the URL

Should be: `http://localhost:8000/api/v1/customers?per_page=100`  
NOT: `https://talastocks.onrender.com/api/v1/customers?per_page=100`

**Check 3: Environment variable loaded?**

Add this to `frontend/components/credit/reports/CustomerStatementReport.tsx` line 44:
```typescript
console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL)
```

Check browser console. Should show: `http://localhost:8000`

**Check 4: Clear browser cache**

Sometimes the browser caches the old API URL:
1. Open DevTools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## Quick Fix Script

Create `frontend/restart-dev.sh`:
```bash
#!/bin/bash
echo "Stopping frontend..."
pkill -f "next dev"

echo "Clearing Next.js cache..."
rm -rf .next

echo "Starting frontend..."
npm run dev
```

Make it executable:
```bash
chmod +x restart-dev.sh
```

Run it:
```bash
./restart-dev.sh
```

---

## Windows Quick Fix

Create `frontend/restart-dev.bat`:
```batch
@echo off
echo Clearing Next.js cache...
rmdir /s /q .next

echo Starting frontend...
npm run dev
```

Double-click to run.

---

## Permanent Fix

To avoid this issue in the future:

1. **Always restart frontend after changing `.env.local`**
2. **Use `npm run dev` not `next dev` directly**
3. **Clear `.next` folder if environment variables don't update**

---

## Expected Result

After fixing:
- ✅ Frontend calls `http://localhost:8000/api/v1/customers`
- ✅ Backend responds with customer data
- ✅ Customer dropdown loads successfully
- ✅ No more 404 errors

---

**Status:** Ready to fix  
**Time to Fix:** 2 minutes  
**Priority:** HIGH (blocking feature)
