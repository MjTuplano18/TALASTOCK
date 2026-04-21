# Frequently Asked Questions (FAQ)

Common questions about Talastock.

---

## General Questions

### What is Talastock?

Talastock is an inventory and sales management system designed for Filipino small businesses. It helps you track products, manage stock, record sales, and generate reports.

### Who is Talastock for?

- Sari-sari stores
- Retail shops
- Wholesale businesses
- Restaurants
- Trading companies
- Any business that sells products

### How much does it cost?

Pricing varies by plan. Contact sales for current pricing.

### Is my data safe?

Yes! Your data is:
- Encrypted in transit and at rest
- Backed up automatically
- Stored securely on Supabase
- Protected by authentication

### Can I use it offline?

The POS system detects offline mode, but you need internet to complete sales and sync data.

---

## Account & Login

### I forgot my password. What do I do?

1. Click **"Forgot Password?"** on login page
2. Enter your email
3. Check your email for reset link
4. Create a new password

### Can I change my email address?

Contact support to change your email address.

### Can multiple people use the same account?

Not recommended. Each user should have their own account for security and tracking.

### How do I log out?

Click your profile icon in the top right and select **"Logout"**.

---

## Products & Inventory

### What is a SKU?

SKU (Stock Keeping Unit) is a unique code for each product. Example: `FOD-SUG-001`

**Best Practice:** Use a consistent format like `CATEGORY-PRODUCT-NUMBER`

### Can I add products without a SKU?

No, SKU is required and must be unique.

### How do I organize products?

Use **Categories** to group similar products (e.g., Food, Beverages, Household).

### What's the difference between Price and Cost Price?

- **Price** - What you sell it for (₱75)
- **Cost Price** - What you paid for it (₱60)
- **Profit** - Price minus Cost Price (₱15)

### How do I set low stock alerts?

When adding/editing a product, set the **"Low Stock Threshold"**. You'll get alerts when stock falls below this number.

### Can I add product images?

Yes! Add an image URL when creating/editing a product. The image will show in the POS and product list.

### How do I update stock quantities?

**Method 1:** Go to Inventory → Click "Adjust Stock"  
**Method 2:** Go to Transactions → Add stock movement  
**Method 3:** Import inventory CSV with new quantities

### What happens when I delete a product?

Deleting a product also deletes:
- Inventory records
- Stock movement history
- **Warning:** This cannot be undone!

---

## Sales & POS

### What payment methods are supported?

- Cash
- Card (Credit/Debit)
- GCash
- PayMaya
- Bank Transfer

### How do I apply a discount?

In POS:
1. Add products to cart
2. Click **"Add Discount"**
3. Choose type and enter value
4. Click **"Apply"**

### What is Senior/PWD discount?

Senior Citizen and PWD (Person with Disability) discount is automatically 20% as per Philippine law.

### Can I edit a sale after completing it?

No, but you can process a refund and create a new sale.

### How do I process a refund?

1. Go to **Sales** page
2. Find the sale
3. Click **"Refund"**
4. Select items to refund
5. Click **"Process Refund"**

Inventory is automatically restored.

### Can I refund part of a sale?

Yes! Select only the items you want to refund. The sale status will change to "Partially Refunded".

### Does the POS work on mobile?

The POS is optimized for tablets (iPad, Android tablets). It works on phones but is best on larger screens.

---

## Barcode Scanner

### What barcode scanners are compatible?

Any USB barcode scanner that works in "keyboard mode" (types the barcode like a keyboard).

**Recommended:**
- Honeywell Voyager 1200g
- Zebra DS2208
- Any generic USB scanner

### How do I set up a barcode scanner?

1. Plug in USB scanner
2. Go to POS
3. Scan a product
4. It should appear in cart

**Detailed guide:** `docs/pos/BARCODE_SCANNER_SETUP.md`

### My scanner isn't working. What do I do?

**Check:**
- USB is connected
- Scanner is in keyboard mode
- Product SKU matches barcode
- Scanner light turns on when scanning

### Can I use a wireless scanner?

Yes, if it connects via USB dongle and works in keyboard mode.

---

## Reports & Analytics

### What reports are available?

1. **Sales Report** - Transaction history, revenue, payment methods
2. **Inventory Report** - Stock levels, valuation, low stock
3. **Profit & Loss** - Revenue, costs, profit margins

### How do I export reports?

Click **"Export (PDF)"** or **"Export (Excel)"** on any report card.

### What is the AI Report Summary?

AI analyzes your business data and provides:
- Performance insights
- Top product analysis
- Inventory recommendations
- Actionable suggestions

### Can I customize reports?

Use date range and filters to customize what's included. Full customization coming soon.

### How often should I generate reports?

**Recommended:**
- Daily: Check dashboard
- Weekly: Sales report
- Monthly: Profit & Loss report
- Quarterly: Full business review

---

## Importing & Exporting

### What file formats are supported?

- **Import:** CSV, Excel (.xlsx)
- **Export:** PDF, Excel (.xlsx), CSV

### How do I import products?

1. Go to **Products**
2. Click **"Import"**
3. Download template
4. Fill in your products
5. Upload file

### What if my import fails?

**Common issues:**
- Duplicate SKUs
- Missing required fields
- Wrong file format
- Invalid data (negative prices, etc.)

Check the error message and fix the CSV file.

### Can I export all my data?

Yes! Use the export buttons on each page:
- Products → Export
- Inventory → Export
- Sales → Export
- Transactions → Export

---

## Technical Questions

### What browsers are supported?

- Chrome (recommended)
- Firefox
- Safari
- Edge

### What devices are supported?

- Desktop computers
- Laptops
- Tablets (iPad, Android)
- Smartphones (limited)

**Best for POS:** Tablets or desktop

### Is there a mobile app?

Not yet, but the web app works on mobile browsers.

### Can I use it on multiple devices?

Yes! Log in from any device with your email and password.

### What happens if my internet goes down?

The POS will detect offline mode and prevent completing sales until connection is restored. Your cart is saved locally.

### How is data backed up?

All data is automatically backed up by Supabase. No action needed from you.

---

## Business Questions

### Can I use this for multiple stores?

Multi-location support is coming soon. Currently, one location per account.

### Can I add employees/users?

Multi-user support is coming soon. Currently, one user per account.

### Can I track customer information?

Customer management is coming soon.

### Does it integrate with accounting software?

Not yet, but you can export reports to Excel and import into your accounting software.

### Can I customize receipts?

Receipt customization (logo, business info) is coming soon.

### Is there a limit on products or sales?

No limits! Add unlimited products and record unlimited sales.

---

## Troubleshooting

### The page is loading slowly

**Try:**
- Refresh the page
- Clear browser cache
- Check internet connection
- Try a different browser

### I see an error message

**Common errors:**
- "Product not found" - Check SKU spelling
- "Insufficient stock" - Check inventory levels
- "Invalid credentials" - Check email/password
- "Network error" - Check internet connection

### Data isn't updating

**Try:**
- Refresh the page (F5)
- Log out and log back in
- Clear browser cache
- Check internet connection

### I can't complete a sale

**Check:**
- Cart has items
- Payment method selected
- For cash: amount received ≥ total
- Internet connection active

---

## Feature Requests

### How do I request a new feature?

Send your suggestions to: feedback@talastock.com

### What features are coming soon?

- Multi-user support
- Customer management
- Receipt customization
- Mobile app
- Multi-location support
- Accounting integrations

---

## Support

### How do I get help?

1. Check this FAQ
2. Read the User Guide (`docs/USER_GUIDE.md`)
3. Contact support: support@talastock.com

### What are support hours?

Monday - Friday: 9 AM - 6 PM (Philippine Time)  
Saturday: 9 AM - 12 PM  
Sunday: Closed

### How quickly will I get a response?

- Email: Within 24 hours
- Urgent issues: Within 4 hours

---

## Still Have Questions?

📧 **Email:** support@talastock.com  
📖 **User Guide:** `docs/USER_GUIDE.md`  
🚀 **Quick Start:** `docs/QUICK_START.md`

---

**Last Updated:** April 21, 2026
