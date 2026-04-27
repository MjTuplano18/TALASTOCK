# Credit Dashboard Analysis & Recommendations

## Current Status

### What's Working ✅
1. **KPI Metrics** - Showing real data:
   - Total Credit Outstanding: ₱480.00
   - Overdue Balance: ₱0.00
   - Customers Near Limit: 0

2. **Overdue Customers Table** - Working correctly:
   - Shows "No Overdue Customers" when none exist
   - Will display table with customer details when there are overdue accounts

### What's Not Working ❌
1. **Credit Sales Trend Chart** - Shows "No credit sales data available"
2. **Payment Collection Chart** - Shows "No payment data available"

## Why Charts Are Empty

Looking at the code, both charts have this comment:
```typescript
// The aggregate=daily endpoint is not yet implemented on the backend.
// Show empty state until it's available.
```

**Root Cause**: The backend doesn't have endpoints to provide time-series data for:
- Daily credit sales aggregated by date
- Daily payment collections aggregated by date

The charts need endpoints like:
- `GET /api/v1/credit-sales?aggregate=daily&range=7d`
- `GET /api/v1/payments?aggregate=daily&range=7d`

## Recommended Dashboard Improvements

### Priority 1: Essential Charts (Implement First)

#### 1. **Credit Sales Trend** (Line Chart)
**Purpose**: Show daily credit sales over time to identify patterns

**Backend Endpoint Needed**:
```python
@router.get("/credit-sales/trend")
async def get_credit_sales_trend(range: str = "30d"):
    # Group credit_sales by created_at date
    # Return: [{ date: "2026-04-20", amount: 1500 }, ...]
```

**Business Value**: 
- Identify peak credit sales days
- Spot trends (increasing/decreasing credit usage)
- Plan inventory for credit customers

---

#### 2. **Payment Collection Trend** (Bar Chart)
**Purpose**: Show daily payment collections to track cash flow

**Backend Endpoint Needed**:
```python
@router.get("/payments/trend")
async def get_payment_trend(range: str = "30d"):
    # Group payments by payment_date
    # Return: [{ date: "2026-04-20", amount: 800 }, ...]
```

**Business Value**:
- Monitor cash flow from credit customers
- Identify collection patterns
- Plan working capital needs

---

### Priority 2: High-Value Charts (Add Next)

#### 3. **Credit Utilization by Customer** (Horizontal Bar Chart)
**Purpose**: Show which customers are using most of their credit limit

**Data Source**: Already available from `/api/v1/reports/credit-kpis`

**Implementation**: 
```typescript
// Show top 10 customers by credit utilization %
// Example: "Juan Dela Cruz: 85% (₱4,250 / ₱5,000)"
```

**Business Value**:
- Identify customers who may need limit increases
- Spot potential credit risks early
- Prioritize collection efforts

---

#### 4. **Aging Analysis** (Stacked Bar Chart)
**Purpose**: Show how long credit has been outstanding

**Categories**:
- Current (0-30 days): Green
- 31-60 days: Yellow
- 61-90 days: Orange
- 90+ days: Red

**Backend Endpoint Needed**:
```python
@router.get("/credit-sales/aging")
async def get_aging_analysis():
    # Group by days_outstanding
    # Return: { current: 5000, "31-60": 2000, "61-90": 500, "90+": 100 }
```

**Business Value**:
- Identify collection priorities
- Assess credit risk
- Improve cash flow management

---

#### 5. **Payment Method Distribution** (Donut Chart)
**Purpose**: Show how customers are paying (cash, bank transfer, check, etc.)

**Data Source**: `payments` table, group by `payment_method`

**Implementation**:
```typescript
// Show: Cash: 60%, Bank Transfer: 30%, Check: 10%
```

**Business Value**:
- Understand customer payment preferences
- Optimize payment collection methods
- Reduce transaction costs

---

### Priority 3: Advanced Analytics (Future)

#### 6. **Collection Efficiency Rate** (Gauge Chart)
**Formula**: `(Payments Collected / Total Due) × 100`

**Example**: If ₱10,000 was due and ₱8,500 was collected = 85% efficiency

**Business Value**:
- Measure collection team performance
- Set collection targets
- Identify improvement areas

---

#### 7. **Credit vs Cash Sales Comparison** (Stacked Area Chart)
**Purpose**: Compare credit sales vs cash sales over time

**Business Value**:
- Understand sales mix
- Assess credit policy impact
- Plan financing needs

---

#### 8. **Top Credit Customers** (Table with Sparklines)
**Purpose**: Show top 10 customers by total credit sales with mini trend charts

**Columns**:
- Customer Name
- Total Credit Sales
- Current Balance
- Payment History (sparkline)
- Last Payment Date

**Business Value**:
- Identify VIP credit customers
- Prioritize relationship management
- Spot payment pattern changes

---

## Implementation Roadmap

### Phase 1: Fix Empty Charts (1-2 days)
1. Create backend endpoints for credit sales trend
2. Create backend endpoints for payment collection trend
3. Update frontend charts to fetch real data
4. Test with actual data

### Phase 2: Add High-Value Charts (2-3 days)
1. Implement Credit Utilization chart
2. Implement Aging Analysis chart
3. Implement Payment Method Distribution chart

### Phase 3: Advanced Analytics (3-5 days)
1. Implement Collection Efficiency gauge
2. Implement Credit vs Cash comparison
3. Implement Top Credit Customers table

---

## Quick Wins (Can Implement Today)

### 1. Credit Utilization Chart
**No backend changes needed!** The data is already available from the KPI endpoint.

```typescript
// Fetch customers with >50% utilization
const response = await apiFetch('/api/v1/customers')
const customers = response.data.filter(c => 
  (c.current_balance / c.credit_limit) > 0.5
)
// Display as horizontal bar chart
```

### 2. Payment Method Distribution
**No backend changes needed!** Query payments table directly.

```typescript
// Group payments by payment_method
const payments = await supabase
  .from('payments')
  .select('payment_method, amount')
  .gte('payment_date', startDate)
  .lte('payment_date', endDate)

// Aggregate and display as donut chart
```

---

## Recommended Chart Library Additions

Current: Recharts (via shadcn/ui Charts)

**Consider adding**:
- **Gauge charts**: For collection efficiency, credit utilization
- **Sparklines**: For mini trend indicators in tables
- **Heatmaps**: For payment patterns by day of week/month

---

## Dashboard Layout Recommendation

### Current Layout:
```
[KPI 1] [KPI 2] [KPI 3]
[Empty Chart] [Empty Chart]
[Overdue Table]
```

### Recommended Layout:
```
[KPI 1] [KPI 2] [KPI 3]
[Credit Sales Trend (full width)]
[Payment Collection] [Credit Utilization]
[Aging Analysis] [Payment Methods]
[Overdue Customers Table]
```

---

## Data You Already Have

From your screenshot, you have:
- ✅ Total Credit Outstanding: ₱480.00
- ✅ Overdue Balance: ₱0.00
- ✅ Customers Near Limit: 0
- ✅ Overdue customers list (currently empty)

**This means**:
- You have at least one credit sale (₱480.00 outstanding)
- Customer is not overdue yet (within payment terms)
- Customer is not near their credit limit

---

## Next Steps

### Option A: Quick Fix (Recommended)
1. Implement Credit Utilization chart (no backend needed)
2. Implement Payment Method Distribution (no backend needed)
3. Add placeholder text explaining trend charts need more data over time

### Option B: Complete Solution
1. Build backend endpoints for time-series data
2. Implement all Priority 1 & 2 charts
3. Add export functionality for credit reports

### Option C: Hybrid Approach (Best)
1. Implement Quick Wins today (Option A)
2. Build backend endpoints this week
3. Roll out Priority 1 charts next week
4. Add Priority 2 charts as needed

---

## Sample Backend Endpoint (Credit Sales Trend)

```python
@router.get("/credit-sales/trend")
async def get_credit_sales_trend(
    range: str = Query("30d", description="7d, 30d, 3m, 6m"),
    user=Depends(verify_token)
):
    db = get_supabase()
    
    # Calculate date range
    days = {"7d": 7, "30d": 30, "3m": 90, "6m": 180}[range]
    start_date = (datetime.utcnow() - timedelta(days=days)).date()
    
    # Query credit sales grouped by date
    result = db.rpc('get_credit_sales_by_date', {
        'start_date': start_date.isoformat()
    }).execute()
    
    return {"success": True, "data": result.data}
```

**SQL Function**:
```sql
CREATE OR REPLACE FUNCTION get_credit_sales_by_date(start_date date)
RETURNS TABLE(date date, amount numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    created_at::date as date,
    SUM(amount) as amount
  FROM credit_sales
  WHERE created_at::date >= start_date
  GROUP BY created_at::date
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;
```

---

## Conclusion

Your Credit Dashboard has a solid foundation with working KPIs and overdue tracking. The empty charts are due to missing backend endpoints for time-series data, not a frontend issue.

**Recommended Action**: Start with Quick Wins (Credit Utilization + Payment Methods) today, then build the backend endpoints for trend charts this week.
