# Force Fix: API URL Still Calling Wrong Backend

## Problem
Even after setting `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`, the frontend is still calling `https://talastocks.onrender.com`.

## Root Cause
Next.js has cached the old environment variable in the `.next` build directory. Simply restarting doesn't clear this cache.

## Solution: Nuclear Option (Guaranteed to Work)

### Step 1: Stop Frontend
Press `Ctrl+C` in the terminal running the frontend

### Step 2: Delete Cache Directories
```powershell
cd frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
```

### Step 3: Verify .env.local
```powershell
Get-Content .env.local | Select-String "NEXT_PUBLIC_API_URL"
```

Should show:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If it shows anything else, edit `.env.local` and change it.

### Step 4: Start Fresh
```powershell
npm run dev
```

### Step 5: Hard Refresh Browser
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## Alternative: Use PowerShell Script

I've created a script that does all of this automatically:

```powershell
cd frontend
.\restart-clean.ps1
```

This will:
- Stop any running Next.js processes
- Clear `.next` cache
- Clear `node_modules/.cache`
- Show your environment variables
- Start the dev server fresh

---

## Verify the Fix

### Check 1: Environment Variable in Browser
Open browser console and run:
```javascript
fetch('/api/v1/customers?per_page=100')
  .then(r => r.url)
  .then(console.log)
```

Should show: `http://localhost:8000/api/v1/customers?per_page=100`  
NOT: `https://talastocks.onrender.com/api/v1/customers?per_page=100`

### Check 2: Network Tab
1. Open DevTools → Network tab
2. Refresh the page
3. Look for the `customers` request
4. Check the URL

Should be calling `localhost:8000`, not `talastocks.onrender.com`

### Check 3: Backend is Running
```powershell
curl http://localhost:8000/health
```

Should return:
```json
{"status":"ok","version":"1.0.0","env":"development"}
```

If you get "connection refused", the backend isn't running. Start it:
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

---

## If Still Not Working: Hardcode the URL (Temporary)

Edit `frontend/lib/api-client.ts`:

Change line 7 from:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

To:
```typescript
const API_BASE_URL = 'http://localhost:8000' // HARDCODED FOR DEBUGGING
```

Then restart:
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

This will force it to use `localhost:8000` regardless of environment variables.

---

## Debug: Check What URL is Being Used

Add this to `frontend/lib/api-client.ts` after line 7:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
console.log('[API Client] Using API_BASE_URL:', API_BASE_URL) // ADD THIS LINE
```

Then check the browser console. It should log:
```
[API Client] Using API_BASE_URL: http://localhost:8000
```

If it logs something else, the environment variable isn't being read.

---

## Nuclear Option: Reinstall Dependencies

If nothing else works:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item -Force package-lock.json
npm install
npm run dev
```

This will:
- Delete all node modules
- Delete the build cache
- Reinstall everything fresh
- Start the dev server

**Warning:** This takes 5-10 minutes depending on your internet speed.

---

## Expected Result

After fixing:
- ✅ Browser console shows: `[API Client] Using API_BASE_URL: http://localhost:8000`
- ✅ Network tab shows requests to `localhost:8000`
- ✅ Customer dropdown loads successfully
- ✅ No more 404 errors from `talastocks.onrender.com`

---

## Summary of Steps

1. Stop frontend (Ctrl+C)
2. Delete `.next` folder
3. Delete `node_modules/.cache` folder
4. Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
5. Start frontend (`npm run dev`)
6. Hard refresh browser (Ctrl+Shift+R or Empty Cache and Hard Reload)
7. Check Network tab to verify it's calling `localhost:8000`

---

**Status:** Ready to fix  
**Time to Fix:** 3 minutes  
**Priority:** CRITICAL (blocking all credit features)
