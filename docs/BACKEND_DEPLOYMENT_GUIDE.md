# Backend Deployment Guide - Railway

## Why You Need to Deploy the Backend

Your backend provides critical services that CANNOT be done from the frontend:

1. **Credit Limit Enforcement** - Server-side validation
2. **Balance Calculations** - Atomic database updates
3. **Authentication** - Uses service key (admin privileges)
4. **Rate Limiting** - Prevents API abuse
5. **Business Logic** - Credit calculations, due dates, etc.
6. **Reports** - Aging reports, credit summaries
7. **Security** - CORS, token validation, audit logging

**Your backend is NOT optional - it's required for production!**

## Deploy to Railway (Free Tier) - 5 Minutes

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Authorize Railway to access your repository

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `TALASTOCK` repository
4. Railway will detect it's a Python project

### Step 3: Configure Build Settings

Railway should auto-detect Python, but if not:

1. Go to Settings → Build
2. Set **Root Directory**: `backend`
3. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 4: Add Environment Variables

Go to Variables tab and add these:

```env
SUPABASE_URL=https://uwzidzpwiceijjcmifum.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlkenB3aWNlaWpqY21pZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTI1MTYsImV4cCI6MjA5MTYyODUxNn0.fA2ZR8omA7wmTtJEoEsvwX5c2C0kR_Kvx2XWsKOpaME
SUPABASE_SERVICE_KEY=your_service_key_here
CORS_ORIGINS=https://talastock.vercel.app,https://www.talastock.vercel.app
ENV=production
```

**Important:** Get your `SUPABASE_SERVICE_KEY` from:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API → `service_role` key (secret)

### Step 5: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Railway will give you a URL like: `https://talastock-backend-production.up.railway.app`

### Step 6: Test Your Backend

```bash
# Test health endpoint
curl https://your-backend.railway.app/health

# Expected response:
# {"status":"ok","version":"1.0.0","env":"production"}
```

### Step 7: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your Talastock project
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL`:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Redeploy your frontend

### Step 8: Verify Everything Works

1. Go to https://talastock.vercel.app
2. Try creating a credit sale
3. Should work without CORS errors!

## Alternative: Deploy to Render (Also Free)

If Railway doesn't work, try Render:

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Root Directory: `backend`
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add same environment variables
8. Deploy

## Alternative: Deploy to Fly.io

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. In backend folder:
   ```bash
   cd backend
   fly launch
   fly secrets set SUPABASE_URL=xxx SUPABASE_ANON_KEY=xxx ...
   fly deploy
   ```

## Troubleshooting

### Issue: Build Fails

**Solution:** Check `requirements.txt` has all dependencies:
```bash
cd backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update requirements.txt"
git push
```

### Issue: CORS Errors Still Happening

**Solution:** Check CORS_ORIGINS includes your Vercel domain:
```env
CORS_ORIGINS=https://talastock.vercel.app,https://www.talastock.vercel.app
```

### Issue: 500 Internal Server Error

**Solution:** Check Railway logs:
1. Go to Railway dashboard
2. Click on your service
3. View logs
4. Look for Python errors

### Issue: Database Connection Fails

**Solution:** Verify Supabase credentials:
1. Check SUPABASE_URL is correct
2. Check SUPABASE_SERVICE_KEY is the service_role key (not anon key)
3. Test connection locally first

## Cost Estimate

### Railway Free Tier:
- $5 credit per month
- Enough for ~500 hours of runtime
- Perfect for small businesses
- Upgrade to $5/month for more

### Render Free Tier:
- 750 hours per month
- Spins down after 15 min inactivity
- Slower cold starts
- Free forever

### Fly.io Free Tier:
- 3 shared-cpu VMs
- 160GB bandwidth
- Good performance
- Free forever

## Recommended: Railway

Railway is the easiest and most reliable for your use case:
- ✅ Auto-deploys from GitHub
- ✅ Easy environment variables
- ✅ Good logs
- ✅ Fast deployment
- ✅ No cold starts
- ✅ Good free tier

## After Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Health endpoint returns 200 OK
- [ ] Environment variables set correctly
- [ ] CORS configured with Vercel domain
- [ ] Vercel updated with backend URL
- [ ] Frontend redeployed
- [ ] Credit sales work without errors
- [ ] Customer balance updates correctly
- [ ] Reports load without 500 errors

## Need Help?

If you get stuck:
1. Check Railway/Render logs for errors
2. Test backend health endpoint
3. Verify environment variables
4. Check CORS configuration
5. Test locally first to isolate issues

---

**Remember: Your backend is REQUIRED for production. It's not optional!**
