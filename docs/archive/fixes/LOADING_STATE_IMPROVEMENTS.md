# Loading State Improvements for Talastock

**Analysis Date:** April 23, 2026  
**Current Status:** Good foundation, needs optimization

---

## 📊 Current State Analysis

### ✅ What You're Doing Well

1. **Skeleton Screens** ✅
   - You have `MetricCardSkeleton`, `ChartSkeleton`, and `TableSkeleton`
   - Used consistently across dashboard, inventory, and reports
   - Maintains layout structure during loading

2. **Parallel Data Fetching** ✅
   - Using `useQueries` in `useDashboardQuery` to fetch all data simultaneously
   - All 7 dashboard queries run in parallel (metrics, charts, sales, etc.)
   - Good use of React Query for caching

3. **Memoization** ✅
   - Charts are memoized with `useMemo` to prevent unnecessary re-renders
   - Reduces performance overhead

4. **Loading States per Component** ✅
   - Each page has its own `loading.tsx` file
   - Individual components show loading states

5. **Caching Strategy** ✅
   - React Query with 2-5 minute stale times
   - Reduces unnecessary API calls

---

## 🚨 Critical Issues to Fix

### 1. **No Progressive Loading** ❌
**Problem:** All data loads together or shows skeleton. Users wait for everything.

**Current Behavior:**
```tsx
{loading ? (
  <>{[...Array(6)].map((_, i) => <MetricCardSkeleton key={i} />)}</>
) : (
  // Show all 6 metrics at once
)}
```

**Better Approach:**
```tsx
// Show metrics as they load individually
<HydrationSafeMetricCard 
  label="Total Products" 
  value={metricsQuery.data?.total_products ?? 0}
  loading={metricsQuery.isLoading}
  icon={<Package />} 
/>
```

**Impact:** Users see data appear progressively instead of waiting for everything.

---

### 2. **Single Loading State for All Queries** ❌
**Problem:** `loading` is true if ANY query is loading. Blocks entire dashboard.

**Current Code:**
```tsx
const loading = queries.some(q => q.isLoading)
```

**Issue:** If one slow query (like dead stock) takes 5 seconds, the entire dashboard shows skeletons for 5 seconds, even though metrics loaded in 200ms.

**Better Approach:**
```tsx
// Individual loading states
const metricsLoading = metricsQuery.isLoading
const salesChartLoading = salesChartQuery.isLoading
const topProductsLoading = topProductsQuery.isLoading
```

**Impact:** Fast data shows immediately, slow data shows skeleton only in its section.

---

### 3. **No Optimistic Defaults** ❌
**Problem:** Empty screen on first load. No cached/stale data shown.

**Current:** Skeleton → Wait → Data

**Better:** Stale Data (with indicator) → Fresh Data

**Implementation:**
```tsx
// Show cached data immediately with "updating" indicator
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['metrics'],
  queryFn: getDashboardMetrics,
  staleTime: 2 * 60 * 1000,
  placeholderData: (previousData) => previousData, // Show old data while fetching
})

// Show subtle indicator when refreshing
{isFetching && !isLoading && (
  <div className="text-xs text-[#B89080]">
    <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
    Updating...
  </div>
)}
```

---

### 4. **No Error States per Section** ❌
**Problem:** If one query fails, entire dashboard might break or show nothing.

**Current:** No visible error handling per widget.

**Better Approach:**
```tsx
{metricsQuery.isError ? (
  <div className="bg-[#FDECEA] rounded-xl border border-[#F2C4B0] p-4">
    <p className="text-xs text-[#C05050]">Failed to load metrics</p>
    <button onClick={() => metricsQuery.refetch()} 
      className="text-xs text-[#E8896A] hover:underline mt-2">
      Retry
    </button>
  </div>
) : (
  <MetricCard data={metricsQuery.data} loading={metricsQuery.isLoading} />
)}
```

---

### 5. **Layout Shift Issues** ⚠️
**Problem:** Skeletons might not match exact final size, causing content jump.

**Current Skeleton:**
```tsx
<div className="h-[280px] w-full bg-[#FDF6F0] rounded-lg animate-pulse" />
```

**Issue:** If actual chart is 300px, there's a 20px jump.

**Fix:** Match exact dimensions
```tsx
// In ChartCard component
<div className="h-[280px] w-full"> {/* Fixed height container */}
  {loading ? <ChartSkeleton /> : <SalesChart data={data} />}
</div>
```

---

### 6. **No Timeout Handling** ❌
**Problem:** If a query takes 30 seconds, user just sees skeleton forever.

**Better:**
```tsx
const { data, isLoading, isError } = useQuery({
  queryKey: ['metrics'],
  queryFn: getDashboardMetrics,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  // Show error after 10 seconds
  meta: {
    timeout: 10000,
  },
})

// Show timeout message
{isLoading && Date.now() - startTime > 8000 && (
  <div className="text-xs text-[#B89080] mt-2">
    This is taking longer than expected...
  </div>
)}
```

---

### 7. **No Priority Loading** ⚠️
**Problem:** All queries have same priority. Heavy charts load at same time as critical metrics.

**Better:**
```tsx
// Load critical data first
const metricsQuery = useQuery({
  queryKey: ['metrics'],
  queryFn: getDashboardMetrics,
  staleTime: 2 * 60 * 1000,
})

// Defer heavy charts until metrics load
const salesChartQuery = useQuery({
  queryKey: ['sales-chart'],
  queryFn: getSalesChartData,
  enabled: metricsQuery.isSuccess, // Only fetch after metrics load
  staleTime: 2 * 60 * 1000,
})
```

---

## 🎯 Recommended Implementation Plan

### Phase 1: Quick Wins (2-3 hours)

#### 1.1 Add Individual Loading States
**File:** `frontend/hooks/useDashboardQuery.ts`

```tsx
export function useDashboardQuery(dateRange: DateRange = '7d') {
  // ... existing code ...
  
  return {
    // Individual loading states
    metrics: {
      data: metricsQuery.data ?? DEFAULT_METRICS,
      loading: metricsQuery.isLoading,
      error: metricsQuery.error,
      refetch: metricsQuery.refetch,
    },
    salesChart: {
      data: salesChartQuery.data ?? [],
      loading: salesChartQuery.isLoading,
      error: salesChartQuery.error,
      refetch: salesChartQuery.refetch,
    },
    topProducts: {
      data: topProductsQuery.data ?? [],
      loading: topProductsQuery.isLoading,
      error: topProductsQuery.error,
      refetch: topProductsQuery.refetch,
    },
    // ... etc for all queries
    
    // Global states
    isAnyLoading: queries.some(q => q.isLoading),
    isAnyError: queries.some(q => q.isError),
    refetchAll: () => queries.forEach(q => q.refetch()),
  }
}
```

#### 1.2 Update Dashboard to Use Individual States
**File:** `frontend/app/(dashboard)/dashboard/page.tsx`

```tsx
export default function DashboardPage() {
  const {
    metrics,
    salesChart,
    topProducts,
    categoryPerformance,
    paymentMethods,
    isAnyLoading,
    refetchAll,
  } = useDashboardQuery(dateRange)

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Cards - show individually as they load */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <HydrationSafeMetricCard 
          label="Total Products" 
          value={metrics.data.total_products}
          loading={metrics.loading}
          error={metrics.error}
          icon={<Package />} 
        />
        {/* ... other metrics */}
      </div>

      {/* Sales Chart - independent loading */}
      <ChartCard title="Sales Trend">
        {salesChart.loading ? (
          <ChartSkeleton />
        ) : salesChart.error ? (
          <ErrorState onRetry={salesChart.refetch} />
        ) : (
          <SalesChart data={salesChart.data} />
        )}
      </ChartCard>
    </div>
  )
}
```

---

### Phase 2: Progressive Loading (3-4 hours)

#### 2.1 Create Enhanced Metric Card with Loading State
**File:** `frontend/components/shared/MetricCard.tsx`

```tsx
interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  change?: number | null
  danger?: boolean
}

export function MetricCard({ 
  label, value, icon, loading, error, onRetry, change, danger 
}: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton />
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
        <div className="w-8 h-8 rounded-lg bg-[#FDECEA] flex items-center justify-center mb-3">
          <AlertTriangle className="w-4 h-4 text-[#C05050]" />
        </div>
        <p className="text-xs text-[#C05050] mb-2">Failed to load</p>
        {onRetry && (
          <button onClick={onRetry} 
            className="text-xs text-[#E8896A] hover:underline">
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#F2C4B0] p-4">
      <div className="w-8 h-8 rounded-lg bg-[#FDE8DF] flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs text-[#B89080] mb-1">{label}</p>
      <p className={cn(
        "text-2xl font-medium",
        danger ? "text-[#C05050]" : "text-[#7A3E2E]"
      )}>
        {value}
      </p>
      {change !== null && change !== undefined && (
        <p className={cn(
          "text-xs mt-1",
          change > 0 ? "text-[#4CAF50]" : "text-[#C05050]"
        )}>
          {change > 0 ? "+" : ""}{change.toFixed(1)}% vs last month
        </p>
      )}
    </div>
  )
}
```

#### 2.2 Add Stale Data Indicator
**File:** `frontend/components/shared/StaleDataIndicator.tsx`

```tsx
export function StaleDataIndicator({ isFetching }: { isFetching: boolean }) {
  if (!isFetching) return null
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-[#B89080] bg-[#FDF6F0] rounded-full px-2 py-1">
      <RefreshCw className="w-3 h-3 animate-spin" />
      <span>Updating...</span>
    </div>
  )
}
```

---

### Phase 3: Priority Loading (2-3 hours)

#### 3.1 Implement Waterfall Loading
**File:** `frontend/hooks/useDashboardQuery.ts`

```tsx
export function useDashboardQuery(dateRange: DateRange = '7d') {
  const { startDate, endDate } = useDateRangeQuery()

  // Priority 1: Critical metrics (load first)
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics', startDate, endDate],
    queryFn: () => getDashboardMetrics(startDate, endDate),
    staleTime: 2 * 60 * 1000,
  })

  // Priority 2: Main chart (load after metrics)
  const salesChartQuery = useQuery({
    queryKey: ['sales-chart', dateRange, startDate, endDate],
    queryFn: () => getSalesChartData(dateRange, startDate, endDate),
    enabled: metricsQuery.isSuccess, // Wait for metrics
    staleTime: 2 * 60 * 1000,
  })

  // Priority 3: Secondary charts (load after main chart)
  const topProductsQuery = useQuery({
    queryKey: ['top-products', startDate, endDate],
    queryFn: () => getTopProductsData(startDate, endDate),
    enabled: salesChartQuery.isSuccess, // Wait for sales chart
    staleTime: 2 * 60 * 1000,
  })

  // Priority 4: Nice-to-have data (load last)
  const deadStockQuery = useQuery({
    queryKey: ['dead-stock', startDate, endDate],
    queryFn: () => getDeadStock(startDate, endDate),
    enabled: topProductsQuery.isSuccess, // Wait for top products
    staleTime: 5 * 60 * 1000,
  })

  return {
    metrics: metricsQuery,
    salesChart: salesChartQuery,
    topProducts: topProductsQuery,
    deadStock: deadStockQuery,
  }
}
```

---

### Phase 4: Error Handling (1-2 hours)

#### 4.1 Create Error State Component
**File:** `frontend/components/shared/ErrorState.tsx`

```tsx
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  compact?: boolean
}

export function ErrorState({ 
  title = "Failed to load data",
  message = "Something went wrong. Please try again.",
  onRetry,
  compact = false
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#C05050] bg-[#FDECEA] rounded px-2 py-1">
        <AlertTriangle className="w-3 h-3" />
        <span>Failed to load</span>
        {onRetry && (
          <button onClick={onRetry} className="text-[#E8896A] hover:underline ml-1">
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#FDECEA] flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-[#C05050]" />
      </div>
      <h3 className="text-sm font-medium text-[#7A3E2E] mb-1">{title}</h3>
      <p className="text-xs text-[#B89080] mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 h-8 px-3 text-xs bg-[#E8896A] hover:bg-[#C1614A] text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Try Again
        </button>
      )}
    </div>
  )
}
```

---

## 📈 Expected Impact

### Before Improvements
- **First Paint:** 2-3 seconds (all skeletons)
- **Full Load:** 3-5 seconds (all data at once)
- **Perceived Performance:** Slow, blocking
- **Error Handling:** Poor, entire dashboard fails

### After Improvements
- **First Paint:** 200-500ms (critical metrics)
- **Progressive Load:** 500ms → 1s → 2s → 3s (data appears incrementally)
- **Perceived Performance:** Fast, responsive
- **Error Handling:** Graceful, per-section retry

### User Experience Improvements
1. **Faster perceived load time** - Users see data in 200ms instead of 3s
2. **Better feedback** - Know what's loading and what failed
3. **Graceful degradation** - One failed query doesn't break everything
4. **Reduced frustration** - No more staring at blank screens

---

## 🎯 Priority Ranking

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Individual loading states | 🔥🔥🔥 High | 2-3h | ⭐⭐⭐ Do First |
| Error states per section | 🔥🔥🔥 High | 1-2h | ⭐⭐⭐ Do First |
| Progressive loading | 🔥🔥 Medium | 3-4h | ⭐⭐ Do Second |
| Stale data indicators | 🔥 Low | 1h | ⭐ Do Third |
| Priority loading | 🔥 Low | 2-3h | ⭐ Do Third |
| Timeout handling | 🔥 Low | 1h | ⭐ Nice to have |

---

## 🚀 Quick Start

**This Weekend (4-5 hours):**
1. Implement individual loading states (2-3h)
2. Add error states per section (1-2h)
3. Test and polish (1h)

**Result:** Dashboard feels 2-3x faster with better error handling!

---

## 📝 Testing Checklist

After implementing improvements:

- [ ] Dashboard loads metrics in < 500ms
- [ ] Charts appear progressively (not all at once)
- [ ] Failed queries show error with retry button
- [ ] Stale data shows "updating" indicator
- [ ] No layout shift when data loads
- [ ] Slow network (throttle to 3G) still feels responsive
- [ ] One failed query doesn't break entire dashboard

---

**Want me to implement Phase 1 (Individual Loading States) right now?** It's the highest impact improvement and only takes 2-3 hours! 🚀

