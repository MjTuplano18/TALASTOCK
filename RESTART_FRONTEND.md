# Restart Frontend to Apply PDF Export Fix

## The Issue
You're testing on localhost, but the code changes haven't been loaded yet because the development server is still running the old code.

## Solution: Restart the Frontend

### Step 1: Stop the Frontend Server
In the terminal where `npm run dev` is running:
- Press `Ctrl + C` to stop the server

### Step 2: Restart the Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test Again
1. Wait for the server to start (you'll see "Ready" message)
2. Refresh your browser at http://localhost:3000
3. Go to Reports → Credit Reports
4. Export any PDF
5. The currency should now show as **PHP 4,400.00** instead of garbled text

## Alternative: Test on Production
If you don't want to restart locally, you can test on the production site:
- Go to: https://talastock.vercel.app/reports/credit
- The fix is already deployed there (Vercel auto-deploys on push)

## What Was Fixed
- Currency formatting in PDFs now uses `PHP` instead of `₱` symbol
- This prevents the encoding issue that caused garbled text
- All three credit reports (Customer Statement, Credit Summary, Aging Report) are fixed
