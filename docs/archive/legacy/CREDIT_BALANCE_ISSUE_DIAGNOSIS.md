# Credit Balance Not Reflecting - Issue Diagnosis

## Problem Statement
When recording a credit sale, the customer's available balance shown in the sale form doesn't update to reflect the new balance after the sale is created.

## Root Cause Analysis

### Issue 1: Customer Cache Not Invalidated After Credit Sale
**Location**: `frontend/lib/supabase-queries.ts` - `createCreditSale()` function

**Problem**: After a credit sale is created, the backend updates the customer's `current_balance` in the database, but the frontend's cached customer data is not invalidated.

**Flow**:
1. User opens sale form → sees customer with balance ₱0
2. User creates credit sale for ₱1,000
3. Backend updates customer balance to ₱1,000 ✅
4. Frontend cache still shows ₱0 ❌
5. User opens sale form again → still sees ₱0 balance ❌

**Evidence**:
```typescript
// frontend/lib/supabase-queries.ts - createCreditSale function
async function createCreditSale(data: SaleCreate, userId: string): Promise<Sale> {
  // ... creates sale ...
  // ... calls backend API to create credit_sales record ...
  // ... backend updates customer balance ...
  
  return sale as Sale  // ❌ No cache invalidation!
}
```

### Issue 2: useCustomers Hook Doesn't Refetch After Sale
**Location**: `frontend/hooks/useCustomers.ts`

**Problem**: The `useCustomers` hook uses localStorage caching and doesn't automatically refetch when a credit sale is created.

**Evidence**:
```typescript
// frontend/hooks/useCustomers.ts
const [allCustomers, setAllCustomers] = useState<Customer[]>(
  () => getCached<Customer[]>(CACHE_KEY) ?? []  // ❌ Uses stale cache
)
```

### Issue 3: SaleForm Uses Stale Customer Data
**Location**: `frontend/components/forms/SaleForm.tsx`

**Problem**: The SaleForm component gets customer data from `useCustomers()` hook, which returns cached data that doesn't reflect recent balance changes.

**Evidence**:
```typescript
// frontend/components/forms/SaleForm.tsx
export function SaleForm({ open, onOpenChange, products, onSubmit }: SaleFormProps) {
  const { allCustomers } = useCustomers()  // ❌ Gets stale cached data
  
  const selectedCustomer = allCustomers.find(c => c.id === watchedCustomerId)
  const availableCredit = selectedCustomer 
    ? selectedCustomer.credit_limit - selectedCustomer.current_balance  // ❌ Uses stale balance
    : 0
}
```

## Impact

1. **User Confusion**: Users see incorrect available credit amounts
2. **Credit Limit Violations**: Users might exceed credit limits without realizing
3. **Data Inconsistency**: UI shows different data than database
4. **Poor UX**: Users need to refresh the page to see updated balances

## Solution Strategy

### Fix 1: Invalidate Customer Cache After Credit Sale
Add cache invalidation in the `createCreditSale` function:

```typescript
// frontend/lib/supabase-queries.ts
async function createCreditSale(data: SaleCreate, userId: string): Promise<Sale> {
  // ... existing code ...
  
  // ✅ Invalidate customer cache after credit sale
  if (typeof window !== 'undefined') {
    localStorage.removeItem('talastock_cache_customers')
  }
  
  return sale as Sale
}
```

### Fix 2: Refetch Customers After Credit Sale
Modify the sales page to refetch customers after creating a credit sale:

```typescript
// frontend/app/(dashboard)/sales/page.tsx
async function handleCreateSale(data: SaleCreate) {
  const sale = await createSale(data)
  if (sale) {
    // ✅ Refetch customers if it was a credit sale
    if (data.customer_id) {
      await refetchCustomers()
    }
  }
}
```

### Fix 3: Add Refetch Method to useCustomers Hook
Expose a refetch method from the `useCustomers` hook:

```typescript
// frontend/hooks/useCustomers.ts
export function useCustomers() {
  // ... existing code ...
  
  return {
    allCustomers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: () => fetchCustomers(true),  // ✅ Add refetch method
  }
}
```

### Fix 4: Real-time Updates (Optional Enhancement)
For a better UX, implement Supabase real-time subscriptions:

```typescript
// frontend/hooks/useCustomers.ts
useEffect(() => {
  const channel = supabase
    .channel('customers-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'customers'
    }, (payload) => {
      // Update local state when customer changes
      fetchCustomers(true)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

## Testing Checklist

After implementing fixes:

1. [ ] Create a customer with ₱5,000 credit limit
2. [ ] Open sale form and verify balance shows ₱5,000 available
3. [ ] Create a credit sale for ₱1,000
4. [ ] Immediately open sale form again
5. [ ] Verify balance now shows ₱4,000 available (₱5,000 - ₱1,000)
6. [ ] Create another credit sale for ₱2,000
7. [ ] Verify balance now shows ₱2,000 available (₱5,000 - ₱3,000)
8. [ ] Check customer page to verify balance matches
9. [ ] Check credit sales page to verify all sales are recorded
10. [ ] Check reports to verify customer statement is correct

## Related Files

- `frontend/lib/supabase-queries.ts` - createCreditSale function
- `frontend/hooks/useCustomers.ts` - useCustomers hook
- `frontend/components/forms/SaleForm.tsx` - SaleForm component
- `frontend/app/(dashboard)/sales/page.tsx` - Sales page
- `backend/routers/credit_sales.py` - Backend credit sales API
- `database/migrations/create_customer_credit_management_schema.sql` - Database schema

## Priority
**HIGH** - This affects core credit management functionality and user trust in the system.
