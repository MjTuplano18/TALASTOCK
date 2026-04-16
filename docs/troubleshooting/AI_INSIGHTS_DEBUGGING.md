# AI Insights Debugging Guide

## Issue: AI Shows "Zero" Despite Having Data

If you've added products and sales but AI Insight still shows "zero revenue" or "no products", follow these debugging steps:

### Step 1: Clear AI Cache

The AI responses are cached for 5 minutes. To force a fresh analysis:

1. Go to Dashboard
2. Find the "AI Insight" card
3. Click the **refresh button** (circular arrow icon) in the top-right corner
4. Wait 2-3 seconds for the new response

### Step 2: Check Date Range Filter

The dashboard has a date range filter that affects what data is shown:

1. Look at the top of the dashboard for date range buttons: **7d, 30d, 3m, 6m**
2. Make sure your sales fall within the selected date range
3. If you just added sales today, select **7d** (last 7 days)
4. Click refresh on AI Insight card after changing date range

### Step 3: Verify Data in Database

Open your browser's Developer Console (F12) and run:

```javascript
// Check if you have products
const { data: products } = await supabase.from('products').select('*').eq('is_active', true)
console.log('Products:', products?.length)

// Check if you have sales
const { data: sales } = await supabase.from('sales').select('*')
console.log('Sales:', sales?.length)

// Check sales total
const total = sales?.reduce((sum, s) => sum + s.total_amount, 0)
console.log('Total Revenue:', total)
```

### Step 4: Check Network Request

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Click refresh on AI Insight card
4. Look for a request to `/api/ai`
5. Click on it and check:

**Request Payload:**
```json
{
  "type": "dashboard_insight",
  "metrics": {
    "total_products": 0,  // ← Should NOT be 0 if you have products
    "total_sales_revenue": 0,  // ← Should NOT be 0 if you have sales
    "total_inventory_value": 0,
    "low_stock_count": 0
  },
  "topProducts": [],
  "salesChart": []
}
```

**Response:**
```json
{
  "insight": "The business currently has no products...",
  "cached": false
}
```

### Step 5: Check What's Being Sent

If the request payload shows `total_products: 0` and `total_sales_revenue: 0`, then the issue is with the dashboard metrics query, not the AI.

**Possible causes:**
1. **Date range filter** - Your sales are outside the selected date range
2. **User ID mismatch** - Sales were created by a different user
3. **RLS policies** - Row Level Security is blocking your data
4. **Deleted sales** - Sales were deleted or marked inactive

### Step 6: Force Refresh Dashboard Data

1. Go to Dashboard
2. Click the **Refresh** button at the top of the page
3. Wait for all metrics to reload
4. Check if the metric cards show correct numbers:
   - Total Products
   - Sales This Month
   - Inventory Value
5. If these show 0, the issue is with data fetching, not AI

### Step 7: Check Browser Console for Errors

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for any red error messages
4. Common errors:
   - `Failed to fetch` - Network issue
   - `Unauthorized` - Session expired
   - `RLS policy violation` - Permission issue

### Step 8: Verify Sales Date

Your sales might be dated in the future or far in the past:

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  total_amount,
  created_at,
  NOW() - created_at as age
FROM sales
ORDER BY created_at DESC
LIMIT 10;
```

If `created_at` is in the future or more than 30 days ago, it won't show in the default date range.

### Step 9: Check RLS Policies

Row Level Security might be blocking your data:

```sql
-- Run in Supabase SQL Editor
-- Check if you can see your sales
SELECT COUNT(*) FROM sales;

-- Check if you can see your products
SELECT COUNT(*) FROM products WHERE is_active = true;

-- Check your user ID
SELECT auth.uid();
```

If these return 0 but you know you have data, RLS policies might be too restrictive.

### Step 10: Clear All Caches

If nothing works, clear all caches:

1. **Browser Cache:**
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Local Storage:**
   - Open Developer Tools (F12)
   - Go to **Application** tab
   - Click **Local Storage** → your domain
   - Right-click → Clear
   - Click **Session Storage** → your domain
   - Right-click → Clear

3. **Hard Refresh:**
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Refresh AI:**
   - Click refresh button on AI Insight card

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] I have products in the Products page
- [ ] I have sales in the Sales page
- [ ] My sales are within the last 30 days
- [ ] The dashboard metric cards show correct numbers (not all zeros)
- [ ] I clicked the refresh button on AI Insight card
- [ ] I checked the Network tab and saw the request to `/api/ai`
- [ ] The request payload shows correct numbers (not zeros)
- [ ] I don't see any errors in the Console tab
- [ ] I tried clearing cache and hard refreshing

## Still Not Working?

If you've tried everything above and AI still shows "zero":

1. **Take a screenshot** of:
   - Dashboard with metric cards visible
   - Network tab showing the `/api/ai` request payload
   - Console tab showing any errors

2. **Check the actual data:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT 
     (SELECT COUNT(*) FROM products WHERE is_active = true) as products,
     (SELECT COUNT(*) FROM sales) as sales,
     (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at >= NOW() - INTERVAL '30 days') as revenue_30d,
     (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at >= DATE_TRUNC('month', NOW())) as revenue_this_month;
   ```

3. **Share the results** so we can identify the exact issue

## Common Solutions

### Solution 1: Date Range Issue
**Problem:** Sales are older than 30 days  
**Fix:** Change date range to 3m or 6m

### Solution 2: Cache Issue
**Problem:** Old cached response  
**Fix:** Click refresh button on AI card

### Solution 3: Session Expired
**Problem:** User session expired  
**Fix:** Log out and log back in

### Solution 4: RLS Policy Too Strict
**Problem:** Can't see own data  
**Fix:** Check RLS policies in Supabase

### Solution 5: Wrong User ID
**Problem:** Sales created by different user  
**Fix:** Check `created_by` field in sales table

## Expected Behavior

When working correctly:

1. **Dashboard loads** → Shows correct metrics (products, sales, revenue)
2. **AI Insight loads** → Shows "Generating insights..." or cached insight
3. **Click refresh** → Shows loading animation
4. **After 2-3 seconds** → Shows new insight with specific numbers
5. **Insight mentions your actual data** → "₱45,230 in revenue", "23 products", etc.

If any step fails, use the debugging steps above to identify where it breaks.
