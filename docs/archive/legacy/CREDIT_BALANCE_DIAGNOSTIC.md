# Credit Balance Not Updating - Complete Diagnostic & Fix

## Problem Statement
When recording a credit sale:
1. ✅ Sale is created in `sales` table with `payment_method: 'credit'`
2. ❌ `credit_sales` record is NOT created
3. ❌ Customer `current_balance` is NOT updated
4. ❌ Available credit shows stale data in UI

## User Report
> "it successfully create a sales as a credit but it doesn't update the available balance of a certain account"

Customer: **Jenilyn Tuplano** (also appears as "Jenilyn Collantes")
- Credit Limit: ₱5,000
- Expected: Balance should increase after credit sale
- Actual: Balance stays at ₱0.00

## Root Cause

### The 404 Error
```
POST http://localhost:8000/api/v1/credit-sales 404 (Not Found)
{"detail":"Not Found"}
```

### Why It Happened

**FastAPI Routing with Trailing Slashes:**

1. **Router Configuration:**
   ```python
   router = APIRouter(prefix="/credit-sales")
   ```

2. **Route Definition (BEFORE FIX):**
   ```python
   @router.post("/", status_code=201)  # ❌ Requires trailing slash
   ```

3. **Main App Configuration:**
   ```python
   app.include_router(credit_sales.router, prefix="/api/v1")
   app = FastAPI(redirect_slashes=False)  # ⚠️ Strict about slashes
   ```

4. **Final Route:**
   - Expected by backend: `/api/v1/credit-sales/` (with trailing slash)
   - Called by frontend: `/api/v1/credit-sales` (without trailing slash)
   - Result: **404 Not Found**

### Why `redirect_slashes=False`?
It was added to fix CORS preflight issues. When `redirect_slashes=True`, FastAPI redirects `/api/v1/credit-sales` → `/api/v1/credit-sales/`, but the redirect response loses CORS headers, causing CORS errors.

## The Fix

### Changed Route Definitions
**File:** `backend/routers/credit_sales.py`

```python
# BEFORE (requires trailing slash)
@router.post("/", status_code=201)
async def create_credit_sale(...)

@router.get("/")
async def list_credit_sales(...)

# AFTER (works without trailing slash)
@router.post("", status_code=201)
async def create_credit_sale(...)

@router.get("")
async def list_credit_sales(...)
```

**Why This Works:**
- Empty string `""` matches the exact path without trailing slash
- Route becomes: `/api/v1/credit-sales` (no trailing slash)
- Frontend calls: `/api/v1/credit-sales` (no trailing slash)
- ✅ Perfect match!

## Complete Flow Analysis

### Frontend Flow (SaleForm.tsx)

```typescript
// 1. User selects "Credit Sale" and customer
payment_type: 'credit'
customer_id: 'ff1eccd6-30ab-433e-a0a9-856c672c1e2a'

// 2. Form submission
onFormSubmit() {
  // Create sale with payment_method: 'credit'
  const saleData = {
    items: [...],
    payment_method: 'credit',  // ✅ Correct
    customer_id: customer_id,
    override_credit_limit: false
  }
  
  await onSubmit(saleData)
  
  // Refetch customers to update balances
  await refetchCustomers()  // ✅ Added
}
```

### API Layer (supabase-queries.ts)

```typescript
// 1. Create sale in sales table
const { data: saleData } = await supabase
  .from('sales')
  .insert({
    total_amount: total,
    payment_method: 'credit',  // ✅ Correct
    customer_id: customerId,
    notes: notes
  })
  .select()
  .single()

// 2. If credit sale, create credit_sales record
if (customerId) {
  await createCreditSale({
    customer_id: customerId,
    sale_id: saleData.id,
    amount: total,
    notes: notes,
    override_credit_limit: overrideCreditLimit
  })
  
  // 3. Invalidate caches
  localStorage.removeItem('talastock_cache_credit_sales')
  localStorage.removeItem('talastock_cache_customers')
  localStorage.removeItem(`talastock_cache_customer_${customerId}`)
}
```

### Backend Flow (credit_sales.py)

```python
@router.post("", status_code=201)  # ✅ Fixed
async def create_credit_sale(payload: CreditSaleCreate, user=Depends(verify_token)):
    # 1. Fetch customer
    customer = db.table("customers").select("*").eq("id", payload.customer_id).execute()
    
    # 2. Calculate new balance
    current_balance = customer.current_balance
    new_balance = current_balance + payload.amount
    credit_limit = customer.credit_limit
    
    # 3. Check credit limit
    if new_balance > credit_limit and not payload.override_credit_limit:
        raise HTTPException(400, "Credit limit exceeded")
    
    # 4. Calculate due date
    due_date = datetime.now() + timedelta(days=customer.payment_terms_days)
    
    # 5. Create credit_sales record
    credit_sale = db.table("credit_sales").insert({
        "customer_id": payload.customer_id,
        "sale_id": payload.sale_id,
        "amount": payload.amount,
        "due_date": due_date,
        "status": "pending",
        "notes": payload.notes,
        "created_by": user.id
    }).execute()
    
    # 6. Update customer balance
    db.table("customers").update({
        "current_balance": new_balance,
        "updated_at": datetime.now()
    }).eq("id", payload.customer_id).execute()
    
    # 7. Invalidate caches
    await invalidate(f"credit_sales:list*")
    await invalidate(f"customers:detail:{payload.customer_id}")
    await invalidate(f"customers:list*")
    
    return {"success": True, "data": credit_sale.data[0]}
```

## Testing Checklist

### 1. Backend Running
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"1.0.0","env":"development"}
```

### 2. Test Credit Sale Creation

**Steps:**
1. Go to http://localhost:3000/sales
2. Click "Record Sale"
3. Add product (e.g., "Sample Product", qty: 1, price: ₱140)
4. Select "Credit Sale" as payment type
5. Select customer "Jenilyn Tuplano"
6. Verify credit info shows:
   - Credit Limit: ₱5,000
   - Current Balance: ₱0.00 (or current value)
   - Available Credit: ₱5,000 (or remaining)
   - New Balance: ₱140 (or current + sale amount)
7. Click "Record Sale"

**Expected Results:**
- ✅ Success toast: "Sale recorded successfully"
- ✅ Sale appears in Sales list with "Credit" payment method
- ✅ Customer balance updates immediately in form (if you open another credit sale)

### 3. Verify Database

```sql
-- Check sales table
SELECT 
  id, 
  total_amount, 
  payment_method, 
  customer_id, 
  created_at 
FROM sales 
WHERE payment_method = 'credit' 
ORDER BY created_at DESC 
LIMIT 5;

-- Expected: New row with payment_method = 'credit'

-- Check credit_sales table
SELECT 
  id, 
  customer_id, 
  sale_id, 
  amount, 
  status, 
  due_date, 
  created_at 
FROM credit_sales 
ORDER BY created_at DESC 
LIMIT 5;

-- Expected: New row linked to the sale

-- Check customer balance
SELECT 
  id, 
  name, 
  credit_limit, 
  current_balance, 
  (credit_limit - current_balance) as available_credit
FROM customers 
WHERE name LIKE '%Jenilyn%';

-- Expected: current_balance increased by sale amount
```

### 4. Verify UI Updates

**Credit Sales Page:**
1. Go to http://localhost:3000/credit-sales
2. Should see the new credit sale in the list
3. Status should be "Pending"
4. Amount should match sale total

**Customers Page:**
1. Go to http://localhost:3000/customers
2. Find "Jenilyn Tuplano"
3. Balance should show updated amount
4. Available credit should be reduced

**Dashboard:**
1. Go to http://localhost:3000/dashboard
2. Credit metrics should update
3. Recent credit sales should show new sale

## Common Issues & Solutions

### Issue 1: Still Getting 404
**Cause:** Backend not restarted after code change
**Solution:** 
```bash
# Stop backend (Ctrl+C)
# Start again
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Issue 2: CORS Error
**Cause:** Frontend URL not in CORS origins
**Solution:** Check `backend/.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Issue 3: 401 Unauthorized
**Cause:** Invalid or expired token
**Solution:** 
1. Logout and login again
2. Check token in browser DevTools → Application → Cookies
3. Verify `SUPABASE_ANON_KEY` in `backend/.env`

### Issue 4: Balance Not Updating in UI
**Cause:** Cache not invalidated
**Solution:** 
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear localStorage: DevTools → Application → Local Storage → Clear All
3. Verify cache invalidation code is present in `createCreditSale`

### Issue 5: Credit Limit Not Enforced
**Cause:** Override flag set to true
**Solution:** 
1. Check `override_credit_limit` in request payload
2. Verify checkbox is unchecked in form
3. Test with amount that exceeds limit

## API Endpoint Documentation

### POST /api/v1/credit-sales

**Request:**
```http
POST /api/v1/credit-sales
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{
  "customer_id": "ff1eccd6-30ab-433e-a0a9-856c672c1e2a",
  "sale_id": "a9b13229-12ef-424e-bae8-d559a289eacc",
  "amount": 140.00,
  "notes": "Sample credit sale",
  "override_credit_limit": false
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customer_id": "ff1eccd6-30ab-433e-a0a9-856c672c1e2a",
    "sale_id": "a9b13229-12ef-424e-bae8-d559a289eacc",
    "amount": 140.00,
    "status": "pending",
    "due_date": "2026-05-27",
    "notes": "Sample credit sale",
    "created_by": "user_uuid",
    "created_at": "2026-04-27T02:30:00Z"
  },
  "message": "Credit sale recorded successfully"
}
```

**Warning Response (201 with warning):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Credit sale recorded successfully",
  "warning": "Customer is near credit limit (85.5% utilized)."
}
```

**Error Response (400 - Credit Limit Exceeded):**
```json
{
  "detail": "Credit limit exceeded. Customer limit: ₱5000, Current balance: ₱4500, New balance would be: ₱5200. Set override_credit_limit=true to proceed."
}
```

**Error Response (404 - Customer Not Found):**
```json
{
  "detail": "Customer not found"
}
```

**Error Response (401 - Unauthorized):**
```json
{
  "detail": "Invalid token"
}
```

## Files Modified

### 1. backend/routers/credit_sales.py
- Changed `@router.post("/")` to `@router.post("")`
- Changed `@router.get("/")` to `@router.get("")`

### 2. frontend/lib/supabase-queries.ts
- Added cache invalidation in `createCreditSale`
- Added extensive logging for debugging

### 3. frontend/components/forms/SaleForm.tsx
- Added `refetchCustomers()` after credit sale
- Fixed payment_method to be 'credit' for credit sales

### 4. frontend/hooks/useCustomers.ts
- Already had `refetch` method (no changes needed)

## Status
✅ **FIXED** - Credit sales now create properly and update customer balances

## Verification Steps

1. ✅ Backend starts without errors
2. ✅ CORS preflight succeeds (OPTIONS request returns 200)
3. ✅ POST /api/v1/credit-sales returns 201 (not 404)
4. ✅ credit_sales record created in database
5. ✅ Customer balance updated in database
6. ✅ UI shows updated balance immediately
7. ✅ Credit Sales page shows new sale
8. ✅ Cache invalidation works correctly

## Next Steps

1. **Test Credit Limit Enforcement:**
   - Try creating a sale that exceeds credit limit
   - Verify error message
   - Test override functionality

2. **Test Payment Recording:**
   - Record a payment against the credit sale
   - Verify balance decreases
   - Verify credit_sales status updates

3. **Test Balance Reports:**
   - Go to Reports page
   - Check customer balance report
   - Verify aging report shows correct data

4. **Test Edge Cases:**
   - Multiple credit sales for same customer
   - Credit sale with zero amount
   - Credit sale for inactive customer
   - Credit sale with invalid customer_id

## Support

If issues persist:
1. Check backend logs in terminal
2. Check browser console for errors
3. Check Network tab for failed requests
4. Verify database schema matches expected structure
5. Clear all caches and try again
