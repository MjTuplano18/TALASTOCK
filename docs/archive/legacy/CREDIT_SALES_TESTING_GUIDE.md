# Credit Sales Testing Guide

## Quick Start

### 1. Start Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Login
Go to http://localhost:3000/login and login with your credentials.

## Test Scenarios

### Scenario 1: Basic Credit Sale (Happy Path)

**Setup:**
- Customer: Jenilyn Tuplano
- Credit Limit: ₱5,000
- Current Balance: ₱0

**Steps:**
1. Go to Sales page
2. Click "Record Sale"
3. Add product: Sample Product, Qty: 1, Price: ₱140
4. Select "Credit Sale"
5. Select customer "Jenilyn Tuplano"
6. Verify displayed info:
   - Credit Limit: ₱5,000
   - Current Balance: ₱0.00
   - Available Credit: ₱5,000
   - New Balance: ₱140.00
   - Credit Utilization: 2.8%
   - Payment Terms: 30 days
   - Due Date: (30 days from today)
7. Click "Record Sale"

**Expected Results:**
- ✅ Success toast: "Sale recorded successfully"
- ✅ Sale appears in Sales list
- ✅ Payment method shows "Credit"
- ✅ Customer name shows "Jenilyn Tuplano"

**Verify in Database:**
```sql
-- Check sales table
SELECT * FROM sales WHERE payment_method = 'credit' ORDER BY created_at DESC LIMIT 1;

-- Check credit_sales table
SELECT * FROM credit_sales ORDER BY created_at DESC LIMIT 1;

-- Check customer balance
SELECT name, credit_limit, current_balance, 
       (credit_limit - current_balance) as available_credit
FROM customers WHERE name LIKE '%Jenilyn%';
```

**Expected Database State:**
- `sales.payment_method` = 'credit'
- `sales.customer_id` = Jenilyn's UUID
- `credit_sales.amount` = 140.00
- `credit_sales.status` = 'pending'
- `customers.current_balance` = 140.00

---

### Scenario 2: Near Credit Limit Warning

**Setup:**
- Customer: Jenilyn Tuplano
- Credit Limit: ₱5,000
- Current Balance: ₱4,000 (manually set in database)

**Steps:**
1. Update customer balance:
   ```sql
   UPDATE customers 
   SET current_balance = 4000 
   WHERE name LIKE '%Jenilyn%';
   ```
2. Go to Sales page
3. Click "Record Sale"
4. Add product: Sample Product, Qty: 1, Price: ₱500
5. Select "Credit Sale"
6. Select customer "Jenilyn Tuplano"

**Expected Results:**
- ⚠️ Warning message: "Customer is near credit limit (90.0% utilized)"
- Background color: Light orange (#FFF3E0)
- Border color: Orange (#E8896A)
- Can still proceed with sale

---

### Scenario 3: Credit Limit Exceeded (Without Override)

**Setup:**
- Customer: Jenilyn Tuplano
- Credit Limit: ₱5,000
- Current Balance: ₱4,800

**Steps:**
1. Update customer balance:
   ```sql
   UPDATE customers 
   SET current_balance = 4800 
   WHERE name LIKE '%Jenilyn%';
   ```
2. Go to Sales page
3. Click "Record Sale"
4. Add product: Sample Product, Qty: 1, Price: ₱500
5. Select "Credit Sale"
6. Select customer "Jenilyn Tuplano"

**Expected Results:**
- ❌ Error message: "Credit limit exceeded! New balance would be ₱5,300 (limit: ₱5,000)"
- Background color: Light red (#FDECEA)
- Border color: Red (#C05050)
- Checkbox: "Override credit limit (requires approval)"
- "Record Sale" button: **DISABLED**

---

### Scenario 4: Credit Limit Override

**Setup:**
- Same as Scenario 3

**Steps:**
1. Follow Scenario 3 steps 1-6
2. Check the "Override credit limit" checkbox
3. Click "Record Sale"

**Expected Results:**
- ✅ Success toast: "Sale recorded successfully"
- ⚠️ Warning in response: "Credit limit override applied. New balance (₱5,300) exceeds limit (₱5,000)."
- Sale created successfully
- Balance updated to ₱5,300

**Verify in Database:**
```sql
-- Check credit_limit_overrides table
SELECT * FROM credit_limit_overrides ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
- Override record created
- `previous_balance` = 4800
- `sale_amount` = 500
- `new_balance` = 5300
- `credit_limit` = 5000

---

### Scenario 5: Multiple Credit Sales

**Setup:**
- Customer: Jenilyn Tuplano
- Credit Limit: ₱5,000
- Current Balance: ₱0

**Steps:**
1. Create first credit sale: ₱500
2. Create second credit sale: ₱300
3. Create third credit sale: ₱200

**Expected Results:**
- All sales created successfully
- Customer balance: ₱1,000
- Available credit: ₱4,000
- Credit utilization: 20%

**Verify:**
```sql
SELECT 
  cs.id,
  cs.amount,
  cs.status,
  cs.due_date,
  s.total_amount,
  s.payment_method
FROM credit_sales cs
JOIN sales s ON cs.sale_id = s.id
WHERE cs.customer_id = (SELECT id FROM customers WHERE name LIKE '%Jenilyn%')
ORDER BY cs.created_at DESC;
```

---

### Scenario 6: Credit Sale for Inactive Customer

**Setup:**
- Customer: Test Customer
- Status: Inactive

**Steps:**
1. Deactivate customer:
   ```sql
   UPDATE customers 
   SET is_active = false 
   WHERE name = 'Test Customer';
   ```
2. Try to create credit sale for this customer

**Expected Results:**
- ❌ Error: "Cannot create credit sale for inactive customer"
- HTTP Status: 400
- Sale NOT created

---

### Scenario 7: Cash Received Calculator (Cash Sale)

**Steps:**
1. Go to Sales page
2. Click "Record Sale"
3. Add product: Sample Product, Qty: 1, Price: ₱140
4. Keep "Cash Sale" selected
5. Select payment method: "Cash"
6. Enter cash received: ₱200

**Expected Results:**
- Amount Due: ₱140.00
- Cash Received: ₱200.00
- Change: ₱60.00 (displayed in orange)

**Try insufficient cash:**
- Enter cash received: ₱100
- Error message: "Insufficient amount"
- Shows: "Need ₱40.00 more"
- "Record Sale" button: **DISABLED**

---

### Scenario 8: Other Payment Methods

**Steps:**
1. Go to Sales page
2. Click "Record Sale"
3. Add product: Sample Product, Qty: 1, Price: ₱140
4. Keep "Cash Sale" selected
5. Try each payment method:
   - Card
   - GCash
   - PayMaya
   - Bank Transfer

**Expected Results:**
- No cash calculator shown
- Can record sale immediately
- Payment method saved correctly

---

## UI Verification Checklist

### Sales Page
- [ ] Credit sales show "Credit" payment method
- [ ] Customer name displayed for credit sales
- [ ] Total amount correct
- [ ] Created date/time correct
- [ ] Can void credit sales
- [ ] Voided sales disappear from list

### Credit Sales Page
- [ ] All credit sales listed
- [ ] Customer name displayed
- [ ] Amount correct
- [ ] Status correct (Pending/Paid/Overdue)
- [ ] Due date correct
- [ ] Can filter by customer
- [ ] Can filter by status
- [ ] Can record payment

### Customers Page
- [ ] Current balance correct
- [ ] Available credit correct
- [ ] Credit utilization percentage correct
- [ ] Balance updates after credit sale
- [ ] Can view customer details
- [ ] Can view credit history

### Dashboard
- [ ] Total credit sales count correct
- [ ] Total outstanding balance correct
- [ ] Overdue amount correct (if any)
- [ ] Recent credit sales shown
- [ ] Charts update correctly

---

## Database Verification Queries

### Check Recent Credit Sales
```sql
SELECT 
  cs.id,
  cs.amount,
  cs.status,
  cs.due_date,
  c.name as customer_name,
  s.total_amount as sale_total,
  s.payment_method,
  cs.created_at
FROM credit_sales cs
JOIN customers c ON cs.customer_id = c.id
JOIN sales s ON cs.sale_id = s.id
ORDER BY cs.created_at DESC
LIMIT 10;
```

### Check Customer Balances
```sql
SELECT 
  name,
  business_name,
  credit_limit,
  current_balance,
  (credit_limit - current_balance) as available_credit,
  CASE 
    WHEN credit_limit > 0 THEN 
      ROUND((current_balance / credit_limit * 100)::numeric, 2)
    ELSE 0 
  END as utilization_pct,
  is_active
FROM customers
WHERE credit_limit > 0
ORDER BY current_balance DESC;
```

### Check Credit Limit Overrides
```sql
SELECT 
  clo.*,
  c.name as customer_name,
  cs.amount as credit_sale_amount
FROM credit_limit_overrides clo
JOIN customers c ON clo.customer_id = c.id
JOIN credit_sales cs ON clo.credit_sale_id = cs.id
ORDER BY clo.created_at DESC;
```

### Check Overdue Credit Sales
```sql
SELECT 
  cs.id,
  cs.amount,
  cs.due_date,
  cs.status,
  c.name as customer_name,
  (CURRENT_DATE - cs.due_date) as days_overdue
FROM credit_sales cs
JOIN customers c ON cs.customer_id = c.id
WHERE cs.status = 'pending'
  AND cs.due_date < CURRENT_DATE
ORDER BY cs.due_date ASC;
```

---

## Troubleshooting

### Issue: 404 Error
**Symptoms:** POST /api/v1/credit-sales returns 404
**Solution:** 
1. Verify backend is running
2. Check route definition uses `@router.post("")` not `@router.post("/")`
3. Restart backend

### Issue: CORS Error
**Symptoms:** "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:**
1. Check `backend/.env` has `CORS_ORIGINS=http://localhost:3000`
2. Verify `redirect_slashes=False` in `backend/main.py`
3. Restart backend

### Issue: 401 Unauthorized
**Symptoms:** "Invalid token" or "Unauthorized"
**Solution:**
1. Logout and login again
2. Check token in browser cookies
3. Verify `SUPABASE_ANON_KEY` in `backend/.env`

### Issue: Balance Not Updating
**Symptoms:** Customer balance stays the same after credit sale
**Solution:**
1. Check browser console for errors
2. Verify `createCreditSale` is called
3. Check database directly
4. Clear browser cache
5. Hard refresh (Ctrl+Shift+R)

### Issue: Credit Sales Not Showing
**Symptoms:** Credit Sales page shows "No credit sales yet"
**Solution:**
1. Check database: `SELECT * FROM credit_sales;`
2. Clear localStorage
3. Check API response in Network tab
4. Verify RLS policies allow reading

---

## Performance Testing

### Load Test: Multiple Concurrent Credit Sales
```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 -H "Authorization: Bearer <token>" \
   -p credit_sale.json -T application/json \
   http://localhost:8000/api/v1/credit-sales
```

### Expected Performance:
- Response time: < 200ms
- Success rate: 100%
- No database deadlocks
- No race conditions on balance updates

---

## Security Testing

### Test 1: Unauthorized Access
```bash
# Try without token
curl -X POST http://localhost:8000/api/v1/credit-sales \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"uuid","amount":100}'

# Expected: 401 Unauthorized
```

### Test 2: Invalid Token
```bash
# Try with invalid token
curl -X POST http://localhost:8000/api/v1/credit-sales \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"uuid","amount":100}'

# Expected: 401 Unauthorized
```

### Test 3: SQL Injection
```bash
# Try SQL injection in customer_id
curl -X POST http://localhost:8000/api/v1/credit-sales \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"uuid; DROP TABLE customers;","amount":100}'

# Expected: 400 Bad Request or 404 Not Found (not SQL error)
```

---

## Regression Testing

After any code changes, run through:
1. ✅ Basic credit sale creation
2. ✅ Credit limit enforcement
3. ✅ Balance updates
4. ✅ Cache invalidation
5. ✅ UI updates
6. ✅ Payment recording
7. ✅ Reports accuracy

---

## Success Criteria

All tests pass when:
- ✅ Credit sales create without errors
- ✅ Customer balances update correctly
- ✅ UI shows updated data immediately
- ✅ Credit limit enforcement works
- ✅ Override functionality works
- ✅ Database records are consistent
- ✅ No CORS errors
- ✅ No 404 errors
- ✅ No hydration errors
- ✅ Cache invalidation works
