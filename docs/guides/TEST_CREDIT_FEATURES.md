# How to Test Credit Features

## Why Charts Show "No Data"

The credit dashboard charts are showing empty states because:

1. **Credit Sales Trend**: No credit sales recorded yet
2. **Credit Utilization**: No customers have outstanding credit balance
3. **Payment Collection**: No payments recorded yet

This is **normal** - you need to add data first!

---

## Step-by-Step: Add Test Data

### 1. Create a Customer with Credit Limit

1. Go to **Customers** page
2. Click **Add Customer**
3. Fill in:
   - Name: `Test Customer`
   - Business Name: `Test Business` (optional)
   - Credit Limit: `10000` (₱10,000)
   - Payment Terms: `30 days`
4. Click **Save**

### 2. Record a Credit Sale

1. Go to **Sales** page
2. Click **Record Sale**
3. Select products and quantities
4. **Important**: Select **Credit** as payment method
5. Select the customer you just created
6. Click **Record Sale**

### 3. Check Credit Dashboard

1. Go to **Dashboard**
2. Click **Credit** tab
3. You should now see:
   - **Total Credit Outstanding**: Shows the sale amount
   - **Credit Sales Trend**: Shows a data point for today
   - **Credit Utilization**: Shows the customer with their balance

### 4. Record a Payment (Optional)

1. On Credit Dashboard, click **Record Payment** button
2. Select the customer
3. Enter payment amount
4. Click **Record Payment**
5. **Payment Collection** chart will now show data

---

## Quick Test with Multiple Sales

To see better charts, record multiple credit sales:

1. Record 3-5 credit sales over different dates (you can manually adjust dates in database if needed)
2. Use different customers
3. Vary the amounts

---

## Checking Database Directly

If you want to verify data exists:

### Check Credit Sales
```sql
SELECT 
  s.id,
  s.total_amount,
  s.payment_method,
  s.customer_id,
  c.name as customer_name,
  s.created_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.payment_method = 'credit'
ORDER BY s.created_at DESC
LIMIT 10;
```

### Check Customer Balances
```sql
SELECT 
  name,
  business_name,
  current_balance,
  credit_limit,
  (current_balance / NULLIF(credit_limit, 0) * 100) as utilization_pct
FROM customers
WHERE is_active = true
  AND credit_limit > 0
  AND current_balance > 0
ORDER BY current_balance DESC;
```

### Check Payments
```sql
SELECT 
  p.id,
  p.amount,
  p.payment_date,
  c.name as customer_name,
  p.created_at
FROM credit_payments p
LEFT JOIN customers c ON p.customer_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## Expected Results After Adding Data

### Credit Sales Trend Chart
- Shows daily credit sales amounts
- Line graph with dates on X-axis
- Hover to see exact amounts

### Credit Utilization Chart
- Shows top customers by credit usage
- Horizontal bar chart
- Red bars = >80% utilized (warning)
- Orange bars = 70-80% utilized
- Brown bars = <70% utilized

### Payment Collection Chart
- Shows daily payment amounts
- Bar chart with dates on X-axis
- Hover to see exact amounts

---

## Troubleshooting

### "No credit sales data available"
**Cause**: No sales with `payment_method = 'credit'`
**Fix**: Record a sale and select "Credit" as payment method

### "No customers with credit balance"
**Cause**: All customers have `current_balance = 0`
**Fix**: Record a credit sale (this automatically updates customer balance)

### "No payment data available"
**Cause**: No payments recorded in `credit_payments` table
**Fix**: Use "Record Payment" button to record a payment

### Charts still empty after adding data
**Cause**: Frontend not refreshing or CORS error
**Fix**: 
1. Check browser console for errors
2. Refresh the page (F5)
3. Check CORS configuration (see FIX_CORS_AND_ERRORS.md)

---

## Sample Test Scenario

Here's a complete test scenario:

1. **Create 2 customers:**
   - Customer A: Credit limit ₱10,000
   - Customer B: Credit limit ₱5,000

2. **Record 3 credit sales:**
   - Day 1: Customer A, ₱3,000
   - Day 2: Customer B, ₱2,000
   - Day 3: Customer A, ₱4,000

3. **Record 1 payment:**
   - Customer A pays ₱2,000

4. **Expected Dashboard:**
   - Total Outstanding: ₱7,000 (3k + 4k - 2k + 2k)
   - Credit Sales Trend: 3 data points
   - Credit Utilization: 
     - Customer A: 50% (5k / 10k)
     - Customer B: 40% (2k / 5k)
   - Payment Collection: 1 data point

---

## Notes

- Charts update in real-time when you record new sales/payments
- Date range filter affects trend charts but not KPI metrics
- Empty states are intentional - they guide users to add data
- All amounts are in Philippine Pesos (₱)
