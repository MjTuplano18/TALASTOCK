# Fix CORS and Production Errors

## Errors Identified

### 1. CORS Error (Critical) ❌
**Error:**
```
Access to fetch at 'https://talastocks.onrender.com/api/v1/reports/credit-summary' 
from origin 'https://talastock.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:** 
The backend CORS configuration doesn't include the production frontend URL.

**Solution:**
Update the `CORS_ORIGINS` environment variable on Render to include the production frontend URL.

**Steps to Fix:**

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service: `talastocks`
3. Go to "Environment" tab
4. Update or add the `CORS_ORIGINS` variable:
   ```
   CORS_ORIGINS=https://talastock.vercel.app,https://www.talastock.vercel.app,http://localhost:3000
   ```
5. Save changes
6. Render will automatically redeploy

**Note:** The backend code already supports multiple origins separated by commas.

---

### 2. Chart Width/Height Warning ⚠️
**Error:**
```
The width(-1) and height(-1) of chart should be greater than 0
```

**Status:** ✅ Already Fixed

**Solution:** 
Fixed in commit `7cce3ee` by updating `ChartWrapper.tsx` to use explicit height instead of min-height.

**Action Required:**
Restart the frontend dev server to see the fix:
```bash
cd frontend
npm run dev
```

---

### 3. Auth Token Error ⚠️
**Error:**
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

**Root Cause:**
Supabase refresh token is missing or expired. This happens when:
- User session has expired
- Cookies were cleared
- Token was invalidated

**Solution:**
This is expected behavior. Users need to log in again when their session expires.

**Optional Improvement:**
Add better error handling to redirect users to login page when token is invalid:

```typescript
// In lib/supabase.ts or auth context
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  if (event === 'SIGNED_OUT' || !session) {
    // Redirect to login
    window.location.href = '/login'
  }
})
```

---

## Verification Checklist

After fixing CORS:
- [ ] Backend redeployed on Render
- [ ] Can access credit reports without CORS error
- [ ] Can fetch customer data without CORS error
- [ ] All API endpoints work from production frontend

After restarting frontend:
- [ ] No chart width/height warnings in console
- [ ] All charts render correctly
- [ ] Dashboard loads without errors

---

## Current Environment Variables Needed on Render

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# CORS (CRITICAL - Must include production URL)
CORS_ORIGINS=https://talastock.vercel.app,https://www.talastock.vercel.app,http://localhost:3000

# Environment
ENV=production

# Optional
PORT=10000
```

---

## Testing After Fix

1. **Test CORS:**
   ```bash
   curl -I -X OPTIONS https://talastocks.onrender.com/api/v1/customers \
     -H "Origin: https://talastock.vercel.app" \
     -H "Access-Control-Request-Method: GET"
   ```
   
   Should return:
   ```
   Access-Control-Allow-Origin: https://talastock.vercel.app
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   ```

2. **Test API Endpoint:**
   ```bash
   curl https://talastocks.onrender.com/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "version": "1.0.2",
     "env": "production"
   }
   ```

3. **Test from Frontend:**
   - Open https://talastock.vercel.app
   - Open browser console (F12)
   - Navigate to Credit Reports
   - Should load without CORS errors

---

## Additional Notes

### Why CORS Errors Happen
CORS (Cross-Origin Resource Sharing) is a security feature that prevents websites from making requests to different domains unless explicitly allowed. Since your frontend (`talastock.vercel.app`) and backend (`talastocks.onrender.com`) are on different domains, the backend must explicitly allow requests from the frontend.

### Why It Works Locally
Locally, both frontend and backend might be on `localhost`, or you have `http://localhost:3000` in the CORS_ORIGINS, so it works fine.

### Production vs Development
- **Development:** `http://localhost:3000` (already in CORS_ORIGINS)
- **Production:** `https://talastock.vercel.app` (needs to be added)

---

## Quick Fix Command

If you have Render CLI installed:
```bash
render env set CORS_ORIGINS="https://talastock.vercel.app,https://www.talastock.vercel.app,http://localhost:3000" --service talastocks
```

Otherwise, update via Render Dashboard as described above.
