# Deploy Dashboard KPI Cache Fix

## Changes Summary
Fixed the 5-minute delay in dashboard KPI updates by adding cache invalidation when credit sales or payments are created.

## Files Changed
- `backend/routers/credit_sales.py` - Added `invalidate_pattern` import and cache invalidation
- `backend/routers/payments.py` - Added `invalidate_pattern` import and cache invalidation

## Deployment Steps

### 1. Commit Changes
```bash
git add backend/routers/credit_sales.py backend/routers/payments.py
git commit -m "fix: invalidate credit KPIs cache on payment/sale creation

- Add invalidate_pattern import to credit_sales and payments routers
- Invalidate reports:credit-kpis:* cache after creating credit sales
- Invalidate reports:credit-kpis:* cache after recording payments
- Fixes 5-minute delay in dashboard Total Credit Outstanding updates"
```

### 2. Push to Main
```bash
git push origin main
```

### 3. Monitor Render Deployment
- Go to: https://dashboard.render.com
- Watch the deployment logs for `talastocks` service
- Deployment typically takes 2-3 minutes
- Wait for "Deploy succeeded" message

### 4. Verify Deployment
```bash
# Check backend is running
curl https://talastocks.onrender.com/health

# Test credit sale creation (replace YOUR_TOKEN and customer_id)
curl -X POST https://talastocks.onrender.com/api/v1/credit-sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "amount": 100,
    "notes": "Test cache invalidation"
  }'

# Immediately check KPIs (should reflect new sale)
curl https://talastocks.onrender.com/api/v1/reports/credit-kpis?range=30d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test on Frontend
1. Go to: https://talastock.vercel.app
2. Login to your account
3. Navigate to Dashboard → Credit tab
4. Note the current "Total Credit Outstanding" value
5. Record a new credit sale or payment
6. Refresh the dashboard (or wait for auto-refresh)
7. **Expected**: Total Credit Outstanding updates within 1-2 seconds
8. **Before fix**: Would take up to 5 minutes to update

## Rollback Plan (If Needed)

If the deployment causes issues:

```bash
# Revert the commit
git revert HEAD

# Push the revert
git push origin main

# Render will auto-deploy the reverted version
```

## Expected Behavior

### Before Fix ❌
- Record payment → Dashboard shows old balance for 5 minutes
- User confusion: "Why isn't my payment showing?"
- Multiple page refreshes don't help

### After Fix ✅
- Record payment → Dashboard updates within 1-2 seconds
- Real-time feel for users
- Cache still improves read performance

## Performance Impact
- **Minimal**: Cache invalidation adds ~5-10ms to write operations
- **Benefit**: Dashboard always shows current data
- **Trade-off**: Slightly more database queries (only when data changes)

## Notes
- Frontend requires no changes (already has auto-refresh)
- Cache is only cleared on writes (credit sales, payments)
- Cache is still used for reads (performance benefit)
- Pattern matching ensures all date ranges are cleared (7d, 30d, 3m, 6m)
