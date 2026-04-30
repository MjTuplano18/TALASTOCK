# Sales Import Guide

## Overview
The Sales Import feature allows users to import historical sales data for analytics and reporting purposes. This is especially useful for businesses migrating from manual records or other systems.

## Key Features
- Import sales from Excel (.xlsx, .xls) or CSV files
- Template with instructions and sample data
- Validation and error checking
- Preview before import
- Historical data preservation (doesn't affect current inventory)

## How to Use

### 1. Download the Template
1. Go to **Sales** page
2. Click **Import Sales** button
3. Click **Download Template** button
4. Open the downloaded `talastock-sales-import-template.xlsx`

### 2. Fill in Your Data
The template has two sheets:
- **Instructions**: Detailed guide on how to use the template
- **Sales Data**: Where you enter your sales

#### Required Columns:
- **Date**: Format YYYY-MM-DD (e.g., 2024-01-15)
- **Product Name** or **SKU**: Must match existing products
- **Quantity**: Positive number
- **Unit Price**: Selling price at time of sale

#### Optional Columns:
- **Time**: Format HH:MM AM/PM (e.g., 10:30 AM)
- **Total Amount**: Auto-calculated if not provided
- **Notes**: Any additional information

#### Example Data:
```
Date        | Time     | Product Name      | SKU         | Quantity | Unit Price | Total Amount | Notes
2024-01-15  | 10:30 AM | Canned Corn 150g  | FOD-CAN-002 | 5        | 60.00      | 300.00       | Regular customer
2024-01-15  | 02:45 PM | Salt 500g         | FOD-SAL-001 | 10       | 25.00      | 250.00       | Bulk order
2024-01-16  | 09:15 AM | KitKat 35g        | SNC-KIT-001 | 3        | 45.00      | 135.00       |
```

### 3. Upload and Import
1. Delete the sample rows from the template
2. Save your file
3. Click **Import Sales** button
4. Click **Choose File** and select your file
5. Review the preview and any warnings/errors
6. Click **Import X Sales** to complete

## Important Notes

### Inventory Not Adjusted
- **Historical imports do NOT adjust inventory levels**
- This is intentional - the feature is for recording past sales only
- If you need to adjust inventory, use the Inventory page

### Product Matching
- Products must exist in your inventory before importing
- Matching is done by SKU (exact match) or Product Name (case-insensitive)
- If a product isn't found, that sale will be skipped

### Date and Time
- Sales are recorded with the date/time you specify
- If time is not provided, defaults to 12:00 PM
- This allows you to preserve the exact timing of historical sales

### Validation
The import process validates:
- ✅ Date format is correct
- ✅ Product exists in inventory
- ✅ Quantity is positive
- ✅ Unit Price is non-negative
- ✅ Total Amount matches Quantity × Unit Price (warns if different)

## Use Cases

### 1. Migrating from Manual Records
If you've been tracking sales in notebooks or spreadsheets:
1. Transcribe your records into the template
2. Import all at once
3. View analytics and trends immediately

### 2. Importing from Another System
If you're switching from another POS or inventory system:
1. Export sales data from old system
2. Reformat to match Talastock template
3. Import to preserve historical data

### 3. Bulk Data Entry
If you have a backlog of sales to enter:
1. Use the template instead of entering one-by-one
2. Much faster than manual entry
3. Less prone to errors

## Tips for Success

### Prepare Your Data
- Clean up product names to match exactly
- Ensure dates are in correct format
- Remove any duplicate entries
- Group sales by date for better organization

### Start Small
- Test with 5-10 sales first
- Verify they import correctly
- Then import the rest

### Use Notes Field
- Add context like customer names
- Note payment methods
- Record any special circumstances
- This helps with future reference

### Check Analytics After Import
- Go to Dashboard to see updated charts
- Check Reports page for historical trends
- Verify totals match your expectations

## Troubleshooting

### "Product not found" Error
**Problem**: SKU or Product Name doesn't match any product in inventory

**Solution**:
1. Go to Products page
2. Check exact spelling and SKU
3. Update your import file to match
4. Or add the product first, then import

### "Invalid date" Error
**Problem**: Date format is incorrect

**Solution**:
- Use YYYY-MM-DD format (e.g., 2024-01-15)
- Not MM/DD/YYYY or DD/MM/YYYY
- Excel may auto-format dates - check the cell format

### "Total doesn't match" Warning
**Problem**: Total Amount ≠ Quantity × Unit Price

**Solution**:
- This is just a warning, import will still work
- Check if you have discounts or special pricing
- Update Total Amount if needed
- Or leave blank to auto-calculate

### Import Fails Completely
**Problem**: File won't upload or parse

**Solution**:
1. Ensure file is .xlsx, .xls, or .csv
2. Check file isn't corrupted
3. Try re-downloading the template
4. Copy your data to fresh template

## Technical Details

### File Formats Supported
- Excel 2007+ (.xlsx)
- Excel 97-2003 (.xls)
- CSV (.csv)

### Column Header Flexibility
The parser accepts various header names:
- **Date**: "date", "sale date", "transaction date", "day"
- **Time**: "time", "sale time", "transaction time", "hour"
- **Product Name**: "product name", "product", "item", "item name", "name"
- **SKU**: "sku", "product code", "code", "item code"
- **Quantity**: "quantity", "qty", "amount", "units", "count"
- **Unit Price**: "unit price", "price", "selling price", "sale price"
- **Total Amount**: "total amount", "total", "amount", "total price"
- **Notes**: "notes", "note", "remarks", "comment", "description"

### Data Validation Rules
- Date must be valid and parseable
- Quantity must be > 0
- Unit Price must be ≥ 0
- Product must exist (by SKU or Name)
- Total Amount is optional (auto-calculated)

### Import Process
1. File is parsed and validated
2. Products are matched by SKU or Name
3. Sales are created with specified timestamps
4. Sale items are linked to products
5. **Inventory is NOT adjusted**
6. Success/failure count is reported

## FAQ

**Q: Will this affect my current inventory levels?**  
A: No, historical imports do not adjust inventory. This is intentional.

**Q: Can I import sales for products I don't have yet?**  
A: No, products must exist first. Add them to Products page, then import sales.

**Q: What if I make a mistake?**  
A: You can void individual sales from the Sales page, or delete them from Transactions page.

**Q: Can I import the same sales twice?**  
A: Yes, but this will create duplicates. Be careful not to import the same file twice.

**Q: How many sales can I import at once?**  
A: There's no hard limit, but we recommend batches of 100-500 for best performance.

**Q: Will this slow down my dashboard?**  
A: No, the dashboard uses efficient queries and caching. Even with thousands of sales, it stays fast.

**Q: Can I edit sales after importing?**  
A: Currently, you can only void (delete) sales. Editing is not supported yet.

## Support

If you encounter issues:
1. Check this guide first
2. Verify your data format matches the template
3. Try with a small test file first
4. Contact support with error details if needed

---

**Last Updated**: April 15, 2026  
**Version**: 1.0
