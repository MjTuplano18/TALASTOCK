# Talastock POS - User Guide

## Overview

Talastock POS is a fast, easy-to-use point of sale system designed for small businesses. It works on PC, laptop, and tablet devices.

---

## Getting Started

### Accessing the POS

**Method 1: Sidebar Navigation**
1. Click "POS" in the left sidebar menu

**Method 2: Quick Access**
1. Go to Dashboard
2. Click the "Quick POS" button (orange button at top)

---

## How to Make a Sale

### Manual Entry (Current Method)

1. **Search for Product**
   - Type product name or SKU in the search box
   - Click on the product to add it to cart

2. **Adjust Quantity**
   - **Option A**: Click the `+` or `-` buttons
   - **Option B**: Click the quantity number and type the amount directly
   - Example: Click "1" and type "5" to change quantity to 5

3. **Review Cart**
   - Check all items and quantities
   - Total amount shown at bottom
   - Remove items with trash icon if needed

4. **Complete Sale**
   - Click "Complete Sale" button
   - Receipt will appear automatically

5. **Print Receipt (Optional)**
   - Click "Print Receipt" button
   - Use browser print dialog

6. **Start New Sale**
   - Click "New Sale" button
   - Cart clears and ready for next customer

---

## Barcode Scanner (Coming Soon)

### How It Will Work

When you connect a USB barcode scanner:

1. **Plug in Scanner**
   - Connect USB barcode scanner to your PC/tablet
   - No software installation needed

2. **Scan Products**
   - Point scanner at product barcode
   - Beep sound = product added to cart
   - Scan same product again = quantity increases

3. **Complete Sale**
   - Same as manual method
   - Click "Complete Sale"

### Testing Scanner Without Hardware

You can test the scanner feature now:

1. Go to POS page
2. Quickly type a product SKU (like: `SKU001`)
3. Press Enter immediately
4. Product should be added to cart

**Note**: The system detects rapid typing (like a scanner) vs normal typing.

---

## Features

### ✅ Current Features (Manual Mode)

- **Product Search**: Search by name or SKU
- **Cart Management**: Add, remove, adjust quantities
- **Type Quantity**: Click quantity number to type amount
- **Stock Warnings**: See when items are low/out of stock
- **Offline Detection**: System warns when internet is down
- **Receipt Printing**: Print receipts for customers
- **Auto-Save**: Cart saved if you refresh page
- **Real-time Sync**: Sales appear in dashboard immediately

### 🔄 Coming Soon (Scanner Mode)

- **Barcode Scanning**: Scan products with USB scanner
- **Faster Checkout**: No typing needed
- **Bulk Scanning**: Scan multiple items quickly

---

## Tips for Small Business Owners

### Best Practices

1. **Keep SKUs Simple**
   - Use short, memorable SKUs
   - Example: `RICE001`, `SOAP001`
   - Makes manual entry faster

2. **Stock Management**
   - Yellow badge = Low stock (reorder soon)
   - Red badge = Out of stock
   - System still allows sale (for pre-orders)

3. **End of Day**
   - Check Dashboard for daily sales
   - Review inventory levels
   - Plan restocking

4. **Training Staff**
   - Show them search feature
   - Practice typing quantities
   - Teach receipt printing

### Hardware Recommendations

**For Manual Mode (Current)**
- Any PC, laptop, or tablet
- Minimum screen: 768px width (iPad size)
- Internet connection required

**For Scanner Mode (Future)**
- USB Barcode Scanner ($20-50)
  - Recommended: Any "keyboard wedge" scanner
  - Brands: Honeywell, Zebra, Inateck
  - Works plug-and-play, no drivers needed

---

## Troubleshooting

### "Product not found"
- Check if product exists in Products page
- Verify SKU spelling
- Make sure product is marked as "Active"

### "You are offline"
- Check internet connection
- Complete Sale button disabled when offline
- Can still add items to cart

### Cart disappeared
- Check session storage (cart auto-saves)
- Refresh page to restore cart
- If cleared, cart was completed or manually cleared

### Quantity not updating
- Make sure you're typing a number > 0
- Click outside the input to confirm
- Use +/- buttons if typing doesn't work

---

## Keyboard Shortcuts

- **Enter**: Complete sale (when cart has items)
- **Escape**: Clear cart (confirmation required)
- **Tab**: Navigate between search and cart

---

## Support

For technical support or questions:
- Check Dashboard for system status
- Review Sales page for transaction history
- Contact your system administrator

---

## Version Information

**Current Version**: Talastock Lite POS v1.0
**Mode**: Manual Entry + Barcode Ready
**Last Updated**: 2026-04-15

---

## Roadmap

### Phase 1 (Current) ✅
- Manual product entry
- Cart management
- Receipt printing
- Real-time inventory sync

### Phase 2 (Next)
- USB barcode scanner support
- Camera barcode scanning (mobile)
- Bulk product scanning
- Faster checkout workflow

### Phase 3 (Future)
- Multiple payment methods
- Customer management
- Discounts and promotions
- Cash drawer integration

