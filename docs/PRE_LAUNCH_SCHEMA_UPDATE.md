# Pre-Launch Schema Update - TypeScript Types

## Overview
This document describes the TypeScript type updates made to support the pre-launch essentials database schema changes.

**Date:** 2024
**Related Migration:** `database/migrations/add_pre_launch_fields_to_sales.sql`
**Task:** 1.3 Apply database migration to production

---

## Updated Types

### New Type Definitions

Three new type aliases were added to support the enhanced sales functionality:

```typescript
export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'paymaya' | 'bank_transfer'
export type DiscountType = 'none' | 'percentage' | 'fixed' | 'senior_pwd'
export type SaleStatus = 'completed' | 'refunded' | 'partially_refunded'
```

### Updated Sale Interface

The `Sale` interface was updated to include all new fields from the database migration:

```typescript
export interface Sale {
  id: string
  total_amount: number
  notes: string | null
  created_by: string
  created_at: string
  sale_items?: SaleItem[]
  
  // Payment method fields (NEW)
  payment_method: PaymentMethod
  cash_received?: number
  change_given?: number
  
  // Discount fields (NEW)
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  
  // Refund tracking fields (NEW)
  status: SaleStatus
  refunded_amount: number
  refund_reason?: string
  refunded_at?: string
  refunded_by?: string
}
```

### Updated SaleCreate Interface

The `SaleCreate` interface was updated to support creating sales with payment and discount information:

```typescript
export interface SaleCreate {
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
  notes?: string | null
  
  // Payment method fields (NEW)
  payment_method?: PaymentMethod
  cash_received?: number
  change_given?: number
  
  // Discount fields (NEW)
  discount_type?: DiscountType
  discount_value?: number
  discount_amount?: number
}
```

---

## Field Descriptions

### Payment Method Fields

- **payment_method**: The payment method used for the sale (cash, card, GCash, PayMaya, or bank transfer)
- **cash_received**: Amount of cash received from customer (only for cash payments)
- **change_given**: Change given to customer (only for cash payments)

### Discount Fields

- **discount_type**: Type of discount applied (none, percentage, fixed amount, or senior/PWD)
- **discount_value**: The discount value (percentage 0-100 or fixed amount in pesos)
- **discount_amount**: The calculated discount amount in pesos (subtracted from total)

### Refund Tracking Fields

- **status**: Current status of the sale (completed, refunded, or partially_refunded)
- **refunded_amount**: Total amount refunded (for full or partial refunds)
- **refund_reason**: Optional reason for the refund
- **refunded_at**: Timestamp when the refund was processed
- **refunded_by**: User ID of the person who processed the refund

---

## Database Migration Status

⚠️ **IMPORTANT**: The database migration file has been created but needs to be run manually in the Supabase SQL editor:

**File:** `database/migrations/add_pre_launch_fields_to_sales.sql`

**Steps to apply:**
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `add_pre_launch_fields_to_sales.sql`
4. Run the migration
5. Verify all columns were created successfully using the verification queries at the end of the migration file

---

## Next Steps

After the database migration is applied, the following tasks can proceed:

- **Task 3.1-3.8**: Payment Methods in POS
- **Task 4.1-4.8**: Discounts in POS
- **Task 5.1-5.7**: Sales Refund & Return

All TypeScript types are now ready to support these features.

---

## Files Modified

- `frontend/types/index.ts` - Updated Sale and SaleCreate interfaces, added new type definitions

---

## Verification

TypeScript compilation: ✅ No errors
Type definitions: ✅ Complete
Database schema alignment: ✅ Matches migration file

---

**Status:** TypeScript types updated and ready for implementation
**Next Task:** 2.1 Create Forgot Password page
