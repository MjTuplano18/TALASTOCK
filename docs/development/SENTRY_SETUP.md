# Sentry Error Tracking Setup Guide

**Status:** ✅ Code Complete - Needs Configuration  
**Time Required:** 10-15 minutes

---

## What is Sentry?

Sentry is an error tracking and performance monitoring tool that helps you:
- Get notified when errors occur in production
- See detailed error reports with stack traces
- Track error frequency and affected users
- Monitor application performance
- Debug issues faster

---

## Step 1: Create a Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Sign up with your email or GitHub account
3. Choose the **Free Plan** (includes 5,000 errors/month)

---

## Step 2: Create a New Project

1. After signing up, click **"Create Project"**
2. Select **"Next.js"** as the platform
3. Set Alert frequency: **"Alert me on every new issue"**
4. Name your project: **"talastock"** (or your preferred name)
5. Click **"Create Project"**

---

## Step 3: Get Your Sentry DSN

After creating the project, you'll see a setup page with your DSN.

**Your DSN looks like this:**
```
https://[key]@[org].ingest.sentry.io/[project-id]
```

**Example:**
```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

**Copy this DSN** - you'll need it in the next step.

---

## Step 4: Add Sentry DSN to Environment Variables

1. Open `frontend/.env.local`
2. Find the Sentry section at the bottom
3. Paste your DSN:

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://[your-key]@[your-org].ingest.sentry.io/[your-project-id]
SENTRY_ORG=[your-org-slug]
SENTRY_PROJECT=talastock
SENTRY_AUTH_TOKEN=
```

**Example:**
```env
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123
SENTRY_ORG=my-company
SENTRY_PROJECT=talastock
SENTRY_AUTH_TOKEN=
```

**Note:** `SENTRY_AUTH_TOKEN` is optional and only needed for uploading source maps in production.

---

## Step 5: Restart Your Development Server

1. Stop your Next.js dev server (Ctrl+C)
2. Start it again:
   ```bash
   cd frontend
   npm run dev
   ```

---

## Step 6: Test Error Tracking

### Method 1: Test API Route

1. Open your browser
2. Go to: `http://localhost:3000/api/sentry-test`
3. You should see an error page
4. Check your Sentry dashboard - the error should appear within 1-2 minutes

### Method 2: Test in Browser Console

1. Open your app: `http://localhost:3000`
2. Open browser console (F12)
3. Type and run:
   ```javascript
   throw new Error("Test error from console")
   ```
4. Check your Sentry dashboard

### Method 3: Add a Test Button (Temporary)

Add this to any page temporarily:

```typescript
<button onClick={() => {
  throw new Error("Test error from button click")
}}>
  Test Sentry
</button>
```

---

## Step 7: Verify in Sentry Dashboard

1. Go to [https://sentry.io/](https://sentry.io/)
2. Click on your **"talastock"** project
3. Go to **"Issues"** tab
4. You should see your test error(s)
5. Click on an error to see:
   - Error message and stack trace
   - Browser and OS information
   - User actions (breadcrumbs)
   - Request details

---

## Step 8: Configure Email Alerts

1. In Sentry dashboard, go to **Settings** → **Projects** → **talastock**
2. Click **"Alerts"** in the left sidebar
3. Click **"Create Alert Rule"**
4. Choose **"Issues"**
5. Set conditions:
   - **When:** A new issue is created
   - **Then:** Send a notification to your email
6. Click **"Save Rule"**

Now you'll get an email every time a new error occurs!

---

## Step 9: Clean Up Test Errors

After verifying Sentry works:

1. In Sentry dashboard, go to **"Issues"**
2. Select all test errors
3. Click **"Resolve"** or **"Delete"**

---

## What Sentry Will Track

### Automatically Tracked:
✅ Unhandled JavaScript errors  
✅ Unhandled promise rejections  
✅ API route errors  
✅ Server-side errors  
✅ Network errors  
✅ User actions (breadcrumbs)  
✅ Browser and device info  
✅ Error frequency and trends  

### Filtered Out (Already Configured):
❌ Browser extension errors  
❌ Network timeouts (harmless)  
❌ ResizeObserver errors (harmless)  
❌ Sensitive data (passwords, tokens)  

---

## Production Deployment

When deploying to Vercel:

1. Go to your Vercel project settings
2. Add environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=[your-dsn]
   SENTRY_ORG=[your-org]
   SENTRY_PROJECT=talastock
   ```
3. Redeploy your app

Sentry will automatically start tracking production errors!

---

## Optional: Source Maps Upload

To get better stack traces in production:

1. In Sentry, go to **Settings** → **Developer Settings** → **Auth Tokens**
2. Click **"Create New Token"**
3. Select scopes: `project:releases` and `project:write`
4. Copy the token
5. Add to `.env.local`:
   ```env
   SENTRY_AUTH_TOKEN=[your-token]
   ```

This allows Sentry to upload source maps during build, giving you readable stack traces in production.

---

## Troubleshooting

### Error: "Sentry DSN not configured"
- Make sure `NEXT_PUBLIC_SENTRY_DSN` is set in `.env.local`
- Restart your dev server after adding the DSN

### Errors not appearing in Sentry
- Wait 1-2 minutes for errors to appear
- Check your Sentry project is selected
- Verify the DSN is correct
- Check browser console for Sentry errors

### Too many errors
- Adjust `tracesSampleRate` in `sentry.client.config.ts`
- Set up alert rules to filter noise
- Use `ignoreErrors` to filter specific errors

---

## Cost & Limits

**Free Plan:**
- 5,000 errors per month
- 10,000 performance transactions per month
- 1 project
- 7-day data retention

**This is plenty for a small business app!**

If you exceed limits, Sentry will stop tracking new errors but won't charge you. You can upgrade to a paid plan if needed.

---

## Summary

✅ Sentry is installed and configured  
✅ Error tracking is ready to use  
✅ Just add your DSN and test!  

**Time to complete:** 10-15 minutes  
**Benefit:** Know immediately when something breaks in production!

---

## Next Steps

After setting up Sentry:
1. ✅ Test error tracking
2. ✅ Configure email alerts
3. ✅ Deploy to production
4. ✅ Monitor errors in real-time

**You're done!** 🎉

---

**Questions?**
- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry Support: https://sentry.io/support/

---

**Created:** April 21, 2026  
**Status:** Ready to use
