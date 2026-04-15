# Import Templates Reference

## Overview
Talastock has two different import templates for different purposes:

1. **Products Import** - For creating NEW products
2. **Inventory Import** - For updating EXISTING products' stock and prices

## Products Import Template

**Purpose:** Create new products with initial stock

**Headers:**
- `Product Name` (required)
- `SKU` (required, must be unique)
- `Category` (optional, will be created if new)
- `Price` (required)
- `Cost Price` (required)
- `Initial Quantity` (optional, defaults to 0)
- `Low Stock Threshold` (optional, defaults to 10)
- `Image URL` (optional)

**Use Cases:**
- Adding new products to the system
- Bulk product creation
- Initial inventory setup

**Key Points:**
- SKU must be unique (will fail if duplicate)
- Creates new product records
- Sets initial stock quantity
- Categories are auto-created if they don't exist

**Download:** Click "Download Template" in Products page → Import button

---

## Inventory Import Template

**Purpose:** Update existing products' stock, prices, and thresholds

**Headers:**
- `SKU` (required for matching) OR `Product Name` (fallback)
- `Product Name` (optional, for reference)
- `Category` (optional, for validation)
- `Quantity` (optional, stock to set or add)
- `Low Stock Threshold` (optional)
- `Price` (optional, updates selling price)
- `Cost Price` (optional, updates cost price)

**Import Modes:**
1. **Replace Mode** - Sets quantity to exact value in file
   - Example: Current = 56, File = 1000 → Result = 1000
   
2. **Add Mode** - Adds file value to current quantity
   - Example: Current = 56, File = 1000 → Result = 1056

**Use Cases:**
- Restocking inventory (Add mode)
- Physical count updates (Replace mode)
- Bulk price updates
- Threshold adjustments

**Key Points:**
- Products must already exist (matches by SKU or name)
- Can update quantity, threshold, price, and cost_price
- Leave columns blank to skip updating that field
- Creates stock movement records for quantity changes

**Download:** Click "Download Template" in Inventory page → Import button

---

## Key Differences

| Feature | Products Import | Inventory Import |
|---------|----------------|------------------|
| Purpose | Create NEW products | Update EXISTING products |
| Quantity Header | `Initial Quantity` | `Quantity` |
| SKU Requirement | Must be unique | Must exist |
| Price Updates | Sets initial price | Updates existing price |
| Import Modes | N/A | Replace or Add |
| Stock Movements | No | Yes (tracked) |
| Category Handling | Auto-creates | Validation only |

---

## Common Mistakes

### ❌ Wrong: Using Products Import to restock
```
Product Name: Snickers
SKU: SNK-001
Initial Quantity: 1000  ← Will fail if SKU already exists
```

### ✅ Correct: Using Inventory Import to restock
```
SKU: SNK-001
Quantity: 1000  ← Updates existing product
Mode: Add       ← Adds to current stock
```

---

### ❌ Wrong: Using Inventory Import for new products
```
SKU: NEW-001
Quantity: 100  ← Will fail if product doesn't exist
```

### ✅ Correct: Using Products Import for new products
```
Product Name: New Product
SKU: NEW-001
Initial Quantity: 100  ← Creates new product with stock
```

---

## File Format Support

Both templates support:
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Comma-separated values)

**Recommended:** Use `.xlsx` for best compatibility

---

## Header Aliases

### Inventory Import accepts multiple header names:

**Quantity:**
- `Quantity`, `Qty`, `Stock`, `Amount`

**Threshold:**
- `Threshold`, `Low Stock Threshold`, `Min Stock`, `Minimum`, `Reorder Point`

**Price:**
- `Price`, `Selling Price`, `Unit Price`

**Cost Price:**
- `Cost Price`, `Cost`, `Purchase Price`, `Cost_Price`

**SKU:**
- `SKU`, `Product Code`, `Code`

**Product Name:**
- `Product Name`, `Name`, `Product`, `Item Name`, `Item`

**Category:**
- `Category`, `Cat`

All headers are **case-insensitive** (e.g., `SKU`, `sku`, `Sku` all work)

---

## Best Practices

1. **Always use SKU for matching** - More accurate than product name
2. **Download the template first** - Ensures correct headers
3. **Test with small batches** - Import 5-10 rows first
4. **Use Dry Run mode** - Preview changes before committing
5. **Keep backups** - Export before bulk imports
6. **Check validation errors** - Fix errors before importing
7. **Use correct template** - Products for new, Inventory for updates

---

## Validation Rules

### Products Import:
- Product Name: Required, non-empty
- SKU: Required, unique, non-empty
- Price: Required, must be ≥ 0
- Cost Price: Required, must be ≥ 0
- Initial Quantity: Optional, must be ≥ 0
- Low Stock Threshold: Optional, must be ≥ 0

### Inventory Import:
- SKU or Product Name: At least one required
- Quantity: Optional, must be ≥ 0
- Threshold: Optional, must be ≥ 0
- Price: Optional, must be ≥ 0
- Cost Price: Optional, must be ≥ 0
- Product must exist in system

---

## Troubleshooting

**"Product not found"**
- Using Inventory Import for non-existent product
- Solution: Use Products Import to create it first

**"SKU already exists"**
- Using Products Import with duplicate SKU
- Solution: Use Inventory Import to update instead

**"Invalid file format"**
- File is corrupted or wrong format
- Solution: Re-download template and copy data

**"No data found"**
- File only has headers, no data rows
- Solution: Add at least one data row

**"Matched by name (warning)"**
- SKU not found, matched by product name instead
- Solution: Use correct SKU for accuracy

---

## Support

For issues or questions:
1. Check validation errors in preview
2. Verify you're using the correct template
3. Ensure headers match exactly (case-insensitive)
4. Test with template sample data first
