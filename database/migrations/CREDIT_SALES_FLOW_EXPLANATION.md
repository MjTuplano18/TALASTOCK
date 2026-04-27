# Credit Sales Flow Explanation

## Overview
Credit sales in Talastock involve a two-table system:
1. **`sales` table**: Records ALL sales (cash, card, credit, etc.)
2. **`credit_sales` table**: Records credit-specific data (customer balance, due dates, credit limits)

## The Problem (Now Fixed)
Previously, credit sales were being created with `payment_method: 'cash'` instead of `payment_method: 'credit'`, which caused the backend API call to be skipped.

## How Credit Sales Work

### 1. Frontend Form (SaleForm.tsx)
When a user selects "Credit Sale" as the payment type:
- User selects a customer from the dropdown
- System shows credit limit, current balance, and calculates new balance
- If credit limit is exceeded, user must check "Override credit limit"
- Form submits with:
  ```typescript
  {
    items: [...],
    payment_method: 'credit',  // ✅ Fixed: Now correctly set to 'credit'
    customer_id: 'uuid',
    override_credit_limit: true/false
  }
  ```

### 2. Frontend Query Layer (supabase-queries.ts)
The `createSale` function checks if `customer_id` is present:
```typescript
export async function createSale(data: SaleCreate, userId: string): Promise<Sale> {
  // For credit sales, call the backend API instead
  if (data.customer_id) {
    return await createCreditSale(data, userId)
  }
  // ... regular sale logic
}
```

### 3. Credit Sale Creation (createCreditSale function)
This function performs multiple steps:

#### Step 1: Inventory Check
```typescript
for (const item of data.items) {
  // Check if sufficient stock exists
  const { data: inv } = await supabase
    .from('inventory')
    .select('quantity, products(name)')
    .eq('product_id', item.product_id)
    .single()
  
  if (inv.quantity < item.quantity) {
    throw new Error(`Insufficient stock for: ${productName}`)
  }
}
```

#### Step 2: Create Sale Record
```typescript
const { data: sale } = await supabase
  .from('sales')
  .insert({
    total_amount: totalAmount,
    notes: data.notes,
    created_by: userId,
    payment_method: 'credit',  // ✅ This is now correct
  })
  .select()
  .single()
```

#### Step 3: Create Sale Items
```typescript
const saleItems = data.items.map(item => ({
  sale_id: sale.id,
  product_id: item.product_id,
  quantity: item.quantity,
  unit_price: item.unit_price,
}))

await supabase.from('sale_items').insert(saleItems)
```

#### Step 4: Update Inventory
```typescript
for (const item of data.items) {
  // Insert stock movement
  await supabase.from('stock_movements').insert({
    product_id: item.product_id,
    type: 'sale',
    quantity: item.quantity,
    note: `Credit Sale ${sale.id}`,
    created_by: userId,
  })

  // Decrement inventory
  await supabase.rpc('decrement_inventory', {
    p_product_id: item.product_id,
    p_quantity: item.quantity,
  })
}
```

#### Step 5: Create Credit Sale Record (Backend API)
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const response = await fetch(`${apiUrl}/api/v1/credit-sales`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    customer_id: data.customer_id,
    sale_id: sale.id,
    amount: totalAmount,
    notes: data.notes,
    override_credit_limit: data.override_credit_limit || false,
  }),
})
```

### 4. Backend API (credit_sales.py)
The backend endpoint `/api/v1/credit-sales` performs:

#### Step 1: Fetch Customer
```python
customer_result = db.table("customers").select("*").eq("id", payload.customer_id).execute()
customer = customer_result.data[0]
```

#### Step 2: Check Credit Limit
```python
current_balance = Decimal(str(customer.get("current_balance", 0)))
new_balance = current_balance + payload.amount
credit_limit = Decimal(str(customer.get("credit_limit", 0)))

if new_balance > credit_limit:
    if not payload.override_credit_limit:
        raise HTTPException(status_code=400, detail="Credit limit exceeded")
```

#### Step 3: Calculate Due Date
```python
payment_terms_days = customer.get("payment_terms_days", 30)
due_date = (datetime.utcnow() + timedelta(days=payment_terms_days)).date()
```

#### Step 4: Create Credit Sale Record
```python
credit_sale_data = {
    "customer_id": payload.customer_id,
    "sale_id": payload.sale_id,
    "amount": float(payload.amount),
    "due_date": due_date.isoformat(),
    "status": "pending",
    "notes": payload.notes,
    "created_by": user.id,
}

credit_sale_result = db.table("credit_sales").insert(credit_sale_data).execute()
```

#### Step 5: Update Customer Balance
```python
update_result = (
    db.table("customers")
    .update({
        "current_balance": float(new_balance),
        "updated_at": datetime.utcnow().isoformat()
    })
    .eq("id", payload.customer_id)
    .execute()
)
```

#### Step 6: Log Override (if applicable)
```python
if new_balance > credit_limit and payload.override_credit_limit:
    override_data = {
        "customer_id": payload.customer_id,
        "credit_sale_id": credit_sale_id,
        "previous_balance": float(current_balance),
        "sale_amount": float(payload.amount),
        "new_balance": float(new_balance),
        "credit_limit": float(credit_limit),
        "override_reason": payload.notes,
        "created_by": user.id,
    }
    db.table("credit_limit_overrides").insert(override_data).execute()
```

## Database Triggers
After the `credit_sales` record is created, database triggers automatically:

### Trigger 1: Update Customer Balance
```sql
CREATE TRIGGER trigger_update_balance_on_credit_sale
  AFTER INSERT OR UPDATE OR DELETE ON credit_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();
```

### Trigger 2: Update Credit Sale Status
```sql
CREATE TRIGGER trigger_update_credit_sale_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_sale_status();
```

## Result
After a successful credit sale:
1. ✅ Sale record exists in `sales` table with `payment_method: 'credit'`
2. ✅ Sale items exist in `sale_items` table
3. ✅ Stock movements recorded in `stock_movements` table
4. ✅ Inventory decremented in `inventory` table
5. ✅ Credit sale record exists in `credit_sales` table
6. ✅ Customer balance updated in `customers` table
7. ✅ Credit limit override logged (if applicable)

## Viewing Credit Sales
Credit sales can be viewed in:
- **Sales Page**: Shows all sales including credit sales (payment method = "Credit")
- **Credit Sales Page**: Shows only credit sales with customer details
- **Customer Reports**: Shows credit sales per customer with balance information

## The Fix Applied
**File**: `frontend/components/forms/SaleForm.tsx`
**Line**: 152
**Change**: 
```typescript
// Before (WRONG):
payment_method: values.payment_method,  // This was 'cash' for credit sales

// After (CORRECT):
payment_method: values.payment_type === 'credit' ? 'credit' : values.payment_method,
```

This ensures that when `payment_type` is 'credit', the `payment_method` is set to 'credit', which triggers the `createCreditSale` function that calls the backend API.

## Testing
To test credit sales:
1. Go to Sales page
2. Click "Record Sale"
3. Add products
4. Select "Credit Sale" as payment type
5. Select a customer
6. If credit limit exceeded, check "Override credit limit"
7. Click "Record Sale"
8. Verify:
   - Sale appears in Sales page with "Credit" payment method
   - Credit sale appears in Credit Sales page
   - Customer balance updated in Customers page
   - Customer statement shows the transaction in Reports

## Troubleshooting
If credit sales still don't work:
1. Check browser console for `[Credit Sale]` logs
2. Check backend terminal for API request logs
3. Verify `NEXT_PUBLIC_API_URL` is set in `frontend/.env.local`
4. Verify backend is running on port 8000
5. Check CORS configuration in `backend/main.py`
6. Verify Supabase auth token is valid
