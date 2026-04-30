# Deploy Payments API Fix

## Problem
Payment recording fails with 404 error:
```
Failed to load resource: the server responded with a status of 404 ()
talastocks.onrender.com/api/v1/payments:1
```

## Root Cause
The `/api/v1/payments` endpoint exists in the code but **Render backend is running an old version** that doesn't have the payments router yet.

## Solution
Redeploy the backend on Render to get the latest code.

## Quick Fix (2 minutes)

### Option 1: Manual Redeploy (Recommended)
1. Go to Render Dashboard: https://dashboard.render.com/
2. Find your service: `talastocks`
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 2-3 minutes for deployment to complete
5. Test payment recording again

### Option 2: Push to GitHub (Auto-deploy)
The backend is already configured to auto-deploy from GitHub. Since the code is already pushed, you can trigger a redeploy by:

1. Go to Render Dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. This forces a fresh deployment

## Verify Deployment

### Step 1: Check Backend Health
Open this URL in browser:
```
https://talastocks.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "env": "production"
}
```

### Step 2: Check Payments Endpoint
Open this URL (will show 401 Unauthorized, which is correct):
```
https://talastocks.onrender.com/api/v1/payments
```

Expected response:
```json
{
  "detail": "Not authenticated"
}
```

If you see 404, the deployment hasn't completed yet.

### Step 3: Test Payment Recording
1. Go to https://talastock.vercel.app
2. Navigate to Credit → Payments
3. Click "Record Payment"
4. Fill in the form:
   - Customer: Jing Collantes
   - Link to Invoice: Select the ₱15,000 invoice
   - Payment Amount: 15000
   - Payment Method: Cash
   - Payment Date: 2026-04-27
5. Click "Record Payment"
6. Should see: "Payment recorded successfully" ✅

## What the Payments API Does

### Record Payment (`POST /api/v1/payments`)
- Records a payment from a customer
- Reduces customer balance immediately
- Applies payment to specific invoice (if selected) or oldest invoice (FIFO)
- Supports partial payments and overpayments
- Updates credit sale status (pending → partially_paid → paid)

### List Payments (`GET /api/v1/payments`)
- Lists all payments with pagination
- Filters by customer, payment method, date range
- Includes customer details

### Get Customer Payments (`GET /api/v1/payments/customers/{customer_id}/payments`)
- Lists all payments for a specific customer
- Filters by payment method, date range

## Expected Behavior After Fix

### Before Payment
- Customer: Jing Collantes
- Current Balance: ₱15,480.00
- Credit Sale: ₱15,000.00 (pending)

### After Payment (₱15,000)
- Customer: Jing Collantes
- Current Balance: ₱480.00 ✅
- Credit Sale: ₱15,000.00 (paid) ✅
- Payment recorded in Payments tab ✅

## Troubleshooting

### Still Getting 404 After Deployment
1. Check Render deployment logs:
   - Go to Render Dashboard
   - Click on `talastocks` service
   - Click "Logs" tab
   - Look for errors during deployment

2. Check if payments router is registered:
   - Look for this line in logs:
     ```
     INFO:     Application startup complete.
     ```
   - If you see errors about `payments` module, there's a deployment issue

3. Check CORS configuration:
   - Make sure `CORS_ORIGINS` environment variable includes:
     ```
     https://talastock.vercel.app,http://localhost:3000
     ```

### Payment Records But Balance Doesn't Update
This is a different issue (database/RLS policy). If payment records successfully but balance doesn't change:
1. Check Supabase RLS policies on `customers` table
2. Check Supabase RLS policies on `payments` table
3. Check browser console for errors

### Payment Records But Credit Sale Status Doesn't Update
1. Check Supabase RLS policies on `credit_sales` table
2. Check if UPDATE policy exists for authenticated users

## Files Involved
- ✅ `backend/routers/payments.py` - Payments API endpoints
- ✅ `backend/main.py` - Registers payments router (line 73)
- ✅ `backend/models/schemas.py` - PaymentCreate, PaymentResponse schemas

## Deployment Checklist
- [ ] Backend deployed to Render
- [ ] Health check returns 200 OK
- [ ] Payments endpoint returns 401 (not 404)
- [ ] Payment recording works in app
- [ ] Customer balance updates correctly
- [ ] Credit sale status updates correctly
- [ ] Payment appears in Payments tab

## Next Steps
1. **Deploy backend on Render** (Manual Deploy button)
2. Wait 2-3 minutes for deployment
3. Test payment recording
4. If still not working, check deployment logs and share screenshot

