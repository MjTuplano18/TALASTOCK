# Dashboard Auto-Refresh Fix & Date Filter Fix

## Problem 1: Auto-Refresh Not Working
After recording a payment on the Credit Dashboard tab, the metrics and charts did not auto-refresh. The user had to manually refresh the page to see updated data.

### Root Cause
The `refresh()` function in `useDashboardQuery` only refetches **Overview tab** data (metrics, sales chart, top products, etc.). The **Credit Dashboard tab** has its own independent `fetchCreditMetrics()` function that was not being triggered when a payment was recorded.

### Solution
Implemented a refresh trigger mechanism using React state:

#### 1. Added `refreshTrigger` prop to `CreditDashboardTab`
- Added optional `refreshTrigger?: number` prop
- Added `refreshTrigger` to the `useEffect` dependency array
- When `refreshTrigger` changes, `fetchCreditMetrics()` is called automatically

#### 2. Updated Dashboard Page
- Added `creditRefreshTrigger` state: `const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0)`
- Passed trigger to Credit tab: `<CreditDashboardTab dateRange={dateRange} refreshTrigger={creditRefreshTrigger} />`
- Updated `RecordPaymentTrigger` onSuccess callback:
  ```typescript
  onSuccess={() => {
    refresh() // Refresh overview tab
    setCreditRefreshTrigger(prev => prev + 1) // Trigger credit tab refresh
  }}
  ```

## Problem 2: Date Filter Not Working on Credit Tab
The date filter (DateRangeFilter) was not affecting the Credit Dashboard tab. Changing the date range only updated the Overview tab, but the Credit tab always showed data for the last 30 days.

### Root Cause
The Dashboard page had a local `dateRange` state initialized to `'7d'` that was never updated. The `DateRangeFilter` component uses a global context (`useDateRangeQuery`), but the local `dateRange` state was what was being passed to the `CreditDashboardTab`.

- **Overview tab**: Uses `startDate` and `endDate` from global context ✅
- **Credit tab**: Uses local `dateRange` state that never changes ❌

### Solution
Removed the local `dateRange` state and converted the global date range preset into the simple format that the Credit tab backend expects:

```typescript
const { startDate, endDate, preset } = useDateRangeQuery()

// Convert global date range preset to simple format for Credit tab
const dateRange: DateRange = useMemo(() => {
  if (preset === 'last_7_days' || preset === 'today' || preset === 'yesterday') return '7d'
  if (preset === 'last_30_days' || preset === 'this_month') return '30d'
  if (preset === 'last_month') return '3m'
  if (preset === 'this_year') return '6m'
  if (preset === 'custom') {
    // For custom ranges, estimate based on date difference
    if (!startDate || !endDate) return '30d'
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 7) return '7d'
    if (days <= 30) return '30d'
    if (days <= 90) return '3m'
    return '6m'
  }
  return '30d' // default
}, [preset, startDate, endDate])
```

### Mapping Logic
- **Today, Yesterday, Last 7 days** → `'7d'`
- **Last 30 days, This month** → `'30d'`
- **Last month** → `'3m'`
- **This year** → `'6m'`
- **Custom range** → Calculated based on day difference

## How It Works Now
1. User changes date filter using `DateRangeFilter`
2. Global context updates (`preset`, `startDate`, `endDate`)
3. Dashboard page's `useMemo` recalculates `dateRange` string
4. `CreditDashboardTab` receives new `dateRange` prop
5. `useEffect` detects the change and calls `fetchCreditMetrics()`
6. Credit metrics, charts, and table all refresh with new date range

## Files Changed
- `frontend/components/credit/CreditDashboardTab.tsx` - Added refreshTrigger prop
- `frontend/app/(dashboard)/dashboard/page.tsx` - Added trigger state, removed local dateRange state, added preset-to-range conversion

## Testing
### Auto-Refresh Test
1. Go to Dashboard → Credit tab
2. Click "Record Payment"
3. Record a payment for any customer
4. Verify that:
   - Total Credit Outstanding updates immediately
   - Overdue Balance updates immediately
   - Customers Near Limit updates immediately
   - Charts refresh
   - Overdue Customers table refreshes
   - No manual page refresh needed

### Date Filter Test
1. Go to Dashboard → Credit tab
2. Change date filter to "Last 7 days"
3. Verify Credit metrics update
4. Change to "This month"
5. Verify Credit metrics update again
6. Try custom date range
7. Verify Credit metrics update based on range

## Notes
- Customer detail page already had proper refresh logic (refetches all data after payment)
- Both fixes only apply to the Dashboard Credit tab
- The trigger pattern is simple and doesn't require complex state management
- Date range conversion handles all preset types and custom ranges
