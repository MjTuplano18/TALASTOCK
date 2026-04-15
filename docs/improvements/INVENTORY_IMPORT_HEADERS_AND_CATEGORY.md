# Inventory Import: Case-Insensitive Headers & Category Support

## Overview
The inventory import feature now fully supports:
1. ✅ **Case-insensitive headers** - Works with "SKU", "sku", "Sku", etc.
2. ✅ **Category column** - Displays and validates category information

## Changes Made

### 1. ImportPreview Component
**File:** `frontend/components/inventory/ImportPreview.tsx`

**Added Category Column:**
```typescript
// Header
<th className="text-left py-2 px-3 text-[#B89080] font-medium">Category</th>

// Data cell
<td className="py-2 px-3 text-[#7A3E2E]">
  {preview.match.product?.categories?.name || preview.row.category || '—'}
</td>
```

**Display Logic:**
- Shows the matched product's category from database
- Falls back to category from Excel file if product not matched
- Shows "—" if no category available

### 2. Import Parser (Already Implemented)
**File:** `frontend/lib/import-parser.ts`

**Case-Insensitive Header Parsing:**
```typescript
const headers = data[0].map((h: string) => String(h).trim().toLowerCase())
```

**Category Support:**
```typescript
category: getCellValue(row, headers, ['category', 'cat'])
```

## Supported Header Variations

### SKU Column
All these work (case-insensitive):
- `SKU`
- `sku`
- `Sku`
- `Product Code`
- `product code`
- `Code`
- `code`

### Product Name Column
All these work:
- `Product Name`
- `product name`
- `Name`
- `name`
- `Product`
- `product`
- `Item Name`
- `item name`
- `Item`
- `item`

### Category Column
All these work:
- `Category`
- `category`
- `CATEGORY`
- `Cat`
- `cat`

### Quantity Column
All these work:
- `Quantity`
- `quantity`
- `Qty`
- `qty`
- `Stock`
- `stock`
- `Amount`
- `amount`

### Threshold Column
All these work:
- `Threshold`
- `threshold`
- `Low Stock Threshold`
- `low stock threshold`
- `Min Stock`
- `min stock`
- `Minimum`
- `minimum`
- `Reorder Point`
- `reorder point`

## Excel File Examples

### Example 1: All Uppercase
```
SKU         | PRODUCT NAME  | CATEGORY      | QUANTITY | THRESHOLD
FOD-STP-001 | Rice 5kg      | Staples       | 60       | 10
FOD-STP-002 | Cooking Oil   | Staples       | 75       | 15
```
✅ **Works perfectly!**

### Example 2: All Lowercase
```
sku         | product name  | category      | quantity | threshold
fod-stp-001 | rice 5kg      | staples       | 60       | 10
fod-stp-002 | cooking oil   | staples       | 75       | 15
```
✅ **Works perfectly!**

### Example 3: Mixed Case
```
Sku         | Product Name  | Category      | Qty      | Threshold
FOD-STP-001 | Rice 5kg      | Staples       | 60       | 10
FOD-STP-002 | Cooking Oil   | Staples       | 75       | 15
```
✅ **Works perfectly!**

### Example 4: Alternative Names
```
Product Code | Name         | Cat           | Stock    | Min Stock
FOD-STP-001  | Rice 5kg     | Staples       | 60       | 10
FOD-STP-002  | Cooking Oil  | Staples       | 75       | 15
```
✅ **Works perfectly!**

## Import Preview Display

### Before (Without Category)
```
┌─────┬─────────────┬──────────────┬─────────┬─────────┬────────┬───────────┬────────┐
│ Row │ SKU         │ Product      │ Current │ New Qty │ Change │ Threshold │ Status │
├─────┼─────────────┼──────────────┼─────────┼─────────┼────────┼───────────┼────────┤
│ 2   │ FOD-STP-001 │ Rice 5kg     │ 50      │ 60      │ +10    │ 10        │ ✓      │
│ 3   │ FOD-STP-002 │ Cooking Oil  │ 65      │ 75      │ +10    │ 15        │ ✓      │
└─────┴─────────────┴──────────────┴─────────┴─────────┴────────┴───────────┴────────┘
```

### After (With Category) ✅
```
┌─────┬─────────────┬──────────────┬──────────┬─────────┬─────────┬────────┬───────────┬────────┐
│ Row │ SKU         │ Product      │ Category │ Current │ New Qty │ Change │ Threshold │ Status │
├─────┼─────────────┼──────────────┼──────────┼─────────┼─────────┼────────┼───────────┼────────┤
│ 2   │ FOD-STP-001 │ Rice 5kg     │ Staples  │ 50      │ 60      │ +10    │ 10        │ ✓      │
│ 3   │ FOD-STP-002 │ Cooking Oil  │ Staples  │ 65      │ 75      │ +10    │ 15        │ ✓      │
└─────┴─────────────┴──────────────┴──────────┴─────────┴─────────┴────────┴───────────┴────────┘
```

## Category Validation

### Scenario 1: Category Matches
```
Excel: Category = "Staples"
Database: Product category = "Staples"
Result: ✅ No warning
```

### Scenario 2: Category Mismatch
```
Excel: Category = "Food"
Database: Product category = "Staples"
Result: ⚠️ Warning: "Category mismatch: expected 'Staples', got 'Food'"
```

### Scenario 3: No Category in Excel
```
Excel: Category = (empty)
Database: Product category = "Staples"
Result: ✅ Shows database category, no warning
```

### Scenario 4: Product Not Found
```
Excel: Category = "Staples"
Database: Product not found
Result: ❌ Error: "Product not found in database"
Display: Shows "Staples" from Excel file
```

## Benefits

### 1. User-Friendly
- Users don't need to worry about exact header capitalization
- Works with exports from different systems
- Reduces import errors

### 2. Category Visibility
- Users can see which category each product belongs to
- Helps identify mismatches before importing
- Provides context for inventory decisions

### 3. Validation
- Category mismatches show as warnings (not errors)
- Users can proceed with import even if categories don't match
- Helps maintain data quality

## Testing Checklist

- [x] Uppercase headers work (SKU, PRODUCT NAME, CATEGORY)
- [x] Lowercase headers work (sku, product name, category)
- [x] Mixed case headers work (Sku, Product Name, Category)
- [x] Alternative header names work (Product Code, Name, Cat)
- [x] Category column displays in preview
- [x] Category shows from database when product matched
- [x] Category shows from Excel when product not matched
- [x] Category mismatch shows warning
- [x] Empty category shows "—"
- [x] No TypeScript errors
- [x] No console errors

## Example Import Files

### Minimal Format (Restock)
```
SKU         | Quantity
FOD-STP-001 | 1000
FOD-STP-002 | 500
```

### Full Format (Physical Count)
```
SKU         | Product Name  | Category      | Quantity | Threshold
FOD-STP-001 | Rice 5kg      | Staples       | 60       | 10
FOD-STP-002 | Cooking Oil   | Staples       | 75       | 15
FOD-STP-003 | Sugar 1kg     | Staples       | 80       | 15
```

### With Alternative Headers
```
Product Code | Name         | Cat     | Qty  | Min Stock
FOD-STP-001  | Rice 5kg     | Staples | 60   | 10
FOD-STP-002  | Cooking Oil  | Staples | 75   | 15
```

## Related Files

- `frontend/lib/import-parser.ts` - Header parsing and normalization
- `frontend/components/inventory/ImportPreview.tsx` - Preview display
- `frontend/lib/import-validator.ts` - Category validation
- `frontend/lib/product-matcher.ts` - Product matching logic

## Summary

✅ **Case-Insensitive Headers** - Already implemented, works with any capitalization
✅ **Category Column** - Now displayed in import preview
✅ **Category Validation** - Shows warnings for mismatches
✅ **Flexible Format** - Supports multiple header name variations

Users can now import inventory with any header capitalization and see category information during the import preview!
