# Fix: Dashboard Not Deducting Refunded Sales

## Problem
When a sale is refunded, the dashboard metrics still include the refunded amount in "Sales This Month" and charts.

### Example:
- Original sale: ₱9,000
- Refunded: ₱9,000 (full refund)
- **Expected**: Dashboard shows ₱358,292 (₱367,292 - ₱9,000)
- **Actual**: Dashboard still shows ₱367,292 ❌

## Root Cause
All dashboard queries were calculating total sales like this:

```typescript
// ❌ WRONG - Includes refunded amounts
const total = salesData.reduce((sum, s) => sum + s.total_amount, 0)
```

This adds up ALL `total_amount` values, even for refunded sales. It should subtract `refunded_amount`:

```typescript
// ✅ CORRECT - Subtracts refunded amounts
const total = salesData.reduce((sum, s) => {
  return sum + (s.total_amount - (s.refunded_amount || 0))
}, 0)
```

## What Was Fixed

### 1. Dashboard Metrics (`getDashboardMetrics`)
**Before:**
```typescript
const { data: salesData } = await supabase.from('sales').select('total_amount')
const total_sales_revenue = salesData.reduce((sum, s) => sum + s.total_amount, 0)
```

**After:**
```typescript
const { data: salesData } = await supabase.from('sales').select('total_amount, refunded_amount, status')
const total_sales_revenue = salesData.reduce((sum, s) => {
  const netAmount = s.total_amount - (s.refunded_amount || 0)
  return sum + netAmount
}, 0)
```

**Also:**
- Sales count now excludes fully refunded sales
- Last month revenue also subtracts refunded amounts
- Gross profit calculation excludes refunded sales

### 2. Sales Chart (`getSalesChartData`)
Fixed all 3 query locations (custom date range, daily, weekly) to subtract refunded amounts.

**Before:**
```typescript
const { data } = await supabase.from('sales').select('total_amount')
const sales = data.reduce((sum, s) => sum + s.total_amount, 0)
```

**After:**
```typescript
const { data } = await supabase.from('sales').select('total_amount, refunded_amount')
const sales = data.reduce((sum, s) => {
  return sum + (s.total_amount - (s.refunded_amount || 0))
}, 0)
```

### 3. Revenue Chart (`getRevenueChartData`)
Fixed both custom date range and default 6-month queries.

**Before:**
```typescript
const { data } = await supabase.from('sales').select('total_amount')
const revenue = data.reduce((sum, s) => sum + s.total_amount, 0)
```

**After:**
```typescript
const { data } = await supabase.from('sales').select('total_amount, refunded_amount')
const revenue = data.reduce((sum, s) => {
  return sum + (s.total_amount - (s.refunded_amount || 0))
}, 0)
```

## Expected Behavior After Fix

### Dashboard Metrics
- **Sales This Month**: ₱367,292 - ₱9,000 = **₱358,292** ✅
- **Sales Count**: Excludes fully refunded sales ✅
- **Gross Profit**: Calculated only from non-refunded sales ✅

### Sales Trend Chart
- Each day's sales subtract refunded amounts ✅
- If a sale is refunded on the same day, chart shows net amount ✅

### Revenue Chart
- Each month's revenue subtracts refunded amounts ✅
- Reflects actual revenue after refunds ✅

## How Refunds Are Handled

### Full Refund
- Sale status: `'refunded'`
- `refunded_amount` = `total_amount`
- **Net revenue**: ₱0 (₱9,000 - ₱9,000)
- **Excluded from sales count**

### Partial Refund
- Sale status: `'partially_refunded'`
- `refunded_amount` = amount refunded (e.g., ₱3,000)
- **Net revenue**: ₱6,000 (₱9,000 - ₱3,000)
- **Included in sales count**

### No Refund
- Sale status: `'completed'`
- `refunded_amount` = 0 or null
- **Net revenue**: ₱9,000 (₱9,000 - ₱0)
- **Included in sales count**

## Files Modified
- ✅ `frontend/lib/supabase-queries.ts`
  - `getDashboardMetrics()` - Fixed sales revenue, count, and gross profit
  - `getSalesChartData()` - Fixed all 3 query locations
  - `getRevenueChartData()` - Fixed both query locations

## Testing Checklist
- [ ] Dashboard "Sales This Month" deducts refunded amounts
- [ ] Dashboard "Sales Count" excludes fully refunded sales
- [ ] Sales Trend chart shows net sales (after refunds)
- [ ] Revenue chart shows net revenue (after refunds)
- [ ] Partial refunds show correct net amount
- [ ] Full refunds show ₱0 net revenue

## Example Scenarios

### Scenario 1: Full Refund on Same Day
- 9:00 AM: Sale ₱9,000 → Dashboard shows ₱9,000
- 3:00 PM: Full refund ₱9,000 → Dashboard shows ₱0 ✅

### Scenario 2: Partial Refund
- Day 1: Sale ₱9,000 → Dashboard shows ₱9,000
- Day 2: Partial refund ₱3,000 → Dashboard shows ₱6,000 ✅

### Scenario 3: Multiple Sales and Refunds
- Sale 1: ₱10,000 (completed)
- Sale 2: ₱5,000 (refunded ₱2,000) → Net: ₱3,000
- Sale 3: ₱8,000 (fully refunded) → Net: ₱0
- **Total**: ₱10,000 + ₱3,000 + ₱0 = **₱13,000** ✅

## Deployment
Changes pushed to GitHub and will auto-deploy to Vercel.

After deployment:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check dashboard metrics
3. Verify refunded sales are deducted correctly

