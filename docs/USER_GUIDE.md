# Talastock User Guide

**Welcome to Talastock!** 🎉

This guide will help you get started with your inventory and sales management system.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Products](#managing-products)
4. [Managing Categories](#managing-categories)
5. [Managing Inventory](#managing-inventory)
6. [Recording Sales](#recording-sales)
7. [Using the POS System](#using-the-pos-system)
8. [Viewing Reports](#viewing-reports)
9. [Viewing Transactions](#viewing-transactions)
10. [Processing Refunds](#processing-refunds)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Login

1. Open Talastock in your web browser
2. Enter your email and password
3. Click **"Sign In"**

**Forgot your password?**
- Click **"Forgot Password?"** on the login page
- Enter your email
- Check your email for a reset link
- Create a new password

---

## Dashboard Overview

The Dashboard is your home page. It shows:

### Key Metrics
- **Total Products** - Number of products in your system
- **Total Revenue** - Total sales amount
- **Inventory Value** - Total value of your stock
- **Low Stock Items** - Products that need restocking

### Charts
- **Sales Trend** - Daily sales over time
- **Revenue Chart** - Revenue over time
- **Top Products** - Best-selling products
- **Category Performance** - Sales by category
- **Payment Methods** - How customers pay

### Quick Actions
- **Date Filter** - View data for specific date ranges
- **Export Dashboard** - Download dashboard as PDF
- **AI Insights** - Get business recommendations

---

## Managing Products

### Adding a New Product

1. Go to **Products** page
2. Click **"Add Product"** button
3. Fill in the details:
   - **Product Name** - e.g., "Sugar 1kg"
   - **SKU** - Unique code (e.g., "FOD-SUG-001")
   - **Category** - Select or create new
   - **Price** - Selling price (₱)
   - **Cost Price** - Your cost (₱)
   - **Initial Stock** - Starting quantity
   - **Low Stock Alert** - When to alert (default: 10)
   - **Image URL** - Optional product image
4. Click **"Add Product"**

**Tips:**
- Use clear, descriptive names
- Create a consistent SKU format (e.g., CAT-PROD-001)
- Set realistic low stock alerts
- Cost price helps track profit margins

### Editing a Product

1. Find the product in the list
2. Click the **Edit** icon (pencil)
3. Update the information
4. Click **"Save Changes"**

### Deleting a Product

1. Find the product in the list
2. Click the **Delete** icon (trash)
3. Confirm deletion
4. **Warning:** This also deletes inventory and stock history

### Searching & Filtering

- **Search** - Type product name or SKU
- **Category Filter** - Show only specific category
- **Status Filter** - In Stock / Low Stock / Out of Stock
- **Price Range** - Filter by price
- **Stock Range** - Filter by quantity

### Importing Products (Bulk)

1. Click **"Import"** button
2. Download the template CSV
3. Fill in your products
4. Upload the CSV file
5. Review and confirm

**CSV Format:**
```
name,sku,category,price,cost_price,initial_stock,low_stock_threshold
Sugar 1kg,FOD-SUG-001,Food,75,60,100,10
```

---

## Managing Categories

Categories help organize your products (e.g., Food, Beverages, Household).

### Adding a Category

1. Go to **Categories** page
2. Click **"Add Category"**
3. Enter category name
4. Click **"Create"**

### Editing a Category

1. Find the category
2. Click the **Edit** icon
3. Change the name
4. Press Enter or click outside

### Deleting a Category

1. Find the category
2. Click the **Delete** icon
3. Confirm deletion
4. **Note:** Products in this category will become "Uncategorized"

---

## Managing Inventory

### Viewing Inventory

Go to **Inventory** page to see:
- Current stock levels
- Low stock alerts
- Stock value
- Last updated time

### Adjusting Stock

**Method 1: Quick Adjust**
1. Find the product
2. Click **"Adjust Stock"**
3. Enter new quantity
4. Add a note (optional)
5. Click **"Save"**

**Method 2: Stock Movements**
1. Go to **Transactions** page
2. Click **"Add Movement"**
3. Select product
4. Choose type:
   - **Restock** - Adding new stock
   - **Adjustment** - Fixing errors
   - **Return** - Customer returns
5. Enter quantity
6. Add note
7. Click **"Save"**

### Importing Inventory (Bulk Update)

1. Go to **Inventory** page
2. Click **"Import"** button
3. Download template
4. Update quantities in Excel
5. Upload the file
6. Review changes
7. Confirm import

**Excel Format:**
```
sku,quantity,note
FOD-SUG-001,150,Restocked from supplier
FOD-SAL-001,80,Inventory count adjustment
```

---

## Recording Sales

### Manual Sales Entry

1. Go to **Sales** page
2. Click **"Add Sale"**
3. Add products:
   - Search for product
   - Enter quantity
   - Click **"Add to Cart"**
4. Review total
5. Click **"Complete Sale"**

### Importing Sales (Bulk)

1. Go to **Sales** page
2. Click **"Import"**
3. Download template
4. Fill in sales data
5. Upload CSV
6. Review and confirm

**CSV Format:**
```
date,product_sku,quantity,unit_price,payment_method
2026-04-21,FOD-SUG-001,2,75,cash
2026-04-21,FOD-SAL-001,1,70,gcash
```

---

## Using the POS System

The POS (Point of Sale) is for quick sales at the counter.

### Starting a Sale

1. Go to **POS** page
2. Search for products or scan barcode
3. Products appear in the cart

### Adding Products

**Method 1: Search**
1. Type product name or SKU
2. Click the product
3. It's added to cart

**Method 2: Barcode Scanner**
1. Connect USB barcode scanner
2. Scan product barcode
3. Product automatically added

**Method 3: Direct Quantity**
1. Search for product
2. Enter quantity in the input field
3. Click product

### Adjusting Quantities

- Click **+** to increase
- Click **-** to decrease
- Type number directly in quantity field
- Click **trash icon** to remove item

### Applying Discounts

1. Click **"Add Discount"** button
2. Choose discount type:
   - **Percentage** - e.g., 10% off
   - **Fixed Amount** - e.g., ₱50 off
   - **Senior/PWD** - Automatic 20% off
3. Enter discount value
4. Click **"Apply"**

**To remove discount:**
- Click the **X** next to discount amount

### Selecting Payment Method

1. Click **"Complete Sale"**
2. Choose payment method:
   - **Cash** - Shows cash calculator
   - **Card** - Credit/debit card
   - **GCash** - Mobile payment
   - **PayMaya** - Mobile payment
   - **Bank Transfer** - Direct transfer

### Cash Payment

1. Select **"Cash"**
2. Enter amount received
3. Change is calculated automatically
4. Click **"Complete Sale"**

### Non-Cash Payment

1. Select payment method
2. Confirm payment received
3. Click **"Complete Sale"**

### Completing the Sale

1. Review cart and total
2. Apply discount (if any)
3. Select payment method
4. Complete payment
5. Receipt is displayed
6. Click **"Print Receipt"** or **"New Sale"**

### Clearing the Cart

1. Click **"Clear"** button
2. Confirm to remove all items

---

## Viewing Reports

### Sales Report

Shows transaction history and revenue.

**To Generate:**
1. Go to **Reports** page
2. Find **"Sales Report"** card
3. Select date range (optional)
4. View summary:
   - Total transactions
   - Total revenue
   - Average order value
5. Click **"Export (PDF)"** or **"Export (Excel)"**

**What's Included:**
- All sales transactions
- Payment method breakdown
- Top products by revenue
- Top products by quantity
- Daily/weekly/monthly totals

### Inventory Report

Shows current stock levels and valuation.

**To Generate:**
1. Go to **Reports** page
2. Find **"Inventory Report"** card
3. Filter by:
   - Status (In Stock / Low Stock / Out of Stock)
   - Category
4. View summary:
   - Total products
   - Total inventory value
   - Low/out of stock count
5. Click **"Export (PDF)"** or **"Export (Excel)"**

**What's Included:**
- Product name and SKU
- Category
- Current quantity
- Cost price
- Total value
- Stock status

### Profit & Loss Report

Shows financial performance.

**To Generate:**
1. Go to **Reports** page
2. Find **"Profit & Loss Report"** card
3. Select date range
4. View summary:
   - Revenue
   - Cost of Goods Sold (COGS)
   - Gross Profit
   - Gross Margin %
5. Click **"Export (PDF)"** or **"Export (Excel)"**

**What's Included:**
- Total revenue
- Total COGS
- Gross profit
- Gross margin percentage
- Net revenue (after discounts)
- Net profit
- Breakdown by category

### AI Report Summary

Get AI-powered business insights.

**To View:**
1. Scroll to **"AI Business Summary"** section
2. Wait for AI to analyze your data
3. Read the summary
4. Click **"Copy"** to save
5. Click **refresh icon** to regenerate

**What AI Analyzes:**
- Overall performance trends
- Top products and revenue drivers
- Inventory health and concerns
- Specific recommendations

---

## Viewing Transactions

The Transactions page shows all stock movements.

### Transaction Types

- **Restock** - Adding new inventory
- **Sale** - Product sold
- **Adjustment** - Manual correction
- **Return** - Customer refund

### Filtering Transactions

- **Type Filter** - Show specific movement type
- **Date Filter** - Select date range
- **Search** - Find by product name or SKU

### Exporting Transactions

1. Apply filters (optional)
2. Click **"Export"** button
3. Choose format (Excel/CSV)
4. File downloads automatically

---

## Processing Refunds

### Full Refund

1. Go to **Sales** page
2. Find the sale
3. Click **"Refund"** button
4. Select all items
5. Enter refund reason (optional)
6. Click **"Process Refund"**

**What Happens:**
- Sale status changes to "Refunded"
- Inventory is restored
- Stock movement is created
- Refund amount is recorded

### Partial Refund

1. Go to **Sales** page
2. Find the sale
3. Click **"Refund"** button
4. Select specific items to refund
5. Adjust quantities if needed
6. Enter refund reason
7. Click **"Process Refund"**

**What Happens:**
- Sale status changes to "Partially Refunded"
- Only selected items restored to inventory
- Partial refund amount recorded

**Important:**
- You cannot refund the same sale twice
- Refunds restore inventory automatically
- Refund reason helps track issues

---

## Tips & Best Practices

### Product Management
✅ Use consistent SKU format (e.g., CAT-PROD-001)  
✅ Set realistic low stock alerts  
✅ Update cost prices regularly  
✅ Use clear, searchable product names  
✅ Organize products into categories  

### Inventory Management
✅ Do regular stock counts  
✅ Update inventory after receiving stock  
✅ Add notes to stock movements  
✅ Monitor low stock alerts  
✅ Use bulk import for large updates  

### Sales & POS
✅ Train staff on POS system  
✅ Use barcode scanner for speed  
✅ Double-check quantities before completing  
✅ Apply discounts before payment  
✅ Print receipts for customers  

### Reports
✅ Generate reports weekly/monthly  
✅ Review AI insights regularly  
✅ Track profit margins  
✅ Monitor top products  
✅ Export reports for accounting  

### Security
✅ Use strong passwords  
✅ Log out when done  
✅ Don't share login credentials  
✅ Change password regularly  
✅ Review transactions for errors  

---

## Troubleshooting

### Can't Login
**Problem:** Forgot password  
**Solution:** Click "Forgot Password?" and follow email instructions

**Problem:** Wrong email/password  
**Solution:** Double-check spelling and caps lock

### Product Not Found
**Problem:** Can't find product in search  
**Solution:** Check spelling, try SKU instead, or check if product exists

### Low Stock Alert Not Showing
**Problem:** Product out of stock but no alert  
**Solution:** Check low stock threshold setting for that product

### Sale Not Completing
**Problem:** "Complete Sale" button disabled  
**Solution:** 
- Check if cart is empty
- Verify payment method selected
- For cash: ensure amount received ≥ total

### Barcode Scanner Not Working
**Problem:** Scanner not adding products  
**Solution:**
- Check USB connection
- Ensure scanner is in keyboard mode
- Verify product SKU matches barcode
- See: `docs/pos/BARCODE_SCANNER_SETUP.md`

### Import Failed
**Problem:** CSV import shows errors  
**Solution:**
- Check CSV format matches template
- Verify all required fields filled
- Check for duplicate SKUs
- Ensure numbers are formatted correctly

### Report Shows Wrong Data
**Problem:** Numbers don't match expectations  
**Solution:**
- Check date range filter
- Verify all sales were recorded
- Review recent stock adjustments
- Check for refunded sales

### Discount Not Applying
**Problem:** Discount doesn't reduce total  
**Solution:**
- Ensure discount is applied before payment
- Check discount value is correct
- Verify discount type (% vs fixed amount)

### Receipt Not Printing
**Problem:** Print button doesn't work  
**Solution:**
- Check browser print settings
- Ensure printer is connected
- Try "Print to PDF" first
- Check printer has paper

---

## Keyboard Shortcuts

**General:**
- `Ctrl + K` - Quick search (coming soon)
- `Esc` - Close modal/dialog

**POS:**
- `Enter` - Complete sale
- `Esc` - Clear cart (with confirmation)
- Type numbers - Direct quantity input

---

## Getting Help

### Documentation
- **User Guide** - This document
- **POS Guide** - `docs/pos/USER_GUIDE.md`
- **Barcode Setup** - `docs/pos/BARCODE_SCANNER_SETUP.md`
- **Import Guide** - `docs/guides/SALES_IMPORT_GUIDE.md`

### Support
- **Email:** support@talastock.com (if available)
- **In-App Help:** Click "?" icon in header (coming soon)

### Common Questions

**Q: Can I use Talastock offline?**  
A: The POS system detects offline mode but requires internet to complete sales.

**Q: How many products can I add?**  
A: Unlimited products on all plans.

**Q: Can multiple users access at once?**  
A: Yes, but each user needs their own account.

**Q: Is my data backed up?**  
A: Yes, all data is automatically backed up by Supabase.

**Q: Can I export all my data?**  
A: Yes, use the export buttons on each page.

**Q: How do I add more users?**  
A: Contact support for multi-user setup (coming soon).

---

## Updates & New Features

Talastock is constantly improving! Check back for:
- New features
- Performance improvements
- Bug fixes
- User interface updates

**Current Version:** 1.0  
**Last Updated:** April 21, 2026

---

## Feedback

We'd love to hear from you!

**What's working well?**  
**What could be better?**  
**What features do you need?**

Send feedback to: feedback@talastock.com

---

## Thank You!

Thank you for using Talastock. We're here to help your business grow! 🚀

---

**Need more help?** Check the other guides in the `docs/` folder or contact support.
